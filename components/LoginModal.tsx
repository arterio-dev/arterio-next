'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { X, Eye, EyeOff } from 'lucide-react';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
    // Agora desestruturamos também a função register do contexto
    const { login, register } = useAuth();
    
    // Estado para controlar qual aba está ativa
    const [isLoginView, setIsLoginView] = useState(true);
    
    // Campos do formulário
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // Estados de UI
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Limpar o formulário quando o modal fecha ou troca de aba
    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen, isLoginView]);

    const resetForm = () => {
        setFirstName('');
        setLastName('');
        setEmail('');
        setPassword('');
        setError(null);
        setShowPassword(false);
    };

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
            onClose(); // Fecha o modal após sucesso
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocorreu um erro inesperado.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-md bg-white p-6 sm:p-8 shadow-xl">
                {/* Botão Fechar */}
                <button 
                    onClick={onClose}
                    className="absolute right-4 top-4 text-black/40 hover:text-black transition-colors"
                >
                    <X size={24} strokeWidth={1.5} />
                </button>

                {/* Cabeçalho / Abas */}
                <div className="flex gap-6 mb-8 border-b border-black/10">
                    <button
                        onClick={() => setIsLoginView(true)}
                        className={`pb-3 text-sm tracking-wide transition-colors relative ${
                            isLoginView 
                                ? 'text-black font-medium' 
                                : 'text-black/40 hover:text-black/70'
                        }`}
                    >
                        ENTRAR
                        {isLoginView && (
                            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-black" />
                        )}
                    </button>
                    <button
                        onClick={() => setIsLoginView(false)}
                        className={`pb-3 text-sm tracking-wide transition-colors relative ${
                            !isLoginView 
                                ? 'text-black font-medium' 
                                : 'text-black/40 hover:text-black/70'
                        }`}
                    >
                        CRIAR CONTA
                        {!isLoginView && (
                            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-black" />
                        )}
                    </button>
                </div>

                {/* Mensagem de Erro */}
                {error && (
                    <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Campos extras para Criação de Conta */}
                    {!isLoginView && (
                        <div className="flex gap-4">
                            <div className="flex-1 space-y-1">
                                <label className="text-xs tracking-wide text-black/60">NOME</label>
                                <input
                                    type="text"
                                    required
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full border border-black/20 p-3 text-sm focus:border-black outline-none transition-colors"
                                />
                            </div>
                            <div className="flex-1 space-y-1">
                                <label className="text-xs tracking-wide text-black/60">SOBRENOME</label>
                                <input
                                    type="text"
                                    required
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full border border-black/20 p-3 text-sm focus:border-black outline-none transition-colors"
                                />
                            </div>
                        </div>
                    )}

                    {/* Campos Comuns (Email e Senha) */}
                    <div className="space-y-1">
                        <label className="text-xs tracking-wide text-black/60">E-MAIL</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-black/20 p-3 text-sm focus:border-black outline-none transition-colors"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs tracking-wide text-black/60">SENHA</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full border border-black/20 p-3 text-sm focus:border-black outline-none transition-colors pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff size={18} strokeWidth={1.5} />
                                ) : (
                                    <Eye size={18} strokeWidth={1.5} />
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-black text-white p-4 text-sm tracking-wide mt-4 hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading 
                            ? (isLoginView ? 'ENTRANDO...' : 'CRIANDO...') 
                            : (isLoginView ? 'ENTRAR' : 'CRIAR CONTA')}
                    </button>
                </form>
            </div>
        </div>
    );
}