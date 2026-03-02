'use client';

import { useState, useMemo } from "react";
import { ChevronDown, Menu } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";

interface CategoryNavProps {
  onCategorySelect?: (id: string, name: string) => void;
}

export function CategoryNav({ onCategorySelect }: CategoryNavProps) {
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // 1. Buscar as categorias da API
  const { categories, loading } = useCategories();

  // 2. Organizar as categorias (Principais e Subcategorias)
  const hierarchicalCategories = useMemo(() => {
    if (!categories.length) return [];
    
    // Pegar apenas as categorias raiz (parent === 0 ou inexistente)
    // Opcional: Filtrar a categoria "Sem Categoria" comum do WP (id 15 por ex, ou filtrar pelo nome)
    const parents = categories.filter(c => !c.parent || c.parent === 0);
    
    return parents.map(parent => ({
      id: parent.id,
      name: parent.name,
      subcategories: categories.filter(c => c.parent === parent.id)
    })).filter(cat => cat.name !== "Sem categoria"); // Ignora a padrão do WP
  }, [categories]);

  const handleCategoryHover = (categoryId: number) => {
    setActiveCategory(categoryId);
  };

  const handleCategoryClick = (categoryId: number, categoryName: string, hasSubcategories: boolean) => {
    if (!hasSubcategories) {
      onCategorySelect?.(categoryId.toString(), categoryName);
      setActiveCategory(null);
    } else {
      setActiveCategory(activeCategory === categoryId ? null : categoryId);
    }
  };

  const handleSubcategoryClick = (subId: number, subName: string) => {
    onCategorySelect?.(subId.toString(), subName);
    setActiveCategory(null);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileCategory = (categoryId: number, categoryName: string, hasSubcategories: boolean) => {
    if (!hasSubcategories) {
      onCategorySelect?.(categoryId.toString(), categoryName);
      setIsMobileMenuOpen(false);
      setActiveCategory(null);
    } else {
      setActiveCategory(activeCategory === categoryId ? null : categoryId);
    }
  };

  if (loading) {
    // Esqueleto de carregamento opcional para evitar o "pulo" do layout
    return <div className="hidden lg:block h-[60px] border-b border-black/10 bg-white sticky top-[73px] md:top-[89px] z-30" />;
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav 
        className="hidden lg:block border-b border-black/10 bg-white sticky top-[73px] md:top-[89px] z-30"
        onMouseLeave={() => setActiveCategory(null)}
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between">
            {hierarchicalCategories.map((category) => (
              <button
                key={category.id}
                onMouseEnter={() => handleCategoryHover(category.id)}
                onClick={() => handleCategoryClick(category.id, category.name, category.subcategories.length > 0)}
                className={`group relative flex items-center gap-1 py-5 text-xs tracking-wide transition-colors ${
                  activeCategory === category.id
                    ? "text-black"
                    : "text-black/60 hover:text-black"
                }`}
              >
                {category.name.toUpperCase()}
                {category.subcategories.length > 0 && (
                  <ChevronDown 
                    size={14} 
                    className={`transition-transform ${
                      activeCategory === category.id ? "rotate-180" : ""
                    }`}
                  />
                )}
                
                {activeCategory === category.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-black" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Subcategories Dropdown */}
        {activeCategory && (
          <div className="border-t border-black/10 bg-white absolute w-full">
            <div className="mx-auto max-w-7xl px-6 py-6">
              <div className="grid grid-cols-4 gap-8">
                {hierarchicalCategories
                  .find((cat) => cat.id === activeCategory)
                  ?.subcategories.map((subcategory) => (
                    <button
                      key={subcategory.id}
                      onClick={() => handleSubcategoryClick(subcategory.id, subcategory.name)}
                      className="text-left text-sm text-black/60 hover:text-black transition-colors"
                    >
                      {subcategory.name}
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
          <div className="border-t border-black/10 bg-white max-h-[70vh] overflow-y-auto absolute w-full shadow-lg">
            <div className="px-4 sm:px-6 py-4">
              {hierarchicalCategories.map((category) => (
                <div key={category.id} className="mb-4">
                  <button
                    onClick={() => toggleMobileCategory(category.id, category.name, category.subcategories.length > 0)}
                    className="flex items-center justify-between w-full py-3 text-sm tracking-wide text-black/80 hover:text-black transition-colors"
                  >
                    {category.name.toUpperCase()}
                    {category.subcategories.length > 0 && (
                      <ChevronDown 
                        size={16} 
                        className={`transition-transform ${
                          activeCategory === category.id ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </button>
                  
                  {activeCategory === category.id && (
                    <div className="mt-2 pl-4 space-y-2">
                      {category.subcategories.map((subcategory) => (
                        <button
                          key={subcategory.id}
                          onClick={() => handleSubcategoryClick(subcategory.id, subcategory.name)}
                          className="block w-full text-left py-2 text-sm text-black/60 hover:text-black transition-colors"
                        >
                          {subcategory.name}
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