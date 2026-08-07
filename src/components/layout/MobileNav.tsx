import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Scan, CalendarCheck, CreditCard, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';

const mobileNavItems = [
  { name: 'Início', path: '/', icon: LayoutDashboard },
  { name: 'Despesas', path: '/despesas', icon: TrendingDown },
  { name: 'OCR', path: '/ocr-scanner', icon: Scan, isCenter: true },
  { name: 'Contas', path: '/contas', icon: CalendarCheck },
  { name: 'Cartões', path: '/cartoes', icon: CreditCard },
];

export const MobileNav: React.FC = () => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-2">
      <div className="grid grid-cols-5 items-center max-w-md mx-auto">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          if (item.isCenter) {
            return (
              <div key={item.path} className="flex justify-center">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-center -mt-7 w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-300 text-slate-950 shadow-lg shadow-emerald-500/40 transition-transform active:scale-95 shrink-0',
                      isActive && 'ring-4 ring-emerald-400/30 scale-105'
                    )
                  }
                  title="Scanner OCR - Anexar Comprovante"
                >
                  <Icon className="w-6 h-6 stroke-[2.5]" />
                </NavLink>
              </div>
            );
          }
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-1 py-1 rounded-xl text-[10px] font-medium transition-colors',
                  isActive ? 'text-emerald-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
                )
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
