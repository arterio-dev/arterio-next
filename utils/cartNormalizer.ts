// ─── Cart Normalizer ──────────────────────────────────────────────────────────
// Transforma a resposta bruta da WooCommerce Store API no tipo CartItem local.
// Isolado aqui para ser fácil de atualizar se a API mudar.
// ──────────────────────────────────────────────────────────────────────────────

import type { CartItem } from '@/app/types/woocommerce';

interface ServerCartItem {
  key: string;
  id: number;
  name: string;
  quantity: number;
  variation_id?: number;
  images?: Array<{ src: string }>;
  prices?: {
    price?: number | string;
    currency_minor_unit?: number;
  };
  totals?: {
    line_subtotal?: number | string;
    line_total?: number | string;
  };
}

export interface ServerCart {
  items?: ServerCartItem[];
  totals?: {
    total_price?: string | number;
    currency_minor_unit?: number;
  };
}

function toCurrency(raw: number | string | undefined, divisor: number): string {
  if (raw === undefined || raw === null) return '0.00';
  const num = typeof raw === 'string' ? parseFloat(raw) : raw;
  return isNaN(num) ? '0.00' : (num / divisor).toFixed(2);
}

export function normalizeCart(serverCart: unknown): CartItem[] {
  const cart = serverCart as ServerCart;
  if (!cart?.items?.length) return [];

  return cart.items.map((item): CartItem => {
    const minor = item.prices?.currency_minor_unit ?? 2;
    const divisor = Math.pow(10, minor);

    return {
      key: item.key,
      product_id: item.id,
      variation_id: item.variation_id,
      quantity: item.quantity,
      product: {
        id: item.id.toString(),
        name: item.name,
        price: toCurrency(item.prices?.price, divisor),
        image: item.images?.[0]?.src ?? '',
      } as any,
      subtotal: toCurrency(item.totals?.line_subtotal, divisor),
      total: toCurrency(item.totals?.line_total, divisor),
    };
  });
}

export function normalizeTotal(serverCart: unknown): number {
  const cart = serverCart as ServerCart;
  if (!cart?.totals?.total_price) return 0;

  const minor = cart.totals?.currency_minor_unit ?? 2;
  const divisor = Math.pow(10, minor);
  const raw = cart.totals.total_price;
  const num = typeof raw === 'string' ? parseFloat(raw) : raw;

  return isNaN(num) ? 0 : num / divisor;
}