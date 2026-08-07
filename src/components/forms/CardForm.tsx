import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Button } from '../ui';
import { useFinance } from '../../hooks/useFinance';

const cardSchema = z.object({
  nome: z.string().min(2, 'Nome do cartão é obrigatório'),
  banco: z.string().min(2, 'Informe o banco emissor'),
  limite: z.coerce.number().positive('Informe o limite do cartão'),
  fechamento: z.coerce.number().min(1).max(31, 'Dia entre 1 e 31'),
  vencimento: z.coerce.number().min(1).max(31, 'Dia entre 1 e 31'),
  cor_hex: z.string().default('#10b981'),
});

type CardFormData = z.infer<typeof cardSchema>;

interface CardFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const CardForm: React.FC<CardFormProps> = ({ onSuccess, onCancel }) => {
  const { addCard } = useFinance();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      nome: '',
      banco: '',
      limite: undefined,
      fechamento: 15,
      vencimento: 22,
      cor_hex: '#10b981',
    },
  });

  const onSubmit = async (data: CardFormData) => {
    await addCard({
      nome: data.nome,
      banco: data.banco,
      limite: Number(data.limite),
      fechamento: Number(data.fechamento),
      vencimento: Number(data.vencimento),
      cor_hex: data.cor_hex,
    });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Nome do Cartão *"
          placeholder="Ex: Nubank, XP Infinite..."
          {...register('nome')}
          error={errors.nome?.message}
        />

        <Input
          label="Banco Emissor *"
          placeholder="Ex: Nubank, Itaú..."
          {...register('banco')}
          error={errors.banco?.message}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          type="number"
          step="0.01"
          label="Limite Total (R$) *"
          placeholder="5000,00"
          {...register('limite')}
          error={errors.limite?.message}
        />

        <Input
          type="number"
          min="1"
          max="31"
          label="Dia Fechamento *"
          placeholder="15"
          {...register('fechamento')}
          error={errors.fechamento?.message}
        />

        <Input
          type="number"
          min="1"
          max="31"
          label="Dia Vencimento *"
          placeholder="22"
          {...register('vencimento')}
          error={errors.vencimento?.message}
        />
      </div>

      <div className="flex items-center justify-between p-2 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
        <span className="text-slate-300 font-medium">Cor de Identificação:</span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            {...register('cor_hex')}
            className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer p-0.5"
          />
          <span className="text-[11px] text-slate-400">Escolha a cor do cartão</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/60">
        <Button type="button" variant="ghost" onClick={onCancel} size="sm">
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSubmitting} size="sm">
          Cadastrar Cartão
        </Button>
      </div>
    </form>
  );
};
