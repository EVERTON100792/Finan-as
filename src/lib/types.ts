export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'paid' | 'pending';

export interface Transaction {
    id?: string;
    description: string;
    amount: number;
    category: string;
    date: any; // Firestore Timestamp
    type: TransactionType;
    status: TransactionStatus;
    userId: string;
    paymentMethod?: string;
}

export interface Budget {
    category: string;
    limit: number;
    userId: string;
}

export interface FinancialSummary {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    pendingExpenses: number;
}
