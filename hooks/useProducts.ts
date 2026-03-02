'use client';

import { useState, useEffect } from 'react';
import { productService, mapWCProductsToLocal } from '@/app/services/woocommerce';
import type { Product } from '@/app/types/woocommerce';

interface UseProductsOptions {
  category?: string;
  search?: string;
  perPage?: number;
  featured?: boolean;
  enabled?: boolean;
}

export function useProducts(options: UseProductsOptions = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { category, search, perPage = 100, featured, enabled = true } = options;

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    /* async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);

        const wcProducts = await productService.getAll({
          per_page: perPage,
          category,
          search,
          featured,
        });

        if (isMounted) {
          const localProducts = mapWCProductsToLocal(wcProducts);
          setProducts(localProducts);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch products'));
          console.error('Error fetching products:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    } */

      async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);

        // Não enviamos o 'category' na requisição pois a API espera um ID numérico.
        // Faremos o filtro de categoria localmente abaixo.
        const wcProducts = await productService.getAll({
          per_page: perPage,
          search,
          featured,
        });

        if (isMounted) {
          let localProducts = mapWCProductsToLocal(wcProducts);
          
          // Aplicando o filtro pelo nome da categoria localmente
          if (category) {
            localProducts = localProducts.filter(
              (p) => p.category.toLowerCase() === category.toLowerCase()
            );
          }

          setProducts(localProducts);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch products'));
          console.error('Error fetching products:', err);
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
  }, [category, search, perPage, featured, enabled]);

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
