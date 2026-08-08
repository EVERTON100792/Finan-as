import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Button } from '../ui';
import { getTodayString } from '../../lib/utils';
import { useFinance } from '../../hooks/useFinance';
import { PaymentMethod } from '../../types';
import { AlertTriangle, Plus, Tag } from 'lucide-react';

const expenseSchema = z.object({
  descricao: z.string().min(2, 'Descrição deve ter no mínimo 2 caracteres'),
  categoria: z.string().min(1, 'Selecione uma categoria'),
  valor: z.coerce.number().positive('Informe um valor positivo maior que zero'),
  data: z.string().min(1, 'Informe a data'),
  forma_pagamento: z.enum(['pix', 'credito', 'debito', 'dinheiro', 'boleto', 'transferencia']),
  observacoes: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialValues?: Partial<ExpenseFormData>;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSuccess, onCancel, initialValues }) => {
  const { addExpense, addCategory, categories, checkDuplicate } = useFinance();
  const [duplicateAlert, setDuplicateAlert] = useState<string | null>(null);

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  const expenseCategories = categories.filter((c) => c.tipo === 'despesa' || c.tipo === 'ambos');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      descricao: initialValues?.descricao || '',
      categoria: initialValues?.categoria || expenseCategories[0]?.nome || 'Alimentação / Mercado',
      valor: initialValues?.valor || undefined,
      data: initialValues?.data || getTodayString(),
      forma_pagamento: initialValues?.forma_pagamento || 'pix',
      observacoes: initialValues?.observacoes || '',
    },
  });

  const watchDescricao = watch('descricao');
  const watchValor = watch('valor');
  const watchData = watch('data');
  const selectedCategory = watch('categoria');

  const handleValidation = (data: ExpenseFormData) => {
    if (!duplicateAlert && watchDescricao && watchValor && watchData) {
      const isDup = checkDuplicate(data.descricao, Number(data.valor), data.data);
      if (isDup) {
        setDuplicateAlert(`Atenção: Já existe um lançamento idêntico (${data.descricao} - R$ ${data.valor}) em ${data.data}. Deseja prosseguir mesmo assim?`);
        return;
      }
    }
    submitData(data);
  };

  const submitData = async (data: ExpenseFormData) => {
    let finalCategory = data.categoria;

    if (isCustomCategory && customCategoryName.trim()) {
      finalCategory = customCategoryName.trim();
      await addCategory({
        nome: finalCategory,
        tipo: 'despesa',
        cor: '#f43f5e',
        icone: 'Tag',
      });
    }

    await addExpense({
      descricao: data.descricao,
      categoria: finalCategory,
      valor: Number(data.valor),
      data: data.data,
      forma_pagamento: data.forma_pagamento as PaymentMethod,
      observacoes: data.observacoes,
      status: 'pendente',
    });

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(handleValidation)} className="space-y-2.5">
      {duplicateAlert && (
        <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2 text-amber-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <p className="flex-1 text-[11px] leading-tight">{duplicateAlert}</p>
        </div>
      )}

      {/* Descrição */}
      <Input
        label="Descrição da Despesa *"
        placeholder="Ex: Supermercado, Aluguel..."
        {...register('descricao')}
        error={errors.descricao?.message}
        className="py-1.5 text-xs"
      />

      {/* Grid: Valor + Data */}
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="number"
          step="0.01"
          label="Valor (R$) *"
          placeholder="0,00"
          {...register('valor')}
          error={errors.valor?.message}
          className="py-1.5 text-xs"
        />

        <Input
          type="date"
          label="Data *"
          {...register('data')}
          error={errors.data?.message}
          className="py-1.5 text-xs"
        />
      </div>

      {/* Grid: Categoria + Pagamento */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-semibold text-slate-300">Categoria *</label>
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
              placeholder="Nova..."
              value={customCategoryName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setCustomCategoryName(e.target.value);
                setValue('categoria', e.target.value);
              }}
              icon={<Tag className="w-3 h-3" />}
              className="py-1.5 text-xs"
            />
          ) : (
            <select
              value={selectedCategory}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                if (e.target.value === '__new__') {
                  setIsCustomCategory(true);
                } else {
                  setValue('categoria', e.target.value);
                }
              }}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-2 py-1.5 text-[11px] text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.nome}>
                  {c.nome}
                </option>
              ))}
              <option value="__new__">➕ Nova...</option>
            </select>
          )}
          {errors.categoria && <p className="text-[10px] text-rose-400">{errors.categoria.message}</p>}
        </div>

        <div className="space-y-0.5">
          <label className="block text-[11px] font-semibold text-slate-300">Pagamento *</label>
          <select
            {...register('forma_pagamento')}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-2 py-1.5 text-[11px] text-slate-100 focus:outline-none focus:border-emerald-500"
          >
            <option value="pix">PIX</option>
            <option value="credito">Crédito</option>
            <option value="debito">Débito</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="boleto">Boleto</option>
            <option value="transferencia">TED / Transferência</option>
          </select>
        </div>
      </div>

      {/* Observações */}
      <Input
        label="Observações (opcional)"
        placeholder="Notas ou detalhes..."
        {...register('observacoes')}
        className="py-1.5 text-xs"
      />

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
        <Button type="button" variant="ghost" onClick={onCancel} size="sm" className="py-2 px-3 text-xs">
          Cancelar
        </Button>

        <Button type="submit" isLoading={isSubmitting} size="sm" variant={duplicateAlert ? 'danger' : 'primary'} className="py-2 px-4 text-xs font-bold">
          {duplicateAlert ? 'Confirmar Duplicado' : 'Salvar Despesa'}
        </Button>
      </div>
    </form>
  );
};
