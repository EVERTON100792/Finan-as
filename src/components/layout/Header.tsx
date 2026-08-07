import React, { useState } from 'react';
import { Eye, EyeOff, Sun, Moon, Scan, Plus, Wallet, LogOut } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useFinance } from '../../hooks/useFinance';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../lib/utils';
import { Button } from '../ui';

interface HeaderProps {
  onOpenQuickScan: () => void;
  onOpenNewTransaction: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenQuickScan, onOpenNewTransaction }) => {
  const { isDark, toggleTheme } = useTheme();
  const { stats } = useFinance();
  const { user, profile, signOut, isSupabaseActive } = useAuth();
  const [showBalance, setShowBalance] = useState(true);

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Usuário';

  return (
    <header className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-3 lg:px-8 py-2.5 flex items-center justify-between">
      {/* Saldo rápido Header info */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
          <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-[11px] text-slate-400 font-medium hidden xs:inline">Saldo:</span>
          <span className="text-xs sm:text-sm font-extrabold text-emerald-400">
            {showBalance ? formatCurrency(stats?.saldoAtual ?? 0) : '••••••••'}
          </span>
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="text-slate-400 hover:text-white p-0.5 rounded-md transition-colors"
            title={showBalance ? 'Ocultar Saldo' : 'Mostrar Saldo'}
          >
            {showBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Action Buttons & Theme Toggler */}
      <div className="flex items-center gap-2">
        {/* Quick OCR Scanner */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenQuickScan}
          className="hidden sm:flex items-center gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs px-2.5"
        >
          <Scan className="w-3.5 h-3.5" />
          <span>Escanear OCR</span>
        </Button>

        {/* Quick New Transaction */}
        <Button size="sm" onClick={onOpenNewTransaction} className="flex items-center gap-1 text-xs px-3 py-1.5">
          <Plus className="w-4 h-4" />
          <span>Novo</span>
        </Button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          title={isDark ? 'Tema Claro' : 'Tema Escuro'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>

        {/* User Profile & Logout */}
        {isSupabaseActive && user ? (
          <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-800">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-slate-950 font-bold text-xs shadow-md shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>

            <button
              onClick={() => signOut()}
              className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors"
              title="Sair do Sistema"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-slate-950 font-bold text-xs ring-2 ring-emerald-500/20">
            U
          </div>
        )}
      </div>
    </header>
  );
};
