import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Buscar produto do WooCommerce
    const wooCommerceUrl = process.env.NEXT_PUBLIC_WP_URL;
    
    if (!wooCommerceUrl) {
      return NextResponse.json(
        { error: 'WooCommerce URL not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${wooCommerceUrl}/wp-json/wc/store/v1/products/${id}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      console.error(`[Products API] Failed to fetch product ${id}: ${response.status}`);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: response.status }
      );
    }

    let product = await response.json();
    
    // Se for um produto variável e o Store API não retornar variações,
    // buscar IDs das variações da REST API v3 e adicionar ao produto
    if (product.type === 'variable' && (!product.variations || product.variations.length === 0)) {
      try {
        const wc_key = process.env.WC_CONSUMER_KEY;
        const wc_secret = process.env.WC_CONSUMER_SECRET;
        
        if (wc_key && wc_secret) {
          const auth = 'Basic ' + Buffer.from(`${wc_key}:${wc_secret}`).toString('base64');
          
          // Buscar variações via REST API v3
          const varRes = await fetch(
            `${wooCommerceUrl}/wp-json/wc/v3/products/${id}/variations?per_page=100`,
            {
              headers: {
                Authorization: auth,
                'Content-Type': 'application/json',
              },
              cache: 'no-store',
            }
          );
          
          if (varRes.ok) {
            const variations = await varRes.json();
            // Converter para referências de variação (id + atributos) para o Store API
            // IMPORTANTE: Usar taxonomy slug (ex: "pa_size") + term slug (ex: "large")
            // em vez de display names
            product.variations = variations.map((v: any) => ({
              id: v.id,
              attributes: v.attributes.map((restAttr: any) => {
                // Encontrar o atributo correspondente no Store API para obter a taxonomy
                const storeAttr = product.attributes?.find(
                  (a: any) => a.name.toLowerCase() === restAttr.name.toLowerCase()
                );
                
                if (!storeAttr) {
                  // Fallback: se não encontrar, usar o name como attribute
                  console.warn(
                    `[Products API] Could not find Store API attribute matching "${restAttr.name}" for variation`,
                    { variationId: v.id, restAttr }
                  );
                  return {
                    attribute: restAttr.name,
                    value: restAttr.option,
                  };
                }

                // Encontrar o term (slug) que corresponde à option (name)
                const matchingTerm = storeAttr.terms?.find(
                  (term: any) => term.name.toLowerCase() === restAttr.option.toLowerCase()
                );

                const attributeSlug = storeAttr.taxonomy;
                const valueSlug = matchingTerm?.slug || restAttr.option.toLowerCase().replace(/\s+/g, '-');

                return {
                  attribute: attributeSlug,
                  value: valueSlug,
                };
              }),
            }));
            
            console.debug(`[Products API] Enriched product ${id} with ${product.variations.length} variations`);
          }
        }
      } catch (enrichErr) {
        console.warn('[Products API] Failed to enrich product with variations:', enrichErr);
        // Continua mesmo sem variações — o endpoint está funcional
      }
    }
    
    // Debug: se for um produto variável, verificar se temos as variações
    if (product.type === 'variable') {
      console.debug(`[Products API] Product ${id} is variable:`, {
        hasVariations: !!product.variations,
        variationCount: product.variations?.length ?? 0,
        attributes: product.attributes?.map((a: any) => ({
          id: a.id,
          name: a.name,
          taxonomy: a.taxonomy,
          has_variations: a.has_variations,
          terms_count: a.terms?.length ?? 0,
        })) ?? [],
      });
    }
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
