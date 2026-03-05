'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import type { WCProduct } from '@/app/types/woocommerce';
import { useCart } from '@/hooks/useCart';
import { NotifyMeModal } from '@/components/NotifyMeModal';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CategoryNav } from '@/components/CategoryNav';
import { Cart } from '@/components/Cart';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ToastContainer';

interface ProductDetailPageProps {
  params: {
    id: string;
  };
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { addToCart, cart, total, itemCount, isOpen: cartOpen, setIsOpen: setCartOpen, removeFromCart, updateQuantity, goToCheckout, isRedirecting, toasts, removeToast } = useCart();
  
  const [product, setProduct] = useState<WCProduct | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);

  const productId = params?.id as string;

  const handleCategorySelect = (selectedCategory: string) => {
    router.push(`/products?category=${encodeURIComponent(selectedCategory)}`);
  };

  const navigateTo = (page: string) => {
    router.push(`/${page}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/products/${productId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Produto não encontrado');
        }

        const data = await response.json();
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar produto');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm text-black/60">Carregando produto...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white">
        <div className="border-b border-black/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm tracking-wide text-black/60 hover:text-black transition-colors"
            >
              <ArrowLeft size={16} strokeWidth={1.5} />
              VOLTAR
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
          <p className="text-sm text-red-600">{error || 'Produto não encontrado'}</p>
        </div>
      </div>
    );
  }

  const inStock = (product as any).is_in_stock ?? true;
  const priceStr = (product as any).prices?.price || product.price;
  const price = priceStr ? parseFloat(priceStr.toString()) / 100 : undefined;
  const priceOnRequest = product.meta_data?.find(meta => meta.key === '_price_on_request')?.value === 'yes';
  const categoryName = product.categories?.[0]?.name || 'Produtos';

  const handleAddToCart = () => {
    if (inStock && !priceOnRequest) {
      addToCart({
        id: product.id.toString(),
        name: product.name,
        price: price || 0,
        category: categoryName,
        inStock: true,
      }, quantity);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-white">
        <Header 
          cartItemCount={itemCount} 
          onCartClick={() => setCartOpen(true)}
          onNavigate={navigateTo}
          onSearch={() => {}}
        />

        <CategoryNav onCategorySelect={handleCategorySelect} />

        {/* Product Content */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square bg-neutral-100 border border-black/10">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[selectedImage]?.src}
                    alt={product.images[selectedImage]?.alt || product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="text-center p-6">
                      <p className="text-xs tracking-wider text-black/20">{categoryName.toUpperCase()}</p>
                    </div>
                  </div>
                )}
                {!inStock && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/90">
                    <span className="text-sm tracking-wide text-black/60">ESGOTADO</span>
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {product.images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square border transition-all ${
                        selectedImage === index
                          ? 'border-black'
                          : 'border-black/10 hover:border-black/30'
                      }`}
                    >
                      <img
                        src={image.src}
                        alt={image.alt || `${product.name} - imagem ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-8">
              {/* Category */}
              <p className="text-xs tracking-wide text-black/40">{categoryName}</p>

              {/* Title */}
              <div>
                <h1 className="text-2xl lg:text-3xl tracking-tight text-black mb-2">
                  {product.name}
                </h1>
                {product.sku && (
                  <p className="text-xs text-black/40">SKU: {product.sku}</p>
                )}
              </div>

              {/* Price */}
              <div className="border-t border-b border-black/10 py-6">
                {priceOnRequest ? (
                  <p className="text-sm tracking-wide text-black">PREÇO SOB CONSULTA</p>
                ) : (
                  <p className="text-2xl text-black">R$ {price?.toFixed(2)}</p>
                )}
              </div>

              {/* Short Description */}
              {product.short_description && (
                <div
                  className="text-sm text-black/70 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.short_description }}
                />
              )}

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${inStock ? 'bg-green-600' : 'bg-red-600'}`} />
                <span className="text-sm text-black/60">
                  {inStock ? 'Em estoque' : 'Esgotado'}
                </span>
              </div>

              {inStock && (
                <p className="text-xs text-black/40">Disponível para retirada na loja em São Paulo</p>
              )}

              {/* Quantity and Add to Cart */}
              {inStock && !priceOnRequest && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="text-sm text-black/60">Quantidade:</label>
                    <div className="flex items-center border border-black/20">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-4 py-2 text-black/60 hover:text-black hover:bg-black/5 transition-colors"
                      >
                        -
                      </button>
                      <span className="px-6 py-2 text-sm text-black border-l border-r border-black/20">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-4 py-2 text-black/60 hover:text-black hover:bg-black/5 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="w-full flex items-center justify-center gap-3 bg-black text-white px-8 py-4 text-sm tracking-wide hover:bg-black/90 transition-colors"
                  >
                    <ShoppingCart size={18} strokeWidth={1.5} />
                    ADICIONAR AO CARRINHO
                  </button>
                </div>
              )}

              {/* Notify Me Button */}
              {!inStock && (
                <button
                  onClick={() => setIsNotifyModalOpen(true)}
                  className="w-full border border-black text-black px-8 py-4 text-sm tracking-wide hover:bg-black hover:text-white transition-colors"
                >
                  AVISE-ME QUANDO DISPONÍVEL
                </button>
              )}

              {/* Contact for Price */}
              {priceOnRequest && inStock && (
                <a
                  href={`https://wa.me/5511999999999?text=${encodeURIComponent(`Olá! Gostaria de saber o preço do produto: ${product.name}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center border border-black text-black px-8 py-4 text-sm tracking-wide hover:bg-black hover:text-white transition-colors"
                >
                  CONSULTAR PREÇO VIA WHATSAPP
                </a>
              )}

              {/* Attributes */}
              {product.attributes && product.attributes.length > 0 && (
                <div className="border-t border-black/10 pt-6">
                  <h3 className="text-sm tracking-wide text-black mb-4">ESPECIFICAÇÕES</h3>
                  <div className="space-y-2">
                    {product.attributes.map((attr) => (
                      <div key={attr.id} className="flex justify-between text-sm">
                        <span className="text-black/60">{attr.name}:</span>
                        <span className="text-black">{attr.options.join(', ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Full Description */}
          {product.description && (
            <div className="mt-16 border-t border-black/10 pt-16">
              <h2 className="text-lg tracking-wide text-black mb-6">DESCRIÇÃO COMPLETA</h2>
              <div
                className="text-sm text-black/70 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}
        </div>
      </div>

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

      {/* Notify Me Modal */}
      <NotifyMeModal
        isOpen={isNotifyModalOpen}
        productName={product.name}
        onClose={() => setIsNotifyModalOpen(false)}
      />

      <Footer onNavigate={navigateTo} />
    </>
  );
}
