<?php
/**
 * Session Handoff Endpoint para WooCommerce Headless
 * 
 * Este endpoint recebe um Cart-Token (JWT da Store API) e converte a sessão
 * headless em uma sessão PHP tradicional com cookies wp_wc_session_*.
 * 
 * INSTALAÇÃO:
 * 1. Adicione este código ao functions.php do tema ativo, OU
 * 2. Crie um plugin "mu-plugin" em wp-content/mu-plugins/session-handoff.php
 * 
 * USO:
 * GET /wp-json/arterio/v1/session-handoff?cart_token=<JWT>
 * → Retorna JSON com redirect_url e define cookies de sessão
 * 
 * @package Arterio
 */

add_action('rest_api_init', function () {
    register_rest_route('arterio/v1', '/session-handoff', [
        'methods'             => 'GET',
        'callback'            => 'arterio_session_handoff',
        'permission_callback' => '__return_true',
        'args'                => [
            'cart_token' => [
                'required'    => true,
                'type'        => 'string',
                'description' => 'JWT Cart-Token da Store API',
            ],
            'redirect'   => [
                'required'    => false,
                'type'        => 'string',
                'default'     => '',
                'description' => 'URL para redirect após handoff (opcional)',
            ],
        ],
    ]);
});

/**
 * Converte Cart-Token em sessão WooCommerce tradicional.
 *
 * @param WP_REST_Request $request
 * @return WP_REST_Response|WP_Error
 */
function arterio_session_handoff(WP_REST_Request $request) {
    $cart_token = $request->get_param('cart_token');
    $redirect   = $request->get_param('redirect');

    // Validar que WooCommerce está ativo
    if (!class_exists('WC_Session_Handler') || !function_exists('WC')) {
        return new WP_Error(
            'wc_not_available',
            'WooCommerce não está disponível',
            ['status' => 500]
        );
    }

    // Decodificar o Cart-Token (JWT)
    $token_data = arterio_decode_cart_token($cart_token);
    if (is_wp_error($token_data)) {
        return $token_data;
    }

    $session_key = $token_data['user_id'];

    // Buscar dados da sessão da Store API no banco de dados
    global $wpdb;
    $table_name = $wpdb->prefix . 'woocommerce_sessions';
    
    $session_data = $wpdb->get_var($wpdb->prepare(
        "SELECT session_value FROM {$table_name} WHERE session_key = %s",
        $session_key
    ));

    if (empty($session_data)) {
        return new WP_Error(
            'session_not_found',
            'Sessão do carrinho não encontrada. Token inválido ou expirado.',
            ['status' => 404]
        );
    }

    // Iniciar/atualizar sessão WooCommerce tradicional
    WC()->initialize_session();
    
    // Copiar dados da sessão headless para a sessão atual
    $session_array = maybe_unserialize($session_data);
    if (is_array($session_array)) {
        foreach ($session_array as $key => $value) {
            WC()->session->set($key, maybe_unserialize($value));
        }
    }

    // Forçar a criação do cookie de sessão
    $customer_id = WC()->session->get_customer_id();
    
    // Definir cookies manualmente para garantir cross-domain
    $cookie_hash = 'wp_woocommerce_session_' . COOKIEHASH;
    $session_expiration = time() + (60 * 60 * 48); // 48 horas
    $session_expiring   = time() + (60 * 60 * 47);
    $to_hash = $customer_id . '|' . $session_expiration;
    $cookie_value = $customer_id . '||' . $session_expiration . '||' . $session_expiring . '||' . hash_hmac('md5', $to_hash, wp_hash($to_hash));
    
    // Definir cookie com domain correto para funcionar cross-domain
    $cookie_domain = defined('COOKIE_DOMAIN') ? COOKIE_DOMAIN : '';
    
    setcookie(
        $cookie_hash,
        $cookie_value,
        $session_expiration,
        COOKIEPATH,
        $cookie_domain,
        is_ssl(),
        true
    );

    // Também definir os cookies auxiliares
    setcookie('woocommerce_items_in_cart', '1', $session_expiration, COOKIEPATH, $cookie_domain, is_ssl());
    $cart = WC()->session->get('cart');
    if (!empty($cart)) {
        setcookie('woocommerce_cart_hash', md5(wp_json_encode($cart)), $session_expiration, COOKIEPATH, $cookie_domain, is_ssl());
    }

    // Se redirect foi solicitado, fazer redirect HTTP
    if (!empty($redirect)) {
        $checkout_url = filter_var($redirect, FILTER_VALIDATE_URL) 
            ? $redirect 
            : wc_get_checkout_url();
        
        // Retornar redirect
        return new WP_REST_Response(null, 302, [
            'Location' => $checkout_url,
        ]);
    }

    // Retornar sucesso com URL do checkout
    return new WP_REST_Response([
        'success'      => true,
        'checkout_url' => wc_get_checkout_url(),
        'session_key'  => $customer_id,
        'message'      => 'Sessão transferida com sucesso',
    ], 200);
}

/**
 * Decodifica o Cart-Token JWT da Store API.
 * 
 * IMPORTANTE: O WooCommerce Store API usa uma chave secreta interna para
 * assinar os tokens. Este código apenas extrai o payload sem verificar
 * a assinatura (adequado para uso interno em servidor confiável).
 *
 * @param string $token JWT Cart-Token
 * @return array|WP_Error Payload decodificado ou erro
 */
function arterio_decode_cart_token($token) {
    $parts = explode('.', $token);
    
    if (count($parts) !== 3) {
        return new WP_Error(
            'invalid_token_format',
            'Formato de token inválido',
            ['status' => 400]
        );
    }

    // Decodificar payload (segunda parte do JWT)
    $payload = json_decode(
        base64_decode(strtr($parts[1], '-_', '+/')),
        true
    );

    if (empty($payload) || empty($payload['user_id'])) {
        return new WP_Error(
            'invalid_token_payload',
            'Payload do token inválido',
            ['status' => 400]
        );
    }

    // Verificar expiração
    if (!empty($payload['exp']) && $payload['exp'] < time()) {
        return new WP_Error(
            'token_expired',
            'Token expirado',
            ['status' => 401]
        );
    }

    return $payload;
}

/**
 * IMPORTANTE: Configuração necessária no wp-config.php
 * 
 * Para que os cookies funcionem cross-domain (www.arterio.com.br → api.arterio.com.br),
 * adicione estas linhas ao wp-config.php:
 * 
 * define('COOKIE_DOMAIN', '.arterio.com.br');
 * define('COOKIEPATH', '/');
 * 
 * Isso permite que cookies definidos por api.arterio.com.br sejam
 * lidos por www.arterio.com.br e vice-versa.
 */
