import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Buscar produto do WooCommerce
    const wooCommerceUrl = process.env.NEXT_PUBLIC_WP_URL;
    
    if (!wooCommerceUrl) {
      return NextResponse.json(
        { error: 'WooCommerce URL not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${wooCommerceUrl}/wp-json/wc/store/v1/products/${id}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: response.status }
      );
    }

    const product = await response.json();
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
