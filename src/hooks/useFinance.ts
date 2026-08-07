import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { localFinanceEngine } from '../lib/supabase';
import { Recipe, Expense, Bill, CreditCard, Installment, FinancialGoal, Category } from '../types';

export function useFinance() {
  const queryClient = useQueryClient();

  // Queries
  const statsQuery = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      await localFinanceEngine.syncCloudData();
      return localFinanceEngine.getDashboardStats();
    },
  });

  const recipesQuery = useQuery({
    queryKey: ['recipes'],
    queryFn: () => localFinanceEngine.getRecipes(),
  });

  const expensesQuery = useQuery({
    queryKey: ['expenses'],
    queryFn: () => localFinanceEngine.getExpenses(),
  });

  const billsQuery = useQuery({
    queryKey: ['bills'],
    queryFn: () => localFinanceEngine.getBills(),
  });

  const cardsQuery = useQuery({
    queryKey: ['cards'],
    queryFn: () => localFinanceEngine.getCards(),
  });

  const installmentsQuery = useQuery({
    queryKey: ['installments'],
    queryFn: () => localFinanceEngine.getInstallments(),
  });

  const transactionsQuery = useQuery({
    queryKey: ['transactions'],
    queryFn: () => localFinanceEngine.getTransactions(),
  });

  const goalsQuery = useQuery({
    queryKey: ['goals'],
    queryFn: () => localFinanceEngine.getGoals(),
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => localFinanceEngine.getCategories(),
  });

  // Helper to invalidate all queries
  const invalidateAll = async () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    queryClient.invalidateQueries({ queryKey: ['recipes'] });
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    queryClient.invalidateQueries({ queryKey: ['bills'] });
    queryClient.invalidateQueries({ queryKey: ['cards'] });
    queryClient.invalidateQueries({ queryKey: ['installments'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['goals'] });
  };

  const resetAllData = () => {
    localFinanceEngine.clearAllData();
    invalidateAll();
  };

  // Mutations (async/await to guarantee Supabase cloud save)
  const addRecipeMutation = useMutation({
    mutationFn: async (recipe: Omit<Recipe, 'id' | 'user_id' | 'created_at'>) => {
      return await localFinanceEngine.addRecipe(recipe);
    },
    onSuccess: () => invalidateAll(),
  });

  const deleteRecipeMutation = useMutation({
    mutationFn: async (id: string) => {
      await localFinanceEngine.deleteRecipe(id);
    },
    onSuccess: () => invalidateAll(),
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (expense: Omit<Expense, 'id' | 'user_id' | 'created_at'>) => {
      return await localFinanceEngine.addExpense(expense);
    },
    onSuccess: () => invalidateAll(),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      await localFinanceEngine.deleteExpense(id);
    },
    onSuccess: () => invalidateAll(),
  });

  const toggleExpenseMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'paga' | 'pendente' }) => {
      return await localFinanceEngine.toggleExpenseStatus(id, status);
    },
    onSuccess: () => invalidateAll(),
  });

  const addBillMutation = useMutation({
    mutationFn: async (bill: Omit<Bill, 'id' | 'user_id' | 'created_at'>) => {
      return await localFinanceEngine.addBill(bill);
    },
    onSuccess: () => invalidateAll(),
  });

  const toggleBillMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'paga' | 'pendente' }) => {
      return await localFinanceEngine.toggleBillStatus(id, status);
    },
    onSuccess: () => invalidateAll(),
  });

  const deleteBillMutation = useMutation({
    mutationFn: async (id: string) => {
      await localFinanceEngine.deleteBill(id);
    },
    onSuccess: () => invalidateAll(),
  });

  const addCardMutation = useMutation({
    mutationFn: async (card: Omit<CreditCard, 'id' | 'user_id' | 'created_at'>) => {
      return await localFinanceEngine.addCard(card);
    },
    onSuccess: () => invalidateAll(),
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (id: string) => {
      await localFinanceEngine.deleteCard(id);
    },
    onSuccess: () => invalidateAll(),
  });

  const addInstallmentMutation = useMutation({
    mutationFn: async (inst: Omit<Installment, 'id' | 'user_id' | 'created_at'>) => {
      return await localFinanceEngine.addInstallment(inst);
    },
    onSuccess: () => invalidateAll(),
  });

  const payInstallmentMutation = useMutation({
    mutationFn: async (id: string) => {
      return await localFinanceEngine.payInstallment(id);
    },
    onSuccess: () => invalidateAll(),
  });

  const addGoalMutation = useMutation({
    mutationFn: async (goal: Omit<FinancialGoal, 'id' | 'user_id' | 'created_at'>) => {
      return await localFinanceEngine.addGoal(goal);
    },
    onSuccess: () => invalidateAll(),
  });

  const addGoalDepositMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      return await localFinanceEngine.updateGoalDeposit(id, amount);
    },
    onSuccess: () => invalidateAll(),
  });

  const addCategoryMutation = useMutation({
    mutationFn: async (category: Omit<Category, 'id' | 'user_id' | 'created_at'>) => {
      return await localFinanceEngine.addCategory(category);
    },
    onSuccess: () => invalidateAll(),
  });

  return {
    stats: statsQuery.data,
    isLoadingStats: statsQuery.isLoading,
    recipes: recipesQuery.data || [],
    expenses: expensesQuery.data || [],
    bills: billsQuery.data || [],
    cards: cardsQuery.data || [],
    installments: installmentsQuery.data || [],
    transactions: transactionsQuery.data || [],
    goals: goalsQuery.data || [],
    categories: categoriesQuery.data || [],
    
    // Mutations
    addRecipe: addRecipeMutation.mutateAsync,
    deleteRecipe: deleteRecipeMutation.mutateAsync,
    addExpense: addExpenseMutation.mutateAsync,
    toggleExpense: toggleExpenseMutation.mutateAsync,
    deleteExpense: deleteExpenseMutation.mutateAsync,
    addBill: addBillMutation.mutateAsync,
    toggleBill: toggleBillMutation.mutateAsync,
    deleteBill: deleteBillMutation.mutateAsync,
    addCard: addCardMutation.mutateAsync,
    deleteCard: deleteCardMutation.mutateAsync,
    addInstallment: addInstallmentMutation.mutateAsync,
    payInstallment: payInstallmentMutation.mutateAsync,
    addGoal: addGoalMutation.mutateAsync,
    addGoalDeposit: addGoalDepositMutation.mutateAsync,
    addCategory: addCategoryMutation.mutateAsync,
    
    resetAllData,
    checkDuplicate: localFinanceEngine.checkDuplicate.bind(localFinanceEngine),
    refreshData: invalidateAll,
  };
}
