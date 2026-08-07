import React, { useState } from 'react';
import { useFinance } from '../hooks/useFinance';
import { Card, Button, Modal, Badge } from '../components/ui';
import { BillForm } from '../components/forms/BillForm';
import { formatCurrency } from '../lib/utils';
import { CalendarCheck, Plus, CheckCircle2, Trash2, Clock } from 'lucide-react';

export const BillsPage: React.FC = () => {
  const { bills, toggleBill, deleteBill } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const contasPendentes = bills.filter((b) => b.status !== 'paga');
  const contasPagas = bills.filter((b) => b.status === 'paga');

  const totalPendente = contasPendentes.reduce((sum, b) => sum + Number(b.valor), 0);
  const totalPago = contasPagas.reduce((sum, b) => sum + Number(b.valor), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-28 lg:pb-8 relative min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white font-serif flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-amber-400" />
            Contas Fixas & Vencimentos
          </h2>
          <p className="text-xs text-slate-400">Gerencie contas recorrentes, boletos e despesas a pagar no mês.</p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto py-3">
          <Plus className="w-4 h-4 mr-1.5" />
          Cadastrar Nova Conta
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Total a Pagar ({contasPendentes.length})</p>
            <h4 className="text-2xl font-extrabold text-amber-400">{formatCurrency(totalPendente)}</h4>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </Card>

        <Card className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Total Pago no Mês ({contasPagas.length})</p>
            <h4 className="text-2xl font-extrabold text-emerald-400">{formatCurrency(totalPago)}</h4>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Bills List */}
      <Card className="space-y-4 p-3 sm:p-6">
        <h4 className="text-base font-bold text-slate-100">Lista de Contas Registradas</h4>

        {bills.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-400 space-y-3">
            <CalendarCheck className="w-12 h-12 text-slate-600 mx-auto opacity-50" />
            <p>Nenhuma conta cadastrada ainda.</p>
            <Button onClick={() => setIsModalOpen(true)} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-1" /> Cadastrar Primeira Conta
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {bills.map((bill) => {
              const isPaid = bill.status === 'paga';
              const todayDay = new Date().getDate();
              const isLate = !isPaid && bill.dia_vencimento < todayDay;

              return (
                <div
                  key={bill.id}
                  className="p-3 sm:p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/90 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-bold text-xs shrink-0 ${
                        isPaid
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : isLate
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      <span className="text-[9px] uppercase font-semibold">Dia</span>
                      <span className="text-sm font-extrabold leading-none">{bill.dia_vencimento}</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-100 truncate">{bill.nome}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="slate" className="text-[10px]">
                          {bill.categoria}
                        </Badge>
                        {bill.recorrente && (
                          <Badge variant="purple" className="text-[10px]">
                            Recorrente
                          </Badge>
                        )}
                        {isPaid ? (
                          <Badge variant="emerald" className="text-[9px]">Paga</Badge>
                        ) : isLate ? (
                          <Badge variant="rose" className="text-[9px]">Atrasada</Badge>
                        ) : (
                          <Badge variant="amber" className="text-[9px]">Pendente</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                    <span className={`text-base font-extrabold ${isPaid ? 'text-slate-400 line-through' : 'text-amber-400'}`}>
                      {formatCurrency(bill.valor)}
                    </span>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={isPaid ? 'ghost' : 'outline'}
                        onClick={() => toggleBill({ id: bill.id, status: isPaid ? 'pendente' : 'paga' })}
                        className={!isPaid ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs px-2.5 py-1' : 'text-xs px-2 py-1'}
                      >
                        {isPaid ? 'Marcar Pendente' : 'Marcar Paga'}
                      </Button>

                      <button
                        onClick={() => deleteBill(bill.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors flex items-center gap-1 text-xs font-semibold shrink-0"
                        title="Excluir Conta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Floating Action Button (Mobile Only) */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="lg:hidden fixed bottom-20 right-4 z-40 bg-gradient-to-r from-amber-500 to-teal-400 text-slate-950 font-extrabold px-4 py-3 rounded-full shadow-2xl shadow-amber-500/40 flex items-center gap-2 text-sm active:scale-95 transition-transform"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        <span>Nova Conta</span>
      </button>

      {/* Modal Nova Conta */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cadastrar Nova Conta Fixa"
        subtitle="Adicione contas e boletos com dia de vencimento fixo"
      >
        <BillForm onSuccess={() => setIsModalOpen(false)} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};
