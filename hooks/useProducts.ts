'use client';

import { useState, useEffect } from 'react';
import { productService, mapWCProductsToLocal } from '@/app/services/woocommerce';
import { useCategories } from './useCategories';
import type { Product } from '@/app/types/woocommerce';

interface UseProductsOptions {
  categoryId?: string; // The category ID for filtering
  categoryName?: string; // The category name for fallback filtering
  search?: string;
  featured?: boolean;
  enabled?: boolean;
}

export function useProducts(options: UseProductsOptions = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { categoryId, categoryName, search, featured, enabled = true } = options;
  
  // Fetch all categories to understand hierarchy
  const { categories } = useCategories();

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

        console.debug('[useProducts] Fetching with params:', { categoryId, categoryName, search, featured });

        // 1. Fetch products from the API (with paginação automática if fetchAll is true)
        // NOTE: category filtering is NOT sent to the API (WooCommerce bug)
        const wcProducts = await productService.getAll({
          search,
          featured,
          fetchAll: true, // Ativa paginação automática para buscar TODOS os produtos
          categoryId,
          categoryName,
          allCategories: categories, // Pass categories to understand hierarchy
        });

        if (isMounted) {
          // 2. Map to local format
          let localProducts = mapWCProductsToLocal(wcProducts);
          
          // 3. Apply client-side category filtering
          if (categoryId || categoryName) {
            // Build a set of category IDs to match, including parent categories
            const categoryIdsToMatch = new Set<string>();
            
            if (categoryId) {
              categoryIdsToMatch.add(categoryId);
              
              // If this is a subcategory, also include its parent category
              if (categories && categories.length > 0) {
                const selectedCat = categories.find(c => c.id.toString() === categoryId);
                if (selectedCat && selectedCat.parent) {
                  // Add the parent category to the match set
                  categoryIdsToMatch.add(selectedCat.parent.toString());
                }
              }
            }
            
            localProducts = localProducts.filter(product => {
              // First try to match by categoryId if provided
              if (categoryIdsToMatch.size > 0 && product.categoryId) {
                if (categoryIdsToMatch.has(product.categoryId)) {
                  return true;
                }
              }
              
              // Fallback to category name matching
              if (categoryName && product.category) {
                // Case-insensitive name matching
                if (product.category.toLowerCase() === categoryName.toLowerCase()) {
                  return true;
                }
              }
              
              // If both are provided, match either one (OR logic)
              return false;
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
  }, [categoryId, categoryName, search, featured, enabled, categories]);


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