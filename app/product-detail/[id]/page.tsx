'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import type { WCProduct, WCVariation, StoreApiAttribute, StoreApiVariationRef } from '@/app/types/woocommerce';
import { useCart } from '@/hooks/useCart';
import { NotifyMeModal } from '@/components/NotifyMeModal';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CategoryNav } from '@/components/CategoryNav';
import { Cart } from '@/components/Cart';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ToastContainer';
import { STORE_INFO, getWhatsAppLink } from '@/app/config/store';
import { decodeHTMLEntities } from '@/utils/formatters';

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

  // ─── Variações ──────────────────────────────────────────────────────────────
  const [variations, setVariations] = useState<WCVariation[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [isLoadingVariations, setIsLoadingVariations] = useState(false);

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

  // ─── Buscar variações quando o produto é variável ───────────────────────────

  const storeAttributes: StoreApiAttribute[] = (product as any)?.attributes ?? [];
  // Atributos de variação (produto variable)
  const variationAttributes = storeAttributes.filter(a => a.has_variations);
  // Atributos seleccionáveis: variação OU atributos com mais de 1 opção (produto simples)
  const selectableAttributes = storeAttributes.filter(
    a => a.has_variations || a.terms.length > 1,
  );
  const storeVariationRefs: StoreApiVariationRef[] = (product as any)?.variations ?? [];
  const isVariable = variationAttributes.length > 0 && storeVariationRefs.length > 0;
  const hasSelectableAttributes = selectableAttributes.length > 0;

  useEffect(() => {
    if (!product || !isVariable) return;

    const fetchVariations = async () => {
      try {
        setIsLoadingVariations(true);
        const res = await fetch(`/api/products/${product.id}/variations`);
        if (!res.ok) throw new Error('Erro ao buscar variações');
        const data: WCVariation[] = await res.json();
        setVariations(data);

        // Pré-selecionar atributos com valor default (se existir)
        const defaults: Record<string, string> = {};
        variationAttributes.forEach(attr => {
          const defaultTerm = attr.terms.find(t => t.default);
          if (defaultTerm) {
            defaults[attr.taxonomy] = defaultTerm.slug;
          }
        });
        if (Object.keys(defaults).length > 0) {
          setSelectedAttributes(defaults);
        }
      } catch (err) {
        console.error('Erro ao carregar variações:', err);
      } finally {
        setIsLoadingVariations(false);
      }
    };

    fetchVariations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, isVariable]);

  // ─── Encontrar variação seleccionada ────────────────────────────────────────

  const allAttributesSelected = isVariable && variationAttributes.every(
    attr => selectedAttributes[attr.taxonomy],
  );

  // Para produtos simples com atributos: não há restrição de "tudo seleccionado"
  const canAddToCart = isVariable ? allAttributesSelected : true;

  // Encontra a variação na lista de refs do Store API (por taxonomy + slug)
  const matchedRef = allAttributesSelected
    ? storeVariationRefs.find(ref =>
        variationAttributes.every(attr => {
          const selected = selectedAttributes[attr.taxonomy];
          const refValue = ref.attributes.find(a => a.attribute === attr.taxonomy)?.value;
          // refValue vazio ("") aceita qualquer opção ("Any X")
          return refValue === selected || refValue === '';
        }),
      )
    : null;

  // Busca os detalhes completos (preço, stock, imagem) na resposta da REST API v3
  const selectedVariation: WCVariation | null = matchedRef
    ? variations.find(v => v.id === matchedRef.id) ?? null
    : null;

  const handleAttributeChange = (taxonomy: string, slug: string) => {
    setSelectedAttributes(prev => {
      // Toggle: se clicar na mesma opção, deseleciona
      if (prev[taxonomy] === slug) {
        const next = { ...prev };
        delete next[taxonomy];
        return next;
      }
      return { ...prev, [taxonomy]: slug };
    });
  };

  const clearAllAttributes = () => setSelectedAttributes({});

  /**
   * Para cada atributo, calcula quais terms estão disponíveis considerando
   * as selecções actuais dos OUTROS atributos.
   * Retorna um Map<taxonomy, Map<slug, 'available' | 'outofstock' | 'unavailable'>>
   */
  const termAvailability = (() => {
    const result = new Map<string, Map<string, 'available' | 'outofstock' | 'unavailable'>>();
    if (!isVariable) return result;

    variationAttributes.forEach(attr => {
      const statusMap = new Map<string, 'available' | 'outofstock' | 'unavailable'>();

      attr.terms.forEach(term => {
        // Verificar se existe pelo menos uma variação que combine
        // este term com as selecções actuais dos outros atributos
        const matchingRef = storeVariationRefs.find(ref => {
          // Este ref tem o term actual para este atributo?
          const refVal = ref.attributes.find(a => a.attribute === attr.taxonomy)?.value;
          if (refVal !== term.slug && refVal !== '') return false;

          // Combina com os outros atributos seleccionados?
          return variationAttributes.every(otherAttr => {
            if (otherAttr.taxonomy === attr.taxonomy) return true; // skip self
            const otherSelected = selectedAttributes[otherAttr.taxonomy];
            if (!otherSelected) return true; // nenhuma selecção → tudo combina
            const otherRefVal = ref.attributes.find(a => a.attribute === otherAttr.taxonomy)?.value;
            return otherRefVal === otherSelected || otherRefVal === '';
          });
        });

        if (!matchingRef) {
          statusMap.set(term.slug, 'unavailable');
        } else {
          // Verificar stock na lista de variações REST API v3
          const variation = variations.find(v => v.id === matchingRef.id);
          if (variation && variation.stock_status !== 'instock') {
            statusMap.set(term.slug, 'outofstock');
          } else {
            statusMap.set(term.slug, 'available');
          }
        }
      });

      result.set(attr.taxonomy, statusMap);
    });

    return result;
  })();

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

  const inStock = selectedVariation
    ? selectedVariation.stock_status === 'instock'
    : (product as any).is_in_stock ?? true;

  // Preço: se há variação seleccionada, usa o preço dela (REST API v3 = formato decimal)
  // Caso contrário, usa o preço do produto (Store API = minor units)
  const priceStr = (product as any).prices?.price || product.price;
  const basePrice = priceStr ? parseFloat(priceStr.toString()) / 100 : undefined;

  const variationPrice = selectedVariation?.price
    ? parseFloat(selectedVariation.price)
    : null;

  const price = variationPrice ?? basePrice;

  // Price range para produtos variáveis (Store API devolve em minor units)
  const priceRange = (product as any).prices?.price_range;
  const minPrice = priceRange?.min_amount ? parseFloat(priceRange.min_amount) / 100 : null;
  const maxPrice = priceRange?.max_amount ? parseFloat(priceRange.max_amount) / 100 : null;
  const hasPriceRange = isVariable && minPrice !== null && maxPrice !== null && minPrice !== maxPrice;

  const priceOnRequest = product.meta_data?.find(meta => meta.key === '_price_on_request')?.value === 'yes';
  const categoryName = product.categories?.[0]?.name || 'Produtos';

  // Imagem: se a variação seleccionada tem imagem, sobrepõe a galeria principal
  const variationImage = selectedVariation?.image?.src ? selectedVariation.image : null;

  const handleAddToCart = () => {
    if (inStock && !priceOnRequest) {
      // Para variáveis: só adiciona se todos os atributos de variação foram seleccionados
      if (!canAddToCart) return;

      // Construir array de variação para o Store API (taxonomy slug + term slug)
      const variation = isVariable
        ? variationAttributes.map(attr => ({
            attribute: attr.taxonomy,
            value: selectedAttributes[attr.taxonomy] || '',
          }))
        : undefined;

      addToCart({
        id: product.id.toString(),
        name: product.name,
        price: price || 0,
        category: categoryName,
        inStock: true,
      }, quantity, variation);
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
                {variationImage ? (
                  <img
                    src={variationImage.src}
                    alt={variationImage.alt || (decodeHTMLEntities(product.name))}
                    className="h-full w-full object-cover"
                  />
                ) : product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[selectedImage]?.src}
                    alt={product.images[selectedImage]?.alt || (decodeHTMLEntities(product.name))}
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
                  {decodeHTMLEntities(product.name)}
                </h1>
                {/* SKU — mostra o da variação se seleccionada */}
              {(selectedVariation?.sku || product.sku) && (
                  <p className="text-xs text-black/40">
                    SKU: {selectedVariation?.sku || product.sku}
                  </p>
                )}
              </div>

              {/* Price */}
              <div className="border-t border-b border-black/10 py-6">
                {priceOnRequest ? (
                  <p className="text-sm tracking-wide text-black">PREÇO SOB CONSULTA</p>
                ) : isVariable && !selectedVariation && hasPriceRange ? (
                  <p className="text-2xl text-black">
                    R$ {minPrice?.toFixed(2)} – R$ {maxPrice?.toFixed(2)}
                  </p>
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

              {/* Attribute Selectors — variáveis (afectam preço/stock) e simples (informativos) */}
              {hasSelectableAttributes && (
                <div className="space-y-5">
                  {selectableAttributes.map(attr => {
                    const statusMap = termAvailability.get(attr.taxonomy);
                    const selected = selectedAttributes[attr.taxonomy];
                    const isVariationAttr = attr.has_variations;

                    return (
                      <div key={attr.id}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs tracking-wide text-black/60">
                            {attr.name.toUpperCase()}
                            {selected && (
                              <span className="ml-2 text-black font-medium">
                                — {attr.terms.find(t => t.slug === selected)?.name}
                              </span>
                            )}
                          </label>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {attr.terms.map(term => {
                            const isSelected = selected === term.slug;
                            // Só calcula disponibilidade para atributos de variação
                            const status = isVariationAttr
                              ? (statusMap?.get(term.slug) ?? 'available')
                              : 'available';
                            const isUnavailable = status === 'unavailable';
                            const isOutOfStock = status === 'outofstock';
                            const isDisabled = isUnavailable;

                            return (
                              <button
                                key={term.id}
                                onClick={() => !isDisabled && handleAttributeChange(attr.taxonomy, term.slug)}
                                disabled={isDisabled}
                                title={
                                  isUnavailable ? 'Combinação indisponível'
                                  : isOutOfStock ? 'Esgotado'
                                  : term.name
                                }
                                className={`relative px-4 py-2 text-sm border transition-all ${
                                  isSelected
                                    ? 'border-black bg-black text-white'
                                    : isUnavailable
                                      ? 'border-black/10 text-black/25 cursor-not-allowed line-through'
                                      : isOutOfStock
                                        ? 'border-black/20 text-black/40 hover:border-black/40'
                                        : 'border-black/20 text-black hover:border-black/50'
                                }`}
                              >
                                {term.name}
                                {isOutOfStock && !isSelected && (
                                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                    <span className="h-2 w-2 rounded-full bg-red-400" />
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Ações */}
                  <div className="flex items-center gap-4">
                    {isVariable && !allAttributesSelected && (
                      <p className="text-xs text-amber-600">
                        Selecione todas as opções para adicionar ao carrinho.
                      </p>
                    )}
                    {Object.keys(selectedAttributes).length > 0 && (
                      <button
                        onClick={clearAllAttributes}
                        className="text-xs text-black/40 underline hover:text-black/70 transition-colors ml-auto"
                      >
                        Limpar seleção
                      </button>
                    )}
                  </div>

                  {isLoadingVariations && (
                    <p className="text-xs text-black/40">Carregando opções...</p>
                  )}
                </div>
              )}

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${inStock ? 'bg-green-600' : 'bg-red-600'}`} />
                <span className="text-sm text-black/60">
                  {inStock ? 'Em estoque' : 'Esgotado'}
                </span>
              </div>

              {inStock && (
                <p className="text-xs text-black/40">Disponível para retirada na loja</p>
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
                    disabled={!canAddToCart}
                    className={`w-full flex items-center justify-center gap-3 px-8 py-4 text-sm tracking-wide transition-colors ${
                      !canAddToCart
                        ? 'bg-black/30 text-white cursor-not-allowed'
                        : 'bg-black text-white hover:bg-black/90'
                    }`}
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
                  href={getWhatsAppLink(STORE_INFO.whatsapp.productInquiry(product.name))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center border border-black text-black px-8 py-4 text-sm tracking-wide hover:bg-black hover:text-white transition-colors"
                >
                  CONSULTAR PREÇO VIA WHATSAPP
                </a>
              )}

              {/* Attributes (non-selectable only — selectable attrs are shown as buttons above) */}
              {product.attributes && product.attributes.filter(a => {
                const storeAttr = storeAttributes.find(s => s.id === (a as any).id);
                // Ocultar se já é mostrado como selector (tem variações OU tem >1 term)
                return !(storeAttr && (storeAttr.has_variations || storeAttr.terms.length > 1));
              }).length > 0 && (
                <div className="border-t border-black/10 pt-6">
                  <h3 className="text-sm tracking-wide text-black mb-4">ESPECIFICAÇÕES</h3>
                  <div className="space-y-2">
                    {product.attributes.filter(a => {
                      const storeAttr = storeAttributes.find(s => s.id === (a as any).id);
                      return !(storeAttr && (storeAttr.has_variations || storeAttr.terms.length > 1));
                    }).map((attr) => (
                      <div key={attr.id} className="flex justify-between text-sm">
                        <span className="text-black/60">{attr.name}:</span>
                        <span className="text-black">
                          {(attr as any).terms
                            ? (attr as any).terms.map((t: any) => t.name).join(', ')
                            : attr.options.join(', ')}
                        </span>
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
        productName={decodeHTMLEntities(product.name)}
        onClose={() => setIsNotifyModalOpen(false)}
      />

      <Footer onNavigate={navigateTo} />
    </>
  );
}
