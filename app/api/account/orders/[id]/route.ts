import { NextRequest, NextResponse } from 'next/server';
import { extractTracking } from '@/utils/extractTracking';

const WP_URL    = process.env.NEXT_PUBLIC_WP_URL;
const WC_KEY    = process.env.WC_CONSUMER_KEY;
const WC_SECRET = process.env.WC_CONSUMER_SECRET;
const WC_AUTH = (WC_KEY && WC_SECRET)
  ? 'Basic ' + Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString('base64')
  : '';

async function authenticateAndAuthorize(
  request: NextRequest,
  orderId: string,
): Promise<{ order: Record<string, unknown>; user: { id: number; email: string } } | NextResponse> {
  if (!WP_URL || !WC_KEY || !WC_SECRET) {
    return NextResponse.json({ error: 'Configuração incompleta' }, { status: 500 });
  }

  const token = request.cookies.get('wp_auth_token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  // 1. Validar JWT → obter user_id
  const meRes = await fetch(`${WP_URL}/wp-json/wp/v2/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!meRes.ok) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  const { id: userId } = await meRes.json();

  // 2. Buscar email real via WC (mesmo padrão da lista de pedidos)
  const customerRes = await fetch(`${WP_URL}/wp-json/wc/v3/customers/${userId}`, {
    headers: { Authorization: WC_AUTH },
  });
  if (!customerRes.ok) {
    return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
  }
  const { email } = await customerRes.json();
  const user = { id: userId as number, email: email as string };

  console.log(`[Order ${orderId}] Auth: user_id=${user.id}, email=${user.email}`);

  // 3. Buscar o pedido
  const orderRes = await fetch(`${WP_URL}/wp-json/wc/v3/orders/${orderId}`, {
    headers: { Authorization: WC_AUTH },
  });
  if (!orderRes.ok) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
  }
  const order = await orderRes.json();

  // 4. Verificar ownership: customer_id OU billing email
  const isOwnerById    = order.customer_id !== 0 && order.customer_id === user.id;
  const isOwnerByEmail = order.billing?.email?.toLowerCase() === user.email.toLowerCase();

  console.log(`[Order ${orderId}] customer_id=${order.customer_id}, billing_email=${order.billing?.email}, isOwnerById=${isOwnerById}, isOwnerByEmail=${isOwnerByEmail}`);

  if (!isOwnerById && !isOwnerByEmail) {
    console.warn(`[Order ${orderId}] Acesso negado para user ${user.id} (${user.email})`);
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  return { order, user };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await authenticateAndAuthorize(request, id);
  if (result instanceof NextResponse) return result;

  return NextResponse.json(extractTracking(result.order));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await authenticateAndAuthorize(request, id);
  if (result instanceof NextResponse) return result;

  const { status } = await request.json();
  const CANCELLABLE = ['pending', 'processing', 'on-hold'];

  if (status !== 'cancelled') {
    return NextResponse.json({ error: 'Apenas cancelamento é permitido' }, { status: 400 });
  }
  if (!CANCELLABLE.includes(result.order.status as string)) {
    return NextResponse.json(
      { error: `Pedido em estado "${result.order.status}" não pode ser cancelado` },
      { status: 422 },
    );
  }

  const updateRes = await fetch(`${WP_URL}/wp-json/wc/v3/orders/${id}`, {
    method: 'PUT',
    headers: { Authorization: WC_AUTH, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'cancelled' }),
  });

  if (!updateRes.ok) {
    return NextResponse.json({ error: 'Erro ao cancelar pedido' }, { status: 500 });
  }

  return NextResponse.json(extractTracking(await updateRes.json()));
}