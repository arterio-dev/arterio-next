// ─── Cart Service ─────────────────────────────────────────────────────────────
// Comunica com a WooCommerce Store API via proxy Next.js.
// O Cart-Token vive no localStorage e é injectado como header em cada request.
// ──────────────────────────────────────────────────────────────────────────────

import { WP_CONFIG } from '@/app/config/wordpress';

export const CART_TOKEN_LS_KEY = 'arterio_cart_token';
const CART_API_BASE = '/api/cart';
const CHECKOUT_HANDOFF_URL = '/api/checkout';

// ─── Token helpers ────────────────────────────────────────────────────────────

export function getCartToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CART_TOKEN_LS_KEY);
}

function saveToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_TOKEN_LS_KEY, token);
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CART_TOKEN_LS_KEY);
}

// ─── Core fetcher ─────────────────────────────────────────────────────────────

async function request<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getCartToken();

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Cart-Token', token);

  const response = await fetch(`${CART_API_BASE}${endpoint}`, {
    ...options,
    headers,
    cache: 'no-store',
    credentials: 'include',
  });

  // Persiste token novo sempre que a API devolver um
  const newToken = response.headers.get('Cart-Token');
  if (newToken && newToken !== token) saveToken(newToken);

  if (!response.ok) {
    const text = await response.text();
    let message = `Erro ${response.status}`;
    try { message = JSON.parse(text)?.message ?? message; } catch { /* fallback */ }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const cartApi = {
  /** Fetcher usado pelo SWR — devolve o carrinho completo */
  fetcher: (): Promise<unknown> => request('/cart'),

  /**
   * Adiciona item ao carrinho.
   * FIX: garante que o productId é sempre enviado como número inteiro.
   * A Store API do WooCommerce espera um inteiro no campo "id".
   */
  addItem: (productId: number | string, quantity: number, variationId?: number) =>
    request('/cart/add-item', {
      method: 'POST',
      body: JSON.stringify({
        id: typeof productId === 'string' ? parseInt(productId, 10) : productId,
        quantity,
        ...(variationId ? { variation_id: variationId } : {}),
      }),
    }),

  updateItem: (key: string, quantity: number) =>
    request('/cart/update-item', {
      method: 'POST',
      body: JSON.stringify({ key, quantity }),
    }),

  removeItem: (key: string) =>
    request('/cart/remove-item', {
      method: 'POST',
      body: JSON.stringify({ key }),
    }),

  /**
   * Limpa todos os itens do carrinho de uma só vez.
   * Usa DELETE /cart/items (WooCommerce Store API v1) em vez de N chamadas removeItem.
   */
  clearItems: (): Promise<unknown> =>
    request('/cart/items', { method: 'DELETE' }),

  clearToken,

  /**
   * Handoff de sessão + redirect para o checkout nativo do WooCommerce.
   *
   * 1. GET /api/checkout — o proxy faz GET ao WC Store API, que devolve
   *    Set-Cookie (wp_wc_session_*). O proxy repassa esses cookies ao browser.
   * 2. Redirect para WP_CONFIG.checkoutUrl — o WooCommerce reconhece a sessão
   *    via os cookies e mostra o carrinho correcto.
   *
   * Sem o passo 1, o checkout nativo teria um carrinho vazio porque o Cart-Token
   * (localStorage) não é partilhado com o WordPress.
   */
  redirectToCheckout: async (): Promise<void> => {
    const token = getCartToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Cart-Token'] = token;

    await fetch(CHECKOUT_HANDOFF_URL, {
      method: 'GET',
      headers,
      credentials: 'include', // aceita os Set-Cookie do WooCommerce
    });

    window.location.href = WP_CONFIG.checkoutUrl!;
  },
};