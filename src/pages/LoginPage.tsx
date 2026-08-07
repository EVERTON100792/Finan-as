import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Input, Button } from '../components/ui';
import { Sparkles, Cloud, Lock, Mail, ShieldCheck, HeartHandshake, Eye, EyeOff, ArrowRight } from 'lucide-react';

const ALLOWED_EMAILS = [
  'vanessafigueiredodecastro@gmail.com',
  'luismouraeverton@gmail.com',
];

export const LoginPage: React.FC = () => {
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    if (!ALLOWED_EMAILS.includes(cleanEmail)) {
      setErrorMessage('Acesso negado. Este sistema é privado e exclusivo para Everton e Vanessa.');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await signIn(cleanEmail, password);
      if (error) {
        setErrorMessage(
          error.message.includes('Invalid login credentials')
            ? 'E-mail ou senha incorretos. Verifique seus dados.'
            : error.message
        );
      }
    } catch (err: any) {
      setErrorMessage('Ocorreu um erro ao processar o login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-950 text-slate-100 font-sans p-4">
      {/* Dynamic Celestial Background Gradients & Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/70 to-sky-950/90 pointer-events-none" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/3 -left-20 w-[400px] h-[400px] bg-amber-400/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-[500px] h-[500px] bg-teal-400/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Floating Animated Clouds & Celestial Elements */}
      <div className="absolute top-12 left-10 opacity-20 animate-pulse pointer-events-none">
        <Cloud className="w-24 h-24 text-sky-200 filter blur-xs" />
      </div>
      <div className="absolute top-20 right-16 opacity-25 animate-pulse pointer-events-none delay-1000">
        <Cloud className="w-32 h-32 text-indigo-100 filter blur-xs" />
      </div>
      <div className="absolute bottom-20 left-1/4 opacity-15 pointer-events-none">
        <Cloud className="w-40 h-40 text-teal-100 filter blur-sm" />
      </div>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md bg-slate-900/90 border border-slate-700/60 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-xl p-6 sm:p-8 space-y-6 glass-card">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-sky-400 text-slate-950 shadow-xl shadow-emerald-500/25 mb-1">
            <HeartHandshake className="w-9 h-9 stroke-[2.2]" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-serif">
            Segura Na Mão de Deus
          </h1>
          <p className="text-xs text-emerald-400 font-medium tracking-wide uppercase flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Controle Financeiro da Família
          </p>
        </div>

        {/* Security Lock Badge */}
        <div className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 font-semibold text-center">
          <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Portal Exclusivo • Everton & Vanessa</span>
        </div>

        {/* Feedback Badge */}
        {errorMessage && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs animate-fade-in text-center font-medium">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="Seu E-mail *"
            placeholder="seuemail@gmail.com"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4 text-slate-400" />}
            required
          />

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">Sua Senha *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all mt-2"
          >
            Entrar no Sistema
            <ArrowRight className="w-4 h-4 ml-2 inline" />
          </Button>
        </form>

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-800/80 text-center space-y-1">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Cadastros Externos Bloqueados para Segurança
          </p>
          <p className="text-[10px] text-slate-500">
            Sincronização Nuvem Supabase Ativa em Tempo Real.
          </p>
        </div>
      </div>
    </div>
  );
};
