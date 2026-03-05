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