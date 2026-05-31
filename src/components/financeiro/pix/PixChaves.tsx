/**
 * ─── PixChaves — Gerenciar Chaves Pix ───────────────────────────
 * Manage PIX keys registered in the financial account.
 * Fetches current key from financial_accounts and allows viewing.
 * ─────────────────────────────────────────────────────────────────
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
    Key,
    Copy,
    Plus,
    Mail,
    Phone,
    Hash,
    Fingerprint,
    CheckCircle2,
    Shield,
} from "lucide-react";
import { useFinancialAccount } from "@/hooks/use-financial-account";
import { toast } from "sonner";

type KeyType = "evp" | "cpf" | "email" | "telefone";

interface PixKeyItem {
    type: KeyType;
    value: string;
    createdAt: string;
    status: "active" | "pending";
}

export function PixChaves() {
    const { account } = useFinancialAccount();
    const [showAddForm, setShowAddForm] = useState(false);

    // Build the list of keys from the account data
    const keys: PixKeyItem[] = [];
    if (account?.pix_key) {
        keys.push({
            type: "evp",
            value: account.pix_key,
            createdAt: new Date().toISOString(),
            status: "active",
        });
    }

    const keyTypeInfo = {
        evp: { label: "Chave Aleatória", icon: Hash, color: "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" },
        cpf: { label: "CPF/CNPJ", icon: Fingerprint, color: "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" },
        email: { label: "E-mail", icon: Mail, color: "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" },
        telefone: { label: "Telefone", icon: Phone, color: "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" },
    };

    const handleCopyKey = (value: string) => {
        navigator.clipboard.writeText(value);
        toast.success("Chave Pix copiada!");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="p-6 rounded-[28px] bg-zinc-900 dark:bg-white border border-zinc-800 dark:border-zinc-200">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 dark:bg-black/5 text-white dark:text-zinc-900 flex items-center justify-center shadow-lg">
                        <Key className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-tight text-white dark:text-zinc-900">
                            Minhas Chaves Pix
                        </h3>
                        <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-0.5">
                            Cadastre e gerencie suas chaves • Conta NeuroFinance
                        </p>
                    </div>
                    <div className="ml-auto px-3 py-1 rounded-full bg-white/10 dark:bg-black/5 text-[8px] font-black uppercase tracking-widest text-white dark:text-zinc-900">
                        Sandbox
                    </div>
                </div>
            </div>

            {/* Security Notice */}
            <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-start gap-3">
                <Shield className="w-4 h-4 text-zinc-900 dark:text-white shrink-0 mt-0.5" />
                <div>
                    <p className="text-[9px] font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                        Segurança NeuroFinance
                    </p>
                    <p className="text-[10px] text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                        Suas chaves Pix são protegidas pela infraestrutura Asaas BaaS, garantindo segurança em todas as transações.
                    </p>
                </div>
            </div>

            {/* Keys List */}
            <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
                        Chaves Cadastradas ({keys.length})
                    </p>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                    >
                        <Plus className="w-3 h-3" />
                        Nova Chave
                    </button>
                </div>

                {keys.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Key className="w-12 h-12 text-zinc-200 dark:text-zinc-700 mb-4" />
                        <p className="text-sm font-bold text-zinc-400">Nenhuma chave cadastrada</p>
                        <p className="text-[10px] text-zinc-400 mt-1">
                            Cadastre sua primeira chave Pix para começar a receber
                        </p>
                    </div>
                ) : (
                    keys.map((key, index) => {
                        const info = keyTypeInfo[key.type];
                        const Icon = info.icon;

                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-5 rounded-[20px] bg-white/60 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.06] hover:bg-white dark:hover:bg-white/[0.04] transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-md", info.color)}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">{info.label}</p>
                                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/10 text-[7px] font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                                <CheckCircle2 className="w-2.5 h-2.5" />
                                                Ativa
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold text-zinc-900 dark:text-white font-mono mt-1 truncate">
                                            {key.value}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleCopyKey(key.value)}
                                        className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-200 dark:hover:bg-white/10"
                                    >
                                        <Copy className="w-4 h-4 text-zinc-500" />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Add Key Form (simplified for sandbox) */}
            {showAddForm && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="p-6 rounded-[24px] bg-white/60 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.06] space-y-4"
                >
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
                        Cadastrar Nova Chave (Sandbox)
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        {(Object.entries(keyTypeInfo) as [KeyType, typeof keyTypeInfo.evp][]).map(([id, info]) => {
                            const Icon = info.icon;
                            return (
                                <button
                                    key={id}
                                    className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 flex items-center gap-3 hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-all text-left"
                                >
                                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", info.color)}>
                                        <Icon className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                                        {info.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-[9px] text-zinc-400 text-center">
                        No ambiente sandbox, as chaves são gerenciadas automaticamente pelo sistema.
                    </p>
                </motion.div>
            )}
        </div>
    );
}
