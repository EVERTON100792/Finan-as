import React from 'react';
import { MetricCard } from '../components/dashboard/MetricCard';
import { ChartsSection } from '../components/dashboard/ChartsSection';
import { UpcomingBills } from '../components/dashboard/UpcomingBills';
import { FinancialCalendar } from '../components/dashboard/FinancialCalendar';
import { useFinance } from '../hooks/useFinance';
import { Wallet, TrendingUp, TrendingDown, Clock, CheckCircle2, DollarSign, Trash2 } from 'lucide-react';
import { Card, Badge } from '../components/ui';
import { formatCurrency, formatDate } from '../lib/utils';

export const DashboardPage: React.FC = () => {
  const { stats, deleteTransaction } = useFinance();

  return (
    <div className="space-y-6 animate-fade-in pb-16 lg:pb-8">
      {/* Top Banner Greetings */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white font-serif">
            Visão Geral Financeira
          </h2>
          <p className="text-xs text-slate-400">
            Acompanhe seu saldo em tempo real, receitas, despesas e projeção para o fim do mês.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Saldo Atual"
          value={stats?.saldoAtual ?? 0}
          subtitle="Em conta corrente"
          icon={Wallet}
          variant="emerald"
          trendText="Saldo sincronizado"
        />

        <MetricCard
          title="Receitas do Mês"
          value={stats?.receitasMes ?? 0}
          subtitle="Entradas confirmadas"
          icon={TrendingUp}
          variant="emerald"
          trendText="Mês atual"
        />

        <MetricCard
          title="Despesas do Mês"
          value={stats?.despesasMes ?? 0}
          subtitle="Saídas registradas"
          icon={TrendingDown}
          variant="rose"
          trendText="Mês atual"
        />

        <MetricCard
          title="Saldo Previsto"
          value={stats?.saldoPrevisto ?? 0}
          subtitle="Após pagar contas pendentes"
          icon={DollarSign}
          variant={stats && stats.saldoPrevisto >= 0 ? 'purple' : 'rose'}
          trendText={`Contas a pagar: ${formatCurrency(stats?.contasPendentesValor)}`}
        />
      </div>

      {/* Charts Section (Receitas x Despesas & Categorias) */}
      <ChartsSection />

      {/* Bottom Grid: Upcoming Bills & Financial Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingBills />
        <FinancialCalendar />
      </div>

      {/* Recent Transactions Log */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-bold text-slate-100">Últimas Movimentações</h4>
          <span className="text-xs text-slate-400">Extrato em tempo real</span>
        </div>

        {stats?.ultimosPagamentos && stats.ultimosPagamentos.length > 0 ? (
          <div className="space-y-2">
            {stats.ultimosPagamentos.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      tx.tipo === 'receita'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {tx.tipo === 'receita' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-200">{tx.descricao}</h5>
                    <p className="text-[10px] text-slate-400">
                      {tx.categoria} • {formatDate(tx.data)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-extrabold ${
                      tx.tipo === 'receita' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {tx.tipo === 'receita' ? '+' : '-'}{formatCurrency(tx.valor)}
                  </span>

                  <button
                    onClick={() => deleteTransaction(tx.id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                    title="Excluir Transação"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-4">Nenhuma movimentação recente registrada.</p>
        )}
      </Card>
    </div>
  );
};
