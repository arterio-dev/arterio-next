import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const res = NextResponse.json(
    { success: true, message: 'Logout realizado' },
    { status: 200 }
  );

  // Limpar cookie de autenticação
  res.cookies.set('wp_auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return res;
}
