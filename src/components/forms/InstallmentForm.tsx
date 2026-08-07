import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Button } from '../ui';
import { useFinance } from '../../hooks/useFinance';

const installmentSchema = z.object({
  produto: z.string().min(2, 'Informe o nome do produto ou compra'),
  valor_total: z.coerce.number().positive('Valor total deve ser positivo'),
  qtd_parcelas: z.coerce.number().min(1, 'No mínimo 1 parcela'),
  cartao_id: z.string().optional(),
});

type InstallmentFormData = z.infer<typeof installmentSchema>;

interface InstallmentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const InstallmentForm: React.FC<InstallmentFormProps> = ({ onSuccess, onCancel }) => {
  const { addInstallment, cards } = useFinance();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InstallmentFormData>({
    resolver: zodResolver(installmentSchema),
    defaultValues: {
      produto: '',
      valor_total: undefined,
      qtd_parcelas: 10,
      cartao_id: '',
    },
  });

  const watchValorTotal = watch('valor_total');
  const watchQtd = watch('qtd_parcelas');

  const valorParcelaCalculado =
    watchValorTotal && watchQtd && watchQtd > 0
      ? (Number(watchValorTotal) / Number(watchQtd)).toFixed(2)
      : '0.00';

  const onSubmit = async (data: InstallmentFormData) => {
    const total = Number(data.valor_total);
    const qtd = Number(data.qtd_parcelas);
    const valorParcela = total / qtd;

    await addInstallment({
      produto: data.produto,
      valor_total: total,
      qtd_parcelas: qtd,
      valor_parcela: Number(valorParcela.toFixed(2)),
      parcelas_pagas: 0,
      parcelas_restantes: qtd,
      cartao_id: data.cartao_id || undefined,
    });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Produto / Compra *"
          placeholder="Ex: Notebook Dell, Smartphone..."
          {...register('produto')}
          error={errors.produto?.message}
        />

        <Input
          type="number"
          step="0.01"
          label="Valor Total (R$) *"
          placeholder="1200,00"
          {...register('valor_total')}
          error={errors.valor_total?.message}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          type="number"
          min="1"
          max="72"
          label="Nº de Parcelas *"
          placeholder="10"
          {...register('qtd_parcelas')}
          error={errors.qtd_parcelas?.message}
        />

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-300">Cartão Utilizado (opcional)</label>
          <select
            {...register('cartao_id')}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
          >
            <option value="">Outro / Sem Cartão</option>
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                💳 {c.nome} ({c.banco})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between text-xs">
        <span className="text-slate-300">Valor Estimado de Cada Parcela:</span>
        <span className="font-extrabold text-indigo-400">R$ {valorParcelaCalculado} / mês</span>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/60">
        <Button type="button" variant="ghost" onClick={onCancel} size="sm">
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSubmitting} size="sm">
          Cadastrar Parcelamento
        </Button>
      </div>
    </form>
  );
};
