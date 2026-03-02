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
  } = useCart();

  const handleNotifyMe = (productName: string) => {
    setSelectedProduct(productName);
    setNotifyModalOpen(true);
  };

  const handleCategorySelect = (category: string) => {
    router.push(`/products?category=${encodeURIComponent(category)}`);
  };

  const handleSearch = (term: string) => {
    if (term.trim()) {
      router.push(`/products?search=${encodeURIComponent(term)}`);
    }
  };

  const navigateTo = (page: string) => {
    router.push(`/${page}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleProductClick = (product: any) => {
    router.push(`/product/${product.id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
      />

      <WhatsAppButton />

      <Cart
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        total={total}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onCheckout={goToCheckout}
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
       