import React from 'react';
import { X, Smartphone, Share, PlusSquare, Download, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  deferredPrompt: any;
  onInstallAndroid: () => void;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({
  isOpen,
  onClose,
  isIOS,
  deferredPrompt,
  onInstallAndroid,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden">
      <div 
        className="relative w-full max-w-lg max-h-[88vh] max-h-[88dvh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-5 sm:p-8 text-slate-100 touch-pan-y"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-full transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 shadow-lg shadow-emerald-500/20">
            <Smartphone className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Instalar Aplicativo
            </h3>
            <p className="text-sm text-emerald-400 font-medium">
              Segura Na Mão de Deus - Finanças
            </p>
          </div>
        </div>

        {/* Benefits list */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs text-slate-300 font-medium">Acesso Instantâneo</span>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs text-slate-300 font-medium">Sem Loja de Apps</span>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs text-slate-300 font-medium">Modo Tela Cheia</span>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs text-slate-300 font-medium">Funciona Offline</span>
          </div>
        </div>

        {/* Dynamic instructions based on platform */}
        {isIOS ? (
          <div className="space-y-4 mb-6">
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
              <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-2">
                Instruções para iPhone / iPad (iOS Safari):
              </p>
              <ol className="space-y-3 text-sm text-slate-200">
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold shrink-0">1</span>
                  <span>No navegador Safari, toque no botão <strong>Compartilhar</strong> <Share className="inline w-4 h-4 mx-1 text-emerald-400" /> no menu inferior do iPhone.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold shrink-0">2</span>
                  <span>Role a lista de opções para baixo e toque em <strong>"Adicionar à Tela de Início"</strong> <PlusSquare className="inline w-4 h-4 mx-1 text-emerald-400" />.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold shrink-0">3</span>
                  <span>Toque em <strong>"Adicionar"</strong> no canto superior direito para confirmar.</span>
                </li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            <p className="text-sm text-slate-300 leading-relaxed">
              Instale o aplicativo diretamente no seu celular Android ou computador. Ele ocupará pouquíssimo espaço e ficará disponível direto na sua lista de aplicativos!
            </p>
            {deferredPrompt ? (
              <button
                onClick={onInstallAndroid}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-base shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95"
              >
                <Download className="w-5 h-5 text-slate-950" />
                Instalar Agora no Celular
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
                <p className="font-semibold text-slate-200 mb-1">Dica de instalação manual (Android / Chrome):</p>
                <p>Toque no menu de três pontos <strong>⋮</strong> no canto superior direito do seu navegador e selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
