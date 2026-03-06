<?php
/**
 * Plugin Name: Arterio Session Handoff
 * Description: Converte Cart-Token em sessão WordPress para checkout nativo
 * Version: 3.0
 * Author: Arterio
 *
 * Copia o carrinho da sessão headless (Store API) para a sessão PHP
 * tradicional do WooCommerce e deixa o WC definir os cookies.
 *
 * URL: /session-handoff/?cart_token=<JWT>[&debug=1]
 */

// Registrar query var
add_filter('query_vars', function ($vars) {
    $vars[] = 'arterio_handoff';
    return $vars;
});

// Registrar rewrite rule
add_action('init', function () {
    add_rewrite_rule(
        '^session-handoff/?$',
        'index.php?arterio_handoff=1',
        'top'
    );
});

// Interceptar ANTES do WC carregar a sessão (priority 1, on 'wp_loaded')
// Isso permite que definamos o $_COOKIE antes do WC_Session_Handler::init()
add_action('wp_loaded', function () {
    if (empty($_GET['arterio_handoff']) && !get_query_var('arterio_handoff')) {
        // Fallback: verificar via REQUEST_URI
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        if (strpos($uri, 'session-handoff') === false) {
            return;
        }
    }

    $cart_token = isset($_GET['cart_token']) ? sanitize_text_field($_GET['cart_token']) : '';
    if (empty($cart_token)) {
        return; // Vai para template_redirect onde mostramos o erro
    }

    // Decodificar JWT
    $parts = explode('.', $cart_token);
    if (count($parts) !== 3) {
        return;
    }

    $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
    $user_id = $payload['user_id'] ?? null;
    if (empty($user_id)) {
        return;
    }

    if (!function_exists('WC')) {
        return;
    }

    // Buscar sessão headless no banco
    global $wpdb;
    $table = $wpdb->prefix . 'woocommerce_sessions';

    $session_row = $wpdb->get_row($wpdb->prepare(
        "SELECT session_key, session_value FROM {$table} WHERE session_key = %s LIMIT 1",
        $user_id
    ));

    if (!$session_row) {
        $session_row = $wpdb->get_row($wpdb->prepare(
            "SELECT session_key, session_value FROM {$table} WHERE session_key LIKE %s ORDER BY session_expiry DESC LIMIT 1",
            $wpdb->esc_like($user_id) . '%'
        ));
    }

    if (!$session_row) {
        return;
    }

    // Desserializar dados da sessão headless
    $headless_data = maybe_unserialize($session_row->session_value);
    if (!is_array($headless_data) || empty($headless_data['cart'])) {
        return;
    }

    // Copiar dados para a sessão WC atual
    // WC()->session já foi inicializado neste ponto (wp_loaded)
    if (!WC()->session) {
        return;
    }

    // Copiar TODOS os dados da sessão headless para a sessão WC
    foreach ($headless_data as $key => $value) {
        WC()->session->set($key, maybe_unserialize($value));
    }

    // Dizer ao WC para definir o cookie de sessão
    WC()->session->set_customer_session_cookie(true);

    // Salvar sessão no banco
    WC()->session->save_data();

    // Guardar info para o template_redirect
    $GLOBALS['arterio_handoff_ok'] = true;
    $GLOBALS['arterio_headless_data'] = $headless_data;
    $GLOBALS['arterio_session_key'] = $session_row->session_key;

}, 1); // priority 1 = o mais cedo possível

// Template redirect para fazer o redirect ou mostrar debug
add_action('template_redirect', function () {
    // Verificar via query_var ou REQUEST_URI
    $is_handoff = get_query_var('arterio_handoff');
    if (!$is_handoff) {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        if (strpos($uri, 'session-handoff') === false) {
            return;
        }
    }

    // Desabilitar cache
    if (!defined('DONOTCACHEPAGE')) {
        define('DONOTCACHEPAGE', true);
    }
    nocache_headers();

    $cart_token = isset($_GET['cart_token']) ? sanitize_text_field($_GET['cart_token']) : '';

    if (empty($cart_token)) {
        wp_die('Missing cart_token parameter', 'Erro', ['response' => 400]);
    }

    if (empty($GLOBALS['arterio_handoff_ok'])) {
        wp_die('Sessão não encontrada ou carrinho vazio.', 'Erro', ['response' => 404]);
    }

    $redirect = isset($_GET['redirect']) ? esc_url_raw($_GET['redirect']) : wc_get_checkout_url();

    // Modo debug
    if (!empty($_GET['debug'])) {
        header('Content-Type: application/json; charset=utf-8');
        $headless_data = $GLOBALS['arterio_headless_data'] ?? [];
        $cart_contents = isset($headless_data['cart']) ? maybe_unserialize($headless_data['cart']) : 'NOT_FOUND';
        
        echo json_encode([
            'success'           => true,
            'headless_key'      => $GLOBALS['arterio_session_key'] ?? 'unknown',
            'wc_customer_id'    => WC()->session ? WC()->session->get_customer_id() : 'N/A',
            'wc_has_cookie'     => isset($_COOKIE['wp_woocommerce_session_' . COOKIEHASH]),
            'cookie_hash'       => COOKIEHASH,
            'cookie_domain'     => defined('COOKIE_DOMAIN') ? COOKIE_DOMAIN : 'NOT_SET',
            'session_keys'      => is_array($headless_data) ? array_keys($headless_data) : 'NOT_ARRAY',
            'cart_items_count'  => is_array($cart_contents) ? count($cart_contents) : 0,
            'cart_item_keys'    => is_array($cart_contents) ? array_keys($cart_contents) : [],
            'wc_cart_contents'  => WC()->cart ? count(WC()->cart->get_cart()) : 'cart_not_loaded',
            'redirect_url'      => $redirect,
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    wp_redirect($redirect, 302);
    exit;
});
