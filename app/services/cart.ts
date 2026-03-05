import { WP_CONFIG } from '@/app/config/wordpress';

const CART_TOKEN_KEY = 'arterio_cart_token';
const isDev = process.env.NODE_ENV === 'development';

// ─── Logging apenas em desenvolvimento ────────────────────────────────────────
function log(...args: unknown[]) {
  if (isDev) console.log('[CartService]', ...args);
}
function logError(...args: unknown[]) {
  if (isDev) console.error('[CartService]', ...args);
}

export const cartService = {

  // ── 1. GESTÃO DO CART-TOKEN ────────────────────────────────────────────────

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

  // ── 2. COMUNICAÇÃO COM A STORE API ─────────────────────────────────────────

  async fetchStoreApi(endpoint: string, options: RequestInit = {}) {
    const token = this.getCartToken();
    log(`${options.method ?? 'GET'} ${endpoint} | token: ${token ?? 'none'}`);

    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/json');
    headers.set('Content-Type', 'application/json');
    if (token) headers.set('Cart-Token', token);

    const response = await fetch(`${WP_CONFIG.cartApiUrl}${endpoint}`, {
      ...options,
      headers,
      cache: 'no-store',
      credentials: 'include',
    });

    // Guarda novo token se a API devolver um diferente
    const newToken = response.headers.get('Cart-Token');
    if (newToken && newToken !== token) {
      this.setCartToken(newToken);
      log('Novo Cart-Token recebido e guardado.');
    }

    if (!response.ok) {
      const errorText = await response.text();
      logError(`Erro ${response.status}:`, errorText);
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.message ?? `Erro ${response.status}`);
      } catch {
        throw new Error(`Erro de comunicação com a loja: ${response.status}`);
      }
    }

    const data = await response.json();
    log('Resposta recebida:', data);
    return data;
  },

  // ── 3. AÇÕES DO CARRINHO ───────────────────────────────────────────────────

  async getCart() {
    return this.fetchStoreApi('/cart');
  },

  async addItem(productId: number | string, quantity: number = 1, variationId?: number) {
    const body: Record<string, unknown> = { id: productId, quantity };
    if (variationId) body.variation_id = variationId;
    return this.fetchStoreApi('/cart/add-item', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async updateQuantity(itemKey: string, quantity: number) {
    if (quantity <= 0) return this.removeItem(itemKey);
    return this.fetchStoreApi('/cart/update-item', {
      method: 'POST',
      body: JSON.stringify({ key: itemKey, quantity }),
    });
  },

  async removeItem(itemKey: string) {
    return this.fetchStoreApi('/cart/remove-item', {
      method: 'POST',
      body: JSON.stringify({ key: itemKey }),
    });
  },

  // FIX 🔴 — clearCart agora notifica o servidor e apaga o token local
  // A Store API não tem endpoint DELETE /cart, por isso apagamos o token:
  // o WooCommerce vai tratar o próximo request como uma nova sessão vazia.
  async clearCart() {
    try {
      // Tenta esvaziar item a item via API (mais seguro)
      const serverCart = await this.getCart();
      const items: Array<{ key: string }> = serverCart?.items ?? [];
      await Promise.all(items.map(item => this.removeItem(item.key)));
    } catch {
      // Se falhar (ex: sessão já expirou), apaga o token silenciosamente
      log('clearCart: não foi possível contactar o servidor, token local apagado.');
    } finally {
      this.clearCartToken();
    }
    return { items: [], totals: { total_items: '0', total_price: '0' } };
  },

  // FIX 🔴 — redirectToCheckout envia o Cart-Token via query string
  // O WooCommerce consegue ler o token desta forma em modo headless
  redirectToCheckout(): void {
    const token = this.getCartToken();
    const base = WP_CONFIG.checkoutUrl;
    const url = token ? `${base}?cart-token=${encodeURIComponent(token)}` : base;
    window.location.href = url;
  },
};