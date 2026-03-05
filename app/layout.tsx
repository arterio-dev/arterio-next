import type { Metadata } from "next";
import { AuthProvider } from "@/app/providers/AuthProvider";
import "./globals.css";
import { SWRProvider } from "./providers/SWRProvider";

export const metadata: Metadata = {
  title: "Arterio - Equipamentos para Produção Audiovisual",
  description: "Soluções completas em materiais técnicos e suprimentos profissionais para cinema, TV e fotografia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-white text-black">
        <SWRProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </SWRProvider>
      </body >
    </html >
  );
}
