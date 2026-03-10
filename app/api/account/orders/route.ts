// API Route para GET em /api/account/orders
// Retorna a lista de pedidos do utilizador autenticado, com suporte a paginação.
// Busca primeiro por customer_id, depois por billing email (para guest orders).
// Exige autenticação via cookie wp_auth_token (JWT).
import { NextRequest, NextResponse } from 'next/server';

const WP_URL = process.env.NEXT_PUBLIC_WP_URL;
const WC_KEY = process.env.WC_CONSUMER_KEY;
const WC_SECRET = process.env.WC_CONSUMER_SECRET;
const WC_AUTH = (WC_KEY && WC_SECRET)
  ? 'Basic ' + Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString('base64')
  : '';

import { extractTracking } from '@/utils/extractTracking';
import { getUserFromToken } from '../_helpers';

function getAuthToken(request: NextRequest): string | null {
  return request.cookies.get('wp_auth_token')?.value ?? null;
}

function missingConfig() {
  const missing: string[] = [];
  if (!WP_URL) missing.push('NEXT_PUBLIC_WP_URL');
  if (!WC_KEY) missing.push('WC_CONSUMER_KEY');
  if (!WC_SECRET) missing.push('WC_CONSUMER_SECRET');
  return missing;
}

// GET /api/account/orders
// → wp-json/wc/v3/orders?customer=<user_id>
// Fallback: se customer_id não retornar resultados, busca por billing email
// (pedidos criados via session-handoff têm customer_id=0)


export async function GET(request: NextRequest) {
  if (!WP_URL || !WC_KEY || !WC_SECRET) {
    return NextResponse.json({ error: 'Configuração incompleta' }, { status: 500 });
  }

  const token = request.cookies.get('wp_auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const user = await getUserFromToken(token);
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { email, id } = user;
  const { searchParams } = new URL(request.url);
  const page     = searchParams.get('page') ?? '1';
  const per_page = searchParams.get('per_page') ?? '10';

  const base = `${WP_URL}/wp-json/wc/v3/orders`;
  const qs   = `page=${page}&per_page=${per_page}&orderby=date&order=desc`;
  const auth = { headers: { Authorization: WC_AUTH } };

  // Query 1: pedidos com customer_id correto (caminho principal)
  const [byCustomer, byEmail] = await Promise.all([
    fetch(`${base}?customer=${id}&${qs}`, auth),
    // Query 2: pedidos antigos com customer_id=0, criados antes do fix do checkout
    fetch(`${base}?customer=0&search=${encodeURIComponent(email)}&${qs}`, auth),
  ]);

  if (!byCustomer.ok) {
    return NextResponse.json({ error: 'Erro ao carregar pedidos' }, { status: 500 });
  }

  const rawCustomer = await byCustomer.json();
  // byEmail pode falhar silenciosamente — não é crítico
  const rawEmail = byEmail.ok ? await byEmail.json() : [];

  // Fundir e deduplicar por ID, garantindo que só pertencem a este utilizador
  const seen = new Set<number>();
  const merged = [...rawCustomer, ...rawEmail]
    .filter(order => {
      if (seen.has(order.id)) return false;
      // Verificação de segurança extra: confirma que o pedido realmente pertence ao utilizador
      const ownsById    = order.customer_id !== 0 && order.customer_id === id;
      const ownsByEmail = order.billing?.email?.toLowerCase() === email.toLowerCase();
      if (!ownsById && !ownsByEmail) return false;
      seen.add(order.id);
      return true;
    })
    .sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime());

  const orders = merged.map(extractTracking);

  // Total pages vem da query principal (by customer_id)
  const totalPages = byCustomer.headers.get('X-WP-TotalPages') ?? '1';

  console.log(`[Orders] user_id=${id}, email=${email} → ${orders.length} pedidos`);

  return NextResponse.json(
    { orders, total_pages: totalPages },
    { headers: { 'X-WP-Total-Pages': totalPages } },
  );
}