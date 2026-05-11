'use client';

import { useState, useEffect } from 'react';
import { productService, mapWCProductsToLocal } from '@/app/services/woocommerce';
import type { Product } from '@/app/types/woocommerce';

interface UseProductsOptions {
  category?: string; // Este é o ID da categoria que vem da URL
  search?: string;
  featured?: boolean;
  enabled?: boolean;
}

export function useProducts(options: UseProductsOptions = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { category, search, featured, enabled = true } = options;

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);

        console.debug('[useProducts] Fetching with params:', { category, search, featured });

        // 1. Fetch products from the API (with paginação automática if fetchAll is true)
        // NOTE: category filtering is NOT sent to the API (WooCommerce bug)
        const wcProducts = await productService.getAll({
          search,
          featured,
          fetchAll: true, // Ativa paginação automática para buscar TODOS os produtos
        });

        if (isMounted) {
          // 2. Map to local format
          let localProducts = mapWCProductsToLocal(wcProducts);
          
          // 3. Apply client-side category filtering
          if (category && category.trim() !== '') {
            localProducts = localProducts.filter(product => {
              // Use categoryId if available, otherwise try to match by name
              if (product.categoryId) {
                return product.categoryId === category;
              }
              // Fallback to category name matching (in case categoryId is not available)
              return product.category.toLowerCase() === category.toLowerCase();
            });
          }
          
          setProducts(localProducts);
          console.debug('[useProducts] Success:', localProducts.length, 'products loaded after filtering');
        }
      } catch (err) {
        if (isMounted) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.error('[useProducts] Error:', errorMsg, err);
          setError(err instanceof Error ? err : new Error('Failed to fetch products'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [category, search, featured, enabled]);


  return { products, loading, error };
}

export function useProduct(productId: number | null) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchProduct() {
      try {
        setLoading(true);
        setError(null);

        const wcProduct = await productService.getById(productId!);

        if (isMounted) {
          const localProduct = mapWCProductsToLocal([wcProduct])[0];
          setProduct(localProduct);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch product'));
          console.error('Error fetching product:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchProduct();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  return { product, loading, error };
}