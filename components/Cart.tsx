'use client';

import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import type { CartItem } from "@/types/woocommerce";
import { decodeHTMLEntities } from "@/utils/formatters";

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  total: number;
  onUpdateQuantity: (itemKey: string, quantity: number) => void;
  onRemoveItem: (itemKey: string) => void;
  onCheckout: () => void;
  isRedirecting?: boolean;
}

export function Cart({
  isOpen,
  onClose,
  cart,
  total,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  isRedirecting = false,
}: CartProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
      />

      {/* Cart Sidebar */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-2xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-black/10 px-6 py-6">
            <div className="flex items-center gap-3">
              <ShoppingBag size={20} strokeWidth={1.5} className="text-black" />
              <h2 className="text-lg tracking-tight text-black">
                Carrinho ({cart.length})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-black/60 hover:text-black transition-colors"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <ShoppingBag size={48} strokeWidth={1} className="text-black/20 mb-4" />
                <p className="text-sm text-black/60">Seu carrinho está vazio</p>
              </div>
            ) : (
              <div className="space-y-6">
                {cart.map((item) => (
                  <div
                    key={item.key}
                    className="flex gap-4 border-b border-black/5 pb-6"
                  >
                    {/* Product Image */}
                    <div className="h-20 w-20 flex-shrink-0 border border-black/10 bg-white">
                      {(item.product as any).image ? (
                        <img
                          src={(item.product as any).image}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-black/5">
                          <ShoppingBag size={24} strokeWidth={1} className="text-black/20" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex flex-1 flex-col">
                      <h3 className="text-sm text-black mb-1">
                        {decodeHTMLEntities(item.product.name)}
                      </h3>
                      <p className="text-xs text-black/60 mb-3">
                        R$ {parseFloat((item.product as any).price).toFixed(2)}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-black/10">
                          <button
                            onClick={() =>
                              onUpdateQuantity(item.key, item.quantity - 1)
                            }
                            className="p-2 text-black/60 hover:text-black transition-colors"
                          >
                            <Minus size={14} strokeWidth={1.5} />
                          </button>
                          <span className="w-8 text-center text-xs text-black">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              onUpdateQuantity(item.key, item.quantity + 1)
                            }
                            className="p-2 text-black/60 hover:text-black transition-colors"
                          >
                            <Plus size={14} strokeWidth={1.5} />
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.key)}
                          className="ml-auto text-xs text-black/40 hover:text-black transition-colors"
                        >
                          Remover
                        </button>
                      </div>
                    </div>

                    {/* Item Total */}
                    <div className="text-sm text-black">
                      R$ {parseFloat(String(item.total)).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="border-t border-black/10 px-6 py-6">
              <div className="mb-6 flex items-center justify-between">
                <span className="text-sm tracking-wide text-black/60">
                  TOTAL
                </span>
                <span className="text-xl tracking-tight text-black">
                  R$ {total.toFixed(2)}
                </span>
              </div>

              <button
                onClick={onCheckout}
                disabled={isRedirecting}
                className="w-full bg-black py-4 text-sm tracking-wide text-white hover:bg-black/90 transition-colors disabled:opacity-60 disabled:cursor-wait"
              >
                {isRedirecting ? 'REDIRECIONANDO…' : 'FINALIZAR COMPRA'}
              </button>

              <p className="mt-4 text-center text-xs text-black/40">
                Você será redirecionado para o checkout seguro
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
