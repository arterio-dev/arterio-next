'use client';

import { Header } from "@/components/Header";
import { CategoryNav } from "@/components/CategoryNav";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { About } from "@/components/About";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";

export default function AboutPage() {
  const router = useRouter();
    const { addToCart, cart, total, itemCount, isOpen: cartOpen, setIsOpen: setCartOpen, removeFromCart, updateQuantity, goToCheckout } = useCart();
  

  const navigateTo = (page: string) => {
    router.push(`/${page}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategorySelect = (category: string) => {
    router.push(`/products?category=${encodeURIComponent(category)}`);
  };

  const handleSearch = (term: string) => {
    if (term.trim()) {
      router.push(`/products?search=${encodeURIComponent(term)}`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header
        cartItemCount={itemCount}
        onCartClick={() => setCartOpen(true)}
        onNavigate={navigateTo}
        onSearch={() => { }}
      />

      <CategoryNav onCategorySelect={handleCategorySelect} />

      <About />

      <WhatsAppButton />

      <Footer onNavigate={navigateTo} />
    </div>
  );
}
