import React, { useState } from 'react';
import { Card, Badge } from '../ui';
import { useFinance } from '../../hooks/useFinance';
import { formatCurrency, getCurrentMonthName } from '../../lib/utils';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export const FinancialCalendar: React.FC = () => {
  const { recipes, expenses, bills } = useFinance();
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayIndex }, (_, i) => i);

  // Group events by day of current month
  const getDayEvents = (day: number) => {
    const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const recs = recipes.filter(r => r.data === dayStr);
    const exps = expenses.filter(e => e.data === dayStr);
    const blls = bills.filter(b => b.dia_vencimento === day);

    return { recs, exps, blls };
  };

  const selectedEvents = getDayEvents(selectedDay);

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-emerald-400" />
          <div>
            <h4 className="text-base font-bold text-slate-100">Calendário Financeiro</h4>
            <p className="text-xs text-slate-400">{getCurrentMonthName()} {currentYear}</p>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
          <div key={d} className="font-semibold text-slate-400 py-1">
            {d}
          </div>
        ))}

        {emptyDays.map((_, i) => (
          <div key={`empty-${i}`} className="h-9 rounded-lg" />
        ))}

        {daysArray.map((day) => {
          const { recs, exps, blls } = getDayEvents(day);
          const isToday = day === today.getDate();
          const isSelected = day === selectedDay;
          const hasEvents = recs.length > 0 || exps.length > 0 || blls.length > 0;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`h-9 rounded-xl flex flex-col items-center justify-center relative transition-all text-xs font-semibold ${
                isSelected
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                  : isToday
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40'
                  : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              <span>{day}</span>
              {hasEvents && !isSelected && (
                <div className="flex gap-0.5 mt-0.5">
                  {recs.length > 0 && <div className="w-1 h-1 rounded-full bg-emerald-400" />}
                  {exps.length > 0 && <div className="w-1 h-1 rounded-full bg-rose-400" />}
                  {blls.length > 0 && <div className="w-1 h-1 rounded-full bg-amber-400" />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Event Detail */}
      <div className="pt-3 border-t border-slate-800 space-y-2">
        <h5 className="text-xs font-bold text-slate-300">
          Lançamentos do dia {selectedDay} de {getCurrentMonthName()}:
        </h5>

        {selectedEvents.recs.length === 0 &&
        selectedEvents.exps.length === 0 &&
        selectedEvents.blls.length === 0 ? (
          <p className="text-[11px] text-slate-500">Nenhuma movimentação registrada para este dia.</p>
        ) : (
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {selectedEvents.recs.map(r => (
              <div key={r.id} className="flex justify-between items-center text-xs p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                <span>🟢 {r.descricao}</span>
                <span className="font-bold">{formatCurrency(r.valor)}</span>
              </div>
            ))}
            {selectedEvents.exps.map(e => (
              <div key={e.id} className="flex justify-between items-center text-xs p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
                <span>🔴 {e.descricao}</span>
                <span className="font-bold">-{formatCurrency(e.valor)}</span>
              </div>
            ))}
            {selectedEvents.blls.map(b => (
              <div key={b.id} className="flex justify-between items-center text-xs p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                <span>📌 Vencimento: {b.nome}</span>
                <span className="font-bold">{formatCurrency(b.valor)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
