// app/api/account/_helpers.ts
const WP_URL  = process.env.NEXT_PUBLIC_WP_URL;
const WC_KEY    = process.env.WC_CONSUMER_KEY;
const WC_SECRET = process.env.WC_CONSUMER_SECRET;
const WC_AUTH = (WC_KEY && WC_SECRET)
  ? 'Basic ' + Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString('base64')
  : '';

export async function getUserFromToken(
  token: string,
): Promise<{ id: number; email: string } | null> {
  const meRes = await fetch(`${WP_URL}/wp-json/wp/v2/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!meRes.ok) return null;
  const { id } = await meRes.json();

  const customerRes = await fetch(`${WP_URL}/wp-json/wc/v3/customers/${id}`, {
    headers: { Authorization: WC_AUTH },
  });
  if (!customerRes.ok) return null;
  const { email } = await customerRes.json();

  return { id, email };
}