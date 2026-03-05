import { NextRequest, NextResponse } from 'next/server';

const WP_STORE_API = `${process.env.NEXT_PUBLIC_WP_URL}/wp-json/wc/store/v1`;

// ─── GET /api/checkout ────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const cartToken = request.headers.get('Cart-Token');

  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  if (cartToken) headers.set('Cart-Token', cartToken);

  // Propaga cookies do browser (sessão WordPress, se existir)
  const browserCookies = request.headers.get('Cookie');
  if (browserCookies) headers.set('Cookie', browserCookies);

  try {
    const wooRes = await fetch(`${WP_STORE_API}/checkout`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    const data = await wooRes.text();
    const resHeaders = new Headers();
    resHeaders.set('Content-Type', 'application/json');

    const newToken = wooRes.headers.get('Cart-Token');
    if (newToken) resHeaders.set('Cart-Token', newToken);

    // Passa os cookies de sessão WordPress ao browser para que os envie de volta
    // no POST — é assim que o nonce fica amarrado à sessão correcta.
    const setCookieHeaders = wooRes.headers.getSetCookie?.() ?? [];
    for (const cookie of setCookieHeaders) {
      resHeaders.append('Set-Cookie', cookie);
    }

    // Fallback para ambientes onde getSetCookie não existe (Node < 18.14)
    if (setCookieHeaders.length === 0) {
      const singleSetCookie = wooRes.headers.get('set-cookie');
      if (singleSetCookie) resHeaders.set('Set-Cookie', singleSetCookie);
    }

    return new NextResponse(data, { status: wooRes.status, headers: resHeaders });
  } catch (error) {
    console.error('[Checkout GET]', error);
    return NextResponse.json({ message: 'Erro ao contactar o servidor.' }, { status: 503 });
  }
}

// ─── POST /api/checkout ───────────────────────────────────────────────────────
//
// COMO RESOLVE O NONCE:
//   O nonce do WooCommerce é gerado por wp_create_nonce('wc_store_api') e fica
//   amarrado ao PHP session_id() do pedido que o gerou.
//
//   Fluxo correcto:
//     1. Browser faz GET /api/checkout → proxy faz GET ao WC
//     2. WC devolve nonce + Set-Cookie (woocommerce-session / wp_wc_session_*)
//     3. Proxy repassa esses cookies ao browser via Set-Cookie
//     4. Browser armazena os cookies e reenvia-os no POST
//     5. Proxy faz GET rápido ao WC com esses cookies → obtém nonce válido
//        para ESSA sessão
//     6. Proxy usa o nonce no POST → WC valida com sucesso

export async function POST(request: NextRequest) {
  const cartToken    = request.headers.get('Cart-Token');
  const browserCookies = request.headers.get('Cookie') ?? '';

  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(cartToken      ? { 'Cart-Token': cartToken }      : {}),
    ...(browserCookies ? { 'Cookie':     browserCookies } : {}),
  };

  // ── Passo 1: GET ao WC com os cookies do browser → nonce válido ──────────
  let nonce: string | null = null;
  let sessionCookies = '';

  try {
    const nonceRes = await fetch(`${WP_STORE_API}/checkout`, {
      method:  'GET',
      headers: baseHeaders,
      cache:   'no-store',
    });

    nonce =
      nonceRes.headers.get('X-WC-Store-API-Nonce') ??
      nonceRes.headers.get('Nonce')                ??
      null;

    // Recolhe os cookies de sessão devolvidos para os incluir no POST
    const setCookies = nonceRes.headers.getSetCookie?.() ?? [];
    if (setCookies.length > 0) {
      // Converte Set-Cookie → Cookie (extrai apenas nome=valor)
      sessionCookies = setCookies
        .map(c => c.split(';')[0])   // fica só "nome=valor"
        .join('; ');
    } else {
      // Fallback Node < 18.14
      const raw = nonceRes.headers.get('set-cookie');
      if (raw) sessionCookies = raw.split(';')[0];
    }
  } catch (err) {
    console.error('[Checkout POST] Erro ao obter nonce:', err);
  }

  if (!nonce) {
    console.error('[Checkout POST] WooCommerce não devolveu nonce.');
    return NextResponse.json(
      { message: 'Não foi possível obter o token de segurança. Recarrega a página e tenta de novo.' },
      { status: 502 },
    );
  }

  // ── Passo 2: POST ao WC com nonce + cookie de sessão da mesma sessão ─────
  // Combinamos: cookies do browser + cookies novos da sessão criada no passo 1
  const allCookies = [browserCookies, sessionCookies]
    .filter(Boolean)
    .join('; ');

  const body = await request.text();

  try {
    const wooRes = await fetch(`${WP_STORE_API}/checkout`, {
      method: 'POST',
      headers: {
        ...baseHeaders,
        'X-WC-Store-API-Nonce': nonce,
        ...(allCookies ? { 'Cookie': allCookies } : {}),
      },
      body,
      cache: 'no-store',
    });

    const data = await wooRes.text();
    const resHeaders = new Headers();
    resHeaders.set('Content-Type', 'application/json');

    const newToken = wooRes.headers.get('Cart-Token');
    if (newToken) resHeaders.set('Cart-Token', newToken);

    return new NextResponse(data, { status: wooRes.status, headers: resHeaders });
  } catch (error) {
    console.error('[Checkout POST]', error);
    return NextResponse.json({ message: 'Erro ao processar o pedido.' }, { status: 503 });
  }
}