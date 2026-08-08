import { createClient } from '@supabase/supabase-js';
import { 
  UserProfile, Category, Bill, Recipe, Expense, CreditCard, 
  Installment, Receipt, Transaction, FinancialGoal, DashboardStats, BillStatus 
} from '../types';
import { generateId, getTodayString } from './utils';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Default categories remain for convenience
const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', user_id: 'default-user', nome: 'Salário', tipo: 'receita', cor: '#10b981', icone: 'Briefcase', created_at: new Date().toISOString() },
  { id: 'cat-2', user_id: 'default-user', nome: 'Investimentos', tipo: 'receita', cor: '#06b6d4', icone: 'TrendingUp', created_at: new Date().toISOString() },
  { id: 'cat-3', user_id: 'default-user', nome: 'Freelance / Vendas', tipo: 'receita', cor: '#8b5cf6', icone: 'DollarSign', created_at: new Date().toISOString() },
  { id: 'cat-4', user_id: 'default-user', nome: 'Moradia / Aluguel', tipo: 'despesa', cor: '#ef4444', icone: 'Home', created_at: new Date().toISOString() },
  { id: 'cat-5', user_id: 'default-user', nome: 'Alimentação / Mercado', tipo: 'despesa', cor: '#f59e0b', icone: 'ShoppingCart', created_at: new Date().toISOString() },
  { id: 'cat-6', user_id: 'default-user', nome: 'Transporte', tipo: 'despesa', cor: '#3b82f6', icone: 'Car', created_at: new Date().toISOString() },
  { id: 'cat-7', user_id: 'default-user', nome: 'Saúde & Cuidados', tipo: 'despesa', cor: '#ec4899', icone: 'HeartPulse', created_at: new Date().toISOString() },
  { id: 'cat-8', user_id: 'default-user', nome: 'Lazer & Entretenimento', tipo: 'despesa', cor: '#a855f7', icone: 'Smile', created_at: new Date().toISOString() },
  { id: 'cat-9', user_id: 'default-user', nome: 'Educação', tipo: 'despesa', cor: '#14b8a6', icone: 'GraduationCap', created_at: new Date().toISOString() },
];

const INITIAL_PROFILE: UserProfile = {
  id: 'default-user',
  email: 'usuario@meufinanceiro.com',
  full_name: 'Usuário',
  avatar_url: '',
  current_balance: 0.00,
  created_at: new Date().toISOString(),
};

// Direct Supabase Cloud Finance Engine
class LocalFinanceEngine {
  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(`meu_financeiro_${key}`);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`meu_financeiro_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error('Erro ao salvar no localStorage', e);
    }
  }

  private async getUserId(): Promise<string> {
    if (!supabase) return 'default-user';
    try {
      const { data } = await supabase.auth.getSession();
      return data?.session?.user?.id || 'default-user';
    } catch {
      return 'default-user';
    }
  }

  async syncCloudData(): Promise<void> {
    try {
      if (!supabase) return;
      const userId = await this.getUserId();
      if (userId === 'default-user') return;

      const [
        { data: recipes, error: errRec },
        { data: expenses, error: errExp },
        { data: bills, error: errBills },
        { data: cards, error: errCards },
        { data: installments, error: errInst },
        { data: transactions, error: errTx },
        { data: goals, error: errGoals },
        { data: categories, error: errCat },
        { data: profile },
      ] = await Promise.all([
        supabase.from('recipes').select('*').order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').order('created_at', { ascending: false }),
        supabase.from('bills').select('*').order('created_at', { ascending: false }),
        supabase.from('cards').select('*').order('created_at', { ascending: false }),
        supabase.from('installments').select('*').order('created_at', { ascending: false }),
        supabase.from('transactions').select('*').order('created_at', { ascending: false }),
        supabase.from('goals').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      ]);

      if (!errRec && recipes) this.setItem('recipes', recipes);
      if (!errTx && transactions) this.setItem('transactions', transactions);
      if (!errExp && expenses) {
        const cleanExp = expenses.map((e: any) => ({
          ...e,
          status: e.status || (e.observacoes?.toLowerCase().includes('comprovante ocr') ? 'paga' : 'pendente'),
        }));
        this.setItem('expenses', cleanExp);
      }
      if (!errBills && bills) this.setItem('bills', bills);
      if (!errCards && cards) this.setItem('cards', cards);
      if (!errInst && installments) this.setItem('installments', installments);
      if (!errGoals && goals) this.setItem('goals', goals);
      if (!errCat && categories && categories.length > 0) this.setItem('categories', categories);
      if (profile) this.setItem('profile', profile);

      this.recalculateBalance();
    } catch (e) {
      console.error('Erro ao sincronizar dados da nuvem Supabase:', e);
    }
  }

  clearAllData(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('meu_financeiro_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      this.setItem('profile', INITIAL_PROFILE);
      this.setItem('recipes', []);
      this.setItem('expenses', []);
      this.setItem('bills', []);
      this.setItem('cards', []);
      this.setItem('installments', []);
      this.setItem('transactions', []);
      this.setItem('goals', []);
    } catch (e) {
      console.error('Erro ao zerar dados:', e);
    }
  }

  getProfile(): UserProfile {
    return this.getItem<UserProfile>('profile', INITIAL_PROFILE);
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const profile = { ...this.getProfile(), ...updates, updated_at: new Date().toISOString() };
    this.setItem('profile', profile);
    if (supabase) {
      const userId = await this.getUserId();
      if (userId !== 'default-user') {
        await supabase.from('profiles').upsert([{ ...profile, id: userId }]);
      }
    }
    return profile;
  }

  getCategories(): Category[] {
    return this.getItem<Category[]>('categories', INITIAL_CATEGORIES);
  }

  async addCategory(category: Omit<Category, 'id' | 'user_id' | 'created_at'>): Promise<Category> {
    const userId = await this.getUserId();
    const payload = {
      ...category,
      user_id: userId,
    };

    let savedItem: Category;
    if (supabase && userId !== 'default-user') {
      const { data, error } = await supabase.from('categories').insert([payload]).select().single();
      if (error) {
        console.error('Erro ao salvar categoria no Supabase:', error);
        throw new Error(error.message);
      }
      savedItem = data as Category;
    } else {
      savedItem = { ...payload, id: generateId(), created_at: new Date().toISOString() };
    }

    const categories = this.getCategories();
    categories.push(savedItem);
    this.setItem('categories', categories);
    return savedItem;
  }

  getRecipes(): Recipe[] {
    return this.getItem<Recipe[]>('recipes', []);
  }

  async addRecipe(recipe: Omit<Recipe, 'id' | 'user_id' | 'created_at'>): Promise<Recipe> {
    const userId = await this.getUserId();
    const payload = {
      descricao: recipe.descricao,
      categoria: recipe.categoria,
      valor: Number(recipe.valor),
      data: recipe.data,
      observacoes: recipe.observacoes || '',
      user_id: userId,
    };

    let savedItem: Recipe;
    if (supabase && userId !== 'default-user') {
      const { data, error } = await supabase.from('recipes').insert([payload]).select().single();
      if (error) {
        console.error('Erro ao salvar receita no Supabase:', error);
        throw new Error(error.message);
      }
      savedItem = data as Recipe;
    } else {
      savedItem = { ...payload, id: generateId(), created_at: new Date().toISOString() };
    }

    const recipes = this.getRecipes();
    recipes.unshift(savedItem);
    this.setItem('recipes', recipes);

    // Register transaction
    await this.addTransaction({
      tipo: 'receita',
      descricao: savedItem.descricao,
      valor: savedItem.valor,
      data: savedItem.data,
      categoria: savedItem.categoria,
      referencia_id: savedItem.id,
    });

    this.recalculateBalance();
    return savedItem;
  }

  async deleteRecipe(id: string): Promise<void> {
    const recipes = this.getRecipes().filter(r => r.id !== id);
    this.setItem('recipes', recipes);
    if (supabase) {
      await supabase.from('recipes').delete().eq('id', id);
    }
    this.recalculateBalance();
  }

  getExpenses(): Expense[] {
    const rawExpenses = this.getItem<Expense[]>('expenses', []);
    const cleanExpenses = rawExpenses.filter(e => !e.descricao.startsWith('Pgto: '));

    let modified = false;
    const normalizedExpenses = cleanExpenses.map(e => {
      if (!e.status) {
        modified = true;
        const isOCRConfirmed = Boolean(e.observacoes && e.observacoes.toLowerCase().includes('comprovante ocr'));
        return { ...e, status: (isOCRConfirmed ? 'paga' : 'pendente') as BillStatus };
      }
      return e;
    });

    if (modified || cleanExpenses.length !== rawExpenses.length) {
      this.setItem('expenses', normalizedExpenses);
    }

    const pendingExpenseIds = new Set(normalizedExpenses.filter(e => e.status === 'pendente').map(e => e.id));
    if (pendingExpenseIds.size > 0) {
      const rawTx = this.getItem<Transaction[]>('transactions', []);
      const cleanTx = rawTx.filter(t => !t.referencia_id || !pendingExpenseIds.has(t.referencia_id));
      if (cleanTx.length !== rawTx.length) {
        this.setItem('transactions', cleanTx);
      }
    }

    return normalizedExpenses;
  }

  async addExpense(expense: Omit<Expense, 'id' | 'user_id' | 'created_at'>): Promise<Expense> {
    const userId = await this.getUserId();
    const status = expense.status || 'pendente';
    const payload = {
      descricao: expense.descricao,
      categoria: expense.categoria,
      valor: Number(expense.valor),
      data: expense.data,
      forma_pagamento: expense.forma_pagamento,
      observacoes: expense.observacoes || '',
      status: status,
      user_id: userId,
    };

    let savedItem: Expense;
    if (supabase && userId !== 'default-user') {
      const { data, error } = await supabase.from('expenses').insert([payload]).select().single();
      if (error) {
        // Fallback: If 'status' column is missing in Remote Supabase schema cache
        if (error.message.includes('status') || error.code === 'PGRST204') {
          const { status: _st, ...remotePayload } = payload;
          const { data: retryData, error: retryErr } = await supabase.from('expenses').insert([remotePayload]).select().single();
          if (retryErr) {
            console.error('Erro ao salvar despesa no Supabase:', retryErr);
            throw new Error(retryErr.message);
          }
          savedItem = { ...retryData, status } as Expense;
        } else {
          console.error('Erro ao salvar despesa no Supabase:', error);
          throw new Error(error.message);
        }
      } else {
        savedItem = data as Expense;
      }
    } else {
      savedItem = { ...payload, id: generateId(), created_at: new Date().toISOString() };
    }

    const expenses = this.getExpenses();
    expenses.unshift(savedItem);
    this.setItem('expenses', expenses);

    // Only register transaction if status is 'paga'
    if (status === 'paga') {
      await this.addTransaction({
        tipo: 'despesa',
        descricao: savedItem.descricao,
        valor: savedItem.valor,
        data: savedItem.data,
        categoria: savedItem.categoria,
        referencia_id: savedItem.id,
      });
    }

    this.recalculateBalance();
    return savedItem;
  }

  async toggleExpenseStatus(id: string, status: 'paga' | 'pendente'): Promise<Expense | undefined> {
    const expenses = this.getExpenses();
    const targetExpense = expenses.find(e => e.id === id);

    if (targetExpense) {
      targetExpense.status = status;
      this.setItem('expenses', expenses);

      const userId = await this.getUserId();
      if (supabase && userId !== 'default-user') {
        const { error } = await supabase.from('expenses').update({ status }).eq('id', id);
        if (error && error.message.includes('status')) {
          console.warn('Coluna status ausente na tabela remote do Supabase, alteração mantida localmente.');
        }
      }

      if (status === 'paga') {
        await this.addTransaction({
          tipo: 'despesa',
          descricao: targetExpense.descricao,
          valor: targetExpense.valor,
          data: getTodayString(),
          categoria: targetExpense.categoria,
          referencia_id: targetExpense.id,
        });
      } else {
        const rawTx = this.getItem<Transaction[]>('transactions', []);
        const cleanTx = rawTx.filter(t => t.referencia_id !== id);
        this.setItem('transactions', cleanTx);
      }

      this.recalculateBalance();
      return targetExpense;
    }
    return undefined;
  }

  async deleteExpense(id: string): Promise<void> {
    const expenses = this.getExpenses().filter(e => e.id !== id);
    this.setItem('expenses', expenses);
    if (supabase) {
      await supabase.from('expenses').delete().eq('id', id);
    }
    this.recalculateBalance();
  }

  getBills(): Bill[] {
    const rawBills = this.getItem<Bill[]>('bills', []);
    const uniqueBills: Bill[] = [];
    const seenKeys = new Set<string>();

    for (const b of rawBills) {
      const key = `${b.nome.toLowerCase().trim()}_${Number(b.valor).toFixed(2)}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueBills.push(b);
      }
    }

    if (uniqueBills.length !== rawBills.length) {
      this.setItem('bills', uniqueBills);
    }
    return uniqueBills;
  }

  async addBill(bill: Omit<Bill, 'id' | 'user_id' | 'created_at'>): Promise<Bill> {
    const bills = this.getBills();
    
    // Check if identical bill already exists
    const existing = bills.find(
      (b) =>
        b.nome.toLowerCase().trim() === bill.nome.toLowerCase().trim() &&
        Math.abs(Number(b.valor) - Number(bill.valor)) < 0.01
    );

    if (existing) {
      return existing;
    }

    const userId = await this.getUserId();
    const payload = {
      nome: bill.nome,
      categoria: bill.categoria,
      valor: Number(bill.valor),
      dia_vencimento: Number(bill.dia_vencimento),
      status: bill.status || 'pendente',
      recorrente: bill.recorrente ?? true,
      observacoes: bill.observacoes || '',
      user_id: userId,
    };

    let savedItem: Bill;
    if (supabase && userId !== 'default-user') {
      const { data, error } = await supabase.from('bills').insert([payload]).select().single();
      if (error) {
        console.error('Erro ao salvar conta no Supabase:', error);
        throw new Error(error.message);
      }
      savedItem = data as Bill;
    } else {
      savedItem = { ...payload, id: generateId(), created_at: new Date().toISOString() };
    }

    bills.unshift(savedItem);
    this.setItem('bills', bills);
    this.recalculateBalance();
    return savedItem;
  }

  async toggleBillStatus(id: string, status: 'paga' | 'pendente'): Promise<Bill | undefined> {
    const bills = this.getBills();
    const targetBill = bills.find(b => b.id === id);
    
    if (targetBill) {
      targetBill.status = status;
      this.setItem('bills', bills);

      if (supabase) {
        await supabase.from('bills').update({ status }).eq('id', id);
      }

      if (status === 'paga') {
        await this.addTransaction({
          tipo: 'despesa',
          descricao: targetBill.nome,
          valor: targetBill.valor,
          data: getTodayString(),
          categoria: targetBill.categoria,
          referencia_id: targetBill.id,
        });
      }

      this.recalculateBalance();
      return targetBill;
    }
    return undefined;
  }

  async deleteBill(id: string): Promise<void> {
    const bills = this.getBills().filter(b => b.id !== id);
    this.setItem('bills', bills);
    if (supabase) {
      await supabase.from('bills').delete().eq('id', id);
    }
    this.recalculateBalance();
  }

  getCards(): CreditCard[] {
    return this.getItem<CreditCard[]>('cards', []);
  }

  async addCard(card: Omit<CreditCard, 'id' | 'user_id' | 'created_at'>): Promise<CreditCard> {
    const userId = await this.getUserId();
    const payload = {
      nome: card.nome,
      banco: card.banco,
      limite: Number(card.limite),
      fechamento: Number(card.fechamento),
      vencimento: Number(card.vencimento),
      cor_hex: card.cor_hex || '#10b981',
      user_id: userId,
    };

    let savedItem: CreditCard;
    if (supabase && userId !== 'default-user') {
      const { data, error } = await supabase.from('cards').insert([payload]).select().single();
      if (error) {
        console.error('Erro ao salvar cartão no Supabase:', error);
        throw new Error(error.message);
      }
      savedItem = data as CreditCard;
    } else {
      savedItem = { ...payload, id: generateId(), created_at: new Date().toISOString() };
    }

    const cards = this.getCards();
    cards.push(savedItem);
    this.setItem('cards', cards);
    return savedItem;
  }

  async deleteCard(id: string): Promise<void> {
    const cards = this.getCards().filter(c => c.id !== id);
    this.setItem('cards', cards);
    if (supabase) {
      await supabase.from('cards').delete().eq('id', id);
    }
  }

  getInstallments(): Installment[] {
    return this.getItem<Installment[]>('installments', []);
  }

  async addInstallment(inst: Omit<Installment, 'id' | 'user_id' | 'created_at'>): Promise<Installment> {
    const userId = await this.getUserId();
    const payload = {
      produto: inst.produto,
      valor_total: Number(inst.valor_total),
      qtd_parcelas: Number(inst.qtd_parcelas),
      valor_parcela: Number(inst.valor_parcela),
      parcelas_pagas: Number(inst.parcelas_pagas || 0),
      parcelas_restantes: Number(inst.parcelas_restantes),
      cartao_id: inst.cartao_id || null,
      user_id: userId,
    };

    let savedItem: Installment;
    if (supabase && userId !== 'default-user') {
      const { data, error } = await supabase.from('installments').insert([payload]).select().single();
      if (error) {
        console.error('Erro ao salvar parcelamento no Supabase:', error);
        throw new Error(error.message);
      }
      savedItem = data as Installment;
    } else {
      savedItem = {
        ...payload,
        cartao_id: payload.cartao_id || undefined,
        id: generateId(),
        created_at: new Date().toISOString(),
      };
    }

    const installments = this.getInstallments();
    installments.push(savedItem);
    this.setItem('installments', installments);
    return savedItem;
  }

  async payInstallment(id: string): Promise<Installment | undefined> {
    const installments = this.getInstallments();
    const index = installments.findIndex(i => i.id === id);
    if (index !== -1 && installments[index].parcelas_restantes > 0) {
      installments[index].parcelas_pagas += 1;
      installments[index].parcelas_restantes -= 1;
      this.setItem('installments', installments);

      if (supabase) {
        await supabase
          .from('installments')
          .update({
            parcelas_pagas: installments[index].parcelas_pagas,
            parcelas_restantes: installments[index].parcelas_restantes,
          })
          .eq('id', id);
      }

      this.recalculateBalance();
      return installments[index];
    }
    return undefined;
  }

  getTransactions(): Transaction[] {
    const rawTx = this.getItem<Transaction[]>('transactions', []);
    const cleanTx: Transaction[] = [];
    const seenKeys = new Set<string>();

    for (const t of rawTx) {
      const cleanDesc = t.descricao.replace(/^(Pgto:\s*|Baixa:\s*)/i, '').trim();
      const key = `${t.tipo}_${cleanDesc.toLowerCase()}_${Number(t.valor).toFixed(2)}`;

      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        cleanTx.push({
          ...t,
          descricao: cleanDesc,
        });
      }
    }

    if (cleanTx.length !== rawTx.length) {
      this.setItem('transactions', cleanTx);
    }
    return cleanTx;
  }

  async addTransaction(tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>): Promise<Transaction> {
    const cleanDesc = tx.descricao.replace(/^(Pgto:\s*|Baixa:\s*)/i, '').trim();
    const transactions = this.getTransactions();

    const existing = transactions.find(
      (t) =>
        t.tipo === tx.tipo &&
        t.descricao.toLowerCase().trim() === cleanDesc.toLowerCase() &&
        Math.abs(Number(t.valor) - Number(tx.valor)) < 0.01
    );

    if (existing) {
      return existing;
    }

    const userId = await this.getUserId();
    const payload = {
      tipo: tx.tipo,
      descricao: cleanDesc,
      valor: Number(tx.valor),
      data: tx.data,
      categoria: tx.categoria,
      referencia_id: tx.referencia_id || null,
      user_id: userId,
    };

    let savedItem: Transaction;
    if (supabase && userId !== 'default-user') {
      const { data, error } = await supabase.from('transactions').insert([payload]).select().single();
      if (error) {
        console.error('Erro ao salvar movimentação no Supabase:', error);
      }
      savedItem = (data as Transaction) || {
        ...payload,
        referencia_id: payload.referencia_id || undefined,
        id: generateId(),
        created_at: new Date().toISOString(),
      };
    } else {
      savedItem = {
        ...payload,
        referencia_id: payload.referencia_id || undefined,
        id: generateId(),
        created_at: new Date().toISOString(),
      };
    }

    transactions.unshift(savedItem);
    this.setItem('transactions', transactions);
    return savedItem;
  }

  async deleteTransaction(id: string): Promise<void> {
    const rawTx = this.getItem<Transaction[]>('transactions', []);
    const targetTx = rawTx.find(t => t.id === id);
    const cleanTx = rawTx.filter(t => t.id !== id);
    this.setItem('transactions', cleanTx);

    if (targetTx?.referencia_id) {
      const expenses = this.getExpenses().filter(e => e.id !== targetTx.referencia_id);
      this.setItem('expenses', expenses);

      const recipes = this.getRecipes().filter(r => r.id !== targetTx.referencia_id);
      this.setItem('recipes', recipes);

      const bills = this.getBills();
      const targetBill = bills.find(b => b.id === targetTx.referencia_id);
      if (targetBill) {
        targetBill.status = 'pendente';
        this.setItem('bills', bills);
      }

      if (supabase) {
        await supabase.from('transactions').delete().eq('id', id);
        await supabase.from('expenses').delete().eq('id', targetTx.referencia_id);
        await supabase.from('recipes').delete().eq('id', targetTx.referencia_id);
        await supabase.from('bills').update({ status: 'pendente' }).eq('id', targetTx.referencia_id);
      }
    } else if (supabase) {
      await supabase.from('transactions').delete().eq('id', id);
    }

    this.recalculateBalance();
  }

  getGoals(): FinancialGoal[] {
    return this.getItem<FinancialGoal[]>('goals', []);
  }

  async addGoal(goal: Omit<FinancialGoal, 'id' | 'user_id' | 'created_at'>): Promise<FinancialGoal> {
    const userId = await this.getUserId();
    const payload = {
      titulo: goal.titulo,
      valor_alvo: Number(goal.valor_alvo),
      valor_atual: Number(goal.valor_atual || 0),
      prazo: goal.prazo || null,
      cor: (goal as any).cor || '#10b981',
      user_id: userId,
    };

    let savedItem: FinancialGoal;
    if (supabase && userId !== 'default-user') {
      const { data, error } = await supabase.from('goals').insert([payload]).select().single();
      if (error) {
        console.error('Erro ao salvar meta no Supabase:', error);
        throw new Error(error.message);
      }
      savedItem = data as FinancialGoal;
    } else {
      savedItem = {
        ...payload,
        prazo: payload.prazo || undefined,
        id: generateId(),
        created_at: new Date().toISOString(),
      };
    }

    const goals = this.getGoals();
    goals.push(savedItem);
    this.setItem('goals', goals);
    return savedItem;
  }

  async updateGoalDeposit(id: string, amount: number): Promise<FinancialGoal | undefined> {
    const goals = this.getGoals();
    const index = goals.findIndex(g => g.id === id);
    if (index !== -1) {
      goals[index].valor_atual += amount;
      this.setItem('goals', goals);

      if (supabase) {
        await supabase.from('goals').update({ valor_atual: goals[index].valor_atual }).eq('id', id);
      }

      await this.addExpense({
        descricao: `Aporte Meta: ${goals[index].titulo}`,
        categoria: 'Investimentos',
        valor: amount,
        data: getTodayString(),
        forma_pagamento: 'pix',
        observacoes: 'Aporte de economia'
      });
      return goals[index];
    }
    return undefined;
  }

  private recalculateBalance(): number {
    const recipes = this.getRecipes();
    const expenses = this.getExpenses();
    const bills = this.getBills();

    const totalRec = recipes.reduce((sum, r) => sum + Number(r.valor), 0);
    const totalExpenses = expenses
      .filter(e => e.status === 'paga')
      .reduce((sum, e) => sum + Number(e.valor), 0);
    const totalPaidBills = bills
      .filter(b => b.status === 'paga')
      .reduce((sum, b) => sum + Number(b.valor), 0);

    const totalExp = totalExpenses + totalPaidBills;
    const newBalance = totalRec - totalExp;

    this.updateProfile({ current_balance: newBalance });
    return newBalance;
  }

  getDashboardStats(): DashboardStats {
    const recipes = this.getRecipes();
    const expenses = this.getExpenses();
    const bills = this.getBills();
    const transactions = this.getTransactions();

    const currentYearMonth = getTodayString().substring(0, 7);

    const totalRec = recipes.reduce((sum, r) => sum + Number(r.valor), 0);
    const totalPaidExpenses = expenses
      .filter(e => e.status === 'paga')
      .reduce((sum, e) => sum + Number(e.valor), 0);
    const totalPaidBills = bills
      .filter(b => b.status === 'paga')
      .reduce((sum, b) => sum + Number(b.valor), 0);

    const saldoAtualCalculado = totalRec - (totalPaidExpenses + totalPaidBills);

    // Sync profile balance in storage
    const profile = this.getProfile();
    if (profile.current_balance !== saldoAtualCalculado) {
      this.updateProfile({ current_balance: saldoAtualCalculado });
    }

    const receitasMes = recipes
      .filter(r => r.data.startsWith(currentYearMonth))
      .reduce((sum, r) => sum + Number(r.valor), 0);

    const paidExpensesMes = expenses
      .filter(e => e.data.startsWith(currentYearMonth) && e.status === 'paga')
      .reduce((sum, e) => sum + Number(e.valor), 0);

    const paidBillsMes = bills
      .filter(b => b.status === 'paga')
      .reduce((sum, b) => sum + Number(b.valor), 0);

    const despesasMes = paidExpensesMes + paidBillsMes;

    const contasPendentesBills = bills.filter(b => b.status === 'pendente' || b.status === 'atrasada');
    const expensesPendentes = expenses.filter(e => e.status === 'pendente');
    const contasPagasBills = bills.filter(b => b.status === 'paga');
    const expensesPagas = expenses.filter(e => e.status === 'paga');

    const contasPendentesValor = 
      contasPendentesBills.reduce((sum, b) => sum + Number(b.valor), 0) +
      expensesPendentes.reduce((sum, e) => sum + Number(e.valor), 0);

    const contasPagasValor = 
      contasPagasBills.reduce((sum, b) => sum + Number(b.valor), 0) +
      expensesPagas.reduce((sum, e) => sum + Number(e.valor), 0);

    const saldoPrevisto = saldoAtualCalculado - contasPendentesValor;

    const despesasPorCategoria: Record<string, number> = {};
    expenses.filter(e => e.status === 'paga').forEach(e => {
      despesasPorCategoria[e.categoria] = (despesasPorCategoria[e.categoria] || 0) + Number(e.valor);
    });
    bills.filter(b => b.status === 'paga').forEach(b => {
      despesasPorCategoria[b.categoria] = (despesasPorCategoria[b.categoria] || 0) + Number(b.valor);
    });

    const receitasPorCategoria: Record<string, number> = {};
    recipes.forEach(r => {
      receitasPorCategoria[r.categoria] = (receitasPorCategoria[r.categoria] || 0) + Number(r.valor);
    });

    const proximosVencimentos = [...bills]
      .filter(b => b.status !== 'paga')
      .sort((a, b) => a.dia_vencimento - b.dia_vencimento);

    const ultimosPagamentos = transactions.slice(0, 6);

    return {
      saldoAtual: saldoAtualCalculado,
      receitasMes,
      despesasMes,
      saldoPrevisto,
      contasPendentesValor,
      contasPendentesQtd: contasPendentesBills.length + expensesPendentes.length,
      contasPagasValor,
      contasPagasQtd: contasPagasBills.length + expensesPagas.length,
      proximosVencimentos,
      ultimosPagamentos,
      despesasPorCategoria,
      receitasPorCategoria,
    };
  }

  checkDuplicate(descricao: string, valor: number, data: string): boolean {
    const expenses = this.getExpenses();
    const bills = this.getBills();

    const inExpenses = expenses.some(e => 
      e.data === data && 
      Math.abs(Number(e.valor) - Number(valor)) < 0.01 && 
      e.descricao.toLowerCase().trim() === descricao.toLowerCase().trim()
    );

    const inBills = bills.some(b => 
      b.nome.toLowerCase().trim() === descricao.toLowerCase().trim() && 
      Math.abs(Number(b.valor) - Number(valor)) < 0.01
    );

    return inExpenses || inBills;
  }
}

export const localFinanceEngine = new LocalFinanceEngine();
