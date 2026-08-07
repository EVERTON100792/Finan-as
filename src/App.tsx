import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';

import { DashboardPage } from './pages/DashboardPage';
import { RecipesPage } from './pages/RecipesPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { BillsPage } from './pages/BillsPage';
import { CardsPage } from './pages/CardsPage';
import { InstallmentsPage } from './pages/InstallmentsPage';
import { StatementPage } from './pages/StatementPage';
import { OCRScanPage } from './pages/OCRScanPage';
import { ReportsPage } from './pages/ReportsPage';
import { GoalsPage } from './pages/GoalsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';

import { Modal } from './components/ui';
import { ExpenseForm } from './components/forms/ExpenseForm';
import { ReceiptScanner } from './components/ocr/ReceiptScanner';
import { OCRConfirmModal } from './components/ocr/OCRConfirmModal';
import { OCRParseResult } from './types';
import { Cloud, HeartHandshake } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

const MainLayout: React.FC = () => {
  const { user, loading, isSupabaseActive } = useAuth();

  const [isQuickScanOpen, setIsQuickScanOpen] = useState(false);
  const [isNewTxOpen, setIsNewTxOpen] = useState(false);

  // OCR state for quick scan modal
  const [quickOcrResult, setQuickOcrResult] = useState<OCRParseResult | null>(null);
  const [isOcrConfirmOpen, setIsOcrConfirmOpen] = useState(false);

  const handleQuickScanComplete = (result: OCRParseResult) => {
    setQuickOcrResult(result);
    setIsQuickScanOpen(false);
    setIsOcrConfirmOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-xl shadow-emerald-500/30 animate-bounce mb-4">
          <HeartHandshake className="w-8 h-8 stroke-[2.5]" />
        </div>
        <p className="text-sm font-semibold text-emerald-400 tracking-wide uppercase">Carregando Segura Na Mão de Deus...</p>
        <p className="text-xs text-slate-400 mt-1">Conectando ao banco de dados em nuvem</p>
      </div>
    );
  }

  if (isSupabaseActive && !user) {
    return <LoginPage />;
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-slate-950 text-slate-100 antialiased font-sans">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <Header
            onOpenQuickScan={() => setIsQuickScanOpen(true)}
            onOpenNewTransaction={() => setIsNewTxOpen(true)}
          />

          {/* Page Route Views */}
          <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/ocr-scanner" element={<OCRScanPage />} />
              <Route path="/receitas" element={<RecipesPage />} />
              <Route path="/despesas" element={<ExpensesPage />} />
              <Route path="/contas" element={<BillsPage />} />
              <Route path="/cartoes" element={<CardsPage />} />
              <Route path="/parcelamentos" element={<InstallmentsPage />} />
              <Route path="/extrato" element={<StatementPage />} />
              <Route path="/relatorios" element={<ReportsPage />} />
              <Route path="/metas" element={<GoalsPage />} />
              <Route path="/configuracoes" element={<SettingsPage />} />
            </Routes>
          </main>

          {/* Mobile Bottom Navigation */}
          <MobileNav />
        </div>

        {/* Quick Expense Modal */}
        <Modal
          isOpen={isNewTxOpen}
          onClose={() => setIsNewTxOpen(false)}
          title="Novo Lançamento Rápido"
          subtitle="Cadastre uma despesa e atualize seu saldo em tempo real"
        >
          <ExpenseForm onSuccess={() => setIsNewTxOpen(false)} onCancel={() => setIsNewTxOpen(false)} />
        </Modal>

        {/* Quick OCR Scanner Modal */}
        <Modal
          isOpen={isQuickScanOpen}
          onClose={() => setIsQuickScanOpen(false)}
          title="Escanear Comprovante OCR"
          subtitle="Envie uma foto ou PDF do recibo para leitura inteligente"
        >
          <ReceiptScanner onScanComplete={handleQuickScanComplete} />
        </Modal>

        {/* OCR Validation Confirm Modal */}
        <OCRConfirmModal
          isOpen={isOcrConfirmOpen}
          onClose={() => setIsOcrConfirmOpen(false)}
          ocrData={quickOcrResult}
        />
      </div>
    </Router>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
