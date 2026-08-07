import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Button } from '../ui';
import { useFinance } from '../../hooks/useFinance';
import { Plus, Tag } from 'lucide-react';

const billSchema = z.object({
  nome: z.string().min(2, 'Nome da conta deve ter no mínimo 2 caracteres'),
  categoria: z.string().min(1, 'Selecione uma categoria'),
  valor: z.coerce.number().positive('Informe um valor positivo maior que zero'),
  dia_vencimento: z.coerce.number().min(1).max(31, 'Dia de vencimento entre 1 e 31'),
  recorrente: z.boolean(),
  observacoes: z.string().optional(),
});

type BillFormData = z.infer<typeof billSchema>;

interface BillFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const BillForm: React.FC<BillFormProps> = ({ onSuccess, onCancel }) => {
  const { addBill, addCategory, categories } = useFinance();
  const billCategories = categories.filter((c) => c.tipo === 'despesa' || c.tipo === 'ambos');

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BillFormData>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      nome: '',
      categoria: billCategories[0]?.nome || 'Moradia / Aluguel',
      valor: undefined,
      dia_vencimento: 10,
      recorrente: true,
      observacoes: '',
    },
  });

  const selectedCategory = watch('categoria');

  const onSubmit = async (data: BillFormData) => {
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

    await addBill({
      nome: data.nome,
      categoria: finalCategory,
      valor: Number(data.valor),
      dia_vencimento: Number(data.dia_vencimento),
      recorrente: data.recorrente,
      observacoes: data.observacoes,
      status: 'pendente',
    });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Nome da Conta / Fatura *"
          placeholder="Ex: Energia, Internet, Aluguel..."
          {...register('nome')}
          error={errors.nome?.message}
        />

        <Input
          type="number"
          step="0.01"
          label="Valor Previsto (R$) *"
          placeholder="0,00"
          {...register('valor')}
          error={errors.valor?.message}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          type="number"
          min="1"
          max="31"
          label="Dia Vencimento (1-31) *"
          placeholder="10"
          {...register('dia_vencimento')}
          error={errors.dia_vencimento?.message}
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
                setValue('categoria', e.target.value);
              }}
              icon={<Tag className="w-3.5 h-3.5" />}
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
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              {billCategories.map((c) => (
                <option key={c.id} value={c.nome}>
                  {c.nome}
                </option>
              ))}
              <option value="__new__">➕ Nova Categoria...</option>
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="recorrente"
            {...register('recorrente')}
            className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500/20"
          />
          <label htmlFor="recorrente" className="text-xs text-slate-300 font-medium cursor-pointer">
            Conta recorrente (mensal)
          </label>
        </div>

        <Input
          label="Observações (opcional)"
          placeholder="Código de barras, contrato..."
          {...register('observacoes')}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/60">
        <Button type="button" variant="ghost" onClick={onCancel} size="sm">
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSubmitting} size="sm">
          Cadastrar Conta
        </Button>
      </div>
    </form>
  );
};
