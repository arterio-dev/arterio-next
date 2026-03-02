import { WP_CONFIG } from '@/app/config/wordpress';
import type { CartItem, Product } from '@/app/types/woocommerce';

export const cartService = {
  CART_KEY: 'arterio_cart',

  getLocalCart(): CartItem[] {
    if (typeof window === 'undefined') return [];

    try {
      const cart = localStorage.getItem(this.CART_KEY);
      return cart ? JSON.parse(cart) : [];
    } catch (error) {
      console.error('Error reading cart:', error);
      return [];
    }
  },

  saveLocalCart(items: CartItem[]): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.CART_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  },

  addItem(product: Product, quantity: number = 1, variationId?: number): CartItem[] {
    const cart = this.getLocalCart();

    const existingItemIndex = cart.findIndex(
      item => item.product_id === parseInt(product.id) &&
        item.variation_id === variationId
    );

    if (existingItemIndex > -1) {
      cart[existingItemIndex].quantity += quantity;
      cart[existingItemIndex].total = (
        parseFloat(cart[existingItemIndex].total) +
        (product.price * quantity)
      ).toFixed(2);
    } else {
      const newItem: CartItem = {
        key: `${product.id}_${variationId || 'simple'}_${Date.now()}`,
        product_id: parseInt(product.id),
        variation_id: variationId,
        quantity,
        product: product as any,
        subtotal: (product.price * quantity).toFixed(2),
        total: (product.price * quantity).toFixed(2),
      };
      cart.push(newItem);
    }

    this.saveLocalCart(cart);
    return cart;
  },

  removeItem(itemKey: string): CartItem[] {
    const cart = this.getLocalCart();
    const updatedCart = cart.filter(item => item.key !== itemKey);
    this.saveLocalCart(updatedCart);
    return updatedCart;
  },

  updateQuantity(itemKey: string, quantity: number): CartItem[] {
    const cart = this.getLocalCart();
    const itemIndex = cart.findIndex(item => item.key === itemKey);

    if (itemIndex > -1 && quantity > 0) {
      cart[itemIndex].quantity = quantity;
      const product = cart[itemIndex].product as any;
      const unitPrice = parseFloat(product.price);
      cart[itemIndex].total = (unitPrice * quantity).toFixed(2);
      cart[itemIndex].subtotal = (unitPrice * quantity).toFixed(2);
    } else if (quantity === 0) {
      return this.removeItem(itemKey);
    }

    this.saveLocalCart(cart);
    return cart;
  },

  clearCart(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(this.CART_KEY);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  },

  getCartTotal(cart: CartItem[]): number {
    return cart.reduce((total, item) => total + parseFloat(item.total), 0);
  },

  getItemCount(cart: CartItem[]): number {
    return cart.reduce((count, item) => count + item.quantity, 0);
  },

  async redirectToCheckout(cart: CartItem[]): Promise<void> {
    if (cart.length === 0) {
      alert('Seu carrinho está vazio');
      return;
    }

    try {
      // 1. BUSCAR O CARRINHO ATUAL DO SERVIDOR (Para ver se há lixo antigo)
      const getCartRes = await fetch(`${WP_CONFIG.storeApiUrl}/cart`, {
        method: 'GET',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        credentials: 'include', // Puxa o cookie de sessão do usuário,
        cache: 'no-store', // Evita cache para garantir dados frescos
      });

      const wcNonce = getCartRes.headers.get('Nonce') || '';

      if (!getCartRes.ok && getCartRes.status !== 404) {
          console.warn("Falha ao buscar carrinho inicial");
      }

      if (getCartRes.ok) {
        const serverCart = await getCartRes.json();

        // 2. LIMPAR O SERVIDOR: Se houver itens velhos, removemos um por um
        if (serverCart.items && serverCart.items.length > 0) {
          for (const item of serverCart.items) {
            await fetch(`${WP_CONFIG.storeApiUrl}/cart/remove-item`, {
              method: 'POST',
              headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', ...(wcNonce ? { 'Nonce': wcNonce } : {}) },
              credentials: 'include', // Puxa o cookie de sessão do usuário,
              cache: 'no-store', // Evita cache para garantir dados frescos
              body: JSON.stringify({ key: item.key }), // Remove usando a chave única do servidor
            });
          }
        }
      }

      // 3. INJETAR O CARRINHO NOVO: Loop sequencial obrigatório
      for (const item of cart) {
        const response = await fetch(`${WP_CONFIG.storeApiUrl}/cart/add-item`, {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          credentials: 'include', // Puxa o cookie de sessão do usuário,
          cache: 'no-store', // Evita cache para garantir dados frescos
          body: JSON.stringify({
            id: item.product_id,
            quantity: item.quantity,
            variation_id: item.variation_id,
          }),
        });

        if (!response.ok) {
          console.warn(`Aviso: Falha ao sincronizar o produto ${item.product_id}`);
        }
      }

      // 4. Limpar o localStorage local
      this.clearCart();

      // 5. Redirecionar para o checkout limpo
      // Comentário para teste
      //window.location.href = WP_CONFIG.checkoutUrl;

    } catch (error) {
      console.error('Erro fatal ao preparar checkout:', error);
      alert('Tivemos um problema de conexão com o checkout. Por favor, tente novamente.');
    }
  },

  async syncWithWooCommerce(cart: CartItem[]): Promise<void> {
    try {
      console.log('Cart sync with WooCommerce would happen here');
    } catch (error) {
      console.error('Error syncing cart:', error);
    }
  },
};
