import { NextRequest, NextResponse } from 'next/server';

const WP_URL    = process.env.NEXT_PUBLIC_WP_URL;
const WC_KEY    = process.env.WC_CONSUMER_KEY;
const WC_SECRET = process.env.WC_CONSUMER_SECRET;
const WC_AUTH   = (WC_KEY && WC_SECRET)
  ? 'Basic ' + Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString('base64')
  : '';

/**
 * GET /api/products/[id]/variations
 * Proxy para WC REST API v3 — devolve todas as variações de um produto variável.
 * Usa Basic Auth (Consumer Key/Secret) porque a REST API v3 exige autenticação.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!WP_URL || !WC_AUTH) {
    console.error('[Variations] Variáveis de ambiente em falta: NEXT_PUBLIC_WP_URL / WC_CONSUMER_KEY / WC_CONSUMER_SECRET');
    return NextResponse.json(
      { error: 'Configuração do servidor incompleta' },
      { status: 500 },
    );
  }

  try {
    const res = await fetch(
      `${WP_URL}/wp-json/wc/v3/products/${id}/variations?per_page=100`,
      {
        headers: {
          Authorization: WC_AUTH,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      },
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Não foi possível obter as variações' },
        { status: res.status },
      );
    }

    const variations = await res.json();
    return NextResponse.json(variations);
  } catch (error) {
    console.error('[Variations] Erro ao buscar variações:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar variações' },
      { status: 500 },
    );
  }
}
