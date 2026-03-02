'use client';

import { Search, ShoppingCart, User, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LoginModal } from "@components/LoginModal";

interface HeaderProps {
  onCartClick?: () => void;
  cartItemCount?: number;
  onNavigate?: (page: string) => void;
  onSearch?: (searchTerm: string) => void;
}

export function Header({ onCartClick, cartItemCount = 0, onNavigate, onSearch }: HeaderProps) {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleNavigate = (page: string) => {
    onNavigate?.(page);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch?.(searchTerm);
      onNavigate?.("products");
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (value.trim()) {
      onSearch?.(value);
    } else {
      onSearch?.("");
    }
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setSearchTerm("");
      onSearch?.("");
    }
  };

  return (
    <header className="border-b border-black/10 bg-white sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-6 md:py-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button 
            onClick={() => handleNavigate("/")} 
            className="text-xl sm:text-2xl tracking-tight text-black hover:opacity-60 transition-opacity"
          >
            ARTERIO
          </button>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <button 
              onClick={() => handleNavigate("/")}
              className="text-sm tracking-wide text-black/60 hover:text-black transition-colors"
            >
              HOME
            </button>
            <button 
              onClick={() => handleNavigate("products")}
              className="text-sm tracking-wide text-black/60 hover:text-black transition-colors"
            >
              PRODUTOS
            </button>
            <button 
              onClick={() => handleNavigate("about")}
              className="text-sm tracking-wide text-black/60 hover:text-black transition-colors"
            >
              SOBRE
            </button>
            {/* <button 
              onClick={() => handleNavigate("contact")}
              className="text-sm tracking-wide text-black/60 hover:text-black transition-colors"
            >
              CONTATO
            </button> */}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Search - Hidden on small mobile */}
            <button 
              onClick={toggleSearch}
              className="hidden sm:block text-black/60 hover:text-black transition-colors"
            >
              <Search size={20} strokeWidth={1.5} />
            </button>
            
            {/* User / Login */}
            {user ? (
              <div className="hidden sm:flex items-center gap-4">
                <div className="flex flex-col items-end gap-0">
                  <span className="text-xs tracking-wide text-black">{user.name}</span>
                  <button
                    onClick={handleLogout}
                    className="text-xs tracking-wide text-black/60 hover:text-black transition-colors"
                  >
                    SAIR
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="hidden sm:block text-black/60 hover:text-black transition-colors"
              >
                <User size={20} strokeWidth={1.5} />
              </button>
            )}
            
            {/* Cart */}
            <button 
              onClick={onCartClick}
              className="relative text-black/60 hover:text-black transition-colors"
            >
              <ShoppingCart size={20} strokeWidth={1.5} />
              {cartItemCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] text-white">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden text-black/60 hover:text-black transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X size={24} strokeWidth={1.5} />
              ) : (
                <Menu size={24} strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>

        {/* Desktop Search Bar */}
        {isSearchOpen && (
          <div className="hidden sm:block mt-6 pt-6 border-t border-black/10">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Buscar produtos..."
                className="w-full px-4 py-3 text-sm border border-black/20 focus:border-black outline-none transition-colors"
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black/60 hover:text-black transition-colors"
              >
                <Search size={18} strokeWidth={1.5} />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <nav className="fixed top-[73px] right-0 bottom-0 w-full sm:w-80 bg-white border-l border-black/10 lg:hidden overflow-y-auto">
            <div className="flex flex-col p-6 gap-1">
              {/* Mobile Search */}
              <div className="mb-6 pb-6 border-b border-black/10 sm:hidden">
                <form onSubmit={handleSearchSubmit}>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Buscar produtos..."
                      className="w-full px-4 py-3 text-sm border border-black/20 focus:border-black outline-none transition-colors"
                    />
                    <button
                      type="submit"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-black/60 hover:text-black transition-colors"
                    >
                      <Search size={18} strokeWidth={1.5} />
                    </button>
                  </div>
                </form>
              </div>

              <button 
                onClick={() => handleNavigate("home")}
                className="text-left py-4 px-4 text-base tracking-wide text-black/80 hover:bg-black/5 transition-colors"
              >
                HOME
              </button>
              <button 
                onClick={() => handleNavigate("products")}
                className="text-left py-4 px-4 text-base tracking-wide text-black/80 hover:bg-black/5 transition-colors"
              >
                PRODUTOS
              </button>
              <button 
                onClick={() => handleNavigate("about")}
                className="text-left py-4 px-4 text-base tracking-wide text-black/80 hover:bg-black/5 transition-colors"
              >
                SOBRE
              </button>
              <button 
                onClick={() => handleNavigate("contact")}
                className="text-left py-4 px-4 text-base tracking-wide text-black/80 hover:bg-black/5 transition-colors"
              >
                CONTATO
              </button>

              {/* Mobile-only actions */}
              <div className="mt-8 pt-8 border-t border-black/10 sm:hidden">
                {user ? (
                  <div className="space-y-4">
                    <div className="py-4 px-4">
                      <p className="text-xs tracking-wide text-black/60 mb-1">LOGADO COMO</p>
                      <p className="text-sm tracking-wide text-black">{user.name}</p>
                      <p className="text-xs text-black/60">{user.email}</p>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full py-4 px-4 text-base tracking-wide text-black/80 hover:bg-black/5 transition-colors border-t border-black/10"
                    >
                      <LogOut size={20} strokeWidth={1.5} />
                      SAIR
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      setIsLoginModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full py-4 px-4 text-base tracking-wide text-black/80 hover:bg-black/5 transition-colors"
                  >
                    <User size={20} strokeWidth={1.5} />
                    FAZER LOGIN
                  </button>
                )}
              </div>
            </div>
          </nav>
        </>
      )}

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </header>
  );
}
