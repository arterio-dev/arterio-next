'use client';

import { useMemo } from "react";
import { useCategories } from "@/hooks/useCategories";
import { getWhatsAppLink, STORE_INFO } from "@/app/config/store";

export function About() {
  const { categories } = useCategories();

  const handleClick = () => {
    window.open(getWhatsAppLink(), "_blank");
  }

  const hierarchicalCategories = useMemo(() => {
    if (!categories.length) return [];

    const parents = categories.filter(c => !c.parent || c.parent === 0);
    return parents.map(parent => ({
      id: parent.id,
      name: parent.name,
      subcategories: categories.filter(c => c.parent === parent.id)
    })).filter(cat => cat.name !== "Uncategorized");
  }, [categories]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-24">
      {/* Hero Section */}
      <div className="mb-24">
        <h1 className="mb-6 text-5xl tracking-tight text-black">
          Sobre a {STORE_INFO.name}
        </h1>
        <p className="text-xl leading-relaxed text-black/60">
          Fornecendo suprimentos essenciais com excelência desde o início.
        </p>
      </div>

      {/* Story Section */}
      <section className="mb-24 space-y-6">
        <h2 className="mb-6 text-sm tracking-wide text-black/40">
          NOSSA HISTÓRIA
        </h2>
        <p className="text-lg leading-relaxed text-black/80">
          A {STORE_INFO.name} nasceu com o propósito de simplificar o acesso a suprimentos
          de qualidade. O que começou como um fornecedor especializado em produção
          audiovisual evoluiu para uma loja completa de suprimentos gerais, atendendo
          às necessidades mais diversas de profissionais e empresas.
        </p>
        <p className="text-lg leading-relaxed text-black/80">
          Nossa missão é clara: oferecer produtos essenciais com agilidade,
          transparência e sem complicações. Acreditamos que simplicidade e
          eficiência são fundamentais em cada transação.
        </p>
      </section>

      {/* Values Section */}
      <section className="mb-24">
        <h2 className="mb-12 text-sm tracking-wide text-black/40">
          NOSSOS VALORES
        </h2>
        <div className="grid gap-12 md:grid-cols-3">
          <div className="space-y-3">
            <h3 className="text-lg tracking-tight text-black">
              Simplicidade
            </h3>
            <p className="text-sm leading-relaxed text-black/60">
              Design limpo, navegação intuitiva e processos diretos.
              Sem complicações desnecessárias.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-lg tracking-tight text-black">
              Qualidade
            </h3>
            <p className="text-sm leading-relaxed text-black/60">
              Produtos selecionados de marcas confiáveis que
              atendem aos mais altos padrões.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-lg tracking-tight text-black">
              Agilidade
            </h3>
            <p className="text-sm leading-relaxed text-black/60">
              Resposta rápida, entregas eficientes e atendimento
              personalizado via WhatsApp.
            </p>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="mb-24">
        <h2 className="mb-12 text-sm tracking-wide text-black/40">
          NOSSAS CATEGORIAS
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {hierarchicalCategories.map((category) => (
            <div
              key={category.id}
              className="border border-black/10 p-6 hover:border-black/30 transition-colors"
            >
              <p className="text-sm tracking-wide text-black/80">
                {category.name}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="border-t border-black/10 pt-16">
        <div className="text-center space-y-6">
          <h2 className="text-2xl tracking-tight text-black">
            Tem dúvidas sobre nossos produtos?
          </h2>
          <p className="text-sm text-black/60">
            Entre em contato via WhatsApp para atendimento personalizado.
          </p>
          <button onClick={handleClick} className="mt-4 inline-block border border-black px-8 py-3 text-sm tracking-wide text-black hover:bg-black hover:text-white transition-colors">
            FALAR NO WHATSAPP
          </button>
        </div>
      </section>
    </main>
  );
}
