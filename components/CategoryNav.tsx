'use client';

import { useState } from "react";
import { ChevronDown, Menu } from "lucide-react";
import { categories } from "@/app/data/categories";

interface CategoryNavProps {
  onCategorySelect?: (category: string) => void;
}

export function CategoryNav({ onCategorySelect }: CategoryNavProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleCategoryHover = (categoryName: string) => {
    setActiveCategory(categoryName);
  };

  const handleCategoryClick = (categoryName: string) => {
    const category = categories.find((cat) => cat.name === categoryName);
    if (category && category.subcategories.length === 0) {
      onCategorySelect?.(categoryName);
      setActiveCategory(null);
    } else {
      setActiveCategory(activeCategory === categoryName ? null : categoryName);
    }
  };

  const handleSubcategoryClick = (subcategory: string) => {
    onCategorySelect?.(subcategory);
    setActiveCategory(null);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileCategory = (categoryName: string) => {
    const category = categories.find((cat) => cat.name === categoryName);
    if (category && category.subcategories.length === 0) {
      onCategorySelect?.(categoryName);
      setIsMobileMenuOpen(false);
      setActiveCategory(null);
    } else {
      setActiveCategory(activeCategory === categoryName ? null : categoryName);
    }
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav 
        className="hidden lg:block border-b border-black/10 bg-white sticky top-[73px] md:top-[89px] z-30"
        onMouseLeave={() => setActiveCategory(null)}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between">
            {categories.map((category) => (
              <button
                key={category.name}
                onMouseEnter={() => handleCategoryHover(category.name)}
                onClick={() => handleCategoryClick(category.name)}
                className={`group relative flex items-center gap-1 py-5 text-xs tracking-wide transition-colors ${
                  activeCategory === category.name
                    ? "text-black"
                    : "text-black/60 hover:text-black"
                }`}
              >
                {category.name.toUpperCase()}
                <ChevronDown 
                  size={14} 
                  className={`transition-transform ${
                    activeCategory === category.name ? "rotate-180" : ""
                  }`}
                />
                
                {activeCategory === category.name && (
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-black" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Subcategories Dropdown */}
        {activeCategory && (
          <div className="border-t border-black/10 bg-white">
            <div className="mx-auto max-w-7xl px-6 py-6">
              <div className="grid grid-cols-4 gap-8">
                {categories
                  .find((cat) => cat.name === activeCategory)
                  ?.subcategories.map((subcategory) => (
                    <button
                      key={subcategory}
                      onClick={() => handleSubcategoryClick(subcategory)}
                      className="text-left text-sm text-black/60 hover:text-black transition-colors"
                    >
                      {subcategory}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Navigation */}
      <nav className="lg:hidden border-b border-black/10 bg-white sticky top-[61px] sm:top-[73px] z-30">
        <div className="px-4 sm:px-6">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex items-center gap-2 py-4 text-sm tracking-wide text-black/80 hover:text-black transition-colors w-full"
          >
            <Menu size={18} strokeWidth={1.5} />
            CATEGORIAS
            <ChevronDown 
              size={16} 
              className={`ml-auto transition-transform ${
                isMobileMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* Mobile Categories Dropdown */}
        {isMobileMenuOpen && (
          <div className="border-t border-black/10 bg-white max-h-[70vh] overflow-y-auto">
            <div className="px-4 sm:px-6 py-4">
              {categories.map((category) => (
                <div key={category.name} className="mb-4">
                  <button
                    onClick={() => toggleMobileCategory(category.name)}
                    className="flex items-center justify-between w-full py-3 text-sm tracking-wide text-black/80 hover:text-black transition-colors"
                  >
                    {category.name.toUpperCase()}
                    <ChevronDown 
                      size={16} 
                      className={`transition-transform ${
                        activeCategory === category.name ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  
                  {activeCategory === category.name && (
                    <div className="mt-2 pl-4 space-y-2">
                      {category.subcategories.map((subcategory) => (
                        <button
                          key={subcategory}
                          onClick={() => handleSubcategoryClick(subcategory)}
                          className="block w-full text-left py-2 text-sm text-black/60 hover:text-black transition-colors"
                        >
                          {subcategory}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
