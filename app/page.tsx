'use client';

import { useState } from "react";
import { Header } from "@/components/Header";
import { CategoryNav } from "@/components/CategoryNav";
import { Footer } from "@/components/Footer";
import { Cart } from "@/components/Cart";
import { NotifyMeModal } from "@/components/NotifyMeModal";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Home } from "@/components/Home";
import { useCart } from "@/hooks/useCart";
import { useRouter } from "next/navigation";
import { ToastContainer } from '@/components/ToastContainer';


export default function HomePage() {
  const router = useRouter();
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");

  const {
    cart,
    total,
    itemCount,
    isOpen: cartOpen,
    setIsOpen: setCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    goToCheckout,
    isRedirecting,
    toasts,
    removeToast
  } = useCart();

  const handleNotifyMe = (productName: string) => {
    setSelectedProduct(productName);
    setNotifyModalOpen(true);
  };

  const handleCategorySelect = (categoryId: string, categoryName?: string) => {
    const params = new URLSearchParams();
    params.set('categoryId', categoryId);
    if (categoryName) params.set('categoryName', categoryName);
    router.push(`/products?${params.toString()}`);
  };

  const handleSearch = (term: string) => {
    if (term.trim()) {
      router.push(`/products?search=${encodeURIComponent(term)}`);
    }
  };
  
  async function fetchLatestHeroImage() {
  try {
    // Busca a última mídia enviada cujo título ou arquivo contenha "hero-image"
    const res = await fetch(`${process.env.NEXT_PUBLIC_WP_URL}/wp-json/wp/v2/media?search=hero-image&per_page=1&order=desc`);
    
    if (!res.ok) throw new Error('Falha ao buscar a imagem');
    
    const media = await res.json();
    
    // Se encontrou a imagem, retorna a URL (source_url) original
    if (media && media.length > 0) {
      return media[0].source_url; 
    }
    
    // URL de fallback (uma imagem padrão caso não encontre nenhuma)
    return `${process.env.NEXT_PUBLIC_WP_URL}/wp-content/uploads/2026/04/hero-image.jpg`; 

  } catch (error) {
    console.error("Erro ao buscar a hero image:", error);
    return `${process.env.NEXT_PUBLIC_WP_URL}/wp-content/uploads/2026/04/hero-image.jpg`;
  }
}

  const navigateTo = (page: string) => {
    router.push(`/${page}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleProductClick = (product: any) => {
    router.push(`/product-detail/${product.id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const heroImage = await fetchLatestHeroImage();

  return (
    <div className="min-h-screen bg-white">
      <Header 
        cartItemCount={itemCount} 
        onCartClick={() => setCartOpen(true)}
        onNavigate={navigateTo}
        onSearch={handleSearch}
      />

      <CategoryNav onCategorySelect={handleCategorySelect} />

      <Home 
        onNavigate={navigateTo} 
        onCategorySelect={handleCategorySelect}
        onProductClick={handleProductClick}
        heroImageUrl={heroImage}
      />

      <WhatsAppButton />


      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <Cart
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        total={total}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onCheckout={goToCheckout}
        isRedirecting={isRedirecting}
      />

      <NotifyMeModal
        isOpen={notifyModalOpen}
        onClose={() => setNotifyModalOpen(false)}
        productName={selectedProduct}
      />

      <Footer onNavigate={navigateTo} />
    </div>
  );
}
       
