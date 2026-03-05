'use client';

// ─── SWR Provider ─────────────────────────────────────────────────────────────
// Configura o SWR globalmente para toda a app.
// Deve ser adicionado ao layout.tsx, dentro de AuthProvider.
// ──────────────────────────────────────────────────────────────────────────────

import { SWRConfig } from 'swr';

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        // Não revalida no foco por padrão para rotas que não são o carrinho
        // (o useCart sobrepõe isto individualmente com revalidateOnFocus: true)
        revalidateOnFocus: false,
        // Retry automático em caso de erro de rede (máx 3 tentativas)
        errorRetryCount: 3,
        // Deduplica requests com o mesmo key num intervalo de 2s
        dedupingInterval: 2000,
      }}
    >
      {children}
    </SWRConfig>
  );
}