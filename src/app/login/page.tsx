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
        <div className="dark">
            <div className="min-h-screen flex items-center justify-center bg-background p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-background to-background text-foreground">
                <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-xl shadow-primary/20">
                            <span className="text-3xl font-black text-background">F</span>
                        </div>
                        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Financeiro Pro</h1>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] opacity-80">Controle total na palma da sua mão</p>
                    </div>

                    <div className="glass p-8 relative overflow-hidden shadow-2xl shadow-black/50 border-white/10">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                        <form onSubmit={handleAuth} className="space-y-6">
                            <h2 className="text-xl font-black text-white mb-8 text-center uppercase tracking-widest">
                                {isRegister ? "Criar Nova Conta" : "Acessar Sistema"}
                            </h2>

                            {error && (
                                <div className="bg-danger/10 border border-danger/20 text-danger text-[10px] p-4 rounded-xl font-black text-center uppercase tracking-widest animate-shake">
                                    {error}
                                </div>
                            )}

                            {isRegister && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Nome Completo</label>
                                    <div className="relative group">
                                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                                        <input
                                            required
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-12 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold placeholder:text-slate-600 shadow-inner"
                                            placeholder="Seu nome completo"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Endereço de E-mail</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                                    <input
                                        required
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-12 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold placeholder:text-slate-600 shadow-inner"
                                        placeholder="exemplo@email.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Senha de Acesso</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                                    <input
                                        required
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-12 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold placeholder:text-slate-600 shadow-inner"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-primary text-background rounded-xl font-black uppercase tracking-[0.2em] text-xs hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                                ) : (
                                    <>
                                        {isRegister ? <UserPlus size={18} strokeWidth={3} /> : <LogIn size={18} strokeWidth={3} />}
                                        {isRegister ? "Registrar Agora" : "Entrar Agora"}
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-10 pt-6 border-t border-white/5 text-center">
                            <button
                                onClick={() => setIsRegister(!isRegister)}
                                className="text-[10px] text-slate-500 hover:text-white transition-colors font-black uppercase tracking-[0.2em]"
                            >
                                {isRegister ? (
                                    <>Já possui conta? <span className="text-primary">Faça Login</span></>
                                ) : (
                                    <>Ainda não tem conta? <span className="text-primary">Clique aqui</span></>
                                )}
                            </button>
                        </div>
                    </div>

                    <p className="mt-12 text-center text-[9px] text-slate-600 font-black uppercase tracking-[0.3em] opacity-50">
                        Financeiro Pro &copy; 2026 - Secure Banking Standard
                    </p>
                </div>
            </div>
        </div>
    );
}
