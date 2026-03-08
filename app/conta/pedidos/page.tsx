'use client';

import { useState } from 'react';
import { useOrders } from '@/hooks/useOrders';
import { OrderCard } from '@/components/account/OrderCard';
import { OrderSkeleton } from '@/components/account/OrderSkeleton';
import { Pagination } from '@/components/Pagination';
import Link from 'next/link';

export default function PedidosPage() {
  const [page, setPage] = useState(1);
  const { orders, isLoading, error, totalPages } = useOrders(page);

  // Heurística simples: se retornar 10 itens, provavelmente há mais páginas
  // TODO: usar X-WP-TotalPages do response header quando disponível
  

  if (isLoading) return <OrderSkeleton count={4} />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-red-500 text-sm mb-2">Não foi possível carregar os pedidos.</p>
        <p className="text-black/40 text-xs">{error.message}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-black/40 mb-6">Ainda não fizeste nenhum pedido.</p>
        <Link
          href="/products"
          className="bg-black text-white text-sm px-8 py-3 hover:bg-black/80 transition-colors"
        >
          Ir para a Loja
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl tracking-tight mb-8">Histórico de Pedidos</h1>
      <div className="space-y-3">
        {orders.map(order => <OrderCard key={order.id} order={order} />)}
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
