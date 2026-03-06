"use client";

import React, { useState, useEffect } from "react";
import {
    BarChart3,
    PieChart as PieIcon,
    TrendingUp,
    TrendingDown,
    Calendar,
    Download
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { transactionService } from "@/services/transactionService";
import { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function RelatoriosPage() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = transactionService.subscribeToTransactions(user.uid, setTransactions);
        return () => unsubscribe();
    }, [user]);

    const totalIncome = transactions
        .filter(tx => tx.type === 'income')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const totalExpenses = transactions
        .filter(tx => tx.type === 'expense')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const categories = Object.entries(
        transactions
            .filter(tx => tx.type === 'expense')
            .reduce((acc, curr) => {
                acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
                return acc;
            }, {} as Record<string, number>)
    ).sort((a, b) => b[1] - a[1]);

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 md:pb-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 md:pt-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">Relatórios</h2>
                    <p className="text-sm text-slate-500 font-medium tracking-tight">Análise detalhada da sua saúde financeira.</p>
                </div>
                <button className="flex items-center justify-center gap-2 px-6 py-4 bg-foreground/5 border border-white/5 rounded-2xl hover:bg-foreground/10 transition-all font-black text-[11px] uppercase tracking-widest text-slate-400 w-full md:w-auto shadow-lg shadow-black/20">
                    <Download size={18} />
                    Exportar PDF
                </button>
            </header>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="glass p-5 md:p-6 group transition-all hover:border-primary/30">
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                        <div className="p-2 md:p-3 bg-primary/10 rounded-xl text-primary border border-primary/20">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">ESTÁVEL</span>
                    </div>
                    <p className="text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Média Mensal Receitas</p>
                    <p className="text-xl md:text-2xl font-black text-foreground">R$ {(totalIncome / 3).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>

                <div className="glass p-5 md:p-6 group transition-all hover:border-danger/30">
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                        <div className="p-2 md:p-3 bg-danger/10 rounded-xl text-danger border border-danger/20">
                            <TrendingDown size={20} />
                        </div>
                    </div>
                    <p className="text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Média Mensal Despesas</p>
                    <p className="text-xl md:text-2xl font-black text-foreground">R$ {(totalExpenses / 3).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>

                <div className="glass p-5 md:p-6 group transition-all hover:border-secondary/30">
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                        <div className="p-2 md:p-3 bg-secondary/10 rounded-xl text-secondary border border-secondary/20">
                            <BarChart3 size={20} />
                        </div>
                    </div>
                    <p className="text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Taxa de Poupança</p>
                    <p className="text-xl md:text-2xl font-black text-foreground">
                        {totalIncome > 0 ? (((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(1) : 0}%
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                {/* Category Breakdown */}
                <div className="glass p-6 md:p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 md:p-3 bg-orange-500/10 rounded-xl text-orange-500">
                                <PieIcon size={20} />
                            </div>
                            <h3 className="font-black text-lg text-foreground">Distribuição</h3>
                        </div>
                    </div>
                    <div className="space-y-6">
                        {categories.length === 0 ? (
                            <div className="py-20 text-center text-slate-500/50 uppercase font-black text-[10px] tracking-widest italic border-2 border-dashed border-white/5 rounded-2xl">
                                Sem dados para análise.
                            </div>
                        ) : (
                            categories.map(([category, amount]) => (
                                <div key={category} className="space-y-2 group">
                                    <div className="flex justify-between items-center text-[10px] md:text-xs font-black uppercase tracking-widest">
                                        <span className="text-slate-500 group-hover:text-foreground transition-colors">{category}</span>
                                        <span className="text-foreground">R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="h-2 w-full bg-foreground/5 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className="h-full bg-primary shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-1000"
                                            style={{ width: `${(amount / Math.max(1, totalExpenses)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Monthly Evolution */}
                <div className="glass p-6 md:p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 md:p-3 bg-primary/10 rounded-xl text-primary">
                                <Calendar size={20} />
                            </div>
                            <h3 className="font-black text-lg text-foreground">Evolução Mensal</h3>
                        </div>
                    </div>
                    <div className="h-64 flex items-end gap-2 md:gap-3 justify-between px-2 pb-2 border-b border-white/5">
                        {/* Bars for evolution */}
                        {[40, 65, 30, 85, 45, 90].map((height, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                                <div
                                    className="w-full bg-primary/20 hover:bg-primary group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all rounded-t-xl relative border-t border-x border-primary/30"
                                    style={{ height: `${height}%` }}
                                >
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-xl pointer-events-none whitespace-nowrap z-10">
                                        R$ {(height * 100).toLocaleString()}
                                    </div>
                                </div>
                                <span className="text-[9px] md:text-[10px] text-slate-500 font-black uppercase tracking-tighter">{['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'][i]}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 flex items-center justify-center gap-6">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                            <div className="w-3 h-3 bg-primary rounded-sm shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> Realizado
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                            <div className="w-3 h-3 bg-foreground/10 rounded-sm border border-white/10" /> Projetado
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
