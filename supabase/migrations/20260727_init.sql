-- ==============================================================================
-- SCRIPT DE MIGRAÇÃO SUPABASE - MEU FINANCEIRO
-- Banco de Dados PostgreSQL com Row Level Security (RLS) e Triggers Automáticos
-- ==============================================================================

-- 1. TABELA PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  current_balance NUMERIC(12, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA CATEGORIAS
CREATE TABLE IF NOT EXISTS public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa', 'ambos')),
  cor TEXT DEFAULT '#10b981',
  icone TEXT DEFAULT 'Tag',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA CONTAS (Contas Fixas / Recorrentes / A Pagar)
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

-- 4. TABELA RECEITAS
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

-- 5. TABELA DESPESAS
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

-- 6. TABELA CARTOES DE CRÉDITO
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

-- 7. TABELA PARCELAMENTOS
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

-- 8. TABELA COMPROVANTES (OCR)
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
  status_validacao TEXT DEFAULT 'pendente' CHECK (status_validacao IN ('pendente', 'confirmado', 'rejeitado')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABELA MOVIMENTACOES (Extrato Geral)
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

-- 10. TABELA METAS
CREATE TABLE IF NOT EXISTS public.metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  valor_alvo NUMERIC(12, 2) NOT NULL CHECK (valor_alvo > 0),
  valor_atual NUMERIC(12, 2) DEFAULT 0.00,
  prazo DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cartoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcelamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comprovantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;

-- Politicas RLS para profiles
CREATE POLICY "Profiles do próprio usuário" ON public.profiles FOR ALL USING (auth.uid() = id);

-- Politicas genéricas para tabelas associadas a user_id
CREATE POLICY "Categorias próprias" ON public.categorias FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Contas próprias" ON public.contas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Receitas próprias" ON public.receitas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Despesas próprias" ON public.despesas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Cartoes próprios" ON public.cartoes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Parcelamentos próprios" ON public.parcelamentos FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Comprovantes próprios" ON public.comprovantes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Movimentacoes próprias" ON public.movimentacoes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Metas próprias" ON public.metas FOR ALL USING (auth.uid() = user_id);

-- ==============================================================================
-- ÍNDICES DE PERFORMANCE
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_receitas_user_data ON public.receitas(user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_despesas_user_data ON public.despesas(user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_contas_user_status ON public.contas(user_id, status);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_user_data ON public.movimentacoes(user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_comprovantes_user ON public.comprovantes(user_id);

-- ==============================================================================
-- TRIGGERS E FUNÇÕES AUTOMÁTICAS PARA SALDO
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.recalculate_user_balance()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  total_rec NUMERIC(12, 2);
  total_desp NUMERIC(12, 2);
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_user_id := OLD.user_id;
  ELSE
    target_user_id := NEW.user_id;
  END IF;

  SELECT COALESCE(SUM(valor), 0) INTO total_rec FROM public.receitas WHERE user_id = target_user_id;
  SELECT COALESCE(SUM(valor), 0) INTO total_desp FROM public.despesas WHERE user_id = target_user_id;

  UPDATE public.profiles
  SET current_balance = (total_rec - total_desp),
      updated_at = NOW()
  WHERE id = target_user_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers em Receitas
DROP TRIGGER IF EXISTS trigger_recalculate_balance_receitas ON public.receitas;
CREATE TRIGGER trigger_recalculate_balance_receitas
AFTER INSERT OR UPDATE OR DELETE ON public.receitas
FOR EACH ROW EXECUTE FUNCTION public.recalculate_user_balance();

-- Triggers em Despesas
DROP TRIGGER IF EXISTS trigger_recalculate_balance_despesas ON public.despesas;
CREATE TRIGGER trigger_recalculate_balance_despesas
AFTER INSERT OR UPDATE OR DELETE ON public.despesas
FOR EACH ROW EXECUTE FUNCTION public.recalculate_user_balance();

-- Trigger para auto-criar perfil quando um novo usuário se cadastrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, current_balance)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url', 0.00)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
