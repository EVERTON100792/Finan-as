import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Scan, Loader2, AlertCircle, Sparkles, FileText } from 'lucide-react';
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

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    setErrorMsg(null);
    setIsScanning(true);
    setProgressPercent(10);
    setProgressText('Carregando foto/comprovante...');

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
      setErrorMsg('Não foi possível ler o texto da imagem. Tente tirar uma foto mais nítida e bem iluminada.');
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
      {/* Hidden File Inputs */}
      {/* Direct Camera Input for Mobile */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
          }
        }}
      />

      {/* Gallery / Document Input */}
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
          }
        }}
      />

      {/* Action Buttons: Camera vs Gallery */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isScanning}
          className="flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-b from-emerald-500/20 to-teal-900/30 border-2 border-emerald-500/40 hover:border-emerald-400 text-white transition-all transform active:scale-98 group cursor-pointer shadow-lg shadow-emerald-500/10"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
            <Camera className="w-6 h-6" />
          </div>
          <span className="text-sm font-bold text-slate-100">📸 Tirar Foto da Notinha</span>
          <span className="text-[11px] text-emerald-400 mt-0.5">Abre a Câmera do Celular</span>
        </button>

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={isScanning}
          className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-900/60 border-2 border-slate-700/80 hover:border-slate-600 text-white transition-all transform active:scale-98 group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
            <ImageIcon className="w-6 h-6 text-teal-400" />
          </div>
          <span className="text-sm font-bold text-slate-100">📁 Escolher Foto / PDF</span>
          <span className="text-[11px] text-slate-400 mt-0.5">Galeria ou Comprovante Salvo</span>
        </button>
      </div>

      {/* Dropzone Alternative */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => galleryInputRef.current?.click()}
        className="border border-dashed border-slate-700/80 hover:border-emerald-500/60 rounded-xl p-4 text-center bg-slate-950/40 hover:bg-slate-900/40 transition-all cursor-pointer flex items-center justify-center gap-3 text-slate-400 text-xs"
      >
        <Scan className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>Ou arraste a foto / PDF do comprovante para esta área</span>
      </div>

      {/* Image Preview & Processing Bar */}
      {previewUrl && isScanning && (
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-3 animate-fade-in flex items-center gap-3">
          <img src={previewUrl} alt="Prévia" className="w-14 h-14 object-cover rounded-lg border border-slate-700 shrink-0" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span className="truncate">{progressText}</span>
              <span className="text-emerald-400 shrink-0 ml-2">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* OCR & AI Vision Tips Banner */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-2.5 text-[11px] text-slate-400">
        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1 w-full">
          <strong className="text-slate-200 block">Motor Triplo de Leitura (IA Vision + QR Code + OCR):</strong>
          <p>
            O sistema lê comprovantes bancários, cupons fiscais e recibos físicos com leitura inteligente.
          </p>
        </div>
      </div>

      {/* Optional AI Vision Key Config (Groq / Gemini) */}
      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            Chave IA Vision Gratuita (Groq / Gemini):
          </label>
          <span className="text-[10px] text-emerald-400 font-semibold">⚡ Opcional</span>
        </div>
        <div className="flex gap-2">
          <input
            type="password"
            placeholder="Cole sua chave (ex: gsk_...)"
            defaultValue={localStorage.getItem('ai_vision_key') || ''}
            onChange={(e) => {
              const val = e.target.value.trim();
              if (val) {
                localStorage.setItem('ai_vision_key', val);
              } else {
                localStorage.removeItem('ai_vision_key');
              }
            }}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <p className="text-[10px] text-slate-400">
          Insira uma chave gratuita da Groq (<code className="text-amber-300">console.groq.com</code>) para leitura por Inteligência Artificial com 100% de precisão.
        </p>
      </div>

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
