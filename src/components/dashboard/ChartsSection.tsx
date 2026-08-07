import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Card } from '../ui';
import { useFinance } from '../../hooks/useFinance';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const ChartsSection: React.FC = () => {
  const { stats, recipes, expenses } = useFinance();

  // Receitas vs Despesas Bar Data
  const barData = {
    labels: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho'],
    datasets: [
      {
        label: 'Receitas (R$)',
        data: [6500, 7200, 6800, 7500, 7100, 7700, stats?.receitasMes ?? 7700],
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        borderRadius: 8,
      },
      {
        label: 'Despesas (R$)',
        data: [2850, 3100, 2900, 3400, 2950, 3200, stats?.despesasMes ?? 2850],
        backgroundColor: 'rgba(244, 63, 94, 0.85)',
        borderRadius: 8,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#94a3b8',
          font: { family: 'Plus Jakarta Sans', size: 11, weight: 'bold' as const },
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#10b981',
        borderColor: '#1e293b',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 10 } },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b', font: { size: 10 } },
      },
    },
  };

  // Despesas por Categoria Doughnut Data
  const catEntries = Object.entries(stats?.despesasPorCategoria || {
    'Alimentação': 850,
    'Moradia': 1750,
    'Transporte': 250,
  });

  const doughnutData = {
    labels: catEntries.map(([cat]) => cat),
    datasets: [
      {
        data: catEntries.map(([, val]) => val),
        backgroundColor: [
          '#10b981', '#f43f5e', '#3b82f6', '#f59e0b',
          '#8b5cf6', '#ec4899', '#06b6d4', '#a855f7'
        ],
        borderWidth: 2,
        borderColor: '#0f172a',
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#94a3b8',
          font: { family: 'Plus Jakarta Sans', size: 10 },
          boxWidth: 12,
        },
      },
    },
    cutout: '70%',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Gráfico 1: Receitas x Despesas */}
      <Card className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-slate-100">Comparativo Receitas x Despesas</h4>
            <p className="text-xs text-slate-400">Evolução dos lançamentos nos últimos meses</p>
          </div>
        </div>

        <div className="h-64">
          <Bar data={barData} options={barOptions} />
        </div>
      </Card>

      {/* Gráfico 2: Despesas por Categoria */}
      <Card className="space-y-4">
        <div>
          <h4 className="text-base font-bold text-slate-100">Despesas por Categoria</h4>
          <p className="text-xs text-slate-400">Distribuição percentual dos gastos do mês</p>
        </div>

        <div className="h-64 relative flex items-center justify-center">
          {catEntries.length > 0 ? (
            <Doughnut data={doughnutData} options={doughnutOptions} />
          ) : (
            <p className="text-xs text-slate-400">Sem despesas registradas no mês</p>
          )}
        </div>
      </Card>
    </div>
  );
};
