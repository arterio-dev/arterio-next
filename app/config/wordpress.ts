// Configuração Limpa para WooCommerce Store API
const wpUrl = process.env.NEXT_PUBLIC_WP_URL || 'https://arterio.com.br/wp';

export const WP_CONFIG = {
  siteUrl: wpUrl,
  
  // Store API v1 (Pública, segura e feita para Frontends)
  storeApiUrl: `${wpUrl}/wp-json/wc/store/v1`,
  
  checkoutUrl: `${wpUrl}/checkout`,
};
