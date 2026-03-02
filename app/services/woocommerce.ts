import { WP_CONFIG } from '../config/wordpress';
import type { WCProduct, WCCategory, Product } from '../types/woocommerce';

// Helper limpo para fazer requests à Store API
async function storeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${WP_CONFIG.storeApiUrl}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Store API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Store API Error:', error);
    throw error;
  }
}

export const productService = {
  async getAll(params?: { per_page?: number; page?: number; category?: string; search?: string; featured?: boolean }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.featured !== undefined) queryParams.append('featured', params.featured.toString());
    
    return storeRequest<any[]>(`/products?${queryParams.toString()}`);
  },

  async getById(id: number): Promise<any> {
    return storeRequest<any>(`/products/${id}`);
  }
};

export const categoryService = {
  async getAll(): Promise<any[]> {
    return storeRequest<any[]>('/products/categories');
  }
};

// Mapeamento atualizado para o formato da Store API
export function mapWCProductToLocal(storeProduct: any): Product {
  const priceString = storeProduct.prices?.price || '0';
  const price = typeof priceString === 'string' ? parseFloat(priceString) / 100 : priceString;

  return {
    id: storeProduct.id.toString(),
    name: storeProduct.name,
    price: price,
    category: storeProduct.categories?.[0]?.name || 'Sem Categoria',
    inStock: storeProduct.is_in_stock, 
    image: storeProduct.images?.[0]?.src,
    sku: storeProduct.sku,
    description: storeProduct.short_description || storeProduct.description,
    variants: storeProduct.attributes?.map((attr: any) => ({
      name: attr.name,
      value: attr.terms?.map((t: any) => t.name).join(', ')
    })) || [],
  };
}

export function mapWCProductsToLocal(wcProducts: any[]): Product[] {
  return wcProducts.map(mapWCProductToLocal);
}
