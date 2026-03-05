'use client';

// ─── useCart ──────────────────────────────────────────────────────────────────
//
// Regras de mutação:
//   1. Cada acção (add/update/remove) chama a API e recebe o carrinho completo
//   2. Esse carrinho é injectado no cache SWR com revalidate:false (sem re-fetch)
//   3. Actualizações de quantidade são debounced (300ms) por item key para evitar
//      race conditions quando o utilizador clica rapidamente nos botões +/-.
//   4. Em caso de erro, força revalidação para garantir estado correcto
//
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef } from 'react';
import useSWR from 'swr';
import { cartApi, getCartToken, clearToken } from '@/app/services/cart';
import { normalizeCart, normalizeTotal } from '@/utils/cartNormalizer';
import { useToast } from '@/hooks/useToast';
import type { CartItem, Product } from '@/app/types/woocommerce';

const CART_KEY = 'cart';
const QUANTITY_DEBOUNCE_MS = 350;

export function useCart() {
  const [isOpen,        setIsOpen]        = useState(false);
  const [isUpdating,    setIsUpdating]    = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  // Mapa de timers pendentes por item key — permite debounce individual por item
  const pendingQuantityTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const {
    data: serverCart,
    isLoading,
    mutate,
  } = useSWR(CART_KEY, cartApi.fetcher, {
    revalidateOnFocus:     true,
    revalidateOnReconnect: true,
    keepPreviousData:      false,
    refreshInterval:       0,
    onError: (err: Error) => {
      // Se o token apontar para uma sessão expirada/consumida (ex: após checkout
      // no WooCommerce), limpa-o silenciosamente e reseta o cache SWR.
      const is404 = err?.message?.includes('404');
      const isGone = err?.message?.includes('410');
      if ((is404 || isGone) && getCartToken()) {
        clearToken();
        mutate(undefined, { revalidate: false });
      }
    },
  });

  const cart:      CartItem[] = normalizeCart(serverCart);
  const total:     number     = normalizeTotal(serverCart);
  const itemCount: number     = cart.reduce((acc, item) => acc + item.quantity, 0);

  // ── Helper central de mutação ─────────────────────────────────────────────
  // A API do WooCommerce devolve o carrinho completo em CADA mutação.
  // Injectamos esse resultado directamente no cache SWR sem re-fetch.

  const runMutation = useCallback(async (
    action: () => Promise<unknown>,
    errorMessage: string,
  ) => {
    setIsUpdating(true);
    try {
      const updatedCart = await action();
      // revalidate:false crítico — evita o ciclo: update → re-fetch → dados antigos
      await mutate(updatedCart, { revalidate: false });
    } catch (err) {
      // Em erro, re-fetch do servidor para garantir estado real
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

  // ── updateQuantity (debounced por item key) ────────────────────────────────
  //
  // Se o utilizador clicar +/- várias vezes seguidas no mesmo item, apenas o
  // último valor é enviado à API após QUANTITY_DEBOUNCE_MS de inactividade.
  // Isto evita N requests simultâneos e garante que o servidor recebe sempre
  // a quantidade final pretendida.

  const updateQuantity = useCallback((key: string, quantity: number) => {
    if (quantity <= 0) {
      // Remoção imediata — sem debounce
      const existing = pendingQuantityTimers.current.get(key);
      if (existing) {
        clearTimeout(existing);
        pendingQuantityTimers.current.delete(key);
      }
      runMutation(
        () => cartApi.removeItem(key),
        'Não foi possível remover o produto.',
      );
      return;
    }

    // Cancela timer anterior para este item (se existir)
    const existing = pendingQuantityTimers.current.get(key);
    if (existing) clearTimeout(existing);

    // Agenda novo request após o debounce
    const timer = setTimeout(() => {
      pendingQuantityTimers.current.delete(key);
      runMutation(
        () => cartApi.updateItem(key, quantity),
        'Não foi possível actualizar a quantidade.',
      );
    }, QUANTITY_DEBOUNCE_MS);

    pendingQuantityTimers.current.set(key, timer);
  }, [runMutation]);

  // ── removeFromCart ─────────────────────────────────────────────────────────

  const removeFromCart = useCallback(async (key: string) => {
    // Cancela qualquer update pendente para este item
    const existing = pendingQuantityTimers.current.get(key);
    if (existing) {
      clearTimeout(existing);
      pendingQuantityTimers.current.delete(key);
    }
    await runMutation(
      () => cartApi.removeItem(key),
      'Não foi possível remover o produto.',
    );
  }, [runMutation]);

  // ── clearCart ──────────────────────────────────────────────────────────────
  // FIX: usa DELETE /cart/items (uma única chamada) em vez de N removeItem.

  const clearCart = useCallback(async () => {
    // Cancela todos os timers pendentes
    pendingQuantityTimers.current.forEach(timer => clearTimeout(timer));
    pendingQuantityTimers.current.clear();

    setIsUpdating(true);
    try {
      await cartApi.clearItems();
      cartApi.clearToken();
      await mutate(undefined, { revalidate: false });
    } catch {
      await mutate();
    } finally {
      setIsUpdating(false);
    }
  }, [mutate]);

  // ── goToCheckout ───────────────────────────────────────────────────────────
  // Handoff de sessão (GET /api/checkout) → redirect para WooCommerce nativo.

  const goToCheckout = useCallback(async () => {
    setIsRedirecting(true);
    try {
      await cartApi.redirectToCheckout();
    } catch {
      addToast('Não foi possível redirecionar para o checkout. Tenta novamente.', 'error');
      setIsRedirecting(false);
    }
    // NB: não fazemos setIsRedirecting(false) no success — o browser vai navegar
  }, [addToast]);

  return {
    cart,
    total,
    itemCount,
    isOpen,
    setIsOpen,
    isLoading,
    isUpdating,
    isRedirecting,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    goToCheckout,
    toasts,
    removeToast,
  };
}