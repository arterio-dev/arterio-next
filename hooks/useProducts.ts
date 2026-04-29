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

        // 1. Buscamos os produtos à API com paginação automática
        // O parâmetro category é passado direto à Store API
        const wcProducts = await productService.getAll({
          category,
          search,
          featured,
          fetchAll: true, // Ativa paginação automática para buscar TODOS os produtos
        });

        if (isMounted) {
          // 2. Mapeamos os produtos para o formato local
          const localProducts = mapWCProductsToLocal(wcProducts);
          setProducts(localProducts);
          console.debug('[useProducts] Success:', localProducts.length, 'products loaded');
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