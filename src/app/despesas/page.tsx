"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Trash2, Edit2, ArrowDownCircle } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { transactionService } from "@/services/transactionService";
import { Transaction } from "@/lib/types";
import { Timestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";

export default function DespesasPage() {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState<Transaction[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        description: "",
        amount: "",
        category: "Geral",
        status: "paid" as const,
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (!user) return;
        const unsubscribe = transactionService.subscribeToTransactions(user.uid, (data) => {
            setExpenses(data.filter(tx => tx.type === 'expense'));
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
            type: 'expense',
            status: formData.status,
            date: Timestamp.fromDate(new Date(formData.date)),
            userId: user.uid
        });

        setIsModalOpen(false);
        setFormData({ description: "", amount: "", category: "Geral", status: "paid", date: new Date().toISOString().split('T')[0] });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 md:pb-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 md:pt-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">Despesas</h2>
                    <p className="text-sm text-slate-500 font-medium tracking-tight">Controle suas saídas de forma detalhada.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-danger text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-danger/20 w-full md:w-auto"
                >
                    <Plus size={18} />
                    Nova Despesa
                </button>
            </header>

            {/* Filter/Search Section */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar despesa..."
                        className="w-full bg-foreground/5 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                    />
                </div>
            </div>

            {/* Content Section: Table for Desktop, Cards for Mobile */}
            <div className="space-y-4">
                {/* Desktop view (Hidden on mobile) */}
                <div className="hidden md:block glass overflow-hidden divide-y divide-white/5 shadow-2xl">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] uppercase font-black text-slate-500 border-b border-white/5 bg-foreground/[0.02]">
                                <th className="px-6 py-5 tracking-widest">Descrição</th>
                                <th className="px-6 py-5 tracking-widest">Categoria</th>
                                <th className="px-6 py-5 tracking-widest">Data</th>
                                <th className="px-6 py-5 tracking-widest">Status</th>
                                <th className="px-6 py-5 tracking-widest text-right">Valor</th>
                                <th className="px-6 py-5 tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {expenses.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-slate-500 font-bold uppercase text-xs tracking-widest opacity-30">
                                        Nenhuma despesa registrada.
                                    </td>
                                </tr>
                            ) : (
                                expenses.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-foreground/[0.02] transition-colors group">
                                        <td className="px-6 py-4 font-bold text-foreground">{tx.description}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-4 py-1.5 bg-foreground/5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 border border-white/5">
                                                {tx.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-500">
                                            {tx.date?.toDate ? new Date(tx.date.toDate()).toLocaleDateString('pt-BR') : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                                                tx.status === 'paid' ? "bg-primary/10 text-primary border border-primary/20" : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                                            )}>
                                                {tx.status === 'paid' ? 'PAGO' : 'PENDENTE'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-foreground">
                                            - {formatCurrency(tx.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 text-slate-400 hover:text-foreground bg-foreground/5 rounded-xl transition-all">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => tx.id && transactionService.deleteTransaction(tx.id)}
                                                    className="p-2 text-slate-400 hover:text-danger bg-foreground/5 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile view (Hidden on desktop) */}
                <div className="md:hidden space-y-3">
                    {expenses.length === 0 ? (
                        <div className="glass p-12 text-center text-slate-500 font-bold uppercase text-xs tracking-widest opacity-30">
                            Nenhuma despesa.
                        </div>
                    ) : (
                        expenses.map((tx) => (
                            <div key={tx.id} className="glass p-5 space-y-4 shadow-xl active:scale-[0.98] transition-transform">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center border border-danger/20 shrink-0">
                                            <ArrowDownCircle size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground leading-tight truncate max-w-[150px]">{tx.description}</p>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 opacity-60">{tx.category}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-foreground">- {formatCurrency(tx.amount)}</p>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                                            {tx.date?.toDate ? new Date(tx.date.toDate()).toLocaleDateString('pt-BR') : '-'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                    <span className={cn(
                                        "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                                        tx.status === 'paid' ? "bg-primary/10 text-primary border border-primary/20" : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                                    )}>
                                        {tx.status === 'paid' ? 'PAGO' : 'PENDENTE'}
                                    </span>
                                    <div className="flex gap-2">
                                        <button className="p-2 bg-foreground/5 rounded-xl text-slate-400">
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => tx.id && transactionService.deleteTransaction(tx.id)}
                                            className="p-2 bg-foreground/5 rounded-xl text-slate-400"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="glass w-full max-w-md p-8 animate-in zoom-in-95 duration-200 shadow-2xl shadow-black relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
                        >
                            <Plus className="rotate-45" size={24} />
                        </button>

                        <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                            <ArrowDownCircle className="text-danger" size={28} /> Nova Despesa
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Descrição</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-black/40 border border-card-border rounded-xl px-5 py-4 focus:outline-none focus:border-danger/50 text-white font-medium"
                                    placeholder="EX: Aluguel, Mercado..."
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
                                        className="w-full bg-black/40 border border-card-border rounded-xl px-5 py-4 focus:outline-none focus:border-danger/50 text-white font-black"
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
                                        className="w-full bg-black/40 border border-card-border rounded-xl px-5 py-4 focus:outline-none focus:border-danger/50 text-white text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Categoria</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-black/40 border border-card-border rounded-xl px-5 py-4 focus:outline-none focus:border-danger/50 text-white font-medium appearance-none"
                                >
                                    <option value="Geral">Geral</option>
                                    <option value="Alimentação">Alimentação</option>
                                    <option value="Moradia">Moradia</option>
                                    <option value="Saúde">Saúde</option>
                                    <option value="Transporte">Transporte</option>
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
                                    className="flex-1 py-4 bg-danger text-white rounded-xl font-black uppercase text-xs tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-danger/20"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
