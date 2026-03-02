'use client';

import { useState, useEffect } from "react";
import { CategorySidebar } from "./CategorySidebar";
import { ProductCard } from "./ProductCard";
import { Pagination } from "./Pagination";
import { useProducts } from "@/hooks/useProducts";
import type { WCProduct } from "@/types/woocommerce";

interface ProductListingProps {
  onNotifyMe: (productName: string) => void;
  selectedCategoryId: string | null;       // <-- Tem de estar assim
  selectedCategoryName: string | null;     // <-- Tem de estar assim
  onClearCategory: () => void;
  onCategorySelect: (id: string, name: string) => void; // <-- Tem de estar assim
  onAddToCart?: (product: { id: string; name: string; price?: number; category: string; inStock: boolean }) => void;
  onProductClick?: (product: WCProduct) => void;
  searchTerm?: string;
}

const PRODUCTS_PER_PAGE = 12;

export function ProductListing({ onNotifyMe, selectedCategoryId, selectedCategoryName, onClearCategory, onCategorySelect, onAddToCart, onProductClick, searchTerm = "" }: ProductListingProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Usa o categoryId para filtrar
  const { products: filteredProducts, loading, error } = useProducts({
    category: selectedCategoryId || undefined,
    search: searchTerm || undefined,
    perPage: 100
  });

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const currentProducts = filteredProducts.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);

  useEffect(() => setCurrentPage(1), [selectedCategoryId, searchTerm]);

  const getHeadingText = () => {
    if (searchTerm.trim()) return `RESULTADOS PARA "${searchTerm.toUpperCase()}"`;
    if (selectedCategoryName) return selectedCategoryName.toUpperCase();
    return "TODOS OS PRODUTOS";
  };

  if (loading) return <main className="mx-auto max-w-7xl px-6 py-16"><div className="text-center"><div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-black border-r-transparent mb-4"></div></div></main>;
  if (error) return <main className="mx-auto max-w-7xl px-6 py-16"><div className="text-center"><p className="text-black/60 mb-4">Erro ao carregar produtos.</p></div></main>;

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
      <div className="flex gap-8 lg:gap-16">
        {!searchTerm.trim() && (
          <CategorySidebar 
            onCategorySelect={onCategorySelect}
            selectedCategoryId={selectedCategoryId}
          />
        )}

        <div className="flex-1">
          <div className="mb-8 sm:mb-12">
            <h2 className="mb-2 text-sm tracking-wide text-black/40">{getHeadingText()}</h2>
            <p className="text-xl sm:text-2xl tracking-tight text-black">{filteredProducts.length} produtos encontrados</p>
            {(selectedCategoryId || searchTerm.trim()) && (
              <button onClick={onClearCategory} className="mt-4 text-xs tracking-wide text-black/60 underline hover:text-black">Limpar filtro</button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-8 sm:gap-y-16">
            {currentProducts.map((product) => (
              <ProductCard key={product.id} {...product} onNotifyMe={onNotifyMe} onAddToCart={onAddToCart} onProductClick={onProductClick} />
            ))}
          </div>
          
          {filteredProducts.length > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
        </div>
      </div>
    </main>
  );
}