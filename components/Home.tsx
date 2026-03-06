'use client';


import { ArrowRight } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import type { WCProduct } from "@/types/woocommerce";
import { useCategories } from "@/hooks/useCategories";
import { useState, useMemo } from "react";
import { getHierarchicalCategories } from '@/utils/categoriesCleaner';
import { STORE_INFO } from "@/app/config/store";


interface HomeProps {
  onNavigate: (page: string) => void;
  onCategorySelect: (category: string, categoryName?: string) => void;
  onProductClick?: (product: any) => void;
}

export function Home({ onNavigate, onCategorySelect, onProductClick }: HomeProps) {
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  // Buscar produtos em destaque da Store API
  const { products: featuredProducts, loading: loadingFeatured } = useProducts({
    featured: true,
    perPage: 6,
  });

  const { categories } = useCategories();

  const hierarchicalCategories = useMemo(() => getHierarchicalCategories(categories), [categories]);

  const handleProductClick = (product: WCProduct) => {
    if (onProductClick) {
      onProductClick(product);
    }
  };

  const handleCategoryClick = (categoryId: number, categoryName: string) => {
    onCategorySelect?.(categoryId.toString(), categoryName);
    setActiveCategory(null);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 pt-32 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="max-w-3xl">
            <h2 className="mb-6 text-6xl tracking-tighter text-black leading-tight">
              {STORE_INFO.tagline}
            </h2>
            <p className="mb-12 text-lg text-black/60 leading-relaxed max-w-xl">
              Soluções completas em materiais técnicos e suprimentos
              profissionais para cinema, TV e fotografia.
            </p>
            <button
              onClick={() => onNavigate("products")}
              className="group flex items-center gap-3 bg-black px-8 py-4 text-sm tracking-wide text-white hover:bg-black/90 transition-all"
            >
              VER CATÁLOGO
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
          </div>
          <div className="aspect-[4/3] bg-neutral-100 overflow-hidden">
            <img
              src={`${process.env.NEXT_PUBLIC_WP_URL}/wp-content/uploads/2026/03/hero-image.jpg`}
              alt="Equipamentos para Produção Audiovisual"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="mx-auto max-w-7xl px-6 py-24 border-t border-black/10">
        <div className="mb-16">
          <h3 className="mb-2 text-sm tracking-wide text-black/40">CATEGORIAS</h3>
          <p className="text-2xl tracking-tight text-black">
            Navegue por Linha de Produtos
          </p>
        </div>

        <div className="grid grid-cols-1 gap-px bg-black/10 md:grid-cols-3 lg:grid-cols-3">
          {hierarchicalCategories.map((category, index) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id, category.name)}
              className="group bg-white p-8 text-left hover:bg-neutral-50 transition-colors"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-3xl text-black/10">{String(index + 1).padStart(2, "0")}</span>
                <ArrowRight
                  size={20}
                  className="text-black/20 transition-all group-hover:text-black group-hover:translate-x-1"
                  strokeWidth={1.5}
                />
              </div>
              <h4 className="mb-2 text-sm tracking-tight text-black">
                {category.name}
              </h4>
              <p className="text-xs text-black/40">{category.count}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-6 py-24 border-t border-black/10">
        <div className="mb-12">
          <h3 className="mb-2 text-sm tracking-wide text-black/40">DESTAQUES</h3>
          <p className="text-2xl tracking-tight text-black">Produtos em Evidência</p>
        </div>

        {loadingFeatured ? (
          <div className="grid grid-cols-2 gap-px bg-black/10 md:grid-cols-3 lg:grid-cols-5 max-w-5xl">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white p-4">
                <div className="mb-4 aspect-square bg-neutral-100 border border-black/5 animate-pulse" />
                <div className="h-3 bg-neutral-100 mb-2 animate-pulse" />
                <div className="h-3 w-16 bg-neutral-100 animate-pulse" />
              </div>
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-px bg-black/10 md:grid-cols-3 lg:grid-cols-5 max-w-6xl">
            {featuredProducts.slice(0, 5).map((product) => (
              <div
                key={product.id}
                className="group bg-white p-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                onClick={() => handleProductClick({ ...product, id: Number(product.id), price: String(product.price) })}
              >
                <div className="mb-4 aspect-square bg-neutral-100 border border-black/5 group-hover:border-black/20 transition-colors overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
                <h4 className="mb-2 text-xs tracking-tight text-black group-hover:text-black/60 transition-colors line-clamp-2">
                  {product.name}
                </h4>
                <span className="text-xs text-black">
                  R$ {typeof product.price === 'number'
                    ? product.price.toFixed(2)
                    : parseFloat(product.price as any).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-sm text-black/40">
              Nenhum produto em destaque no momento
            </p>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-6 py-32 border-t border-black/10">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
          <h3 className="mb-6 text-4xl tracking-tight text-black">
            Atendimento Especializado
          </h3>
          <p className="mb-12 text-black/60">
            Dúvidas sobre produtos ou precisa de uma solução customizada?
            Nossa equipe está pronta para ajudar.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => onNavigate("products")}
              className="bg-black px-8 py-4 text-sm tracking-wide text-white hover:bg-black/90 transition-colors"
            >
              VER TODOS OS PRODUTOS
            </button>
            <button
              onClick={() => onNavigate("contact")}
              className="border border-black px-8 py-4 text-sm tracking-wide text-black hover:bg-black hover:text-white transition-colors"
            >
              FALE CONOSCO
            </button>
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <section className="mx-auto max-w-7xl px-6 py-16 border-t border-black/10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          <div>
            <h4 className="mb-4 text-xs tracking-wide text-black">RETIRADA NA LOJA</h4>
            <p className="text-sm text-black/60 leading-relaxed">
              Retire seus produtos no mesmo dia em nossa loja física.
              Agilidade para sua produção.
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-xs tracking-wide text-black">ATENDIMENTO WHATSAPP</h4>
            <p className="text-sm text-black/60 leading-relaxed">
              Tire dúvidas e faça pedidos direto pelo WhatsApp.
              Resposta rápida e personalizada.
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-xs tracking-wide text-black">ESTOQUE ATUALIZADO</h4>
            <p className="text-sm text-black/60 leading-relaxed">
              Sistema em tempo real. Consulte disponibilidade
              antes de ir à loja.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
