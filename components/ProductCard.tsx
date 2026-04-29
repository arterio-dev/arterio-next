'use client';

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from 'lucide-react';
import type { WCProduct } from "@/types/woocommerce";
import { decodeHTMLEntities } from "@/utils/formatters";

interface ProductCardProps {
  id: string;
  name: string;
  slug?: string;
  price?: number;
  priceOnRequest?: boolean;
  category: string;
  categoryId?: string; // ID da categoria para navegação
  inStock: boolean;
  image?: string;
  variants?: { name: string; value: string }[];
  onProductClick?: (product: WCProduct) => void;
  onNotifyMe: (productName: string) => void;
  onAddToCart?: (product: { id: string; name: string; price?: number; category: string; inStock: boolean }) => void;
  onCategoryNavigate?: (categoryId: string, categoryName: string) => void;
}

export function ProductCard({
  id,
  name,
  slug,
  price,
  priceOnRequest,
  category,
  categoryId,
  inStock,
  image,
  variants,
  onNotifyMe,
  onAddToCart,
  onProductClick,
  onCategoryNavigate
}: ProductCardProps) {
  const [selectedVariant, setSelectedVariant] = useState(variants?.[0]?.value || "");

  const PRODUCT_URL = `/product-detail/${id}`;

  const cleanName = decodeHTMLEntities(name);

  return (
    <div className="group relative">
      <div className="group cursor-pointer">
        {/* Product Image */}
        <Link href={PRODUCT_URL} className="block">
          <div className="relative mb-4 aspect-square overflow-hidden bg-neutral-100 border border-black/5 hover:border-black/20 transition-colors">
            {image ? (
              <img
                src={image}
                alt={name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <div className="text-center p-6">
                  <p className="text-xs tracking-wider text-black/20">{category.toUpperCase()}</p>
                </div>
              </div>
            )}
            {!inStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90">
                <span className="text-xs tracking-wide text-black/60">ESGOTADO</span>
              </div>
            )}
          </div>
        </Link>

        {/* Product Info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Link href={PRODUCT_URL} className="flex-1 block">
              <p className="mb-1 text-xs tracking-wide text-black/40">{category}</p>
              <h3 className="text-sm tracking-tight text-black group-hover:text-black/60 transition-colors">
                {cleanName}
              </h3>
            </Link>
            
            {/* Link para navegar para a categoria */}
            {categoryId && onCategoryNavigate && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onCategoryNavigate(categoryId, category);
                }}
                className="ml-2 p-1 text-black/40 hover:text-black transition-colors"
                title={`Ver todos os produtos de ${category}`}
                aria-label={`Navegar para categoria ${category}`}
              >
                <ChevronRight size={16} />
              </button>
            )}
          </div>

          {/* Color Variants */}
          {/*{variants && variants.length > 0 && (
            <div className="flex items-center gap-2">
              {variants.map((variant) => (
                <button
                  key={variant.value}
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedVariant(variant.value);
                  }}
                  className={`h-6 w-6 border transition-all ${selectedVariant === variant.value
                    ? "border-black scale-110"
                    : "border-black/20 hover:border-black/40"
                    }`}
                  style={{ backgroundColor: variant.value }}
                  aria-label={variant.name}
                />
              ))}
            </div>
          )}*/}

          {/* Price / Actions */}
          <div className="flex items-center justify-between pt-2">
            {priceOnRequest ? (
              <span className="text-xs tracking-wide text-black">PREÇO SOB CONSULTA</span>
            ) : (
              <span className="text-sm text-black">R$ {price?.toFixed(2)}</span>
            )}

            {!inStock ? (
              <button
                onClick={() => {
                  onNotifyMe(name);
                }}
                className="text-xs tracking-wide text-black/60 underline hover:text-black transition-colors cursor-pointer"
              >
                AVISE-ME
              </button>
            ) : (
              <button
                onClick={() => {
                  onAddToCart?.({ id, name, price, category, inStock });
                }}
                className="text-xs tracking-wide text-black hover:text-black/60 transition-colors cursor-pointer"
              >
                ADICIONAR
              </button>
            )}
          </div>

          {/* In-store Pickup */}
          {inStock && (
            <p className="text-xs text-black/40">Disponível para retirada na loja</p>
          )}
        </div>
      </div>
    </div>
  );
}
