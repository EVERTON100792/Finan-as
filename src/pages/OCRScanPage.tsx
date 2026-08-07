import React, { useState } from 'react';
import { ReceiptScanner } from '../components/ocr/ReceiptScanner';
import { OCRConfirmModal } from '../components/ocr/OCRConfirmModal';
import { OCRParseResult } from '../types';
import { Card } from '../components/ui';
import { Scan, Sparkles, ShieldCheck } from 'lucide-react';

export const OCRScanPage: React.FC = () => {
  const [scanResult, setScanResult] = useState<OCRParseResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | undefined>(undefined);

  const handleScanComplete = (result: OCRParseResult, previewUrl?: string) => {
    setScanResult(result);
    setImagePreviewUrl(previewUrl);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 lg:pb-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white font-serif flex items-center gap-2">
          <Scan className="w-6 h-6 text-emerald-400" />
          Leitor OCR de Comprovantes
        </h2>
        <p className="text-xs text-slate-400">
          Envie fotos de recibos, comprovantes de PIX ou PDFs bancários para extração automática via Tesseract.js.
        </p>
      </div>

      <Card className="space-y-6">
        <ReceiptScanner onScanComplete={handleScanComplete} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-xs">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-200">Extração Inteligente</p>
              <p className="text-slate-400 text-[11px]">Detecta valor, data, hora, favorecido e código da transação.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-200">Validação Antes de Registrar</p>
              <p className="text-slate-400 text-[11px]">Você confirma e ajusta qualquer campo antes do lançamento.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Scan className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-200">100% Local e Gratuito</p>
              <p className="text-slate-400 text-[11px]">Sem uso de APIs pagas de IA ou envio de dados a terceiros.</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Confirmation Modal */}
      <OCRConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ocrData={scanResult}
        imagePreviewUrl={imagePreviewUrl}
      />
    </div>
  );
};
