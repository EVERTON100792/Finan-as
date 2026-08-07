import React, { useState } from 'react';
import { useFinance } from '../hooks/useFinance';
import { Card, Button, Input, Modal, Badge } from '../components/ui';
import { ExpenseForm } from '../components/forms/ExpenseForm';
import { formatCurrency, formatDate } from '../lib/utils';
import { TrendingDown, Plus, Search, Trash2, Tag, CalendarCheck, CheckCircle2 } from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const { expenses, bills, deleteExpense, deleteBill, toggleExpense, toggleBill } = useFinance();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Combine paid expenses and pending bills
  const allExpenseItems = [
    ...expenses.map((e) => ({
      id: e.id,
      descricao: e.descricao,
      categoria: e.categoria,
      valor: e.valor,
      data: e.data,
      forma_pagamento: e.forma_pagamento,
      isPaid: e.status ? e.status === 'paga' : true,
      type: 'expense' as const,
    })),
    ...bills.map((b) => ({
      id: b.id,
      descricao: b.nome,
      categoria: b.categoria,
      valor: b.valor,
      data: getTodayStringWithDay(b.dia_vencimento),
      forma_pagamento: 'pix',
      isPaid: b.status === 'paga',
      type: 'bill' as const,
    })),
  ];

  function getTodayStringWithDay(day: number): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    return `${year}-${month}-${formattedDay}`;
  }

  const filteredItems = allExpenseItems.filter(
    (e) =>
      e.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValor = filteredItems.reduce((sum, e) => sum + Number(e.valor), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-28 lg:pb-8 relative min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white font-serif flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-rose-400" />
            Gestão de Despesas & Contas
          </h2>
          <p className="text-xs text-slate-400">Controle suas despesas a pagar e pagamentos efetuados.</p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} variant="primary" className="w-full sm:w-auto py-3">
          <Plus className="w-4 h-4 mr-1.5" />
          Cadastrar Despesa / Conta
        </Button>
      </div>

      {/* Filter & Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 flex items-center">
          <Input
            placeholder="Buscar por descrição ou categoria..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </Card>

        <Card className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Total Filtrado</p>
            <h4 className="text-xl font-extrabold text-rose-400">{formatCurrency(totalValor)}</h4>
          </div>
          <Badge variant="rose">{filteredItems.length} itens</Badge>
        </Card>
      </div>

      {/* Expenses List */}
      <Card className="space-y-3 p-3 sm:p-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-400 space-y-3">
            <TrendingDown className="w-12 h-12 text-slate-600 mx-auto opacity-50" />
            <p>Nenhuma despesa ou conta cadastrada.</p>
            <Button onClick={() => setIsModalOpen(true)} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-1" /> Cadastrar Primeira Despesa
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="p-3 sm:p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/90 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      item.isPaid
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                        : 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                    }`}
                  >
                    {item.isPaid ? <CheckCircle2 className="w-5 h-5" /> : <CalendarCheck className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-100 truncate">{item.descricao}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="slate" className="text-[10px]">
                        <Tag className="w-3 h-3 mr-1" />
                        {item.categoria}
                      </Badge>
                      {item.isPaid ? (
                        <Badge variant="emerald" className="text-[10px]">
                          🟢 Pago
                        </Badge>
                      ) : (
                        <Badge variant="amber" className="text-[10px]">
                          📌 A Pagar
                        </Badge>
                      )}
                      <span className="text-xs text-slate-400">• Venc/Data: {formatDate(item.data)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                  <span className={`text-base font-extrabold ${item.isPaid ? 'text-rose-400' : 'text-amber-400'}`}>
                    -{formatCurrency(item.valor)}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={item.isPaid ? 'ghost' : 'outline'}
                      onClick={() => {
                        const nextStatus = item.isPaid ? 'pendente' : 'paga';
                        if (item.type === 'expense') {
                          toggleExpense({ id: item.id, status: nextStatus });
                        } else {
                          toggleBill({ id: item.id, status: nextStatus });
                        }
                      }}
                      className={!item.isPaid ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs px-2.5 py-1' : 'text-xs px-2 py-1'}
                    >
                      {item.isPaid ? 'Marcar Pendente' : 'Marcar Paga'}
                    </Button>

                    <button
                      onClick={() => {
                        if (item.type === 'expense') deleteExpense(item.id);
                        else deleteBill(item.id);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors flex items-center gap-1 text-xs font-semibold shrink-0"
                      title="Excluir Lançamento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Floating Action Button (Mobile Only) */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="lg:hidden fixed bottom-20 right-4 z-40 bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-extrabold px-4 py-3 rounded-full shadow-2xl shadow-rose-500/40 flex items-center gap-2 text-sm active:scale-95 transition-transform"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        <span>Nova Despesa</span>
      </button>

      {/* Modal Nova Despesa */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cadastrar Despesa / Conta a Pagar"
        subtitle="O lançamento fica como A Pagar sem alterar o Saldo Atual até o envio do comprovante"
      >
        <ExpenseForm onSuccess={() => setIsModalOpen(false)} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};
