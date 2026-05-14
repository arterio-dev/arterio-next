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
        
        if (!wc_key || !wc_secret) {
          console.warn(`[Products API] WC credentials not configured - cannot enrich variations for product ${id}`);
        } else {
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
          
          if (!varRes.ok) {
            console.warn(
              `[Products API] Failed to fetch variations from REST API v3 for product ${id}:`,
              { status: varRes.status, statusText: varRes.statusText }
            );
          } else {
            const variations = await varRes.json();
            
            if (!Array.isArray(variations) || variations.length === 0) {
              console.warn(`[Products API] No variations returned for product ${id}`);
            } else {
              console.debug(
                `[Products API] Fetched ${variations.length} variations from REST API v3 for product ${id}`
              );
              
              // Mapear REST API v3 attributes para Store API attributes usando "id" como chave primária
              // porque os nomes podem estar em idiomas diferentes (e.g., "Tamanho" vs "Size")
              const attributeMapping = new Map<number, any>();
              
              if (product.attributes && Array.isArray(product.attributes)) {
                product.attributes.forEach((storeAttr: any) => {
                  // Criar um mapa de Store API attributes agrupados por ID
                  // Em WooCommerce, o ID do atributo é único globalmente
                  attributeMapping.set(storeAttr.id, storeAttr);
                });
              }
              
              // Converter para referências de variação (id + atributos) para o Store API
              // IMPORTANTE: Usar taxonomy slug (ex: "pa_size") + term slug (ex: "large")
              product.variations = variations.map((v: any) => ({
                id: v.id,
                attributes: v.attributes.map((restAttr: any) => {
                  // ESTRATÉGIA 1: Encontrar por ID (mais confiável)
                  let storeAttr = attributeMapping.get(restAttr.id);
                  
                  // ESTRATÉGIA 2: Se não encontrar por ID, tentar por nome (case-insensitive)
                  if (!storeAttr && product.attributes) {
                    storeAttr = product.attributes.find(
                      (a: any) => a.name.toLowerCase() === restAttr.name.toLowerCase()
                    );
                  }
                  
                  if (!storeAttr) {
                    // Se ainda não encontrar, registrar erro e usar fallback com slugificação
                    console.error(
                      `[Products API] Could not find Store API attribute for variation`,
                      { variationId: v.id, restAttrId: restAttr.id, restAttrName: restAttr.name }
                    );
                    
                    // Fallback: slugificar o nome do atributo e da opção
                    // pa_ é o prefixo padrão para atributos customizados do WooCommerce
                    const slugifiedAttr = `pa_${restAttr.name.toLowerCase().replace(/\s+/g, '_')}`;
                    const slugifiedValue = restAttr.option.toLowerCase().replace(/\s+/g, '-');
                    
                    return {
                      attribute: slugifiedAttr,
                      value: slugifiedValue,
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
              
              console.debug(
                `[Products API] Enriched product ${id} with ${product.variations.length} variations`
              );
            }
          }
        }
      } catch (enrichErr) {
        console.warn('[Products API] Failed to enrich product with variations:', enrichErr);
        // Continua mesmo sem variações — o endpoint está funcional
      }
    }
    
    // ─── Converter variações Store API do formato {name, value} para {attribute, value} ─────
    // A Store API retorna variações com {name, value}, mas precisamos de {attribute, value}
    // para usar na UI (product-detail) e carrinho
    if (product.type === 'variable' && product.variations && product.variations.length > 0) {
      const attributeMapping = new Map<string, any>();
      if (product.attributes && Array.isArray(product.attributes)) {
        product.attributes.forEach((attr: any) => {
          attributeMapping.set(attr.name.toLowerCase(), attr);
        });
      }
      
      // Verificar se precisamos converter (se primeiro atributo tem "name" em vez de "attribute")
      const firstAttr = product.variations[0]?.attributes?.[0];
      if (firstAttr && 'name' in firstAttr && !('attribute' in firstAttr)) {
        console.debug(
          `[Products API] Converting variation format for product ${id}`,
          { before: firstAttr }
        );
        
        product.variations = product.variations.map((v: any) => ({
          ...v,
          attributes: v.attributes?.map((attr: any) => {
            // Converter de {name, value} para {attribute, value}
            const storeAttr = attributeMapping.get(attr.name?.toLowerCase());
            
            if (!storeAttr) {
              // Fallback: slugificar o nome do atributo
              // pa_ é o prefixo padrão para atributos customizados do WooCommerce
              const slugifiedAttr = `pa_${attr.name.toLowerCase().replace(/\s+/g, '_')}`;
              const slugifiedValue = attr.value.toLowerCase().replace(/\s+/g, '-');
              
              console.warn(
                `[Products API] Could not find attribute "${attr.name}" for product ${id}`,
                { fallbackAttribute: slugifiedAttr, fallbackValue: slugifiedValue }
              );
              
              return {
                attribute: slugifiedAttr,
                value: slugifiedValue,
              };
            }
            
            // Encontrar o slug do termo que corresponde ao value (display name)
            const matchingTerm = storeAttr.terms?.find(
              (t: any) => t.name.toLowerCase() === attr.value.toLowerCase()
            );
            
            const valueSlug = matchingTerm?.slug || attr.value.toLowerCase().replace(/\s+/g, '-');
            
            return {
              attribute: storeAttr.taxonomy,
              value: valueSlug,
            };
          }) || [],
        }));
        
        console.debug(
          `[Products API] ✓ Converted variation format for product ${id}`,
          { after: product.variations[0]?.attributes?.[0] }
        );
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
      
      // Validar formato das variações enriquecidas
      if (product.variations && product.variations.length > 0) {
        const firstVar = product.variations[0];
        const hasCorrectFormat = firstVar.attributes?.every((attr: any) => 
          typeof attr.attribute === 'string' && 
          attr.attribute.startsWith('pa_') &&
          typeof attr.value === 'string' &&
          attr.value === attr.value.toLowerCase()
        );
        
        if (!hasCorrectFormat) {
          console.warn(
            `[Products API] ⚠️ Variation format might be incorrect. First variation:`,
            firstVar.attributes
          );
        } else {
          console.debug(
            `[Products API] ✓ Variation format looks correct:`,
            firstVar.attributes
          );
        }
      }
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
