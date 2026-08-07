import React, { useState } from 'react';
import { useFinance } from '../hooks/useFinance';
import { Card, Button, Modal, Input, Badge } from '../components/ui';
import { formatCurrency } from '../lib/utils';
import { Target, Plus, PiggyBank, Sparkles } from 'lucide-react';

export const GoalsPage: React.FC = () => {
  const { goals, addGoal, addGoalDeposit } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [depositModalGoalId, setDepositModalGoalId] = useState<string | null>(null);

  // New Goal State
  const [titulo, setTitulo] = useState('');
  const [valorAlvo, setValorAlvo] = useState<number>(5000);
  const [prazo, setPrazo] = useState('2026-12-31');

  // Deposit State
  const [depositAmount, setDepositAmount] = useState<number>(100);

  const handleCreateGoal = async () => {
    if (!titulo || !valorAlvo) return;
    await addGoal({
      titulo,
      valor_alvo: Number(valorAlvo),
      valor_atual: 0,
      prazo,
    });
    setTitulo('');
    setIsModalOpen(false);
  };

  const handleDeposit = async () => {
    if (depositModalGoalId && depositAmount > 0) {
      await addGoalDeposit({ id: depositModalGoalId, amount: Number(depositAmount) });
      setDepositModalGoalId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white font-serif flex items-center gap-2">
            <Target className="w-6 h-6 text-teal-400" />
            Metas & Objetivos Financeiros
          </h2>
          <p className="text-xs text-slate-400">Defina metas de reserva, viagens ou aquisições e acompanhe o progresso.</p>
        </div>

        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Criar Nova Meta
        </Button>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <Card className="text-center py-12 text-xs text-slate-400">
          Nenhuma meta cadastrada ainda. Defina seus objetivos de economia!
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const progressPct = Math.min(100, Math.round((goal.valor_atual / goal.valor_alvo) * 100));

            return (
              <Card key={goal.id} className="space-y-4 hover:scale-[1.01] transition-transform">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                      <PiggyBank className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">{goal.titulo}</h4>
                      <p className="text-xs text-slate-400">Prazo: {goal.prazo ? goal.prazo : 'Sem prazo fixo'}</p>
                    </div>
                  </div>

                  <Badge variant="emerald" className="text-xs">{progressPct}% concluído</Badge>
                </div>

                {/* Values */}
                <div className="flex justify-between items-baseline pt-2">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Valor Acumulado</span>
                    <p className="text-xl font-extrabold text-teal-400">{formatCurrency(goal.valor_atual)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Meta Final</span>
                    <p className="text-sm font-bold text-slate-200">{formatCurrency(goal.valor_alvo)}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                {/* Actions */}
                <div className="pt-2 flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDepositModalGoalId(goal.id)}
                    className="border-teal-500/30 text-teal-400 hover:bg-teal-500/10"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Adicionar Aporte
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Nova Meta */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Criar Nova Meta Financeira"
        subtitle="Defina o título, valor alvo e prazo limite"
      >
        <div className="space-y-4">
          <Input
            label="Título da Meta *"
            placeholder="Ex: Reserva de Emergência, Viagem..."
            value={titulo}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitulo(e.target.value)}
          />

          <Input
            type="number"
            step="0.01"
            label="Valor Alvo (R$) *"
            placeholder="10000,00"
            value={valorAlvo}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValorAlvo(parseFloat(e.target.value) || 0)}
          />

          <Input
            type="date"
            label="Prazo Limite *"
            value={prazo}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrazo(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateGoal}>Salvar Meta</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Aporte */}
      <Modal
        isOpen={Boolean(depositModalGoalId)}
        onClose={() => setDepositModalGoalId(null)}
        title="Adicionar Aporte de Economia"
        subtitle="Digite o valor economizado para incrementar a meta"
      >
        <div className="space-y-4">
          <Input
            type="number"
            step="0.01"
            label="Valor do Aporte (R$) *"
            placeholder="100,00"
            value={depositAmount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDepositAmount(parseFloat(e.target.value) || 0)}
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setDepositModalGoalId(null)}>
              Cancelar
            </Button>
            <Button onClick={handleDeposit}>Confirmar Aporte</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
