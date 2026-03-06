import { NextRequest, NextResponse } from 'next/server';

const WP_STORE_API = `${process.env.NEXT_PUBLIC_WP_URL}/wp-json/wc/store/v1`;

async function proxyToWoo(request: NextRequest, path: string[]) {
  const endpoint = path.join('/');
  const url = new URL(request.url);
  // Cache-buster: a CDN pode estar a cachear respostas da Store API,
  // resultando em nonces expirados. Adicionamos um timestamp a cada pedido.
  url.searchParams.set('_cb', Date.now().toString());
  const targetUrl = `${WP_STORE_API}/${endpoint}${url.search}`;

  const cartToken = request.headers.get('Cart-Token');
  const nonce     = request.headers.get('Nonce');

  const headers = new Headers();
  headers.set('Content-Type', 'application/json');

  if (cartToken) headers.set('Cart-Token', cartToken);
  if (nonce)     headers.set('Nonce', nonce);

  const init: RequestInit = { method: request.method, headers };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const body = await request.text();
    if (body) init.body = body;
  }

  try {
    const response = await fetch(targetUrl, init);
    const data = await response.text();

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'application/json');

    const newToken = response.headers.get('Cart-Token');
    if (newToken) responseHeaders.set('Cart-Token', newToken);

    // Retransmite o nonce devolvido pelo WooCommerce para que o cliente o possa persistir
    // WooCommerce retorna 'nonce' em minúsculas
    const returnedNonce =
      response.headers.get('nonce') ??
      response.headers.get('Nonce') ??
      response.headers.get('X-WC-Store-API-Nonce');
    if (returnedNonce) responseHeaders.set('Nonce', returnedNonce);

    return new NextResponse(data, { status: response.status, headers: responseHeaders });
  } catch (error) {
    console.error(`[Cart Proxy] Erro ao contactar WooCommerce:`, error);
    return NextResponse.json(
      { message: 'Não foi possível contactar o servidor da loja.' },
      { status: 503 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyToWoo(request, path);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyToWoo(request, path);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyToWoo(request, path);
}