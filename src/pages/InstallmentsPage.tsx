import React, { useState } from 'react';
import { useFinance } from '../hooks/useFinance';
import { Card, Button, Modal, Badge } from '../components/ui';
import { InstallmentForm } from '../components/forms/InstallmentForm';
import { formatCurrency } from '../lib/utils';
import { Layers, Plus, CheckCircle2, ShoppingBag } from 'lucide-react';

export const InstallmentsPage: React.FC = () => {
  const { installments, payInstallment, cards } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getCardName = (cardId?: string) => {
    if (!cardId) return 'Sem cartão vinculado';
    const card = cards.find((c) => c.id === cardId);
    return card ? `${card.nome} (${card.banco})` : 'Cartão de Crédito';
  };

  return (
    <div className="space-y-6 animate-fade-in pb-28 lg:pb-8 relative min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white font-serif flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-400" />
            Controle de Parcelamentos
          </h2>
          <p className="text-xs text-slate-400">Acompanhe suas compras parceladas e abata parcelas mensalmente.</p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto py-3">
          <Plus className="w-4 h-4 mr-1.5" />
          Cadastrar Novo Parcelamento
        </Button>
      </div>

      {/* Installments List */}
      <Card className="space-y-4 p-3 sm:p-6">
        <h4 className="text-base font-bold text-slate-100">Compras Parceladas Ativas</h4>

        {installments.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-400 space-y-3">
            <Layers className="w-12 h-12 text-slate-600 mx-auto opacity-50" />
            <p>Nenhum parcelamento registrado ainda.</p>
            <Button onClick={() => setIsModalOpen(true)} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-1" /> Cadastrar Primeiro Parcelamento
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {installments.map((item) => {
              const isFinished = item.parcelas_restantes === 0;
              const progressPct = Math.round((item.parcelas_pagas / item.qtd_parcelas) * 100);

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-slate-100">{item.produto}</h5>
                        <p className="text-xs text-slate-400">{getCardName(item.cartao_id)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-extrabold text-white">{formatCurrency(item.valor_total)}</p>
                        <p className="text-xs text-emerald-400 font-semibold">
                          {formatCurrency(item.valor_parcela)} / mês
                        </p>
                      </div>

                      {!isFinished && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => payInstallment(item.id)}
                          className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs px-3 py-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Abater
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress info */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>
                        Parcelas: <strong className="text-slate-200">{item.parcelas_pagas} de {item.qtd_parcelas} pagas</strong>
                      </span>
                      <span>
                        Restantes: <strong className="text-indigo-400">{item.parcelas_restantes} parcelas</strong>
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
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
        className="lg:hidden fixed bottom-20 right-4 z-40 bg-gradient-to-r from-indigo-500 to-teal-400 text-slate-950 font-extrabold px-4 py-3 rounded-full shadow-2xl shadow-indigo-500/40 flex items-center gap-2 text-sm active:scale-95 transition-transform"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        <span>Novo Parcelamento</span>
      </button>

      {/* Modal Novo Parcelamento */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cadastrar Novo Parcelamento"
        subtitle="Registre uma compra dividida em parcelas mensais"
      >
        <InstallmentForm onSuccess={() => setIsModalOpen(false)} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};
