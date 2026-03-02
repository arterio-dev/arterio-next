'use client';

import { MapPin, Lock, CreditCard } from "lucide-react";

interface FooterProps {
  onNavigate: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="border-t border-black/10 bg-white">
      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          {/* About */}
          <div className="space-y-4">
            <h3 className="text-sm tracking-wide text-black">
              ARTERIO
            </h3>
            <p className="text-xs leading-relaxed text-black/60">
              Suprimentos essenciais com excelência. Simplicidade, qualidade e agilidade em cada entrega.
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h3 className="text-sm tracking-wide text-black">
              NAVEGAÇÃO
            </h3>
            <nav className="flex flex-col space-y-2">
              <button onClick={() => onNavigate("/")} className="text-xs text-black/60 hover:text-black transition-colors text-left">
                Home
              </button>
              <button onClick={() => onNavigate("products")} className="text-xs text-black/60 hover:text-black transition-colors text-left">
                Produtos
              </button>
              <button onClick={() => onNavigate("about")} className="text-xs text-black/60 hover:text-black transition-colors text-left">
                Sobre
              </button>
              <button onClick={() => onNavigate("contact")} className="text-xs text-black/60 hover:text-black transition-colors text-left">
                Contato
              </button>
            </nav>
          </div>

          {/* Help */}
          {/* <div className="space-y-4">
            <h3 className="text-sm tracking-wide text-black">
              AJUDA
            </h3>
            <nav className="flex flex-col space-y-2">
              <button onClick={() => onNavigate("how-to-buy")} className="text-xs text-black/60 hover:text-black transition-colors text-left">
                Como Comprar
              </button>
              <button onClick={() => onNavigate("shipping")} className="text-xs text-black/60 hover:text-black transition-colors text-left">
                Entrega e Devoluções
              </button>
              <button onClick={() => onNavigate("terms")} className="text-xs text-black/60 hover:text-black transition-colors text-left">
                Termos de Uso
              </button>
              <button onClick={() => onNavigate("privacy")} className="text-xs text-black/60 hover:text-black transition-colors text-left">
                Política de Privacidade
              </button>
            </nav>
          </div> */}

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-sm tracking-wide text-black">
              CONTATO
            </h3>
            <div className="space-y-2 text-xs text-black/60">
              <p>WhatsApp: (11) 99999-9999</p>
              <p>Email: contato@arterio.com.br</p>
              <p>Seg - Sex: 9h às 18h</p>
              <p className="pt-2">
                <MapPin size={12} strokeWidth={1.5} className="inline mr-1" />
                Rio de Janeiro - RJ
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment & Security Section */}
      <div className="border-t border-black/10">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            {/* Payment Methods */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs tracking-wide text-black/40">
                <CreditCard size={14} strokeWidth={1.5} />
                FORMAS DE PAGAMENTO
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-12 items-center justify-center border border-black/10 bg-white text-[8px] font-medium tracking-wide text-black/60">
                  VISA
                </div>
                <div className="flex h-8 w-12 items-center justify-center border border-black/10 bg-white text-[8px] font-medium tracking-wide text-black/60">
                  MASTER
                </div>
                <div className="flex h-8 w-12 items-center justify-center border border-black/10 bg-white text-[8px] font-medium tracking-wide text-black/60">
                  ELO
                </div>
                <div className="flex h-8 w-12 items-center justify-center border border-black/10 bg-white text-[8px] font-medium tracking-wide text-black/60">
                  AMEX
                </div>
                <div className="flex h-8 w-12 items-center justify-center border border-black/10 bg-white text-[8px] font-medium tracking-wide text-black/60">
                  PIX
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs tracking-wide text-black/40">
                <Lock size={14} strokeWidth={1.5} />
                SEGURANÇA
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 items-center gap-1.5 border border-black/10 bg-white px-3">
                  <Lock size={12} strokeWidth={1.5} className="text-black/60" />
                  <span className="text-[8px] font-medium tracking-wide text-black/60">
                    SSL SEGURO
                  </span>
                </div>
                <div className="flex h-8 items-center gap-1.5 border border-black/10 bg-white px-3">
                  <div className="h-2 w-2 rounded-full bg-black/60" />
                  <span className="text-[8px] font-medium tracking-wide text-black/60">
                    SITE SEGURO
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-black/10">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-col gap-4 text-center md:flex-row md:items-center md:justify-between md:text-left">
            <p className="text-xs text-black/40">
              © {new Date().getFullYear()} Arterio. Todos os direitos reservados.
            </p>
            <div className="flex justify-center gap-6 text-xs text-black/40 md:justify-start">
              <button onClick={() => onNavigate("privacy")} className="hover:text-black transition-colors">
                Política de Privacidade
              </button>
              <button onClick={() => onNavigate("terms")} className="hover:text-black transition-colors">
                Termos de Uso
              </button>
              <button onClick={() => onNavigate("shipping")} className="hover:text-black transition-colors">
                Trocas e Devoluções
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
