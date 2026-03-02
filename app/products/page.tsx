'use client';

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { CategoryNav } from "@/components/CategoryNav";
import { Footer } from "@/components/Footer";
import { Cart } from "@/components/Cart";
import { NotifyMeModal } from "@/components/NotifyMeModal";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ProductListing } from "@/components/ProductListing";
import { useCart } from "@/hooks/useCart";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const search = searchParams.get("search");

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

  const handleCategorySelect = (selectedCategory: string) => {
    router.push(`/products?category=${encodeURIComponent(selectedCategory)}`);
  };

  const handleClearCategory = () => {
    router.push("/products");
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

  const handleAddToCart = (product: {
    id: string;
    name: string;
    price?: number;
    category: string;
    inStock: boolean;
  }) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price || 0,
      category: product.category,
      inStock: product.inStock,
    }, 1);
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

      <ProductListing
        onNotifyMe={handleNotifyMe}
        selectedCategory={category}
        onClearCategory={handleClearCategory}
        onCategorySelect={handleCategorySelect}
        onAddToCart={handleAddToCart}
        onProductClick={handleProductClick}
        searchTerm={search || ""}
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

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
