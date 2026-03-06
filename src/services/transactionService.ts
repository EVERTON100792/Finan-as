import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    onSnapshot,
    orderBy,
    Timestamp,
    serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Transaction } from "@/lib/types";


const COLLECTION_NAME = "transactions";

export const transactionService = {
    async addTransaction(transaction: Omit<Transaction, "id">) {
        return await addDoc(collection(db, COLLECTION_NAME), {
            ...transaction,
            createdAt: serverTimestamp(),
        });
    },

    async updateTransaction(id: string, updates: Partial<Transaction>) {
        const docRef = doc(db, COLLECTION_NAME, id);
        return await updateDoc(docRef, updates);
    },

    async deleteTransaction(id: string) {
        const docRef = doc(db, COLLECTION_NAME, id);
        return await deleteDoc(docRef);
    },

    subscribeToTransactions(userId: string, callback: (transactions: Transaction[]) => void) {
        const q = query(
            collection(db, COLLECTION_NAME),
            where("userId", "==", userId),
            orderBy("date", "desc")
        );

        return onSnapshot(q, (snapshot) => {
            const transactions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Transaction[];
            callback(transactions);
        });
    }
};
