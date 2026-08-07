import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Button } from '../ui';
import { getTodayString } from '../../lib/utils';
import { useFinance } from '../../hooks/useFinance';
import { Plus, Tag } from 'lucide-react';

const recipeSchema = z.object({
  descricao: z.string().min(2, 'Descrição deve ter no mínimo 2 caracteres'),
  categoria: z.string().min(1, 'Selecione uma categoria'),
  valor: z.coerce.number().positive('Informe um valor positivo maior que zero'),
  data: z.string().min(1, 'Informe a data'),
  observacoes: z.string().optional(),
});

type RecipeFormData = z.infer<typeof recipeSchema>;

interface RecipeFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const RecipeForm: React.FC<RecipeFormProps> = ({ onSuccess, onCancel }) => {
  const { addRecipe, addCategory, categories } = useFinance();
  const recipeCategories = categories.filter((c) => c.tipo === 'receita' || c.tipo === 'ambos');

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      descricao: '',
      categoria: recipeCategories[0]?.nome || 'Salário',
      valor: undefined,
      data: getTodayString(),
      observacoes: '',
    },
  });

  const selectedCategory = watch('categoria');

  const onSubmit = async (data: RecipeFormData) => {
    let finalCategory = data.categoria;

    if (isCustomCategory && customCategoryName.trim()) {
      finalCategory = customCategoryName.trim();
      await addCategory({
        nome: finalCategory,
        tipo: 'receita',
        cor: '#10b981',
        icone: 'Tag',
      });
    }

    await addRecipe({
      descricao: data.descricao,
      categoria: finalCategory,
      valor: Number(data.valor),
      data: data.data,
      observacoes: data.observacoes,
    });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Descrição da Receita *"
          placeholder="Ex: Salário Mensal, Freelance..."
          {...register('descricao')}
          error={errors.descricao?.message}
        />

        <Input
          type="number"
          step="0.01"
          label="Valor (R$) *"
          placeholder="0,00"
          {...register('valor')}
          error={errors.valor?.message}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          type="date"
          label="Data da Receita *"
          {...register('data')}
          error={errors.data?.message}
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
              {recipeCategories.map((c) => (
                <option key={c.id} value={c.nome}>
                  {c.nome}
                </option>
              ))}
              <option value="__new__">➕ Nova Categoria...</option>
            </select>
          )}
          {errors.categoria && <p className="text-[10px] text-rose-400">{errors.categoria.message}</p>}
        </div>
      </div>

      <Input
        label="Observações (opcional)"
        placeholder="Detalhes adicionais..."
        {...register('observacoes')}
      />

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/60">
        <Button type="button" variant="ghost" onClick={onCancel} size="sm">
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSubmitting} size="sm">
          Salvar Receita
        </Button>
      </div>
    </form>
  );
};
