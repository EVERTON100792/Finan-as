export type TransactionType = 'receita' | 'despesa' | 'pagamento_conta';
export type PaymentMethod = 'pix' | 'credito' | 'debito' | 'dinheiro' | 'boleto' | 'transferencia';
export type BillStatus = 'pendente' | 'paga' | 'atrasada';
export type OCRStatus = 'pendente' | 'confirmado' | 'rejeitado';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  current_balance: number;
  created_at: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  user_id: string;
  nome: string;
  tipo: 'receita' | 'despesa' | 'ambos';
  cor: string;
  icone: string;
  created_at: string;
}

export interface Bill {
  id: string;
  user_id: string;
  nome: string;
  categoria: string;
  valor: number;
  dia_vencimento: number;
  recorrente: boolean;
  observacoes?: string;
  status: BillStatus;
  created_at: string;
}

export interface Recipe {
  id: string;
  user_id: string;
  descricao: string;
  categoria: string;
  valor: number;
  data: string; // YYYY-MM-DD
  observacoes?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  descricao: string;
  categoria: string;
  valor: number;
  data: string; // YYYY-MM-DD
  forma_pagamento: PaymentMethod;
  observacoes?: string;
  status?: BillStatus;
  created_at: string;
}

export interface CreditCard {
  id: string;
  user_id: string;
  nome: string;
  banco: string;
  limite: number;
  fechamento: number; // Dia de fechamento (1-31)
  vencimento: number; // Dia de vencimento (1-31)
  cor_hex: string;
  created_at: string;
}

export interface Installment {
  id: string;
  user_id: string;
  produto: string;
  valor_total: number;
  qtd_parcelas: number;
  valor_parcela: number;
  parcelas_pagas: number;
  parcelas_restantes: number;
  cartao_id?: string;
  created_at: string;
}

export interface Receipt {
  id: string;
  user_id: string;
  url?: string;
  valor?: number;
  data?: string;
  hora?: string;
  favorecido?: string;
  banco?: string;
  tipo_transacao?: string;
  num_transacao?: string;
  raw_text?: string;
  status_validacao: OCRStatus;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  tipo: TransactionType;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  referencia_id?: string;
  created_at: string;
}

export interface FinancialGoal {
  id: string;
  user_id: string;
  titulo: string;
  valor_alvo: number;
  valor_atual: number;
  prazo?: string;
  created_at: string;
}

export interface OCRParseResult {
  valor?: number;
  data?: string;
  hora?: string;
  favorecido?: string;
  banco?: string;
  tipo_transacao?: string;
  num_transacao?: string;
  categoria_sugerida?: string;
  raw_text: string;
  confidence: number;
}

export interface DashboardStats {
  saldoAtual: number;
  receitasMes: number;
  despesasMes: number;
  saldoPrevisto: number;
  contasPendentesValor: number;
  contasPendentesQtd: number;
  contasPagasValor: number;
  contasPagasQtd: number;
  proximosVencimentos: Bill[];
  ultimosPagamentos: Transaction[];
  despesasPorCategoria: Record<string, number>;
  receitasPorCategoria: Record<string, number>;
}
