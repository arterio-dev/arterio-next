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
    
    // Debug: mostrar estrutura das variações da REST API v3
    if (Array.isArray(variations) && variations.length > 0) {
      console.debug(`[Variations API] REST API v3 first variation:`, {
        id: variations[0].id,
        attributes: variations[0].attributes,
        attributeKeys: Object.keys(variations[0].attributes?.[0] || {}),
      });
    }
    
    // ─── Converter atributos REST API v3 para formato esperado ──────────────────────────
    // REST API v3: [{id, name, option}]
    // Esperado: [{attribute: "tamanho", value: "m"}]
    const convertedVariations = variations.map((v: any) => ({
      ...v,
      attributes: v.attributes?.map((attr: any) => ({
        // Usar o "name" como attribute (sem conversão para pa_)
        attribute: attr.name.toLowerCase().replace(/\s+/g, '_'),
        // "option" é o valor selecionado, converter para slug (lowercase, sem espaços)
        value: attr.option.toLowerCase().replace(/\s+/g, '-'),
      })) || [],
    }));
    
    console.debug(`[Variations API] Converted first variation:`, {
      id: convertedVariations[0]?.id,
      attributes: convertedVariations[0]?.attributes,
    });
    
    return NextResponse.json(convertedVariations);
  } catch (error) {
    console.error('[Variations] Erro ao buscar variações:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar variações' },
      { status: 500 },
    );
  }
}
