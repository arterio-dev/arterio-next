import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const wpUrl = process.env.NEXT_PUBLIC_WP_URL;
    if (!wpUrl) {
      return NextResponse.json(
        { error: 'WordPress URL não configurada' },
        { status: 500 }
      );
    }

    // 1. Usar o endpoint do plugin JWT em vez do Basic Auth
    const response = await fetch(`${wpUrl}/wp-json/jwt-auth/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: email, // O plugin JWT aceita o email no campo username
        password: password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Email ou senha inválidos' },
        { status: 401 }
      );
    }

    // 2. Montar a resposta de sucesso com os dados do usuário
    const res = NextResponse.json(
      {
        success: true,
        user: {
          id: data.user_id,
          email: data.user_email,
          name: data.user_display_name,
        },
      },
      { status: 200 }
    );

    // 3. Salvar O TOKEN (seguro) no cookie, NUNCA a senha
    res.cookies.set('wp_auth_token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    );
  }
}