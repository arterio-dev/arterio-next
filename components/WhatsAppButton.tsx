'use client';

import { MessageCircle } from "lucide-react";

export function WhatsAppButton() {
  const handleClick = () => {
    window.open("https://wa.me/5511999999999", "_blank");
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-8 right-8 z-40 flex h-14 w-14 items-center justify-center bg-black text-white shadow-lg hover:bg-black/90 transition-all hover:scale-105"
      aria-label="Fale conosco pelo WhatsApp"
    >
      <MessageCircle size={24} strokeWidth={1.5} />
    </button>
  );
}
