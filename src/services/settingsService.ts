
import {
    db
} from '@/lib/firebase';
import {
    doc,
    getDoc,
    setDoc,
    onSnapshot
} from 'firebase/firestore';

export interface UserSettings {
    notifications: boolean;
    theme: 'dark' | 'light';
    currency: string;
    language: string;
}

const DEFAULT_SETTINGS: UserSettings = {
    notifications: true,
    theme: 'dark',
    currency: 'BRL',
    language: 'pt-BR'
};

export const settingsService = {
    async getSettings(userId: string): Promise<UserSettings> {
        const docRef = doc(db, 'settings', userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as UserSettings;
        } else {
            // Create default settings if they don't exist
            await setDoc(docRef, DEFAULT_SETTINGS);
            return DEFAULT_SETTINGS;
        }
    },

    async updateSettings(userId: string, settings: Partial<UserSettings>) {
        const docRef = doc(db, 'settings', userId);
        await setDoc(docRef, settings, { merge: true });
    },

    subscribeToSettings(userId: string, callback: (settings: UserSettings) => void) {
        const docRef = doc(db, 'settings', userId);
        return onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                callback(doc.data() as UserSettings);
            } else {
                callback(DEFAULT_SETTINGS);
            }
        });
    }
};
