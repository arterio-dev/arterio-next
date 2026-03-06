import type { WCCategory } from '@/app/types/woocommerce';

export interface HierarchicalCategory {
  id: number;
  name: string;
  subcategories: WCCategory[];
  count?: number;
}

export function getHierarchicalCategories(categories: WCCategory[] = []): HierarchicalCategory[] {
  if (!categories || !categories.length) return [];

  const parents = categories.filter(c => !c.parent || c.parent === 0);

  return parents
    .map(parent => ({
      id: parent.id,
      name: parent.name,
      count: parent.count,
      subcategories: categories.filter(c => c.parent === parent.id)
    }))
    .filter(cat => {
      const n = (cat.name || '').toLowerCase().trim();
      return n !== 'uncategorized' && n !== 'sem categoria' && n !== 'sem_categoria';
    });
}

