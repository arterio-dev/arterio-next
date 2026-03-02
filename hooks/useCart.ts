'use client';

import { useState, useEffect, useCallback } from 'react';
import { cartService } from '@/app/services/cart';
import type { CartItem, Product } from '@/app/types/woocommerce';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const localCart = cartService.getLocalCart();
    setCart(localCart);
  }, []);

  const addToCart = useCallback((product: Product, quantity: number = 1, variationId?: number) => {
    const updatedCart = cartService.addItem(product, quantity, variationId);
    setCart(updatedCart);
    setIsOpen(true);
  }, []);

  const removeFromCart = useCallback((itemKey: string) => {
    const updatedCart = cartService.removeItem(itemKey);
    setCart(updatedCart);
  }, []);

  const updateQuantity = useCallback((itemKey: string, quantity: number) => {
    const updatedCart = cartService.updateQuantity(itemKey, quantity);
    setCart(updatedCart);
  }, []);

  const clearCart = useCallback(() => {
    cartService.clearCart();
    setCart([]);
  }, []);

  const goToCheckout = useCallback(async () => {
    try {
      await cartService.redirectToCheckout(cart);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro desconhecido");
    }
  }, [cart]);

  const total = cartService.getCartTotal(cart);
  const itemCount = cartService.getItemCount(cart);

  return {
    cart,
    total,
    itemCount,
    isOpen,
    setIsOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    goToCheckout,
  };
}
