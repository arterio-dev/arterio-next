import type { WCProduct, WCCategory } from '@/types/woocommerce';

// Lógica de ambiente do Next.js (process.env em vez de import.meta.env)
const WP_URL = process.env.NEXT_PUBLIC_WP_URL || 'https://arterio.com.br/wp';
const STORE_API_URL = `${WP_URL}/wp-json/wc/store/v1`;

/**
 * Wrapper de requisição otimizado para Next.js App Router
 */
async function storeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${STORE_API_URL}${endpoint}`;

  try {
    // O fetch no Next.js é anabolizado. Ele faz cache automático.
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      // Revalida o cache a cada 1 hora (3600 segundos).
      // Isso significa que o site carrega instantaneamente, mas atualiza 
      // os produtos no fundo sem derrubar a performance.
      next: { revalidate: 3600, ...options.next }, 
    });

    if (!response.ok) {
      throw new Error(`Store API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Erro ao buscar na API do WooCommerce (${endpoint}):`, error);
    // Lançar o erro permite que o arquivo 'error.tsx' do Next.js capture e mostre uma UI amigável
    throw error; 
  }
}

/**
 * Serviços de Produtos e Categorias
 */
export const woocommerce = {
  async getProducts(params?: { per_page?: number; category?: string; search?: string }): Promise<WCProduct[]> {
    const queryParams = new URLSearchParams();
    
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    
    return storeRequest<WCProduct[]>(`/products?${queryParams.toString()}`);
  },

  async getProductById(id: number): Promise<WCProduct> {
    return storeRequest<WCProduct>(`/products/${id}`);
  },

  async getCategories(): Promise<WCCategory[]> {
    return storeRequest<WCCategory[]>('/products/categories');
  }
};