import React, { useState } from 'react';
import { useFinance } from '../hooks/useFinance';
import { Card, Button, Modal, Badge } from '../components/ui';
import { CardForm } from '../components/forms/CardForm';
import { formatCurrency } from '../lib/utils';
import { CreditCard as CardIcon, Plus, Trash2 } from 'lucide-react';

export const CardsPage: React.FC = () => {
  const { cards, deleteCard, installments } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in pb-28 lg:pb-8 relative min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white font-serif flex items-center gap-2">
            <CardIcon className="w-6 h-6 text-purple-400" />
            Cartões de Crédito
          </h2>
          <p className="text-xs text-slate-400">Controle limites, datas de fechamento e faturas dos seus cartões.</p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto py-3">
          <Plus className="w-4 h-4 mr-1.5" />
          Cadastrar Novo Cartão
        </Button>
      </div>

      {/* Cards Grid */}
      {cards.length === 0 ? (
        <Card className="text-center py-12 text-sm text-slate-400 space-y-3">
          <CardIcon className="w-12 h-12 text-slate-600 mx-auto opacity-50" />
          <p>Nenhum cartão de crédito cadastrado ainda.</p>
          <Button onClick={() => setIsModalOpen(true)} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-1" /> Cadastrar Primeiro Cartão
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card) => {
            const usedLimit = installments
              .filter((i) => i.cartao_id === card.id)
              .reduce((sum, i) => sum + Number(i.valor_total), 0);

            const availableLimit = Math.max(0, card.limite - usedLimit);
            const usagePercent = Math.min(100, Math.round((usedLimit / card.limite) * 100));

            return (
              <div
                key={card.id}
                className="relative rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl overflow-hidden glass-card transition-all hover:scale-[1.01]"
                style={{
                  background: `linear-gradient(135deg, ${card.cor_hex}22 0%, rgba(15, 23, 42, 0.95) 100%)`,
                }}
              >
                {/* Bank badge & Delete action */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: card.cor_hex }}
                    />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                      {card.banco}
                    </span>
                  </div>

                  <button
                    onClick={() => deleteCard(card.id)}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors flex items-center gap-1 text-xs font-semibold shrink-0"
                    title="Excluir Cartão"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>

                {/* Card Title */}
                <h3 className="text-xl font-extrabold text-white mt-4">{card.nome}</h3>
                <p className="text-[10px] text-slate-400 tracking-widest font-mono mt-1">•••• •••• •••• 4092</p>

                {/* Dates Info */}
                <div className="grid grid-cols-2 gap-2 mt-6 pt-4 border-t border-slate-800/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Fechamento</span>
                    <p className="font-bold text-slate-200">Dia {card.fechamento}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Vencimento</span>
                    <p className="font-bold text-purple-400">Dia {card.vencimento}</p>
                  </div>
                </div>

                {/* Limit Progress Bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Limite Utilizado ({usagePercent}%)</span>
                    <span className="font-bold text-emerald-400">{formatCurrency(availableLimit)} disponível</span>
                  </div>

                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${usagePercent}%`,
                        backgroundColor: card.cor_hex,
                      }}
                    />
                  </div>

                  <p className="text-[10px] text-slate-500 text-right">
                    Limite total: {formatCurrency(card.limite)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Action Button (Mobile Only) */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="lg:hidden fixed bottom-20 right-4 z-40 bg-gradient-to-r from-purple-500 to-teal-400 text-slate-950 font-extrabold px-4 py-3 rounded-full shadow-2xl shadow-purple-500/40 flex items-center gap-2 text-sm active:scale-95 transition-transform"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        <span>Novo Cartão</span>
      </button>

      {/* Modal Novo Cartão */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cadastrar Cartão de Crédito"
        subtitle="Configure nome, limite, vencimento e cor"
      >
        <CardForm onSuccess={() => setIsModalOpen(false)} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};
