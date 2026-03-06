"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Calendar,
  Filter,
  ArrowRight,
  PieChart
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { transactionService } from "@/services/transactionService";
import { Transaction, FinancialSummary } from "@/lib/types";
import { cn } from "@/lib/utils";


export default function Home() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    pendingExpenses: 0
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "Outros",
    type: "expense" as "income" | "expense",
    status: "paid" as "paid" | "pending",
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!user) return;

    const unsubscribe = transactionService.subscribeToTransactions(user.uid, (data) => {
      setTransactions(data);

      const newSummary = data.reduce((acc, curr) => {
        if (curr.type === 'income') {
          acc.totalIncome += curr.amount;
        } else {
          acc.totalExpenses += curr.amount;
          if (curr.status === 'pending') {
            acc.pendingExpenses += curr.amount;
          }
        }
        return acc;
      }, { totalIncome: 0, totalExpenses: 0, balance: 0, pendingExpenses: 0 });

      newSummary.balance = newSummary.totalIncome - newSummary.totalExpenses;
      setSummary(newSummary);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    await transactionService.addTransaction({
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category,
      type: formData.type,
      status: formData.status,
      date: new Date(formData.date),
      userId: user.uid
    });

    setIsModalOpen(false);
    setFormData({
      description: "",
      amount: "",
      category: "Outros",
      type: "expense",
      status: "paid",
      date: new Date().toISOString().split('T')[0]
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 pb-20 md:pb-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 md:pt-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">Dashboard</h2>
          <p className="text-sm text-slate-500 font-medium tracking-tight">Bem-vindo ao seu controle financeiro profissional.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-3 bg-foreground/5 border border-white/5 rounded-2xl font-bold text-xs uppercase tracking-widest text-slate-400">
            <Calendar size={16} />
            Março 2026
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-[1.5] md:flex-initial flex items-center justify-center gap-2 px-6 py-3 bg-primary text-background rounded-2xl font-black text-[11px] uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={18} />
            Lançamento
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="glass p-5 md:p-6 relative overflow-hidden group">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
            <div>
              <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Saldo Total</p>
              <h3 className="text-lg md:text-2xl font-black text-foreground truncate">{formatCurrency(summary.balance)}</h3>
            </div>
            <div className="p-2 md:p-3 bg-secondary/10 text-secondary rounded-xl w-fit">
              <Wallet size={18} />
            </div>
          </div>
          <div className="mt-3 md:mt-4 flex items-center gap-2">
            <span className="text-[10px] font-black text-primary flex items-center gap-0.5">
              <TrendingUp size={10} /> 12%
            </span>
            <span className="text-[8px] md:text-[9px] text-slate-500 uppercase font-black tracking-tighter opacity-50">vs mês ant.</span>
          </div>
        </div>

        <div className="glass p-5 md:p-6 relative overflow-hidden group">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
            <div>
              <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Receitas</p>
              <h3 className="text-lg md:text-2xl font-black text-primary truncate">{formatCurrency(summary.totalIncome)}</h3>
            </div>
            <div className="p-2 md:p-3 bg-primary/10 text-primary rounded-xl w-fit">
              <TrendingUp size={18} />
            </div>
          </div>
        </div>

        <div className="glass p-5 md:p-6 relative overflow-hidden group">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
            <div>
              <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Despesas</p>
              <h3 className="text-lg md:text-2xl font-black text-danger truncate">{formatCurrency(summary.totalExpenses)}</h3>
            </div>
            <div className="p-2 md:p-3 bg-danger/10 text-danger rounded-xl w-fit">
              <TrendingDown size={18} />
            </div>
          </div>
        </div>

        <div className="glass p-5 md:p-6 relative overflow-hidden group">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
            <div>
              <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Pendentes</p>
              <h3 className="text-lg md:text-2xl font-black text-yellow-500 truncate">{formatCurrency(summary.pendingExpenses)}</h3>
            </div>
            <div className="p-2 md:p-3 bg-yellow-500/10 text-yellow-500 rounded-xl w-fit">
              <Calendar size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Transactions & Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 glass p-5 md:p-6 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-lg text-foreground">Últimos Lançamentos</h3>
            <button className="p-2 text-slate-500 hover:text-foreground bg-foreground/5 rounded-xl transition-all">
              <Filter size={18} />
            </button>
          </div>

          <div className="space-y-2 flex-1">
            {transactions.slice(0, 5).length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-white/5 rounded-2xl p-6">
                <p className="font-bold text-xs uppercase tracking-widest opacity-50">Nenhum lançamento</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-3 text-primary font-black uppercase text-[10px] tracking-widest bg-primary/10 px-4 py-2 rounded-full"
                >
                  Novo Item
                </button>
              </div>
            ) : (
              transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-foreground/[0.02] border border-white/5 hover:border-primary/20 transition-all hover:bg-foreground/[0.04] group">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center border border-white/5 shrink-0",
                      tx.type === 'income' ? "bg-primary/10 text-primary" : "bg-danger/10 text-danger"
                    )}>
                      {tx.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{tx.description}</p>
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest opacity-70 truncate">{tx.category}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn(
                      "font-black text-sm md:text-base tracking-tight",
                      tx.type === 'income' ? "text-primary" : "text-foreground"
                    )}>
                      {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                    </p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter opacity-50">
                      {tx.date?.toDate ? new Date(tx.date.toDate()).toLocaleDateString('pt-BR') : '-'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <Link href="/despesas" className="mt-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 w-full py-4 bg-foreground/5 hover:bg-foreground/10 rounded-2xl transition-all border border-white/5">
            Ver Todos <ArrowRight size={14} />
          </Link>
        </div>

        {/* Categories Analysis */}
        <div className="glass p-5 md:p-6 overflow-hidden">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <PieChart size={18} />
            </div>
            <h3 className="font-black text-lg text-foreground">Distribuição</h3>
          </div>
          <div className="space-y-5">
            {Object.entries(
              transactions
                .filter(tx => tx.type === 'expense')
                .reduce((acc, curr) => {
                  acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
                  return acc;
                }, {} as Record<string, number>)
            ).length === 0 ? (
              <div className="py-10 text-center text-slate-500/50 uppercase font-black text-[10px] tracking-widest italic">
                Aguardando dados...
              </div>
            ) : (
              Object.entries(
                transactions
                  .filter(tx => tx.type === 'expense')
                  .reduce((acc, curr) => {
                    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
                    return acc;
                  }, {} as Record<string, number>)
              ).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([category, amount]) => (
                <div key={category} className="space-y-1.5 group">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                    <span className="text-slate-400 group-hover:text-foreground transition-colors">{category}</span>
                    <span className="text-foreground">{formatCurrency(amount)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-foreground/5 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-primary shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-1000"
                      style={{ width: `${Math.min(100, (amount / Math.max(1, summary.totalExpenses)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="glass w-full max-w-md p-8 animate-in zoom-in-95 duration-200 shadow-2xl shadow-black">
            <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
              <Plus className="text-primary" size={28} /> Novo Lançamento
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex p-1 bg-black/40 rounded-xl border border-card-border">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'expense' })}
                  className={cn(
                    "flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                    formData.type === 'expense' ? "bg-white/10 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  Despesa
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'income' })}
                  className={cn(
                    "flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                    formData.type === 'income' ? "bg-primary text-background shadow-lg shadow-primary/20" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  Receita
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Descrição</label>
                <input
                  required
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-black/40 border border-card-border rounded-xl px-5 py-4 focus:outline-none focus:border-primary/50 text-white font-medium"
                  placeholder="Ex: Aluguel, Salário..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Valor (R$)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-black/40 border border-card-border rounded-xl px-5 py-4 focus:outline-none focus:border-primary/50 text-white font-black"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Data</label>
                  <input
                    required
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-black/40 border border-card-border rounded-xl px-5 py-4 focus:outline-none focus:border-primary/50 text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Categoria</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-black/40 border border-card-border rounded-xl px-5 py-4 focus:outline-none focus:border-primary/50 text-white font-medium appearance-none"
                >
                  <option value="Outros">Outros</option>
                  <option value="Alimentação">Alimentação</option>
                  <option value="Moradia">Moradia</option>
                  <option value="Saúde">Saúde</option>
                  <option value="Trabalho">Trabalho</option>
                  <option value="Lazer">Lazer</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 border border-card-border rounded-xl font-black uppercase text-xs tracking-widest text-slate-400 hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-primary text-background rounded-xl font-black uppercase text-xs tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

