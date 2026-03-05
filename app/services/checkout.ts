// ─── Checkout Service ─────────────────────────────────────────────────────────
// Toda a lógica de nonce foi removida deste serviço — o proxy em
// app/api/checkout/route.ts trata do ciclo nonce+sessão internamente.
// Este serviço só precisa de enviar o Cart-Token e os cookies de sessão
// (que o browser gere automaticamente via credentials:'include').
// ──────────────────────────────────────────────────────────────────────────────

import { getCartToken, CART_TOKEN_LS_KEY } from '@/app/services/cart';

const CHECKOUT_API = '/api/checkout';

function saveToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_TOKEN_LS_KEY, token);
}

async function request<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getCartToken();

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Cart-Token', token);

  const response = await fetch(`${CHECKOUT_API}${path}`, {
    ...options,
    headers,
    cache:       'no-store',
    // credentials:'include' garante que os cookies de sessão WordPress
    // (devolvidos pelo GET) são reenviados automaticamente no POST
    credentials: 'include',
  });

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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CheckoutAddress {
  first_name: string;
  last_name:  string;
  company?:   string;
  address_1:  string;
  address_2?: string;
  city:       string;
  state:      string;
  postcode:   string;
  country:    string;
  email?:     string;
  phone?:     string;
}

export interface ShippingRate {
  rate_id:             string;
  name:                string;
  price:               string;
  currency_minor_unit: number;
  selected:            boolean;
  method_id:           string;
  instance_id:         number;
}

export interface ShippingPackage {
  package_id:     number;
  name:           string;
  shipping_rates: ShippingRate[];
}

export interface PaymentMethod {
  id:          string;
  title:       string;
  description: string;
}

export interface CheckoutState {
  order_id?:        number;
  status?:          string;
  billing_address:  CheckoutAddress;
  shipping_address: CheckoutAddress;
  payment_method:   string;
  payment_methods?: PaymentMethod[];
  shipping_rates?:  ShippingPackage[];
  coupons?:         Array<{ code: string }>;
  payment_result?:  { payment_status: string; redirect_url?: string };
  totals?: {
    total_price:         string;
    total_shipping:      string;
    total_discount:      string;
    currency_minor_unit: number;
  };
}

export interface CheckoutPayload {
  billing_address:  CheckoutAddress;
  shipping_address: CheckoutAddress;
  payment_method:   string;
  customer_note?:   string;
  payment_data?:    Array<{ key: string; value: string }>;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const checkoutApi = {
  getCheckout: (): Promise<CheckoutState> =>
    request<CheckoutState>(''),

  placeOrder: (payload: CheckoutPayload): Promise<CheckoutState> =>
    request<CheckoutState>('', {
      method: 'POST',
      body:   JSON.stringify(payload),
    }),

  getShippingRates: (): Promise<ShippingPackage[]> =>
    request<ShippingPackage[]>('/shipping'),

  selectShippingRate: (packageId: number, rateId: string): Promise<unknown> =>
    request('/shipping', {
      method: 'POST',
      body:   JSON.stringify({ package_id: packageId, rate_id: rateId }),
    }),

  applyCoupon: (code: string): Promise<unknown> =>
    request('/coupon/apply', {
      method: 'POST',
      body:   JSON.stringify({ code }),
    }),

  removeCoupon: (code: string): Promise<unknown> =>
    request('/coupon/remove', {
      method: 'POST',
      body:   JSON.stringify({ code }),
    }),
};