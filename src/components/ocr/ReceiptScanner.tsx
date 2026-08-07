import React, { useState } from 'react';
import { Upload, Scan, FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { processReceiptOCR } from '../../lib/ocr';
import { OCRParseResult } from '../../types';
import { Button } from '../ui';

interface ReceiptScannerProps {
  onScanComplete: (result: OCRParseResult, imagePreviewUrl?: string) => void;
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onScanComplete }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    setErrorMsg(null);
    setIsScanning(true);
    setProgressPercent(10);
    setProgressText('Carregando comprovante...');

    // Preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      const result = await processReceiptOCR(file, (pct, status) => {
        setProgressPercent(pct);
        setProgressText(status);
      });

      setIsScanning(false);
      onScanComplete(result, objectUrl);
    } catch (err) {
      console.error('Erro na leitura OCR:', err);
      setIsScanning(false);
      setErrorMsg('Não foi possível ler o texto do comprovante. Tente enviar uma imagem mais nítida.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="relative border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-8 text-center bg-slate-900/40 hover:bg-slate-900/80 transition-all cursor-pointer group"
      >
        <input
          type="file"
          accept="image/*,application/pdf"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
          disabled={isScanning}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
            {isScanning ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <Scan className="w-7 h-7 stroke-[2]" />
            )}
          </div>

          <div>
            <h4 className="text-base font-bold text-slate-100">
              {isScanning ? 'Lendo comprovante via Tesseract OCR...' : 'Arraste a foto ou PDF do comprovante'}
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Suporta fotos de recibos, comprovantes PIX, boletos e PDFs bancários (PNG, JPG, PDF)
            </p>
          </div>

          {!isScanning && (
            <Button type="button" variant="outline" size="sm" className="mt-2 pointer-events-none">
              <Upload className="w-4 h-4 mr-2" />
              Selecionar Arquivo
            </Button>
          )}
        </div>
      </div>

      {/* OCR Processing Bar */}
      {isScanning && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 animate-fade-in">
          <div className="flex justify-between text-xs font-semibold text-slate-300">
            <span>{progressText}</span>
            <span className="text-emerald-400">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2.5 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
