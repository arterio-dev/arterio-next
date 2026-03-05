# Arterio Next — Copilot Instructions

## Stack
- Next.js App Router + React 19, TypeScript
- Cart state: **SWR** (`hooks/useCart.ts`) — already installed and working. Do not migrate to React Query or Zustand as part of a cart/checkout refactor — it is an unrelated scope change with high churn risk and no functional gain at this stage. If a library migration is ever warranted, it should be a standalone task.
- All cart/checkout components must be `'use client'`

---

## Checkout Strategy: Two Options

There are two valid approaches — the choice should be made intentionally, not by default:

**Option A — Custom Next.js checkout** (`/checkout`, current implementation)
Full control over UX, branding, and payment flow. Requires maintaining the nonce/session proxy logic in `app/api/checkout/route.ts`. More complexity, more flexibility.

**Option B — Redirect to native WooCommerce checkout** (`WP_CONFIG.checkoutUrl = ${wpUrl}/checkout`)
Simpler to maintain. WooCommerce handles the entire checkout UI. Trade-off: leaves the headless experience.

⚠️ **Critical constraint for Option B:** The headless cart uses `Cart-Token` stored in `localStorage`. The native WooCommerce checkout page uses WordPress session cookies (`wp_wc_session_*`), not the `Cart-Token` header. A bare `window.location.href = WP_CONFIG.checkoutUrl` will land on an **empty cart** on the WooCommerce side — the session is not carried across.

To make Option B work, the cart session must first be handed off to WordPress. The correct sequence:
1. Call `GET /api/checkout` before redirecting — this causes WooCommerce to set `wp_wc_session_*` cookies on the browser (already done by the proxy via `Set-Cookie`)
2. Then redirect to `WP_CONFIG.checkoutUrl` — WordPress will now recognise the session via those cookies and show the correct cart

`cartApi.redirectToCheckout()` currently redirects to `/checkout` (Option A). To switch to Option B, change it to first await the GET and then redirect to `WP_CONFIG.checkoutUrl`.

---

## Architecture: Request Flow

```
Browser → /api/cart/[...path] (Next proxy) → WooCommerce Store API v1
Browser → /api/checkout        (Next proxy) → WooCommerce Store API v1
```

The Next.js proxies exist to inject the `Cart-Token` server-side and avoid CORS issues. **Never call WooCommerce directly from the client.**

---

## Cart-Token: The Session Contract (CRITICAL)

Guest cart sessions are stateless on the server — identity lives in `localStorage` under the key `arterio_cart_token` (defined in `app/services/cart.ts` as `CART_TOKEN_LS_KEY`).

Rules:
1. **First request** to `/api/cart/cart` returns `Cart-Token` in the response header — save it via `saveToken()`
2. **Every subsequent request** must include `Cart-Token: <token>` — `cartApi.request()` does this automatically
3. **Never read `localStorage` outside `useEffect`** — causes SSR hydration errors. The `getCartToken()` helper guards this with `typeof window === 'undefined'`
4. **Proxy forwards the token** from the incoming request header to WooCommerce — see `app/api/cart/[...path]/route.ts`

---

## Checkout: Nonce + Cookie Session (CRITICAL)

The WooCommerce checkout requires a `X-WC-Store-API-Nonce` tied to a PHP session. The nonce is NOT fetched client-side.

Correct flow (already implemented in `app/api/checkout/route.ts`):
1. `GET /api/checkout` → proxy fetches nonce from WC, **sets WP session cookies on the browser** via `Set-Cookie`
2. Browser sends those cookies back on the next request
3. `POST /api/checkout` → proxy does a fresh `GET` to WC using those cookies to get a valid nonce, then uses it in the `POST`

**Do not move nonce fetching to the client.** Do not cache the nonce between page loads.

---

## Key Files

| File | Role |
|---|---|
| `hooks/useCart.ts` | Single source of truth for cart state (SWR-backed) |
| `app/services/cart.ts` | All WooCommerce cart API calls + token management |
| `app/services/checkout.ts` | Checkout API calls (`getCheckout`, `placeOrder`, etc.) |
| `utils/cartNormalizer.ts` | Transforms raw WC API response → `CartItem[]` |
| `app/api/cart/[...path]/route.ts` | Catch-all proxy for cart endpoints |
| `app/api/checkout/route.ts` | Checkout proxy with nonce resolution logic |
| `app/types/woocommerce.ts` | Canonical types — **two versions exist** (see below) |

---

## Known Type Duplication Issue

`CartItem` and `WCProduct` are defined in **two places**:
- `app/types/woocommerce.ts` — full/canonical types
- `types/woocommerce.ts` — lighter aliases used by some components

When adding types, always extend `app/types/woocommerce.ts`. Components importing from `@/types/woocommerce` may need path correction.

---

## Cart Mutation Pattern

Every cart action follows the same pattern in `useCart.ts` via `runMutation()`:
```ts
const updatedCart = await action();           // API returns full cart
await mutate(updatedCart, { revalidate: false }); // Inject into SWR cache — no re-fetch
// On error: await mutate() — forces re-fetch to recover real state
```
**`revalidate: false` is intentional** — prevents stale re-fetch overwriting the fresh API response.

---

## Race Condition: Quantity Updates

`updateQuantity` uses per-item debounce (`QUANTITY_DEBOUNCE_MS = 350ms`) via `pendingQuantityTimers` ref (a `Map<itemKey, timer>`).  
When `quantity <= 0`, the item is removed immediately (no debounce).  
`removeFromCart` cancels any pending timer for that item before calling the API.

---

## Product API: Category Filtering

`useProducts` fetches **all products** and filters client-side by `category` ID — this is intentional to work around a WooCommerce Store API bug with category query params.  
Do not add `category` as a query param to the WC fetch.

---

## Checkout Page State — Current Problem

`app/checkout/page.tsx` has ~12 scattered `useState` calls managing address, shipping, coupons, payment, and loading flags independently. Every mutation (coupon, shipping rate, submit) does its own `setXxxLoading` + sequential `checkoutApi.getCheckout()` re-fetch. This creates sync bugs and is fragile.

## Checkout Refactor Target: `useCheckout` Hook

**Goal:** Extract all checkout logic into `hooks/useCheckout.ts`, mirroring the `useCart` pattern. The page becomes a pure render component.

**Target shape:**
```ts
export function useCheckout() {
  // Depends on useCart to know when the token is ready and to clear cart after order
  const { mutate: cartMutate } = useCart();

  // Single server state — SWR-backed, same pattern as useCart
  // SWR key is null until a Cart-Token exists (getCartToken() !== null)
  const [tokenReady, setTokenReady] = useState(false);
  useEffect(() => { setTokenReady(!!getCartToken()); }, []);

  const { data: checkoutData, mutate } = useSWR(
    tokenReady ? 'checkout' : null,
    checkoutApi.getCheckout,
    { revalidateOnFocus: false },
  );

  // Local form state only — NOT derived from server
  const [billing, setBilling]         = useState<CheckoutAddress>(EMPTY_ADDRESS);
  const [shipping, setShipping]       = useState<CheckoutAddress>(EMPTY_ADDRESS);
  const [sameAddress, setSameAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentData, setPaymentData] = useState<Array<{ key: string; value: string }>>([]);
  const [couponInput, setCouponInput] = useState('');
  const [isUpdating, setIsUpdating]   = useState(false);

  // Derived from server state — do NOT duplicate into local useState
  // checkoutData.coupons, checkoutData.totals, checkoutData.shipping_rates,
  // checkoutData.payment_methods all come from SWR

  // Single mutation helper — same contract as runMutation in useCart
  const runMutation = async (action: () => Promise<CheckoutState>, errorMsg: string) => {
    setIsUpdating(true);
    try {
      const updated = await action();
      await mutate(updated, { revalidate: false });
    } catch (err) {
      await mutate(); // re-fetch to restore real server state on error
      addToast(err instanceof Error ? err.message : errorMsg, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const selectShippingRate = (packageId: number, rateId: string) =>
    runMutation(
      () => checkoutApi.selectShippingRate(packageId, rateId).then(() => checkoutApi.getCheckout()),
      'Não foi possível seleccionar o método de envio.',
    );

  const applyCoupon = (code: string) =>
    runMutation(
      () => checkoutApi.applyCoupon(code).then(() => checkoutApi.getCheckout()),
      'Cupão inválido.',
    );

  const removeCoupon = (code: string) =>
    runMutation(
      () => checkoutApi.removeCoupon(code).then(() => checkoutApi.getCheckout()),
      'Não foi possível remover o cupão.',
    );

  // placeOrder: after success, wipe cart state from both SWR caches
  const placeOrder = async () => {
    setIsUpdating(true);
    try {
      const result = await checkoutApi.placeOrder({
        billing_address:  billing,
        shipping_address: sameAddress ? billing : shipping,
        payment_method:   paymentMethod,
        payment_data:     paymentData.length ? paymentData : undefined,
      });
      // Clear cart in SWR + localStorage token — order is placed
      await cartMutate(undefined, { revalidate: false });
      cartApi.clearToken();
      return result;
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao processar pedido.', 'error');
      throw err; // let the page handle redirect vs. success screen
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    checkoutData, billing, setBilling, shipping, setShipping,
    sameAddress, setSameAddress, paymentMethod, setPaymentMethod,
    setPaymentData, couponInput, setCouponInput,
    selectShippingRate, applyCoupon, removeCoupon, placeOrder, isUpdating,
  };
}
```

**Key rules for this refactor:**

- `checkoutData` is the single source of truth for totals, shipping packages, coupons, and available payment methods — derive from it, never duplicate into local `useState`
- `billing`, `shipping`, `sameAddress`, `paymentMethod`, `couponInput` remain local form state
- The SWR key must be `null` until `getCartToken()` is non-null — initialising checkout without a token creates an orphan WooCommerce session
- After `placeOrder` succeeds: call `cartMutate(undefined, { revalidate: false })` then `cartApi.clearToken()` — this clears the cart badge and prevents the old session token from being reused
- After `placeOrder`, if `result.payment_result?.redirect_url` is set, do `window.location.href = redirect_url` — **never use Next.js router for payment gateway redirects**

## Payment Methods with Client-Side Steps

`CheckoutPayload` already has `payment_data?: Array<{ key: string; value: string }>`. Payment gateways (Pix, Stripe, Mercado Pago, etc.) that require client-side tokenisation or QR generation must **populate `paymentData` via `setPaymentData` before `placeOrder` is called**, not inside it.

Pattern for the checkout page:
```tsx
// Each payment method renders its own data-collection UI when selected
// and calls setPaymentData when ready
{paymentMethod === 'pix' && (
  <PixPaymentFields onReady={(data) => setPaymentData(data)} />
)}
{paymentMethod === 'stripe' && (
  <StripePaymentFields onReady={(data) => setPaymentData(data)} />
)}
```

The submit button must be disabled until `paymentData` is populated for methods that require it. Each payment field component is responsible for knowing whether its gateway needs pre-tokenisation. `placeOrder` itself is always gateway-agnostic — it just passes whatever `paymentData` is in state.