"use client";

import "./globals.css";


import { AuthProvider, useAuth } from "@/lib/AuthContext";
import {
  LayoutDashboard,
  ArrowUpCircle,
  ArrowDownCircle,
  PieChart,
  Settings,
  User,
  LogOut
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { settingsService } from "@/services/settingsService";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Receitas", href: "/receitas", icon: ArrowUpCircle },
  { name: "Despesas", href: "/despesas", icon: ArrowDownCircle },
  { name: "Relatórios", href: "/relatorios", icon: PieChart },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      router.push("/login");
    }
  }, [user, loading, isLoginPage, router]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = settingsService.subscribeToSettings(user.uid, (data) => {
      if (data.theme) {
        document.documentElement.classList.toggle('dark', data.theme === 'dark');
      }
    });
    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!user) return null;

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-background overflow-hidden">
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="hidden md:flex w-72 flex-col p-6 shrink-0 h-full border-r border-white/5 relative bg-background">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-xl font-bold text-white">F</span>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-foreground">Financeiro</h1>
            <p className="text-[10px] text-primary font-black uppercase tracking-widest">Sincronizado</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group border border-transparent",
                pathname === item.href
                  ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
                  : "text-slate-400 hover:text-foreground hover:bg-foreground/5"
              )}
            >
              <item.icon size={20} className={cn(pathname === item.href ? "text-primary" : "text-slate-500 group-hover:text-slate-300")} />
              <span className="font-bold text-sm tracking-tight">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="pt-6 border-t border-white/5 mt-auto space-y-4">
          <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-foreground/5 border border-white/5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <User size={18} className="text-primary" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate text-foreground uppercase tracking-tight">{user.displayName || "Usuário Pro"}</p>
              <p className="text-[9px] text-slate-500 truncate font-medium">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-danger hover:bg-danger/10 transition-all font-black text-[10px] uppercase tracking-widest"
          >
            <LogOut size={16} />
            Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:p-8 custom-scrollbar pb-24 md:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation - Visible only on small screens */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-background/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-4 z-50">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 p-2 transition-all rounded-xl",
              pathname === item.href ? "text-primary scale-110" : "text-slate-500"
            )}
          >
            <item.icon size={pathname === item.href ? 24 : 20} className={pathname === item.href ? "fill-primary/20" : ""} />
            <span className="text-[9px] font-black uppercase tracking-tighter">{item.name}</span>
          </Link>
        ))}
        <button
          onClick={() => router.push('/configuracoes')}
          className={cn(
            "flex flex-col items-center gap-1 p-2 transition-all",
            pathname === '/configuracoes' ? "text-primary" : "text-slate-500"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <User size={18} className="text-primary" />
          </div>
        </button>
      </nav>
    </div>
  );
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}

