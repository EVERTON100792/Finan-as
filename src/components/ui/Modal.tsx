import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[maxWidth];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in overflow-hidden"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidthClasses} bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 glass-card max-h-[85dvh] max-h-[85vh] sm:max-h-[85vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile handle indicator */}
        <div className="sm:hidden w-12 h-1 bg-slate-700/60 rounded-full mx-auto mt-2.5 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-slate-800/80 bg-slate-950/40 shrink-0">
          <div className="pr-2">
            <h3 className="text-sm sm:text-base font-bold text-slate-100 leading-tight">{title}</h3>
            {subtitle && <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 leading-snug">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body - Responsive & Scrollable in Middle */}
        <div className="p-4 sm:p-5 overflow-y-auto min-h-0 flex-1 touch-pan-y space-y-3">
          {children}
        </div>

        {/* Fixed Footer at Bottom of Card - ALWAYS 100% VISIBLE */}
        {footer && (
          <div className="px-4 sm:px-5 py-3.5 border-t border-slate-800/90 bg-slate-950/95 shrink-0 pb-8 sm:pb-3.5 z-20">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
