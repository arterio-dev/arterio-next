'use client';

import { useMemo } from "react";
import { useCategories } from "@/hooks/useCategories";

// Dentro de components/CategorySidebar.tsx
interface CategorySidebarProps {
  onCategorySelect?: (id: string, name: string) => void; // <-- Tem de estar assim
  selectedCategoryId?: string | null;                    // <-- Tem de estar assim
}

export function CategorySidebar({ onCategorySelect, selectedCategoryId }: CategorySidebarProps) {
  const { categories, loading } = useCategories();

  const hierarchicalCategories = useMemo(() => {
    if (!categories.length) return [];
    
    const parents = categories.filter(c => !c.parent || c.parent === 0);
    return parents.map(parent => ({
      id: parent.id,
      name: parent.name,
      subcategories: categories.filter(c => c.parent === parent.id)
    })).filter(cat => cat.name !== "Sem categoria");
  }, [categories]);

  if (loading) {
    return (
      <aside className="hidden lg:block w-64 pr-12 animate-pulse">
        <div className="space-y-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="h-4 bg-black/10 rounded w-24 mb-4" />
              <div className="space-y-2">
                <div className="h-3 bg-black/5 rounded w-32" />
                <div className="h-3 bg-black/5 rounded w-28" />
              </div>
            </div>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden lg:block w-64 pr-12">
      <nav className="space-y-8">
        {hierarchicalCategories.map((category) => (
          <div key={category.id} onClick={() => onCategorySelect?.(category.id.toString(), category.name)}>
            <h3 className="mb-3 text-sm tracking-wide text-black">
              {category.name.toUpperCase()}
            </h3>
            
            <ul className="space-y-2">
              {category.subcategories.map((subcategory) => (
                <li key={subcategory.id}>
                  <button
                    onClick={() => onCategorySelect?.(subcategory.id.toString(), subcategory.name)}
                    className={`text-sm transition-colors text-left ${
                      selectedCategoryId === subcategory.id.toString()
                        ? 'text-black font-medium'
                        : 'text-black/60 hover:text-black'
                    }`}
                  >
                    {subcategory.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
} 