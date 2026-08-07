import React, { useState } from 'react';
import { useFinance } from '../hooks/useFinance';
import { Card, Input } from '../components/ui';
import { formatCurrency, formatDate } from '../lib/utils';
import { ListOrdered, Search, TrendingUp, TrendingDown } from 'lucide-react';

export const StatementPage: React.FC = () => {
  const { transactions } = useFinance();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'todos' | 'receita' | 'despesa'>('todos');

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'todos' || tx.tipo === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-16 lg:pb-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white font-serif flex items-center gap-2">
          <ListOrdered className="w-6 h-6 text-emerald-400" />
          Extrato Financeiro Unificado
        </h2>
        <p className="text-xs text-slate-400">Histórico completo de entradas, saídas e movimentações.</p>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <Input
            placeholder="Buscar por descrição ou categoria no extrato..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </Card>

        <Card className="flex items-center justify-around">
          <button
            onClick={() => setFilterType('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              filterType === 'todos' ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30' : 'text-slate-400'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterType('receita')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              filterType === 'receita' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400'
            }`}
          >
            Receitas
          </button>
          <button
            onClick={() => setFilterType('despesa')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              filterType === 'despesa' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400'
            }`}
          >
            Despesas
          </button>
        </Card>
      </div>

      {/* Transactions List */}
      <Card className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            Nenhuma movimentação encontrada para os filtros selecionados.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="py-3 flex items-center justify-between hover:bg-slate-900/40 px-2 rounded-xl transition-colors"
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
                    <h4 className="text-xs font-bold text-slate-200">{tx.descricao}</h4>
                    <p className="text-[10px] text-slate-400">
                      {tx.categoria} • {formatDate(tx.data)}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-sm font-extrabold ${
                    tx.tipo === 'receita' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {tx.tipo === 'receita' ? '+' : '-'}{formatCurrency(tx.valor)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
