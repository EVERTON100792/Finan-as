"use client";

import React, { useState, useEffect } from "react";
import {
    User,
    Bell,
    Shield,
    Database,
    Moon,
    LogOut,
    ChevronRight,
    Save,
    Download,
    Check,
    X
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { Timestamp } from "firebase/firestore";
import { settingsService, UserSettings } from "@/services/settingsService";
import { transactionService } from "@/services/transactionService";
import { Transaction } from "@/lib/types";

export default function ConfiguracoesPage() {
    const { user, logout } = useAuth();
    const [name, setName] = useState("");
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (!user) return;
        setName(user.displayName || "");

        // Subscribe to settings
        const unsubscribeSettings = settingsService.subscribeToSettings(user.uid, (data) => {
            setSettings(data);
            // Apply theme locally if changed
            if (data.theme) {
                document.documentElement.classList.toggle('dark', data.theme === 'dark');
            }
        });

        // Subscribe to transactions for export
        const unsubscribeTransactions = transactionService.subscribeToTransactions(user.uid, (data) => {
            setTransactions(data);
        });

        return () => {
            unsubscribeSettings();
            unsubscribeTransactions();
        };
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSaving(true);
        setErrorMessage("");
        try {
            await updateProfile(user, { displayName: name });
            setIsEditingProfile(false);
            showSuccess("Perfil atualizado com sucesso!");
        } catch (error: any) {
            console.error(error);
            setErrorMessage("Erro ao atualizar perfil: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !user.email) return;

        setIsSaving(true);
        setErrorMessage("");
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            setShowSecurityModal(false);
            setCurrentPassword("");
            setNewPassword("");
            showSuccess("Senha atualizada com sucesso!");
        } catch (error: any) {
            console.error(error);
            setErrorMessage("Erro de segurança: " + (error.code === 'auth/wrong-password' ? "Senha atual incorreta" : error.message));
        } finally {
            setIsSaving(false);
        }
    };

    const toggleNotification = async () => {
        if (!user || !settings) return;
        setErrorMessage("");
        try {
            const newValue = !settings.notifications;
            // Immediate local update for better UX
            setSettings({ ...settings, notifications: newValue });
            await settingsService.updateSettings(user.uid, {
                notifications: newValue
            });
            showSuccess(`Notificações ${newValue ? 'ativadas' : 'desativadas'}!`);
        } catch (error: any) {
            console.error(error);
            setErrorMessage("Erro ao salvar configurações: " + error.message);
        }
    };

    const changeTheme = async (theme: 'dark' | 'light') => {
        if (!user || !settings) return;
        try {
            await settingsService.updateSettings(user.uid, { theme });
            showSuccess(`Tema ${theme === 'dark' ? 'Escuro' : 'Claro'} aplicado!`);
        } catch (error: any) {
            console.error(error);
            setErrorMessage("Erro ao mudar tema: " + error.message);
        }
    };

    const exportData = (format: 'json' | 'csv') => {
        if (transactions.length === 0) {
            setErrorMessage("Não há dados para exportar.");
            return;
        }

        try {
            const dataStr = format === 'json'
                ? JSON.stringify(transactions, null, 2)
                : transactionsToCSV(transactions);

            const blob = new Blob([dataStr], { type: format === 'json' ? 'application/json' : 'text/csv' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `backup_financeiro_${new Date().toISOString().split('T')[0]}.${format}`;
            link.click();
            showSuccess(`Dados exportados em ${format.toUpperCase()}!`);
        } catch (error: any) {
            setErrorMessage("Erro ao exportar: " + error.message);
        }
    };

    const transactionsToCSV = (txs: Transaction[]) => {
        const headers = "Data,Descrição,Tipo,Categoria,Valor,Status\n";
        const rows = txs.map(tx => {
            const dateStr = tx.date instanceof Timestamp
                ? tx.date.toDate().toLocaleDateString('pt-BR')
                : (tx.date instanceof Date ? tx.date.toLocaleDateString('pt-BR') : '-');
            return `"${dateStr}","${tx.description}","${tx.type}","${tx.category}","${tx.amount}","${tx.status}"`;
        }).join("\n");
        return headers + rows;
    };

    const showSuccess = (msg: string) => {
        setErrorMessage("");
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(""), 3000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 md:pb-8">
            <header className="pt-2 md:pt-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground font-sans">Configurações</h2>
                    <p className="text-sm text-slate-500 font-medium">Ajuste o sistema para o seu jeito.</p>
                </div>
                <div className="flex flex-col items-start md:items-end gap-2 w-full md:w-auto">
                    {successMessage && (
                        <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest animate-in fade-in zoom-in shadow-[0_0_20px_rgba(16,185,129,0.1)] w-full md:w-auto text-center md:text-right">
                            <Check size={14} className="inline mr-2" /> {successMessage}
                        </div>
                    )}
                    {errorMessage && (
                        <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-2 rounded-xl text-xs font-bold animate-in shake duration-500 shadow-[0_0_20px_rgba(239,68,68,0.1)] w-full md:w-auto text-center md:text-right">
                            {errorMessage}
                        </div>
                    )}
                </div>
            </header>

            <div className="space-y-6">
                {/* Perfil Section */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Conta</h3>
                    <div className="glass overflow-hidden divide-y divide-white/5 shadow-2xl">
                        <div className="p-5 md:p-6">
                            <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-6">
                                <div className="flex items-center gap-4 w-full">
                                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden shrink-0">
                                        {user?.photoURL ? (
                                            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={32} className="text-primary" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {isEditingProfile ? (
                                            <form onSubmit={handleUpdateProfile} className="flex gap-2">
                                                <input
                                                    autoFocus
                                                    value={name}
                                                    onChange={e => setName(e.target.value)}
                                                    className="bg-foreground/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all w-full max-w-[200px]"
                                                />
                                                <button type="submit" disabled={isSaving} className="text-primary hover:text-primary/80 transition-colors p-1">
                                                    {isSaving ? <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : <Save size={20} />}
                                                </button>
                                            </form>
                                        ) : (
                                            <h4 className="text-lg font-bold text-foreground flex items-center gap-2 group/name truncate">
                                                {user?.displayName || "Usuário Pro"}
                                                <button onClick={() => setIsEditingProfile(true)} className="text-[10px] text-slate-500 hover:text-primary uppercase tracking-widest font-black transition-colors px-2 py-1 rounded hover:bg-white/5">
                                                    Editar
                                                </button>
                                            </h4>
                                        )}
                                        <p className="text-xs text-slate-500 font-medium truncate">{user?.email}</p>
                                    </div>
                                </div>
                                <div className="w-full md:w-auto text-center md:text-right">
                                    <span className="inline-block text-[10px] bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 rounded-full font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.1)]">Conta Premium</span>
                                </div>
                            </div>
                        </div>

                        {/* Security item */}
                        <div
                            onClick={() => setShowSecurityModal(true)}
                            className="p-5 md:p-6 flex items-center justify-between hover:bg-foreground/5 transition-colors cursor-pointer group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 rounded-xl bg-foreground/5 text-emerald-500 group-hover:scale-110 transition-transform">
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-foreground text-sm">Segurança</p>
                                    <p className="text-xs text-slate-500 font-medium tracking-tight">Alterar senha e proteção de conta</p>
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-slate-600 group-hover:text-foreground transition-all translate-x-0 group-hover:translate-x-1" />
                        </div>

                        {/* Notifications Toggler */}
                        <div className="p-5 md:p-6 flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 rounded-xl bg-foreground/5 text-orange-500 group-hover:scale-110 transition-transform">
                                    <Bell size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-foreground text-sm">Notificações</p>
                                    <p className="text-xs text-slate-500 font-medium tracking-tight">Alertas de vencimento e resumos</p>
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    toggleNotification();
                                }}
                                className={cn(
                                    "w-12 h-6 md:w-14 md:h-7 rounded-full transition-all relative flex items-center px-1 border border-white/5",
                                    settings?.notifications ? "bg-primary shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "bg-slate-300 dark:bg-slate-800"
                                )}
                            >
                                <div className={cn(
                                    "w-4 h-4 md:w-5 md:h-5 bg-white rounded-full shadow-lg transition-transform",
                                    settings?.notifications ? "translate-x-6 md:translate-x-7" : "translate-x-0"
                                )} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* System Section */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Sistema</h3>
                    <div className="glass overflow-hidden divide-y divide-white/5 shadow-2xl">
                        <div className="p-5 md:p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 rounded-xl bg-foreground/5 text-purple-500">
                                        <Database size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground text-sm">Exportar Dados</p>
                                        <p className="text-xs text-slate-500 font-medium">Histórico financeiro ({transactions.length} registros)</p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:ml-12">
                                <button
                                    onClick={() => exportData('csv')}
                                    className="px-6 py-4 bg-foreground/5 hover:bg-foreground/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-foreground flex items-center justify-center gap-2 transition-all border border-white/5"
                                >
                                    <Download size={16} className="text-slate-500" /> Planilha CSV
                                </button>
                                <button
                                    onClick={() => exportData('json')}
                                    className="px-6 py-4 bg-foreground/5 hover:bg-foreground/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-foreground flex items-center justify-center gap-2 transition-all border border-white/5"
                                >
                                    <Download size={16} className="text-slate-500" /> Backup JSON
                                </button>
                            </div>
                        </div>

                        <div className="p-5 md:p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 rounded-xl bg-foreground/5 text-slate-400">
                                        <Moon size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground text-sm">Aparência</p>
                                        <p className="text-xs text-slate-500 font-medium tracking-tight">Personalize cores (Claro ou Escuro)</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 md:ml-12">
                                <button
                                    onClick={() => changeTheme('dark')}
                                    className={cn(
                                        "flex-1 md:flex-initial px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                        settings?.theme === 'dark'
                                            ? "bg-primary/20 border-primary/40 text-primary shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                            : "bg-foreground/5 border-white/5 text-slate-500 hover:bg-foreground/10"
                                    )}
                                >
                                    Escuro
                                </button>
                                <button
                                    onClick={() => changeTheme('light')}
                                    className={cn(
                                        "flex-1 md:flex-initial px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                        settings?.theme === 'light'
                                            ? "bg-primary/20 border-primary/40 text-primary shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                            : "bg-foreground/5 border-white/5 text-slate-500 hover:bg-foreground/10"
                                    )}
                                >
                                    Claro
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 md:pt-6">
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-3 py-5 border border-white/5 bg-foreground/5 rounded-2xl text-danger font-black uppercase tracking-widest text-[11px] hover:bg-danger/10 hover:border-danger/20 transition-all shadow-xl"
                    >
                        <LogOut size={20} />
                        Encerrar Sessão
                    </button>
                    <p className="text-center text-[9px] text-slate-500 font-black uppercase tracking-widest mt-8 opacity-40 px-4">
                        Seus dados são criptografados e sincronizados com Antigravity Cloud Security
                    </p>
                </div>
            </div>

            {/* Security Modal */}
            {showSecurityModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div
                        className="glass w-full max-w-md p-8 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowSecurityModal(false)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="flex flex-col items-center text-center space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
                                <Shield size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white uppercase tracking-tight">Segurança da Conta</h3>
                            <p className="text-sm text-slate-400">Para sua proteção, confirme sua senha atual antes de definir uma nova.</p>
                        </div>

                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Senha Atual</label>
                                <input
                                    type="password"
                                    required
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nova Senha</label>
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all"
                                    placeholder="Mínimo 6 caracteres"
                                    minLength={6}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-4 bg-primary text-background font-black uppercase tracking-widest text-sm rounded-xl hover:bg-primary-hover transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                            >
                                {isSaving ? <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" /> : <Save size={18} />}
                                Atualizar Senha
                            </button>
                        </form>

                        {errorMessage && (
                            <p className="text-center text-[11px] text-danger font-bold mt-4 animate-in shake duration-500">{errorMessage}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
