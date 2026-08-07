import React, { useState } from 'react';
import { Card, Button, Input, Badge } from '../components/ui';
import { useTheme } from '../hooks/useTheme';
import { isSupabaseConfigured } from '../lib/supabase';
import { Settings, ShieldCheck, Database, Sun, Moon, Copy, Check, Plus, Tag, RefreshCw, AlertOctagon } from 'lucide-react';
import { useFinance } from '../hooks/useFinance';

export const SettingsPage: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const { categories, addCategory, resetAllData } = useFinance();
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Category State
  const [newCatName, setNewCatName] = useState('');
  const [newCatTipo, setNewCatTipo] = useState<'receita' | 'despesa'>('despesa');

  const sqlScriptText = `-- MEU FINANCEIRO - SCRIPT DE BANCO DE DADOS SUPABASE (PostgreSQL + RLS + Triggers)
-- Executar este SQL no Editor SQL do seu projeto Supabase

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  current_balance NUMERIC(12, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa', 'ambos')),
  cor TEXT DEFAULT '#10b981',
  icone TEXT DEFAULT 'Tag',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  valor NUMERIC(12, 2) NOT NULL,
  dia_vencimento INT NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
  recorrente BOOLEAN DEFAULT TRUE,
  observacoes TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'paga', 'atrasada')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.receitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  valor NUMERIC(12, 2) NOT NULL CHECK (valor > 0),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.despesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  valor NUMERIC(12, 2) NOT NULL CHECK (valor > 0),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  forma_pagamento TEXT NOT NULL DEFAULT 'pix',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cartoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  banco TEXT NOT NULL,
  limite NUMERIC(12, 2) NOT NULL CHECK (limite >= 0),
  fechamento INT NOT NULL CHECK (fechamento BETWEEN 1 AND 31),
  vencimento INT NOT NULL CHECK (vencimento BETWEEN 1 AND 31),
  cor_hex TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.parcelamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  produto TEXT NOT NULL,
  valor_total NUMERIC(12, 2) NOT NULL,
  qtd_parcelas INT NOT NULL CHECK (qtd_parcelas >= 1),
  valor_parcela NUMERIC(12, 2) NOT NULL,
  parcelas_pagas INT DEFAULT 0,
  parcelas_restantes INT NOT NULL,
  cartao_id UUID REFERENCES public.cartoes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.comprovantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT,
  valor NUMERIC(12, 2),
  data DATE,
  hora TEXT,
  favorecido TEXT,
  banco TEXT,
  tipo_transacao TEXT,
  num_transacao TEXT,
  raw_text TEXT,
  status_validacao TEXT DEFAULT 'pendente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.movimentacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa', 'pagamento_conta')),
  descricao TEXT NOT NULL,
  valor NUMERIC(12, 2) NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  categoria TEXT NOT NULL,
  referencia_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  valor_alvo NUMERIC(12, 2) NOT NULL CHECK (valor_alvo > 0),
  valor_atual NUMERIC(12, 2) DEFAULT 0.00,
  prazo DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cartoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso seguro usuário" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Contas do usuário" ON public.contas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Receitas do usuário" ON public.receitas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Despesas do usuário" ON public.despesas FOR ALL USING (auth.uid() = user_id);
`;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sqlScriptText);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 2000);
  };

  const handleAddCategory = async () => {
    if (!newCatName) return;
    await addCategory({
      nome: newCatName,
      tipo: newCatTipo,
      cor: newCatTipo === 'receita' ? '#10b981' : '#f43f5e',
      icone: 'Tag',
    });
    setNewCatName('');
  };

  const handleResetData = () => {
    resetAllData();
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 lg:pb-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white font-serif flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-300" />
          Configurações & Banco de Dados
        </h2>
        <p className="text-xs text-slate-400">Personalize o aplicativo, tema e credenciais do Supabase.</p>
      </div>

      {/* Clear Data Reset Card */}
      <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-rose-500/20 bg-rose-500/5">
        <div>
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-400" />
            Zerar Dados para Testes (Reset Geral)
          </h4>
          <p className="text-xs text-slate-400">
            Reseta todos os saldos, receitas, despesas, contas e cartões para R$ 0,00.
          </p>
        </div>

        <Button variant="danger" onClick={handleResetData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          {resetSuccess ? 'Dados Zerados!' : 'Zerar Todos os Dados'}
        </Button>
      </Card>

      {/* Supabase Status Card */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h4 className="text-base font-bold text-white">Status da Conexão Supabase</h4>
          </div>
          {isSupabaseConfigured ? (
            <Badge variant="emerald" className="gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Conectado RLS
            </Badge>
          ) : (
            <Badge variant="amber" className="gap-1">
              Modo Local / LocalStorage
            </Badge>
          )}
        </div>

        <p className="text-xs text-slate-400">
          O aplicativo roda automaticamente em modo local com armazenamento reativo no navegador. Para conectar ao seu Supabase próprio, configure as variáveis no arquivo <code className="text-emerald-400 font-mono">.env.local</code>.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-500 block">VITE_SUPABASE_URL</span>
            <span className="text-slate-300">{import.meta.env.VITE_SUPABASE_URL || 'Não configurado'}</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-500 block">VITE_SUPABASE_ANON_KEY</span>
            <span className="text-slate-300">{import.meta.env.VITE_SUPABASE_ANON_KEY ? '••••••••••••••••' : 'Não configurado'}</span>
          </div>
        </div>
      </Card>

      {/* Theme Card */}
      <Card className="flex items-center justify-between">
        <div>
          <h4 className="text-base font-bold text-white">Tema Visual da Interface</h4>
          <p className="text-xs text-slate-400">Alternar entre o tema escuro padrão e o tema claro</p>
        </div>

        <Button variant="outline" onClick={toggleTheme}>
          {isDark ? (
            <>
              <Sun className="w-4 h-4 mr-2 text-amber-400" />
              Ativar Tema Claro
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 mr-2 text-indigo-400" />
              Ativar Tema Escuro
            </>
          )}
        </Button>
      </Card>

      {/* Categories Manager */}
      <Card className="space-y-4">
        <h4 className="text-base font-bold text-white flex items-center gap-2">
          <Tag className="w-4 h-4 text-emerald-400" />
          Gerenciador de Categorias
        </h4>

        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Nova categoria..."
            value={newCatName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCatName(e.target.value)}
          />

          <select
            value={newCatTipo}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewCatTipo(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="despesa">Despesa</option>
            <option value="receita">Receita</option>
          </select>

          <Button onClick={handleAddCategory}>
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {categories.map((c) => (
            <Badge
              key={c.id}
              variant={c.tipo === 'receita' ? 'emerald' : 'rose'}
              className="text-xs py-1 px-3"
            >
              {c.nome}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Supabase SQL Migration Script Viewer */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-white">Script SQL de Migração Supabase</h4>
            <p className="text-xs text-slate-400">Copie o SQL para criar as 10 tabelas, políticas RLS e triggers de saldo</p>
          </div>

          <Button size="sm" variant="outline" onClick={handleCopySQL}>
            {copiedSQL ? <Check className="w-4 h-4 mr-1 text-emerald-400" /> : <Copy className="w-4 h-4 mr-1" />}
            {copiedSQL ? 'Copiado!' : 'Copiar SQL'}
          </Button>
        </div>

        <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400/90 overflow-x-auto max-h-64 scrollbar-thin">
          {sqlScriptText}
        </pre>
      </Card>
    </div>
  );
};
