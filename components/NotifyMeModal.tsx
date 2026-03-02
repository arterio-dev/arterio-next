'use client';

import { useState } from "react";
import { X } from "lucide-react";

interface NotifyMeModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
}

export function NotifyMeModal({ isOpen, onClose, productName }: NotifyMeModalProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      onClose();
      setEmail("");
      setSubmitted(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-md bg-white p-12">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-black/40 hover:text-black transition-colors"
        >
          <X size={20} strokeWidth={1.5} />
        </button>

        {!submitted ? (
          <>
            <h3 className="mb-2 text-xl tracking-tight text-black">Avise-me</h3>
            <p className="mb-8 text-sm text-black/60">
              Receba uma notificação quando {productName} estiver disponível
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Endereço de e-mail"
                  required
                  className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-sm text-black placeholder:text-black/40 focus:border-black focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-black py-4 text-sm tracking-wide text-white hover:bg-black/90 transition-colors"
              >
                AVISE-ME
              </button>
            </form>
          </>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-black">Você será notificado quando estiver disponível.</p>
          </div>
        )}
      </div>
    </div>
  );
}
