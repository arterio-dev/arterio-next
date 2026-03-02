import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('wp_auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { user: null },
        { status: 200 }
      );
    }

    const wpUrl = process.env.NEXT_PUBLIC_WP_URL;
    if (!wpUrl) {
      return NextResponse.json(
        { user: null },
        { status: 200 }
      );
    }

    // Buscar dados do usuário autenticado
    const response = await fetch(`${wpUrl}/wp-json/wp/v2/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { user: null },
        { status: 200 }
      );
    }

    const user = await response.json();

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { user: null },
      { status: 200 }
    );
  }
}
