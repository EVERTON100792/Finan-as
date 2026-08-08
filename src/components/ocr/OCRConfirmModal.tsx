import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Input, Button, Badge } from '../ui';
import { OCRParseResult } from '../../types';
import { getTodayString, formatCurrency, formatDate } from '../../lib/utils';
import { useFinance } from '../../hooks/useFinance';
import { 
  CheckCircle2, Share2, Sparkles, CalendarCheck, Plus, Tag, 
  Layers, Check, FileCheck, CheckSquare, Edit3, ArrowRight
} from 'lucide-react';
import { sharePaymentSummary } from '../../lib/whatsapp';

interface OCRConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  ocrData: OCRParseResult | null;
  imagePreviewUrl?: string;
}

interface MatchCandidate {
  type: 'bill' | 'installment' | 'expense';
  id: string;
  title: string;
  valor: number;
  subtitle: string;
  diff: number;
  isExact: boolean;
  category: string;
}

export const OCRConfirmModal: React.FC<OCRConfirmModalProps> = ({
  isOpen,
  onClose,
  ocrData,
  imagePreviewUrl,
}) => {
  const { 
    addExpense, deleteExpense, toggleExpense, toggleBill, payInstallment, 
    bills, installments, expenses, categories, addCategory, stats 
  } = useFinance();

  const expenseCategories = categories.filter((c) => c.tipo === 'despesa' || c.tipo === 'ambos');

  const [valor, setValor] = useState<number>(ocrData?.valor || 0);
  const [data, setData] = useState<string>(ocrData?.data || getTodayString());
  const [hora, setHora] = useState<string>(ocrData?.hora || '12:00');
  const [favorecido, setFavorecido] = useState<string>(ocrData?.favorecido || 'Desconhecido');
  const [banco, setBanco] = useState<string>(ocrData?.banco || 'Bancário');
  const [tipoTransacao, setTipoTransacao] = useState<string>(ocrData?.tipo_transacao || 'PIX');
  const [numTransacao, setNumTransacao] = useState<string>(ocrData?.num_transacao || '');
  const [categoria, setCategoria] = useState<string>('Alimentação / Mercado');

  // Custom account name for direct baixa
  const [nomeContaCustom, setNomeContaCustom] = useState<string>('');
  
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  // Selected candidate match for auto-baixa
  const [selectedCandidate, setSelectedCandidate] = useState<MatchCandidate | null>(null);

  const [isRegistering, setIsRegistering] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [markedItemTitle, setMarkedItemTitle] = useState<string | null>(null);

  // Compute all potential pending items (bills, installments, expenses)
  const allPendingItems: MatchCandidate[] = useMemo(() => {
    const list: MatchCandidate[] = [];
    const targetVal = valor || ocrData?.valor || 0;

    // 1. Contas Fixas Pendentes
    bills.filter((b) => b.status !== 'paga').forEach((b) => {
      const diff = Math.abs(Number(b.valor) - targetVal);
      list.push({
        type: 'bill',
        id: b.id,
        title: b.nome,
        valor: Number(b.valor),
        subtitle: `Conta Fixa Pendente • Venc. dia ${b.dia_vencimento}`,
        diff,
        isExact: diff < 0.05,
        category: b.categoria,
      });
    });

    // 2. Parcelamentos Ativos
    installments.filter((i) => i.parcelas_restantes > 0).forEach((i) => {
      const diff = Math.abs(Number(i.valor_parcela) - targetVal);
      list.push({
        type: 'installment',
        id: i.id,
        title: `${i.produto} (Parc. ${i.parcelas_pagas + 1}/${i.qtd_parcelas})`,
        valor: Number(i.valor_parcela),
        subtitle: `Parcelamento • Faltam ${i.parcelas_restantes} parcelas`,
        diff,
        isExact: diff < 0.05,
        category: 'Lazer & Entretenimento',
      });
    });

    // 3. Despesas Previamente Cadastradas (Pendentes)
    expenses.filter((e) => e.status !== 'paga').forEach((e) => {
      const diff = Math.abs(Number(e.valor) - targetVal);
      list.push({
        type: 'expense',
        id: e.id,
        title: e.descricao,
        valor: Number(e.valor),
        subtitle: `Despesa Pendente em ${formatDate(e.data)}`,
        diff,
        isExact: diff < 0.05,
        category: e.categoria,
      });
    });

    // Sort: exact/closest matches first
    list.sort((a, b) => a.diff - b.diff);
    return list;
  }, [valor, ocrData, bills, installments, expenses]);

  // Sync state when ocrData changes
  useEffect(() => {
    if (ocrData) {
      const val = ocrData.valor || 0;
      const fav = ocrData.favorecido || 'Favorecido Extraído';

      setValor(val);
      setData(ocrData.data || getTodayString());
      setHora(ocrData.hora || '12:00');
      setFavorecido(fav);
      setBanco(ocrData.banco || 'Banco');
      setTipoTransacao(ocrData.tipo_transacao || 'PIX');
      setNumTransacao(ocrData.num_transacao || '');
      if (ocrData.categoria_sugerida) {
        setCategoria(ocrData.categoria_sugerida);
      }
      setNomeContaCustom(fav);
      setRegisteredSuccess(false);
      setMarkedItemTitle(null);
    }
  }, [ocrData]);

  // Auto-select candidate if exact match found
  useEffect(() => {
    if (allPendingItems.length > 0) {
      const bestMatch = allPendingItems[0];
      if (bestMatch && (bestMatch.isExact || bestMatch.diff <= 50.0)) {
        setSelectedCandidate(bestMatch);
        setCategoria(bestMatch.category);
        setNomeContaCustom(bestMatch.title);
      } else {
        setSelectedCandidate(null);
      }
    } else {
      setSelectedCandidate(null);
    }
  }, [allPendingItems]);

  if (!ocrData) return null;

  const handleSelectCandidate = (candidate: MatchCandidate | null) => {
    setSelectedCandidate(candidate);
    if (candidate) {
      setValor(candidate.valor);
      setCategoria(candidate.category);
      setNomeContaCustom(candidate.title);
    } else {
      setNomeContaCustom(favorecido);
    }
  };

  const parseNumeric = (val: any): number => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const cleanStr = String(val)
      .replace(/[^\d,\.]/g, '')
      .replace(/\.(?=\d{3})/g, '')
      .replace(',', '.');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  };

  const handleConfirm = async () => {
    setIsRegistering(true);

    const numericValor = parseNumeric(valor);
    if (numericValor <= 0) {
      alert('Por favor, verifique o valor pago antes de confirmar (deve ser maior que zero).');
      setIsRegistering(false);
      return;
    }

    let finalCategory = categoria || 'Alimentação / Mercado';
    if (isCustomCategory && customCategoryName.trim()) {
      finalCategory = customCategoryName.trim();
      await addCategory({
        nome: finalCategory,
        tipo: 'despesa',
        cor: '#f43f5e',
        icone: 'Tag',
      });
    }

    const finalAccountTitle = nomeContaCustom.trim() || favorecido || 'Despesa OCR';

    try {
      if (selectedCandidate) {
        if (selectedCandidate.type === 'bill') {
          // Mark pending bill as paid
          await toggleBill({ id: selectedCandidate.id, status: 'paga' });
          setMarkedItemTitle(selectedCandidate.title);
        } else if (selectedCandidate.type === 'installment') {
          // Pay installment
          await payInstallment(selectedCandidate.id);
          setMarkedItemTitle(selectedCandidate.title);
        } else if (selectedCandidate.type === 'expense') {
          // Mark pending expense as paid via confirmed OCR proof
          await toggleExpense({ id: selectedCandidate.id, status: 'paga' });
          setMarkedItemTitle(selectedCandidate.title);
        }
      } else {
        // Register standalone paid expense with custom or extracted name
        await addExpense({
          descricao: finalAccountTitle,
          categoria: finalCategory,
          valor: numericValor,
          data: data || getTodayString(),
          forma_pagamento: 'pix',
          observacoes: `Comprovante OCR. Favorecido: ${favorecido} (${banco}). Nº Transação: ${numTransacao || 'N/A'}. Hora: ${hora}`,
          status: 'paga',
        });
        setMarkedItemTitle(finalAccountTitle);
      }

      setIsRegistering(false);
      setRegisteredSuccess(true);
    } catch (err: any) {
      console.error('Erro ao registrar baixa:', err);
      alert(`Ocorreu um erro ao registrar a baixa: ${err?.message || 'Tente novamente.'}`);
      setIsRegistering(false);
    }
  };

  const handleShareWhatsApp = () => {
    sharePaymentSummary({
      descricao: markedItemTitle ? `Baixa: ${markedItemTitle}` : `Comprovante ${favorecido}`,
      valor: valor,
      data: data,
      saldoAtual: stats?.saldoAtual ?? 0,
      contasRestantesValor: stats?.contasPendentesValor ?? 0,
      contasRestantesQtd: stats?.contasPendentesQtd ?? 0,
      saldoPrevisto: stats?.saldoPrevisto ?? 0,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Validar & Dar Baixa (OCR)"
      subtitle="Confirme os dados extraídos para registrar a baixa"
      maxWidth="sm"
      footer={
        registeredSuccess ? null : (
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} size="sm" className="py-2 px-3 text-xs text-slate-300">
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm} 
              isLoading={isRegistering} 
              size="sm" 
              className="flex-1 sm:flex-none py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/25 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950 shrink-0" />
              <span>{selectedCandidate ? `Dar Baixa` : 'Confirmar e Registrar Baixa'}</span>
            </Button>
          </div>
        )
      }
    >
      {registeredSuccess ? (
        <div className="text-center py-4 space-y-3 animate-fade-in">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">Baixa Concluída!</h4>
            <p className="text-xs text-emerald-400 font-semibold mt-0.5">
              {markedItemTitle
                ? `Baixa confirmada na conta "${markedItemTitle}"!`
                : 'A despesa foi registrada no extrato.'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              onClick={handleShareWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2"
            >
              <Share2 className="w-3.5 h-3.5 mr-1" />
              Compartilhar WhatsApp
            </Button>
            <Button variant="secondary" onClick={onClose} className="text-xs py-2">
              Concluir
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Row 1: Compact Banner & Candidate Selector if available */}
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[11px] text-emerald-400">
            <div className="flex items-center gap-1.5 truncate">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Lido: <strong>{formatCurrency(valor)}</strong> • {favorecido}</span>
            </div>
            {selectedCandidate && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold shrink-0 ml-1">
                ✨ Vinculada
              </span>
            )}
          </div>

          {/* Account Title Field */}
          <div className="space-y-0.5">
            <label className="block text-[11px] font-semibold text-slate-200 flex items-center gap-1">
              <Edit3 className="w-3 h-3 text-emerald-400 shrink-0" />
              Nome da Conta / Descrição *
            </label>
            <Input
              placeholder="Ex: Supermercado, Aluguel, Oficina..."
              value={nomeContaCustom}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNomeContaCustom(e.target.value)}
              className="py-1.5 text-xs bg-slate-950"
            />
          </div>

          {/* Row 3: Ultra Compact 3-Column Grid (Valor | Data | Categoria) */}
          <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-800/80">
            <div className="space-y-0.5">
              <label className="block text-[10px] font-semibold text-slate-300">Valor (R$) *</label>
              <Input
                type="number"
                step="0.01"
                value={valor}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValor(parseFloat(e.target.value) || 0)}
                className="py-1 px-2 text-xs bg-slate-950"
              />
            </div>

            <div className="space-y-0.5">
              <label className="block text-[10px] font-semibold text-slate-300">Data *</label>
              <Input
                type="date"
                value={data}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData(e.target.value)}
                className="py-1 px-1.5 text-[11px] bg-slate-950"
              />
            </div>

            <div className="space-y-0.5">
              <label className="block text-[10px] font-semibold text-slate-300 truncate">Categoria *</label>
              <select
                value={categoria}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoria(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-1.5 py-1 text-[11px] text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                {expenseCategories.map((c) => (
                  <option key={c.id} value={c.nome}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Action Buttons directly inside form body */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={onClose} size="sm" className="py-2 px-3 text-xs text-slate-300">
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm} 
              isLoading={isRegistering} 
              size="sm" 
              className="flex-1 py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/25 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950 shrink-0" />
              <span>Confirmar e Registrar Baixa</span>
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
