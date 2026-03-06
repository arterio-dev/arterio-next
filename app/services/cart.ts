// ─── Cart Service ─────────────────────────────────────────────────────────────
// Comunica com a WooCommerce Store API via proxy Next.js.
// O Cart-Token vive no localStorage e é injectado como header em cada request.
// ──────────────────────────────────────────────────────────────────────────────

import { WP_CONFIG } from '@/app/config/wordpress';

export const CART_TOKEN_LS_KEY = 'arterio_cart_token';
const NONCE_LS_KEY            = 'arterio_nonce';
const CART_API_BASE           = '/api/cart';

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
  localStorage.removeItem(NONCE_LS_KEY);
}

// ─── Nonce helpers ────────────────────────────────────────────────────────────

function getNonce(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(NONCE_LS_KEY);
}

function saveNonce(nonce: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NONCE_LS_KEY, nonce);
}

/**
 * Obtém um nonce fresco fazendo GET ao carrinho — o WooCommerce inclui o nonce
 * nos headers de resposta de TODOS os endpoints da Store API.
 * Usado apenas no retry após 401 (nonce expirado).
 */
async function fetchAndSaveNonce(): Promise<string | null> {
  const token = getCartToken();
  if (!token) return null;
  try {
    const res = await fetch(`${CART_API_BASE}/cart`, {
      credentials: 'include',
      headers: { 'Cart-Token': token },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const nonce =
      res.headers.get('Nonce') ??
      res.headers.get('nonce') ??
      res.headers.get('X-WC-Store-API-Nonce');
    if (nonce) saveNonce(nonce);
    return nonce || null;
  } catch {
    return null;
  }
}

// ─── Core fetcher ─────────────────────────────────────────────────────────────

async function request<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  _retry = true,
): Promise<T> {
  const token = getCartToken();
  const nonce = getNonce();

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Cart-Token', token);
  if (nonce) headers.set('Nonce', nonce);

  const response = await fetch(`${CART_API_BASE}${endpoint}`, {
    ...options,
    headers,
    cache: 'no-store',
    credentials: 'include',
  });

  // Persiste token novo sempre que a API devolver um
  const newToken = response.headers.get('Cart-Token');
  if (newToken && newToken !== token) saveToken(newToken);

  // Persiste nonce devolvido pelo proxy (WC inclui-o nas respostas)
  // Headers são case-insensitive mas incluímos fallbacks por segurança
  const returnedNonce =
    response.headers.get('Nonce') ??
    response.headers.get('nonce') ??
    response.headers.get('X-WC-Store-API-Nonce');
  if (returnedNonce) saveNonce(returnedNonce);

  // Nonce expirado ou inválido — WooCommerce retorna 401 ou 403
  // Obtém um novo nonce e reintenta uma vez
  if ((response.status === 401 || response.status === 403) && _retry) {
    const fresh = await fetchAndSaveNonce();
    if (fresh) return request<T>(endpoint, options, false);
  }

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
  /**
   * Fetcher usado pelo SWR — devolve o carrinho completo.
   * O WooCommerce inclui o nonce nos headers da resposta; request() persiste-o
   * automaticamente via saveNonce(), pelo que não é necessário um pedido extra.
   */
  fetcher: (): Promise<unknown> => request('/cart'),

  /**
   * Adiciona item ao carrinho.
   * FIX: garante que o productId é sempre enviado como número inteiro.
   * A Store API do WooCommerce espera um inteiro no campo "id".
   */
  addItem: (productId: number | string, quantity: number, variation?: { attribute: string; value: string }[]) =>
    request('/cart/add-item', {
      method: 'POST',
      body: JSON.stringify({
        id: typeof productId === 'string' ? parseInt(productId, 10) : productId,
        quantity,
        ...(variation?.length ? { variation } : {}),
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
   * Fluxo:
   * 1. Construir URL do session-handoff com cart_token como query param
   * 2. Redirect direto para o endpoint WordPress que:
   *    - Decodifica o Cart-Token (JWT)
   *    - Busca a sessão no banco de dados
   *    - Define cookies wp_wc_session_* no browser
   *    - Redireciona para o checkout
   *
   * Este método evita o problema de cookies cross-domain ao fazer o handoff
   * diretamente no domínio do WordPress (api.arterio.com.br).
   *
   * REQUISITOS WORDPRESS:
   * 1. Plugin session-handoff.php instalado (ver docs/wordpress/)
   * 2. COOKIE_DOMAIN='.arterio.com.br' no wp-config.php
   */
  redirectToCheckout: async (): Promise<void> => {
    const token = getCartToken();
    
    if (!token) {
      // Sem token, vai direto pro checkout (vai estar vazio mesmo)
      window.location.href = WP_CONFIG.checkoutUrl!;
      return;
    }

    // Construir URL com token como query param
    const handoffUrl = new URL(WP_CONFIG.sessionHandoffUrl!);
    handoffUrl.searchParams.set('cart_token', token);
    handoffUrl.searchParams.set('redirect', WP_CONFIG.checkoutUrl!);

    // Limpa o token ANTES do redirect — o session-handoff já copia o carrinho
    // para uma sessão WC com cookies, então o token headless não é mais necessário.
    // Sem isto, ao voltar do checkout o SWR re-fetcha a sessão headless antiga
    // (que ainda contém os itens) e o carrinho "reaparece".
    clearToken();

    // Redirect direto - o WordPress define os cookies e redireciona pro checkout
    window.location.href = handoffUrl.toString();
  },
};