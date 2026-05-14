import { WP_CONFIG } from '../config/wordpress';
import type { WCProduct, WCCategory, Product } from '../types/woocommerce';
import { decodeHTMLEntities } from '@/utils/formatters';

// Helper limpo para fazer requests à Store API
async function storeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${WP_CONFIG.storeApiUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      // ADICIONADO: Força o Next.js a nunca colocar esta resposta em cache
      // Garante que recebe sempre os dados frescos e reais do WooCommerce
      cache: 'no-store', 
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Se receber 401 ou 403, limpar o token de sessão corrompido
    if (response.status === 401 || response.status === 403) {
      console.warn(`[storeRequest] Received ${response.status} - clearing invalid session token`);
      // Limpar o token inválido do localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('arterio_cart_token');
        localStorage.removeItem('arterio_nonce');
      }
    }

    if (!response.ok) {
      throw new Error(`Store API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[storeRequest] Error:', error);
    throw error;
  }
}

export const productService = {
  async getAll(params?: { per_page?: number; page?: number; categoryId?: string; categoryName?: string; search?: string; featured?: boolean; fetchAll?: boolean; allCategories?: any[] }): Promise<any[]> {
    // If fetchAll=true and no pagination was specified, fetch ALL products with automatic pagination
    if (params?.fetchAll && !params?.page) {
      return this.getAllPaginated(params);
    }

    const queryParams = new URLSearchParams();
    
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    
    // NOTE: Do NOT send category to the API — WooCommerce Store API has a bug with the category param
    // Category filtering is done client-side
    
    if (params?.search) queryParams.append('search', params.search);
    if (params?.featured !== undefined) queryParams.append('featured', params.featured.toString());
    
    return storeRequest<any[]>(`/products?${queryParams.toString()}`);
  },

  async getAllPaginated(params?: { categoryId?: string; categoryName?: string; search?: string; featured?: boolean; allCategories?: any[] }): Promise<any[]> {
    const allProducts: any[] = [];
    let page = 1;
    const perPage = 100; // máximo permitido pela Store API

    let hasMore = true;
    while (hasMore) {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('per_page', perPage.toString());
        queryParams.append('page', page.toString());
        
        // NOTE: Do NOT send category to the API — WooCommerce Store API has a bug with the category param
        // Category filtering is done client-side in useProducts
        
        // CORREÇÃO: validar search - search works server-side, so we can send it
        if (params?.search && params.search.trim() !== '') {
          queryParams.append('search', params.search.trim());
        }
        
        if (params?.featured !== undefined) {
          queryParams.append('featured', params.featured.toString());
        }
        
        console.debug(`[productService] Fetching page ${page}`, Object.fromEntries(queryParams));
        
        const pageProducts = await storeRequest<any[]>(`/products?${queryParams.toString()}`);
        
        // Filter by category client-side if category is specified
        let filteredProducts = pageProducts;
        if (params?.categoryId || params?.categoryName) {
          // Build a set of category IDs to match
          // For parent categories, also include all subcategories
          const categoryIdsToMatch = new Set<string>();
          
          if (params.categoryId) {
            categoryIdsToMatch.add(params.categoryId);
            
            // If this is a PARENT category, also include all its subcategories
            if (params.allCategories && params.allCategories.length > 0) {
              const selectedCat = params.allCategories.find(c => c.id.toString() === params.categoryId);
              // Only add subcategories if the selected category IS a parent (has no parent itself)
              if (selectedCat && (!selectedCat.parent || selectedCat.parent === 0)) {
                const subcategories = params.allCategories.filter(c => c.parent === selectedCat.id);
                subcategories.forEach(subcat => {
                  categoryIdsToMatch.add(subcat.id.toString());
                });
              }
            }
          }
          
          filteredProducts = pageProducts.filter(product => {
            // First try to match by categoryId if provided
            if (categoryIdsToMatch.size > 0) {
              const categoryMatch = product.categories?.some((cat: any) => 
                categoryIdsToMatch.has(cat.id.toString())
              );
              if (categoryMatch) return true;
            }
            
            // Fallback to category name matching if provided
            if (params.categoryName && product.categories && product.categories.length > 0) {
              const nameMatch = product.categories.some((cat: any) => 
                cat.name.toLowerCase() === params.categoryName!.toLowerCase()
              );
              if (nameMatch) return true;
            }
            
            return false;
          });
        }
        
        if (pageProducts.length === 0) {
          hasMore = false;
        } else {
          allProducts.push(...filteredProducts);
          page++;
        }
      } catch (error) {
        console.error(`[productService] Error on page ${page}:`, error);
        throw error; // Propaga o erro para que useProducts trate
      }
    }

    console.debug(`[productService] Total products fetched: ${allProducts.length}`);
    return allProducts;
  },

  async getById(id: number): Promise<any> {
    return storeRequest<any>(`/products/${id}`);
  }
};

export const categoryService = {
  async getAll(): Promise<any[]> {
    // ADICIONADO: per_page=100 e hide_empty=false para forçar a API
    // a entregar TODAS as categorias disponíveis no painel
    return storeRequest<any[]>('/products/categories?per_page=100&hide_empty=false');
  }
};

// Mapeamento atualizado para o formato da Store API
export function mapWCProductToLocal(storeProduct: any): Product {
  const priceString = storeProduct.prices?.price || '0';
  const price = typeof priceString === 'string' ? parseFloat(priceString) / 100 : priceString;

  return {
    id: storeProduct.id.toString(),
    name: decodeHTMLEntities(storeProduct.name),
    price: price,
    category: decodeHTMLEntities(storeProduct.categories?.[0]?.name || 'Sem Categoria'),
    categoryId: storeProduct.categories?.[0]?.id?.toString(), // Adiciona o ID da categoria
    inStock: storeProduct.is_in_stock, 
    image: storeProduct.images?.[0]?.src,
    sku: storeProduct.sku,
    description: decodeHTMLEntities(storeProduct.short_description || storeProduct.description || ''),
    variants: storeProduct.attributes?.map((attr: any) => ({
      name: decodeHTMLEntities(attr.name),
      value: decodeHTMLEntities(attr.terms?.map((t: any) => t.name).join(', ') || '')
    })) || [],
  };
}

export function mapWCProductsToLocal(wcProducts: any[]): Product[] {
  return wcProducts.map(mapWCProductToLocal);
}