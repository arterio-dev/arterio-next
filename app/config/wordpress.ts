// Configuração Limpa para WooCommerce Store API
const wpUrl = process.env.NEXT_PUBLIC_WP_URL;

export const WP_CONFIG = {
  siteUrl: wpUrl,
  cartApiUrl: '/api/cart', 
  storeApiUrl: `/api/wp/wc/store/v1`,
  checkoutUrl: `${wpUrl}/checkout`,
  // Endpoint custom para session handoff (Cart-Token → cookies PHP)
  sessionHandoffUrl: `${wpUrl}/session-handoff`,
};