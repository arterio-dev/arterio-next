'use client';

import { categories } from "@/app/data/categories";

interface CategorySidebarProps {
  onCategorySelect?: (category: string) => void;
  selectedCategory?: string | null;
}

export function CategorySidebar({ onCategorySelect, selectedCategory }: CategorySidebarProps) {
  return (
    <aside className="hidden lg:block w-64 pr-12">
      <nav className="space-y-8">
        {categories.map((category) => (
          <div key={category.name}>
            <h3 className="mb-3 text-sm tracking-wide text-black">
              {category.name.toUpperCase()}
            </h3>
            <ul className="space-y-2">
              {category.subcategories.map((subcategory) => (
                <li key={subcategory}>
                  <button
                    onClick={() => onCategorySelect?.(subcategory)}
                    className={`text-sm transition-colors ${
                      selectedCategory === subcategory
                        ? 'text-black font-medium'
                        : 'text-black/60 hover:text-black'
                    }`}
                  >
                    {subcategory}
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
