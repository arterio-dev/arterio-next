import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email, password } = await request.json();

    const wpUrl = process.env.NEXT_PUBLIC_WP_URL;
    const consumerKey = process.env.WC_CONSUMER_KEY;
    const consumerSecret = process.env.WC_CONSUMER_SECRET;

    // 1. Criar o Cliente no WooCommerce usando a REST API v3
    const authHeader = 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    const createRes = await fetch(`${wpUrl}/wp-json/wc/v3/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        username: email, // Usamos o email como username
      }),
    });

    const createData = await createRes.json();

    if (!createRes.ok) {
      return NextResponse.json({ error: createData.message || 'Erro ao criar conta' }, { status: 400 });
    }

    // 2. Cliente criado! Agora vamos fazer o Login automático dele para gerar o Cookie
    const loginRes = await fetch(`${wpUrl}/wp-json/jwt-auth/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password }),
    });

    const loginData = await loginRes.json();

    if (loginRes.ok) {
      // Salva o cookie de segurança
      const cookieStore = await cookies();
      cookieStore.set('wp_auth_token', loginData.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
    }

    // 3. Devolve sucesso para o frontend
    return NextResponse.json({
      success: true,
      user: {
        id: createData.id,
        email: createData.email,
        name: `${createData.first_name} ${createData.last_name}`.trim(),
      }
    });

  } catch (error) {
    console.error('Erro no registo:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}