import React from 'react';
import { Card, Badge, Button } from '../ui';
import { useFinance } from '../../hooks/useFinance';
import { formatCurrency } from '../../lib/utils';
import { CalendarCheck, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const UpcomingBills: React.FC = () => {
  const { stats, toggleBill } = useFinance();
  const upcoming = stats?.proximosVencimentos || [];

  const handleMarkPaid = (id: string) => {
    toggleBill({ id, status: 'paga' });
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-amber-400" />
          <h4 className="text-base font-bold text-slate-100">Próximos Vencimentos</h4>
        </div>
        <Link to="/contas" className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1">
          Ver todas ({upcoming.length})
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {upcoming.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl">
          Nenhuma conta pendente de pagamento no momento! 🎉
        </div>
      ) : (
        <div className="space-y-2.5">
          {upcoming.slice(0, 4).map((bill) => {
            const todayDay = new Date().getDate();
            const isLate = bill.dia_vencimento < todayDay;

            return (
              <div
                key={bill.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center text-amber-400">
                    <span className="text-[10px] uppercase font-bold">Dia</span>
                    <span className="text-sm font-extrabold leading-none">{bill.dia_vencimento}</span>
                  </div>

                  <div>
                    <h5 className="text-sm font-bold text-slate-200">{bill.nome}</h5>
                    <p className="text-xs text-slate-400">{bill.categoria}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-rose-400">{formatCurrency(bill.valor)}</p>
                    {isLate ? (
                      <Badge variant="rose" className="text-[9px]">Atrasada</Badge>
                    ) : (
                      <Badge variant="amber" className="text-[9px]">Pendente</Badge>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkPaid(bill.id)}
                    className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs px-2.5 py-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Pagar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
