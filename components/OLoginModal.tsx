'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { X, Eye, EyeOff } from 'lucide-react';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const { login, register } = useAuth();

    // Campos do formulário
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    // Estado da interface para controlar qual aba está ativa (login ou registro)
    const [isLoginView, setIsLoginView] = useState(true);

    // Estados de UI
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    
    const resetForm = () => {
        setEmail('');
        setPassword('');
        setFirstName('');
        setLastName('');
        setError(null);
        setShowPassword(false);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (isLoginView) {
                await login(email, password);
            } else {
                await register(firstName, lastName, email, password);
            }
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao fazer login');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 z-40 bg-black/20"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                <div className="w-full max-w-md bg-white rounded-lg shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-black/10 p-6">
                        <h2 className="text-lg tracking-wide text-black">FAZER LOGIN</h2>
                        <button
                            onClick={onClose}
                            className="text-black/60 hover:text-black transition-colors"
                        >
                            <X size={20} strokeWidth={1.5} />
                        </button>
                    </div>

                    {/* Content */}
                    <form onSubmit={handleSubmit} className="space-y-6 p-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded p-4">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-xs tracking-wide text-black mb-2">
                                EMAIL
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full border border-black/10 px-4 py-3 text-sm text-black focus:border-black focus:outline-none transition-colors"
                                placeholder="seu@email.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-xs tracking-wide text-black mb-2">
                                SENHA
                            </label>
                            <div className="flex items-center gap-2 w-full">
                                <input
                                    id="password"
                                    // O tipo muda dinamicamente
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="flex-1 border border-black/10 px-4 py-3 text-sm text-black focus:border-black focus:outline-none transition-colors"
                                    placeholder="••••••••"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="p-3 border border-black/10 text-gray-500 hover:text-black hover:bg-gray-50 focus:outline-none focus:border-black transition-colors flex items-center justify-center"
                                    aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} /> // Ícone de olho cortado
                                    ) : (
                                        <Eye size={20} />    // Ícone de olho aberto
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-black text-white px-8 py-4 text-sm tracking-wide hover:bg-black/90 transition-colors disabled:bg-black/50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'ENTRANDO...' : 'ENTRAR'}
                        </button>

                        <p className="text-xs text-center text-black/60">
                            Ainda não tem conta?{' '}
                            <a
                                href={`${process.env.NEXT_PUBLIC_WP_URL}/minha-conta/`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-black hover:underline"
                            >
                                Criar conta no WordPress
                            </a>
                        </p>
                    </form>
                </div>
            </div>
        </>
    );
}
