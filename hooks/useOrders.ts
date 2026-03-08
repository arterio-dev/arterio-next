'use client';

import useSWR, { useSWRConfig } from 'swr';
import { useAuth } from '@/hooks/useAuth';
import { useCallback } from 'react';
import type { WCOrder } from '@/app/types/account';

async function fetcher(url: string): Promise<OrdersResponse> {
  //console.log('[useOrders] fetcher chamado →', `/api/${url}`);
  
  const res = await fetch(`/api/${url}`);
  
  //console.log('[useOrders] response status:', res.status);

  if (res.status === 401) throw new Error('401');
  if (!res.ok) throw new Error(`Erro ${res.status}`);

  // ⚠️ Ler o body UMA vez e logar o raw antes de qualquer parse
  const raw = await res.json();
  //console.log('[useOrders] raw body recebido:', JSON.stringify(raw));
  //console.log('[useOrders] tipo de raw.orders:', typeof raw?.orders, '| isArray:', Array.isArray(raw?.orders));

  const { orders, total_pages }: OrdersResponse = raw;
  //console.log('[useOrders] orders após destructure:', orders?.length, 'itens | total_pages:', total_pages);

  return { orders, total_pages };
}

async function orderFetcher(url: string): Promise<WCOrder> {
  const res = await fetch(`/api/${url}`);
  if (res.status === 401) throw new Error('401');
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  return res.json();
}

interface OrdersResponse {
  orders: WCOrder[];
  total_pages: string;
}

// Hook para lista paginada de pedidos
export function useOrders(page = 1) {
  const { isAuthenticated } = useAuth();
  const key = isAuthenticated ? `account/orders?page=${page}&per_page=10` : null;

  // ⚠️ Log crítico: se key for null, o SWR não faz NADA
  //console.log('[useOrders] isAuthenticated:', isAuthenticated, '| SWR key:', key);

  const { data, isLoading, error } = useSWR<OrdersResponse>(key, fetcher, {
    revalidateOnFocus: false,
    errorRetryCount: 2,
    //onSuccess: (data) => console.log('[useOrders] SWR onSuccess:', data?.orders?.length, 'pedidos'),
    //onError: (err) => console.error('[useOrders] SWR onError:', err.message),
  });

  const orders = Array.isArray(data?.orders) ? data.orders : [];

  return {
    orders,
    totalPages: parseInt(data?.total_pages ?? '1', 10),
    isLoading,
    error,
  };
}

// Hook para pedido individual
export function useOrder(id: string | number | null) {
  const { isAuthenticated } = useAuth();
  const { mutate: globalMutate } = useSWRConfig();

  const { data: order, isLoading, error, mutate } = useSWR<WCOrder>(
    isAuthenticated && id ? `account/orders/${id}` : null,
    orderFetcher,
    { revalidateOnFocus: false, errorRetryCount: 1 },
  );

  const cancelOrder = useCallback(async (): Promise<WCOrder> => {
    const res = await fetch(`/api/account/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Erro ao cancelar pedido');
    }

    const updated: WCOrder = await res.json();

    // Atualizar cache do pedido individual
    await mutate(updated, { revalidate: false });

    // Invalidar cache da lista de pedidos para refletir o novo status
    await globalMutate(
      (key: unknown) => typeof key === 'string' && key.startsWith('account/orders?'),
      undefined,
      { revalidate: true },
    );

    return updated;
  }, [id, mutate, globalMutate]);

  return { order, isLoading, error, cancelOrder };
}
