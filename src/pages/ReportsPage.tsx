import React, { useState } from 'react';
import { useFinance } from '../hooks/useFinance';
import { Card, Button, Badge } from '../components/ui';
import { generateFinancialPDFReport, downloadPDF } from '../lib/pdf';
import { formatCurrency } from '../lib/utils';
import { FileText, Download, Filter, Calendar } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { recipes, expenses, bills, cards } = useFinance();
  const [periodType, setPeriodType] = useState<'mensal' | 'diario' | 'semanal' | 'anual'>('mensal');
  const [groupBy, setGroupBy] = useState<'geral' | 'categoria' | 'cartao' | 'conta'>('geral');
  const [isGenerating, setIsGenerating] = useState(false);

  const totalReceitas = recipes.reduce((sum, r) => sum + Number(r.valor), 0);
  const totalDespesas = expenses.reduce((sum, e) => sum + Number(e.valor), 0);
  const balanco = totalReceitas - totalDespesas;

  const handleExportPDF = async () => {
    setIsGenerating(true);

    try {
      const pdfBytes = await generateFinancialPDFReport({
        title: `Relatório Financeiro ${periodType.toUpperCase()} - Agrupado por ${groupBy.toUpperCase()}`,
        subtitle: 'Resumo completo de receitas, despesas e balanço',
        periodText: `Período: ${new Date().toLocaleDateString('pt-BR')}`,
        profile: {
          id: 'user',
          email: 'usuario@meufinanceiro.com',
          full_name: 'Usuário',
          current_balance: balanco,
          created_at: new Date().toISOString(),
        },
        recipes,
        expenses,
        bills,
        cards,
      });

      downloadPDF(pdfBytes, `Relatorio_MeuFinanceiro_${periodType}_${Date.now()}.pdf`);
      setIsGenerating(false);
    } catch (err) {
      console.error('Erro na geração do PDF:', err);
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white font-serif flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" />
            Relatórios Financeiros & Exportação PDF
          </h2>
          <p className="text-xs text-slate-400">Gere relatórios detalhados com exportação nativa em PDF.</p>
        </div>

        <Button onClick={handleExportPDF} isLoading={isGenerating} className="bg-emerald-500 hover:bg-emerald-600">
          <Download className="w-4 h-4 mr-2" />
          Exportar Relatório PDF
        </Button>
      </div>

      {/* Filter Options */}
      <Card className="space-y-4">
        <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-400" />
          Filtros do Relatório
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-400">Período *</label>
            <div className="grid grid-cols-4 gap-2">
              {(['diario', 'semanal', 'mensal', 'anual'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriodType(p)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold uppercase transition-colors ${
                    periodType === p
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-400">Agrupar Por *</label>
            <div className="grid grid-cols-4 gap-2">
              {(['geral', 'categoria', 'cartao', 'conta'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGroupBy(g)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold uppercase transition-colors ${
                    groupBy === g
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Box */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="text-center space-y-1">
          <span className="text-xs font-semibold text-slate-400">Total Receitas</span>
          <h3 className="text-2xl font-extrabold text-emerald-400">{formatCurrency(totalReceitas)}</h3>
        </Card>

        <Card className="text-center space-y-1">
          <span className="text-xs font-semibold text-slate-400">Total Despesas</span>
          <h3 className="text-2xl font-extrabold text-rose-400">{formatCurrency(totalDespesas)}</h3>
        </Card>

        <Card className="text-center space-y-1">
          <span className="text-xs font-semibold text-slate-400">Balanço do Período</span>
          <h3 className={`text-2xl font-extrabold ${balanco >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(balanco)}
          </h3>
        </Card>
      </div>

      {/* Preview Section */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-sm font-bold text-slate-200">Pré-visualização dos Dados para PDF</h4>
          <Badge variant="emerald">{recipes.length + expenses.length} lançamentos no relatório</Badge>
        </div>

        <div className="space-y-2">
          {expenses.slice(0, 5).map((exp) => (
            <div key={exp.id} className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div>
                <span className="font-bold text-slate-200">{exp.descricao}</span>
                <p className="text-[10px] text-slate-400">{exp.categoria} • {exp.forma_pagamento.toUpperCase()}</p>
              </div>
              <span className="font-extrabold text-rose-400">-{formatCurrency(exp.valor)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
