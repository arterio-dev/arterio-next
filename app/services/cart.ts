import { WP_CONFIG } from '@/app/config/wordpress';
import type { CartItem } from '@/app/types/woocommerce';

// Chave para guardar o token de sessão do carrinho no navegador
const CART_TOKEN_KEY = 'arterio_cart_token';

export const cartService = {
  // ==========================================
  // 1. GESTÃO DE IDENTIDADE (CART-TOKEN)
  // ==========================================

  getCartToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(CART_TOKEN_KEY);
  },

  setCartToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CART_TOKEN_KEY, token);
  },

  clearCartToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(CART_TOKEN_KEY);
  },

  // ==========================================
  // 2. COMUNICAÇÃO CENTRAL COM A API
  // ==========================================

  /**
   * Wrapper interno para fazer chamadas à Store API.
   * Ele injeta o Cart-Token automaticamente e guarda novos tokens recebidos.
   */
  async fetchStoreApi(endpoint: string, options: RequestInit = {}) {
    const token = this.getCartToken();
    console.log(`API Request: ${options.method || 'GET'} ${endpoint} (Cart-Token: ${token})`); // Log para debug

    // Inicializa os headers juntando com os que vieram no options
    const headers = new Headers(options.headers);

    // Define os headers padrão (o set não duplica se já existir)
    headers.set('Accept', 'application/json');
    headers.set('Content-Type', 'application/json');

    // Injeta o token se ele existir
    if (token) {
      headers.set('Cart-Token', token);
    }
    try {
      const response = await fetch(`${WP_CONFIG.storeApiUrl}${endpoint}`, {
        ...options,
        headers,
        cache: 'no-store',
        credentials: 'include'
      });

      const newToken = response.headers.get('Cart-Token');

      if (newToken && newToken !== token) {
        this.setCartToken(newToken);
      }

      // Se der erro (ex: 400 Bad Request, Produto sem stock)
      if (!response.ok) {
        // Lemos como texto apenas UMA VEZ
        const errorText = await response.text();
        console.error(`[CartService] ❌ Erro da API (${response.status}):`, errorText);

        // Tentamos extrair a mensagem de erro amigável do WooCommerce (se for JSON)
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || `Erro do WooCommerce: ${response.status}`);
        } catch {
          throw new Error(`Erro de comunicação com a loja: ${response.status}`);
        }
      }

      // SUCESSO: Lemos o JSON apenas UMA VEZ e guardamos na variável 'data'
      const data = await response.json();

      console.log(`[CartService] ✅ Resposta da API:`, data);

      // Devolvemos a variável já lida (nunca faças return response.json() aqui)
      return data;

    } catch (error) {
      console.error(`[CartService] 🚨 Falha no fetch:`, error);
      throw error;
    }
  },

  // ==========================================
  // 3. AÇÕES ATÓMICAS (O SERVIDOR É O MESTRE)
  // ==========================================

  /**
   * Vai buscar o estado atual do carrinho ao servidor.
   */
  async getCart() {
    return this.fetchStoreApi('/cart', {
      method: 'GET',
    });
  },

  /**
   * Adiciona um item e retorna imediatamente o carrinho atualizado do servidor.
   */
  async addItem(productId: number | string, quantity: number = 1, variationId?: number) {
    const body: Record<string, any> = {
      id: productId,
      quantity,
    };

    if (variationId) {
      body.variation_id = variationId;
    }

    return this.fetchStoreApi('/cart/add-item', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * Atualiza a quantidade de um item específico (usando a key única devolvida pelo Woo).
   */
  async updateQuantity(itemKey: string, quantity: number) {
    // Se a quantidade for 0, removemos o item
    if (quantity === 0) {
      return this.removeItem(itemKey);
    }

    return this.fetchStoreApi('/cart/update-item', {
      method: 'POST',
      body: JSON.stringify({
        key: itemKey,
        quantity,
      }),
    });
  },

  /**
   * Remove um item do carrinho.
   */
  async removeItem(itemKey: string) {
    return this.fetchStoreApi('/cart/remove-item', {
      method: 'POST',
      body: JSON.stringify({
        key: itemKey,
      }),
    });
  },

  /**
   * Limpa o carrinho. Em Headless, basta muitas vezes apagar o token local
   * para o utilizador receber um novo carrinho vazio na próxima requisição.
   */
  async clearCart() {
    this.clearCartToken();
    // Retorna uma estrutura vazia amigável para limpar o frontend imediatamente
    return { items: [], totals: { total_items: 0, total_price: "0" } };
  },

  // ==========================================
  // 4. CHECKOUT
  // ==========================================

  /**
   * Redireciona para o checkout.
   * Como o servidor já está atualizado a cada clique, não há necessidade de loops de sincronização.
   */
  redirectToCheckout(): void {
    window.location.href = WP_CONFIG.checkoutUrl;
  }
};