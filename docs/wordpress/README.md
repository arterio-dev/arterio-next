# Session Handoff para WooCommerce Headless

Este endpoint resolve o problema de **carrinho vazio** ao redirecionar para o checkout nativo do WooCommerce a partir de uma aplicação headless (Next.js).

## O Problema

Quando usamos o WooCommerce Store API com Cart-Token (JWT), a sessão do carrinho vive apenas no lado da API. O checkout tradicional do WooCommerce usa sessões PHP via cookies `wp_wc_session_*`, que não são partilhados automaticamente.

**Resultado**: Ao redirecionar para `/checkout`, o WordPress não reconhece o carrinho headless e mostra um carrinho vazio.

## A Solução

O endpoint `session-handoff.php` faz a ponte entre os dois sistemas:

1. Recebe o `cart_token` (JWT) como query parameter
2. Decodifica o JWT e extrai o `user_id` (session key)
3. Busca os dados da sessão na tabela `wp_woocommerce_sessions`
4. Define os cookies `wp_wc_session_*` no browser
5. Redireciona para o checkout (opcional)

## Instalação

### Opção 1: MU-Plugin (Recomendado)

```bash
# No servidor WordPress
cp session-handoff.php /path/to/wordpress/wp-content/mu-plugins/
```

MU-Plugins são carregados automaticamente sem necessidade de ativação.

### Opção 2: functions.php

Adicione o conteúdo de `session-handoff.php` ao `functions.php` do tema ativo.

## Configuração Obrigatória

Adicione ao `wp-config.php`:

```php
// Cookie domain para funcionar cross-domain
define('COOKIE_DOMAIN', '.arterio.com.br');
define('COOKIEPATH', '/');
```

Isto permite que cookies definidos por `api.arterio.com.br` sejam lidos por `www.arterio.com.br`.

## Uso

### URL Direta (com redirect automático)

```
https://api.arterio.com.br/wp-json/arterio/v1/session-handoff?cart_token=eyJ...&redirect=https://api.arterio.com.br/checkout
```

### API Response (sem redirect)

```
GET https://api.arterio.com.br/wp-json/arterio/v1/session-handoff?cart_token=eyJ...

Response:
{
  "success": true,
  "checkout_url": "https://api.arterio.com.br/checkout/",
  "session_key": "t_3ece3a9b711...",
  "message": "Sessão transferida com sucesso"
}
```

## Fluxo Completo

```
[Next.js Frontend]
     │
     │ 1. User clicks "Finalizar Compra"
     │
     ├──► cartApi.redirectToCheckout()
     │      │
     │      │ 2. window.location.href = session-handoff URL
     │
     ▼
[WordPress API: /wp-json/arterio/v1/session-handoff]
     │
     │ 3. Decodifica Cart-Token (JWT)
     │ 4. Busca sessão em wp_woocommerce_sessions
     │ 5. Define cookies wp_wc_session_* e woocommerce_*
     │ 6. HTTP 302 Redirect
     │
     ▼
[WordPress Checkout: /checkout]
     │
     │ 7. WooCommerce lê cookies e mostra carrinho correto!
     │
     ▼
[✓ Checkout com itens do carrinho]
```

## Troubleshooting

### Carrinho continua vazio

1. **Verificar COOKIE_DOMAIN**: Confirme que está definido no wp-config.php
2. **Verificar sessão**: A tabela `wp_woocommerce_sessions` deve ter uma entrada com o session_key do JWT
3. **Verificar cookies**: No browser, deve haver `wp_woocommerce_session_*` após o redirect

### Erro "Sessão do carrinho não encontrada"

O Cart-Token pode estar expirado ou a sessão foi limpa. Solução:
- Adicionar novo produto ao carrinho (gera novo token)
- Verificar se `WC_Session_Handler` está a persistir sessões

### Erro "Token expirado"

O Cart-Token JWT tem expiração (geralmente 48h). O utilizador precisa de interagir com o carrinho para obter um novo token.

## Segurança

- O endpoint **não valida a assinatura do JWT** - confia que o token veio do mesmo sistema
- Use HTTPS obrigatório
- O endpoint só pode ser chamado para session handoff, não expõe dados sensíveis
- Rate limiting recomendado em produção
