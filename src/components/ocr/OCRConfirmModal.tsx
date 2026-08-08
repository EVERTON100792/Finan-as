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

  const handleConfirm = async () => {
    setIsRegistering(true);

    let finalCategory = categoria;
    if (isCustomCategory && customCategoryName.trim()) {
      finalCategory = customCategoryName.trim();
      await addCategory({
        nome: finalCategory,
        tipo: 'despesa',
        cor: '#f43f5e',
        icone: 'Tag',
      });
    }

    const finalAccountTitle = nomeContaCustom.trim() || favorecido;

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
          valor: Number(valor),
          data: data,
          forma_pagamento: 'pix',
          observacoes: `Comprovante OCR. Favorecido: ${favorecido} (${banco}). Nº Transação: ${numTransacao || 'N/A'}. Hora: ${hora}`,
          status: 'paga',
        });
        setMarkedItemTitle(finalAccountTitle);
      }

      setIsRegistering(false);
      setRegisteredSuccess(true);
    } catch (err) {
      console.error(err);
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
      title="Validar & Dar Baixa via Comprovante (OCR)"
      subtitle="Abata uma conta cadastrada ou registre a baixa informando o nome"
      maxWidth="lg"
    >
      {registeredSuccess ? (
        <div className="text-center py-6 space-y-4 animate-fade-in">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white">Baixa Concluída com Sucesso!</h4>
            <p className="text-sm text-emerald-400 font-semibold mt-1">
              {markedItemTitle
                ? `Baixa confirmada na conta "${markedItemTitle}"!`
                : 'A despesa foi registrada no extrato.'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              O saldo atual e o extrato de movimentações foram atualizados em tempo real.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Button
              onClick={handleShareWhatsApp}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar no WhatsApp
            </Button>
            <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
              Concluir
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>OCR Lido: Valor de <strong>{formatCurrency(valor)}</strong> extraído do comprovante</span>
            </div>
          </div>

          {/* Selector 1: Manual Dropdown Selector of ALL Pending Bills / Accounts */}
          <div className="space-y-1.5 p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
            <label className="block text-xs font-bold text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-emerald-400" />
                Selecione a Conta para Abater / Dar Baixa:
              </span>
              {selectedCandidate && (
                <span className="text-[10px] text-emerald-400 font-medium">✨ Conta Vinculada</span>
              )}
            </label>

            <select
              value={selectedCandidate ? `${selectedCandidate.type}:${selectedCandidate.id}` : '__custom__'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '__custom__') {
                  handleSelectCandidate(null);
                } else {
                  const match = allPendingItems.find((item) => `${item.type}:${item.id}` === val);
                  handleSelectCandidate(match || null);
                }
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="__custom__">
                ✍️ Nenhuma conta da lista (Digitar nome da conta manualmente abaixo)
              </option>
              {allPendingItems.length > 0 && (
                <optgroup label="📋 Contas Pendentes & Parcelamentos">
                  {allPendingItems.map((item) => (
                    <option key={`${item.type}:${item.id}`} value={`${item.type}:${item.id}`}>
                      {item.type === 'bill' ? '📅 Conta Fixa' : item.type === 'installment' ? '💳 Parcelamento' : '📝 Despesa'}: {item.title} — {formatCurrency(item.valor)}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Account Title Field for Direct Baixa */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1">
              <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
              Nome da Conta / Descrição da Baixa *
            </label>
            <Input
              placeholder="Ex: Conta de Energia, Aluguel, Supermercado..."
              value={nomeContaCustom}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNomeContaCustom(e.target.value)}
            />
            <p className="text-[10px] text-slate-400">
              {selectedCandidate 
                ? `Dar baixa em "${selectedCandidate.title}"`
                : 'Caso não tenha conta cadastrada, este nome será gravado diretamente no extrato.'}
            </p>
          </div>

          {/* Detailed Transaction Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
            <Input
              type="number"
              step="0.01"
              label="Valor Pago (R$) *"
              value={valor}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValor(parseFloat(e.target.value) || 0)}
            />

            <Input
              type="date"
              label="Data da Transação *"
              value={data}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData(e.target.value)}
            />

            <Input
              label="Favorecido / Recebedor *"
              value={favorecido}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFavorecido(e.target.value)}
            />

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">Categoria *</label>
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(!isCustomCategory)}
                  className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5 font-medium"
                >
                  <Plus className="w-3 h-3" />
                  {isCustomCategory ? 'Lista' : 'Nova'}
                </button>
              </div>

              {isCustomCategory ? (
                <Input
                  placeholder="Nova categoria..."
                  value={customCategoryName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setCustomCategoryName(e.target.value);
                    setCategoria(e.target.value);
                  }}
                  icon={<Tag className="w-3.5 h-3.5" />}
                />
              ) : (
                <select
                  value={categoria}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    if (e.target.value === '__new__') {
                      setIsCustomCategory(true);
                    } else {
                      setCategoria(e.target.value);
                    }
                  }}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.nome}>
                      {c.nome}
                    </option>
                  ))}
                  <option value="__new__">➕ Nova Categoria...</option>
                </select>
              )}
            </div>
          </div>

          {/* Sticky/Clear action buttons container at the bottom */}
          <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-md pt-3 pb-1 border-t border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 -mx-4 -mb-4 px-4 pb-4 sm:-mx-5 sm:-mb-5 sm:px-5 sm:pb-5 mt-4 z-10">
            <Button type="button" variant="ghost" onClick={onClose} size="sm" className="w-full sm:w-auto py-2.5">
              Cancelar
            </Button>
            <Button onClick={handleConfirm} isLoading={isRegistering} size="sm" className="w-full sm:w-auto py-2.5">
              {selectedCandidate ? `Dar Baixa em "${selectedCandidate.title}"` : 'Confirmar e Registrar Baixa'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
