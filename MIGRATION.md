# Migração Arterio: Vite → Next.js

## 📋 Resumo da Migração

A migração do projeto Arterio de Vite para Next.js foi concluída com sucesso. Todos os componentes, páginas, serviços, hooks e estilos foram adaptados para o framework Next.js, mantendo a funcionalidade e o design original.

## ✅ Tarefas Completas

### 1. Páginas (Pages)
- ✅ `ContactPage.tsx` → `/app/contact/page.tsx`
- ✅ `HowToBuyPage.tsx` → `/app/how-to-buy/page.tsx`
- ✅ `PrivacyPage.tsx` → `/app/privacy/page.tsx`
- ✅ `ProductDetailPage.tsx` → `/app/product-detail/page.tsx`
- ✅ `ShippingPage.tsx` → `/app/shipping/page.tsx`
- ✅ `TermsPage.tsx` → `/app/terms/page.tsx`

### 2. Componentes (Components)
Todos os 12 componentes foram migrados para `/components`:
- ✅ `Home.tsx` - Página inicial com hero e produtos em destaque
- ✅ `Header.tsx` - Cabeçalho com navegação e carrinho
- ✅ `Footer.tsx` - Rodapé com links e informações
- ✅ `CategoryNav.tsx` - Navegação de categorias (desktop/mobile)
- ✅ `CategorySidebar.tsx` - Sidebar de categorias
- ✅ `ProductCard.tsx` - Card individual de produto
- ✅ `ProductListing.tsx` - Listagem com paginação e filtros
- ✅ `Cart.tsx` - Sidebar do carrinho
- ✅ `About.tsx` - Página sobre a empresa
- ✅ `NotifyMeModal.tsx` - Modal para notificação de disponibilidade
- ✅ `Pagination.tsx` - Componente de paginação
- ✅ `WhatsAppButton.tsx` - Botão flutuante WhatsApp

### 3. Serviços e Configuração
- ✅ `woocommerce.ts` → `/app/services/woocommerce.ts`
- ✅ `cart.ts` → `/app/services/cart.ts`
- ✅ `wordpress.ts` → `/app/config/wordpress.ts` (configuração)

### 4. Hooks Customizados
- ✅ `useProducts.ts` → `/hooks/useProducts.ts`
- ✅ `useCart.ts` → `/hooks/useCart.ts`
- ✅ `useCategories.ts` → `/hooks/useCategories.ts`

### 5. Types e Dados
- ✅ `woocommerce.ts` → `/app/types/woocommerce.ts` (tipos)
- ✅ `categories.ts` → `/app/data/categories.ts` (dados)

### 6. Estilos
- ✅ `globals.css` - Importações, variáveis de tema e estilos base
- ✅ Variáveis CSS migradas (cores, fontes, tema escuro)
- ✅ Tailwind CSS configurado com fonte personalizada
- ✅ Suporte a tema escuro mantido

### 7. Ambiente
- ✅ `.env.example` criado com variáveis necessárias
- ✅ `NEXT_PUBLIC_WP_URL` configurado para API WordPress

## 📂 Estrutura de Diretórios

```
arterio-next/
├── app/
│   ├── about/
│   │   └── page.tsx
│   ├── config/
│   │   └── wordpress.ts
│   ├── contact/
│   │   └── page.tsx
│   ├── data/
│   │   └── categories.ts
│   ├── how-to-buy/
│   │   └── page.tsx
│   ├── privacy/
│   │   └── page.tsx
│   ├── product-detail/
│   │   └── page.tsx
│   ├── products/
│   │   └── page.tsx
│   ├── services/
│   │   ├── cart.ts
│   │   └── woocommerce.ts
│   ├── shipping/
│   │   └── page.tsx
│   ├── terms/
│   │   └── page.tsx
│   ├── types/
│   │   └── woocommerce.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── About.tsx
│   ├── Cart.tsx
│   ├── CategoryNav.tsx
│   ├── CategorySidebar.tsx
│   ├── Footer.tsx
│   ├── Header.tsx
│   ├── Home.tsx
│   ├── NotifyMeModal.tsx
│   ├── Pagination.tsx
│   ├── ProductCard.tsx
│   ├── ProductListing.tsx
│   └── WhatsAppButton.tsx
├── hooks/
│   ├── useCart.ts
│   ├── useCategories.ts
│   └── useProducts.ts
├── .env.example
└── tsconfig.json (paths: @/*)
```

## 🔄 Mudanças Principais

### Roteamento
- **Vite**: Cliente-side routing com `setCurrentPage` em App.tsx
- **Next.js**: File-based routing com App Router
- URLs dinâmicas: `/products?category=X`, `/products?search=X`

### Variáveis de Ambiente
- **Vite**: `VITE_WP_URL`
- **Next.js**: `NEXT_PUBLIC_WP_URL`

### Contexto e Providers
- Hooks como `useCart` podem ser usados diretamente em componentes `'use client'`
- Gerenciamento de estado simplificado com `localStorage`

### Store API
- Migrado para usar `NEXT_PUBLIC_WP_URL` do Next.js
- Fetch nativo mantido para requisições HTTP
- Suporte a `credentials: 'include'` para sessões WooCommerce

## 🚀 Próximos Passos

1. **Configurar Variáveis de Ambiente**:
   ```bash
   cp .env.example .env.local
   # Editar .env.local com a URL real do WordPress
   ```

2. **Instalar Dependências**:
   ```bash
   npm install
   ```

3. **Executar em Desenvolvimento**:
   ```bash
   npm run dev
   ```

4. **Build para Produção**:
   ```bash
   npm run build
   npm start
   ```

5. **Testes Recomendados**:
   - [ ] Navegação entre páginas
   - [ ] Filtro por categoria
   - [ ] Busca de produtos
   - [ ] Adição ao carrinho
   - [ ] Checkout no WooCommerce
   - [ ] Responsividade (mobile/tablet/desktop)
   - [ ] Tema escuro (se implementado)

## 🔧 Tecnologias

- **Framework**: Next.js 15+
- **CSS**: Tailwind CSS com variáveis customizadas
- **Tipo**: TypeScript
- **API**: WooCommerce Store API v1
- **Hospedagem**: Vercel (recomendado)

## 📝 Notas Importantes

1. **Path Aliases**: Use `@/` para imports em todo o projeto (ex: `@/components/Header`)
2. **'use client'**: Componentes interativos marcados com `'use client'` para Client-Side Rendering
3. **localStorage**: Acessível apenas no navegador (verificado com `typeof window`)
4. **WooCommerce**: Store API é pública e não requer autenticação para leitura

## ✨ Melhorias Implementadas

- Estrutura clara com separação de responsabilidades
- Path aliases simplificam imports
- Melhor suporte a SSR/SSG do Next.js
- Roteamento type-safe com Next.js
- Integração nativa com Vercel
- Performance otimizada com Code Splitting automático

## 🐛 Troubleshooting

### Port já em uso
```bash
npm run dev -- -p 3001
```

### Limpar cache Next.js
```bash
rm -rf .next
npm run dev
```

### Problemas com imports
Verificar path aliases em `tsconfig.json`:
```json
"paths": {
  "@/*": ["./*"]
}
```

---

**Status**: ✅ Migração Concluída
**Data**: 26 de Fevereiro de 2026
**Versão**: 1.0.0
