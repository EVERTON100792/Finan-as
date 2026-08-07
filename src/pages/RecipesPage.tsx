import React, { useState } from 'react';
import { useFinance } from '../hooks/useFinance';
import { Card, Button, Input, Modal, Badge } from '../components/ui';
import { RecipeForm } from '../components/forms/RecipeForm';
import { formatCurrency, formatDate } from '../lib/utils';
import { TrendingUp, Plus, Search, Trash2, Tag } from 'lucide-react';

export const RecipesPage: React.FC = () => {
  const { recipes, deleteRecipe } = useFinance();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredRecipes = recipes.filter(
    (r) =>
      r.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValor = filteredRecipes.reduce((sum, r) => sum + Number(r.valor), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-28 lg:pb-8 relative min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white font-serif flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            Gestão de Receitas
          </h2>
          <p className="text-xs text-slate-400">Cadastre e acompanhe seus ganhos, salários e entradas financeiras.</p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto py-3">
          <Plus className="w-4 h-4 mr-1.5" />
          Cadastrar Nova Receita
        </Button>
      </div>

      {/* Filter & Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 flex items-center">
          <Input
            placeholder="Buscar por descrição ou categoria..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </Card>

        <Card className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Total Filtrado</p>
            <h4 className="text-xl font-extrabold text-emerald-400">{formatCurrency(totalValor)}</h4>
          </div>
          <Badge variant="emerald">{filteredRecipes.length} itens</Badge>
        </Card>
      </div>

      {/* Recipes List */}
      <Card className="space-y-3 p-3 sm:p-6">
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-12 text-sm text-slate-400 space-y-3">
            <TrendingUp className="w-12 h-12 text-slate-600 mx-auto opacity-50" />
            <p>Nenhuma receita cadastrada ou encontrada com o filtro atual.</p>
            <Button onClick={() => setIsModalOpen(true)} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-1" /> Cadastrar Primeira Receita
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="p-3 sm:p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/90 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-100 truncate">{recipe.descricao}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="slate" className="text-[10px]">
                        <Tag className="w-3 h-3 mr-1" />
                        {recipe.categoria}
                      </Badge>
                      <span className="text-xs text-slate-400">• {formatDate(recipe.data)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                  <span className="text-base font-extrabold text-emerald-400">
                    +{formatCurrency(recipe.valor)}
                  </span>
                  <button
                    onClick={() => deleteRecipe(recipe.id)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors flex items-center gap-1 text-xs font-semibold shrink-0"
                    title="Excluir Receita"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Floating Action Button (Mobile Only) */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="lg:hidden fixed bottom-20 right-4 z-40 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold px-4 py-3 rounded-full shadow-2xl shadow-emerald-500/40 flex items-center gap-2 text-sm active:scale-95 transition-transform"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        <span>Nova Receita</span>
      </button>

      {/* Modal Nova Receita */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cadastrar Nova Receita"
        subtitle="Adicione uma nova entrada ao seu orçamento"
      >
        <RecipeForm onSuccess={() => setIsModalOpen(false)} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};
