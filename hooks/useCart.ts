'use client';

// ─── useCart (powered by SWR) ─────────────────────────────────────────────────
//
// Estratégia de mutação: "write-through" sem optimistic updates.
//
// O WooCommerce devolve o carrinho COMPLETO em cada resposta de mutação
// (add, update, remove). Então basta popular o cache SWR com essa resposta
// diretamente — sem precisar de reconstructores otimistas que causam flashes.
//
// Fluxo: chamada API → resposta com carrinho atualizado → mutate(data, false)
// O `false` diz ao SWR "aceita este dado, não revalides" → zero flashes.
//
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { cartApi } from '@/app/services/cart';
import { normalizeCart, normalizeTotal } from '@/utils/cartNormalizer';
import { useToast } from '@/hooks/useToast';
import type { CartItem, Product } from '@/app/types/woocommerce';

const CART_KEY = '/cart';

export function useCart() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const {
    data: serverCart,
    isLoading,
    mutate,
  } = useSWR(CART_KEY, cartApi.fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: 0,
    keepPreviousData: true,
    onError: () => {},
  });

  const cart: CartItem[] = normalizeCart(serverCart);
  const total: number = normalizeTotal(serverCart);
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // ── Helper: executa uma ação de API e popula o cache com a resposta ─────────
  // revalidate: false → SWR não faz re-fetch, usa o dado que lhe passámos
  // Isto evita o ciclo: optimistic → flash vazio → dados reais

  const runMutation = useCallback(async (
    action: () => Promise<unknown>,
    errorMessage: string,
  ) => {
    setIsUpdating(true);
    try {
      const updatedCart = await action();
      // Popula o cache SWR diretamente com a resposta — sem re-fetch
      await mutate(updatedCart, { revalidate: false });
    } catch (err) {
      // Em caso de erro, revalida do servidor para garantir estado correto
      await mutate();
      addToast(
        err instanceof Error ? err.message : errorMessage,
        'error',
      );
    } finally {
      setIsUpdating(false);
    }
  }, [mutate, addToast]);

  // ── addToCart ──────────────────────────────────────────────────────────────

  const addToCart = useCallback(async (
    product: Product,
    quantity: number = 1,
    variationId?: number,
  ) => {
    setIsOpen(true);
    await runMutation(
      () => cartApi.addItem(product.id, quantity, variationId),
      'Não foi possível adicionar o produto.',
    );
  }, [runMutation]);

  // ── updateQuantity ─────────────────────────────────────────────────────────

  const updateQuantity = useCallback(async (key: string, quantity: number) => {
    if (quantity <= 0) return removeFromCart(key);
    await runMutation(
      () => cartApi.updateItem(key, quantity),
      'Não foi possível atualizar a quantidade.',
    );
  }, [runMutation]);

  // ── removeFromCart ─────────────────────────────────────────────────────────

  const removeFromCart = useCallback(async (key: string) => {
    await runMutation(
      () => cartApi.removeItem(key),
      'Não foi possível remover o produto.',
    );
  }, [runMutation]);

  // ── clearCart ──────────────────────────────────────────────────────────────

  const clearCart = useCallback(async () => {
    setIsUpdating(true);
    try {
      for (const item of cart) {
        await cartApi.removeItem(item.key);
      }
      cartApi.clearToken();
      await mutate();
    } catch {
      await mutate();
    } finally {
      setIsUpdating(false);
    }
  }, [cart, mutate]);

  // ── goToCheckout ───────────────────────────────────────────────────────────

  const goToCheckout = useCallback(() => {
    cartApi.redirectToCheckout();
  }, []);

  return {
    cart,
    total,
    itemCount,
    isOpen,
    setIsOpen,
    isLoading,
    isUpdating,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    goToCheckout,
    toasts,
    removeToast,
  };
}