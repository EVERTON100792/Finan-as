import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Scan,
  TrendingUp,
  TrendingDown,
  CalendarCheck,
  CreditCard,
  Layers,
  ListOrdered,
  FileText,
  Target,
  Settings,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { isSupabaseConfigured } from '../../lib/supabase';
import { openPwaInstallModal } from '../pwa/InstallPwaBanner';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Scanner OCR', path: '/ocr-scanner', icon: Scan, badge: 'IA OCR' },
  { name: 'Receitas', path: '/receitas', icon: TrendingUp },
  { name: 'Despesas', path: '/despesas', icon: TrendingDown },
  { name: 'Contas Fixas', path: '/contas', icon: CalendarCheck },
  { name: 'Cartões', path: '/cartoes', icon: CreditCard },
  { name: 'Parcelamentos', path: '/parcelamentos', icon: Layers },
  { name: 'Extrato Geral', path: '/extrato', icon: ListOrdered },
  { name: 'Relatórios PDF', path: '/relatorios', icon: FileText },
  { name: 'Metas', path: '/metas', icon: Target },
  { name: 'Configurações', path: '/configuracoes', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800/80 bg-slate-950/90 min-h-screen p-4 sticky top-0 h-screen z-30">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-3 py-4 mb-4 border-b border-slate-800/80">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/25 shrink-0">
          <Scan className="w-5 h-5 font-bold stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-sm font-extrabold tracking-tight text-white font-serif leading-tight">Segura Na Mão de Deus</h1>
          <p className="text-[10px] text-emerald-400 font-medium tracking-wide uppercase">Controle Inteligente</p>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                )
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded-md border border-emerald-500/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* PWA App Install Banner trigger */}
      <div className="pt-3 mb-2">
        <button
          onClick={openPwaInstallModal}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-950/50 to-slate-900 border border-emerald-500/30 text-emerald-400 hover:border-emerald-500/60 transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <div className="text-left text-xs">
              <p className="font-bold text-slate-200">Instalar no Celular</p>
              <p className="text-[10px] text-emerald-400">Android & iPhone (iOS)</p>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/40">
            PWA
          </span>
        </button>
      </div>

      {/* Database Status Footer */}
      <div className="mt-auto pt-4 border-t border-slate-800/80">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className={cn('w-4 h-4', isSupabaseConfigured ? 'text-emerald-400' : 'text-amber-400')} />
            <div className="text-xs">
              <p className="font-semibold text-slate-200">
                {isSupabaseConfigured ? 'Supabase Conectado' : 'Modo Offline / Local'}
              </p>
              <p className="text-[10px] text-slate-400">
                {isSupabaseConfigured ? 'Postgres RLS Ativo' : 'Sincronização LocalDB'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
