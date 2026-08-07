import React, { useState, useEffect } from 'react';
import { Download, Share, X, Smartphone, Sparkles, ChevronRight } from 'lucide-react';
import { InstallPwaModal } from './InstallPwaModal';

export const InstallPwaBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Check if already running in standalone mode (installed PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    
    setIsInstalled(isStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check localStorage dismissal
    const dismissedTime = localStorage.getItem('pwa_banner_dismissed');
    if (dismissedTime) {
      const daysPassed = (Date.now() - parseInt(dismissedTime, 10)) / (1000 * 60 * 60 * 24);
      if (daysPassed < 3) {
        setDismissed(true);
      }
    }

    // Listen for beforeinstallprompt event (Android / Desktop Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    // Listen for custom trigger event (e.g. click "Instalar App" in Header)
    const handleCustomTrigger = () => {
      setIsModalOpen(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('open-pwa-install-modal', handleCustomTrigger);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('open-pwa-install-modal', handleCustomTrigger);
    };
  }, []);

  const handleInstallAndroid = async () => {
    if (!deferredPrompt) {
      setIsModalOpen(true);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsModalOpen(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa_banner_dismissed', Date.now().toString());
  };

  // If app is already installed, don't show the floating banner (modal can still be opened via header)
  if (isInstalled) {
    return (
      <InstallPwaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isIOS={isIOS}
        deferredPrompt={deferredPrompt}
        onInstallAndroid={handleInstallAndroid}
      />
    );
  }

  return (
    <>
      {!dismissed && (
        <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-40 sm:max-w-md animate-in slide-in-from-bottom duration-300">
          <div className="relative overflow-hidden rounded-2xl bg-slate-900/95 border border-emerald-500/30 p-4 shadow-2xl backdrop-blur-xl text-slate-100 flex items-center justify-between gap-3">
            {/* Glow accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />
            
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 border border-emerald-500/30">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Aplicativo Móvel</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </div>
                <p className="text-sm font-bold text-slate-100 truncate">
                  Instalar no seu Celular
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {isIOS ? 'Compatível com iPhone (iOS)' : 'Compatível com Android e PC'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  if (deferredPrompt) {
                    handleInstallAndroid();
                  } else {
                    setIsModalOpen(true);
                  }
                }}
                className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
              >
                {isIOS ? <Share className="w-3.5 h-3.5 text-slate-950" /> : <Download className="w-3.5 h-3.5 text-slate-950" />}
                <span>Instalar</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-950 opacity-70" />
              </button>

              <button
                onClick={handleDismiss}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Installation guide modal */}
      <InstallPwaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isIOS={isIOS}
        deferredPrompt={deferredPrompt}
        onInstallAndroid={handleInstallAndroid}
      />
    </>
  );
};

// Helper trigger function for components (Header, Sidebar, Settings)
export const openPwaInstallModal = () => {
  window.dispatchEvent(new CustomEvent('open-pwa-install-modal'));
};
