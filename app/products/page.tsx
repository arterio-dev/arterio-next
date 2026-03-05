'use client';

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { CategoryNav } from "@/components/CategoryNav";
import { Footer } from "@/components/Footer";
import { Cart } from "@/components/Cart";
import { NotifyMeModal } from "@/components/NotifyMeModal";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ProductListing } from "@/components/ProductListing";
import { useCart } from "@/hooks/useCart";
import { ToastContainer } from "@/components/ToastContainer";

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Agora lemos o ID e o Nome da URL
  const categoryId = searchParams.get("categoryId");
  const categoryName = searchParams.get("categoryName");
  const search = searchParams.get("search");

  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");

  const {
    cart, total, itemCount, isOpen: cartOpen, setIsOpen: setCartOpen,
    addToCart, removeFromCart, updateQuantity, goToCheckout, isRedirecting, toasts, removeToast
  } = useCart();

  const handleNotifyMe = (productName: string) => {
    setSelectedProduct(productName);
    setNotifyModalOpen(true);
  };

  // Recebe ID e Nome do componente filho
  const handleCategorySelect = (id: string, name: string) => {
    router.push(`/products?categoryId=${id}&categoryName=${encodeURIComponent(name)}`);
  };

  const handleClearCategory = () => {
    router.push("/products");
  };

  const handleSearch = (term: string) => {
    if (term.trim()) router.push(`/products?search=${encodeURIComponent(term)}`);
  };

  const navigateTo = (page: string) => {
    router.push(`/${page}`);
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

      <ProductListing
        onNotifyMe={handleNotifyMe}
        selectedCategoryId={categoryId}
        selectedCategoryName={categoryName}
        onClearCategory={handleClearCategory}
        onCategorySelect={handleCategorySelect}
        onAddToCart={(product) => addToCart({ ...product, price: product.price || 0 }, 1)}
        onProductClick={(product) => router.push(`/product/${product.id}`)}
        searchTerm={search || ""}
      />


      <WhatsAppButton />

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <Cart
        isOpen={cartOpen} onClose={() => setCartOpen(false)}
        cart={cart} total={total}
        onUpdateQuantity={updateQuantity} onRemoveItem={removeFromCart} onCheckout={goToCheckout}
        isRedirecting={isRedirecting}
      />

      <NotifyMeModal
        isOpen={notifyModalOpen} onClose={() => setNotifyModalOpen(false)}
        productName={selectedProduct}
      />

      <Footer onNavigate={navigateTo} />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div></div>}>
      <ProductsContent />
    </Suspense>
  );
}