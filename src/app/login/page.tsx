"use client";

import React, { useState } from "react";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile
} from "firebase/auth";
import { app } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus, Mail, Lock, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const auth = getAuth(app);

export default function LoginPage() {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (isRegister) {
                const result = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(result.user, { displayName: name });
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            router.push("/");
        } catch (err: any) {
            console.error(err);
            setError("Falha na autenticação. Verifique suas credenciais.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-background to-background">
            <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-xl shadow-primary/20">
                        <span className="text-3xl font-black text-background">F</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Financeiro Pro</h1>
                    <p className="text-slate-500 font-medium">Controle total na palma da sua mão</p>
                </div>

                <div className="glass p-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                    <form onSubmit={handleAuth} className="space-y-5">
                        <h2 className="text-xl font-bold text-white mb-6 text-center">
                            {isRegister ? "Criar Nova Conta" : "Acessar Sistema"}
                        </h2>

                        {error && (
                            <div className="bg-danger/10 border border-danger/20 text-danger text-xs p-4 rounded-xl font-bold text-center">
                                {error}
                            </div>
                        )}

                        {isRegister && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        required
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-black/40 border border-card-border rounded-xl px-12 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-medium"
                                        placeholder="Seu nome"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Endereço de E-mail</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-black/40 border border-card-border rounded-xl px-12 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    placeholder="exemplo@email.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Senha de Acesso</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    required
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/40 border border-card-border rounded-xl px-12 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-primary text-background rounded-xl font-black uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                            ) : (
                                <>
                                    {isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
                                    {isRegister ? "Registrar" : "Entrar Agora"}
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <button
                            onClick={() => setIsRegister(!isRegister)}
                            className="text-xs text-slate-400 hover:text-primary transition-colors font-bold uppercase tracking-wider"
                        >
                            {isRegister ? "Já possui conta? Faça Login" : "Ainda não tem conta? Clique aqui"}
                        </button>
                    </div>
                </div>

                <p className="mt-8 text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                    Financeiro Pro &copy; 2026 - All Rights Reserved
                </p>
            </div>
        </div>
    );
}
