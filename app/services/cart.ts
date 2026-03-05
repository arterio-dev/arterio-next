// ─── Cart Service ─────────────────────────────────────────────────────────────
// Responsabilidade única: comunicar com a WooCommerce Store API via proxy Next.js.
// Toda a gestão de estado fica no hook useCart (SWR).
// ──────────────────────────────────────────────────────────────────────────────

const CART_TOKEN_KEY = 'arterio_cart_token';
const CART_API_BASE = '/api/cart';

// ─── Token Management ─────────────────────────────────────────────────────────
// O token vive em duas fontes:
//   1. Cookie HttpOnly (definido pelo proxy) — usado pelo servidor no checkout
//   2. localStorage — usado pelo cliente JS para injetar no header Cart-Token
//
// O proxy é a fonte de verdade. O localStorage é apenas um cache do cliente.

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CART_TOKEN_KEY);
}

function saveToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_TOKEN_KEY, token);
}

function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CART_TOKEN_KEY);
}

// ─── Core Fetcher ─────────────────────────────────────────────────────────────
// Usado pelo SWR e pelas mutações. Gere o Cart-Token automaticamente.

async function request<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Cart-Token', token);

  const response = await fetch(`${CART_API_BASE}${endpoint}`, {
    ...options,
    headers,
    cache: 'no-store',
    credentials: 'include',
  });

  // Persiste o token se a API devolver um novo
  const newToken = response.headers.get('Cart-Token');
  if (newToken && newToken !== token) {
    saveToken(newToken);
  }

  if (!response.ok) {
    const text = await response.text();
    let message = `Erro ${response.status}`;
    try {
      message = JSON.parse(text)?.message ?? message;
    } catch {
      // usa o fallback
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

// ─── API Actions ──────────────────────────────────────────────────────────────

export const cartApi = {
  /** Fetcher compatível com SWR — chave é a própria URL do endpoint */
  fetcher: () => request('/cart'),

  addItem: (productId: number | string, quantity: number, variationId?: number) =>
    request('/cart/add-item', {
      method: 'POST',
      body: JSON.stringify({
        id: productId,
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

  clearToken,

  redirectToCheckout: () => {
    // O Cart-Token agora viaja como cookie HttpOnly (definido pelo proxy).
    // O WooCommerce lê-o automaticamente — não precisamos de query string.
    const base = `${process.env.NEXT_PUBLIC_WP_URL}/checkout`;
    window.location.href = base;
  },
};