```markdown
# Arterio Next — Copilot Instructions

## Stack
- Next.js App Router + React 19, TypeScript
- Cart state: **SWR** (`hooks/useCart.ts`) — do not migrate to React Query or Zustand
- All cart/components must be `'use client'`

---

## Checkout Architecture: Native WooCommerce Redirect

The headless experience ends at the cart. When the user clicks "Finalizar Compra", we redirect to the native WooCommerce checkout at `WP_CONFIG.checkoutUrl` (`api.arterio.com.br/checkout`). There is **no custom `/checkout` page** in Next.js.

### Session Handoff — How It Works

The headless cart identifies sessions via `Cart-Token` stored in `localStorage`. The native WooCommerce checkout uses `wp_wc_session_*` PHP cookies. These are two different identity mechanisms across two different domains (`www.arterio.com.br` vs `api.arterio.com.br`).

The bridge is a single GET call through the Next.js proxy before redirecting:

```
Browser                     Next.js Proxy (/api/checkout)     WooCommerce
  │                                  │                              │
  ├─ GET /api/checkout ─────────────►│                              │
  │  Cart-Token: <token>             ├─ GET /wc/store/v1/checkout ─►│
  │  credentials: include            │  Cart-Token: <token>         │
  │                                  │                              │
  │                                  │◄─ 200 + Set-Cookie: ─────────┤
  │                                  │   wp_wc_session_*            │
  │◄─ 200 + Set-Cookie: ────────────┤                              │
  │   wp_wc_session_* (forwarded)    │                              │
  │                                  │                              │
  ├─ window.location.href ───────────────────────────────────────►  │
  │  api.arterio.com.br/checkout                                    │
  │  Cookie: wp_wc_session_* (sent automatically by browser)        │
  │                                  │                              │
  │◄─ WooCommerce checkout with correct cart ─────────────────────  │
```

**WordPress prerequisite:** `wp-config.php` must define:
```php
define('COOKIE_DOMAIN', '.arterio.com.br');
```
Without this, `wp_wc_session_*` cookies are scoped to `api.arterio.com.br` only and the browser will not send them on the redirect — the user lands on an empty cart.

### Key Files

| File | Role |
|---|---|
| `app/services/cart.ts` | `cartApi.redirectToCheckout()` — session handoff + redirect |
| `app/api/checkout/route.ts` | GET-only proxy: forwards `Cart-Token`, relays `Set-Cookie` back to browser |
| `hooks/useCart.ts` | `goToCheckout` — async wrapper with `isRedirecting` state |
| `components/Cart.tsx` | Renders checkout button; disabled + loading text while `isRedirecting` |
| `app/config/wordpress.ts` | `WP_CONFIG.checkoutUrl` — the redirect target |

### What Does Not Exist (and must not be recreated)

- `app/checkout/page.tsx` — no custom checkout page
- `app/services/checkout.ts` — no checkout service
- `app/api/checkout/shipping/` — no shipping proxy
- `app/api/checkout/coupon/` — no coupon proxy
- `hooks/useCheckout.ts` — no checkout hook
- No POST handler on `/api/checkout`
- No nonce handling of any kind

---

## Cart-Token: The Session Contract (CRITICAL)

Guest cart sessions are stateless on the server — identity lives in `localStorage` under the key `arterio_cart_token` (defined in `app/services/cart.ts` as `CART_TOKEN_LS_KEY`).

Rules:
1. **First request** to `/api/cart/cart` returns `Cart-Token` in the response header — save it via `saveToken()`
2. **Every subsequent request** must include `Cart-Token: <token>` — `cartApi.request()` does this automatically, with `credentials: 'include'`
3. **Never read `localStorage` outside `useEffect`** — causes SSR hydration errors. The `getCartToken()` helper guards this with `typeof window === 'undefined'`
4. **Proxy forwards the token** from the incoming request header to WooCommerce — see `app/api/cart/[...path]/route.ts`
5. **Stale token recovery** — if SWR gets a 404/410 on cart fetch (session consumed by WooCommerce after checkout), `useCart` clears the token silently and resets the SWR cache to empty

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

## Known Type Duplication Issue

`CartItem` and `WCProduct` are defined in **two places**:
- `app/types/woocommerce.ts` — full/canonical types
- `types/woocommerce.ts` — lighter aliases used by some components

When adding types, always extend `app/types/woocommerce.ts`. Components importing from `@/types/woocommerce` may need path correction.
```

```