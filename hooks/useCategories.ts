'use client';

import { useState, useEffect } from 'react';
import { categoryService } from '@/app/services/woocommerce';
import type { WCCategory } from '@/app/types/woocommerce';

interface UseCategoriesOptions {
  parent?: number;
  hideEmpty?: boolean;
  perPage?: number;
}

export function useCategories(options: UseCategoriesOptions = {}) {
  const [categories, setCategories] = useState<WCCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { parent, hideEmpty = true, perPage = 100 } = options;

  useEffect(() => {
    let isMounted = true;

    async function fetchCategories() {
      try {
        setLoading(true);
        setError(null);

        const wcCategories = await categoryService.getAll();

        if (isMounted) {
          setCategories(wcCategories);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch categories'));
          console.error('Error fetching categories:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, [parent, hideEmpty, perPage]);

  return { categories, loading, error };
}

export function useCategory(categoryId: number | null) {
  const [category, setCategory] = useState<WCCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!categoryId) {
      setCategory(null);
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchCategory() {
      try {
        setLoading(true);
        setError(null);

        const wcCategories = await categoryService.getAll();
        const wcCategory = wcCategories.find(cat => cat.id === categoryId) || null;

        if (isMounted) {
          setCategory(wcCategory);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch category'));
          console.error('Error fetching category:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchCategory();

    return () => {
      isMounted = false;
    };
  }, [categoryId]);

  return { category, loading, error };
}
