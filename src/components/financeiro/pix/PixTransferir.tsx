/**
 * ─── PixTransferir — Transferir via Pix ─────────────────────────
 * Transfer money to another person/company via PIX key.
 * Creates a PIX transfer via NeuroFinance / Asaas BaaS.
 * ─────────────────────────────────────────────────────────────────
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
    Send,
    Loader2,
    CheckCircle2,
    DollarSign,
    Key,
    FileText,
} from "lucide-react";
import { useNeuroFinancePix } from "@/hooks/use-neurofinance-pix";
import { toast } from "sonner";

type KeyType = "cpf" | "cnpj" | "email" | "telefone" | "evp";

export function PixTransferir() {
    const [keyType, setKeyType] = useState<KeyType>("cpf");
    const [pixKey, setPixKey] = useState("");
    const [valor, setValor] = useState("");
    const [descricao, setDescricao] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState<"form" | "success">("form");
    const [txResult, setTxResult] = useState<any>(null);
    const { sendPix } = useNeuroFinancePix();

    const keyTypes: { id: KeyType; label: string }[] = [
        { id: "cpf", label: "CPF" },
        { id: "cnpj", label: "CNPJ" },
        { id: "email", label: "E-mail" },
        { id: "telefone", label: "Telefone" },
        { id: "evp", label: "Chave Aleatória" },
    ];

    const handleTransfer = async () => {
        if (!pixKey.trim()) { toast.error("Informe a chave Pix."); return; }
        if (!valor || parseFloat(valor) <= 0) { toast.error("Informe um valor válido."); return; }

        setIsProcessing(true);
        try {
            const result = await sendPix.mutateAsync({
                valor: parseFloat(valor),
                pixKey,
                descricao: descricao || `Transferência via Pix para ${pixKey}`,
                type: 'transfer'
            });

            setTxResult(result);
            setStep("success");
        } catch (error: any) {
            // Error handled by mutation onError
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setPixKey("");
        setValor("");
        setDescricao("");
        setTxResult(null);
        setStep("form");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="p-6 rounded-[28px] bg-zinc-900 dark:bg-white border border-zinc-800 dark:border-zinc-200">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 dark:bg-black/5 text-white dark:text-zinc-900 flex items-center justify-center shadow-lg">
                        <Send className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-tight text-white dark:text-zinc-900">
                            Transferir via Pix
                        </h3>
                        <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-0.5">
                            Transferências gratuitas e ilimitadas • NeuroFinance API
                        </p>
                    </div>
                    <div className="ml-auto px-3 py-1 rounded-full bg-white/10 dark:bg-black/5 text-[8px] font-black uppercase tracking-widest text-white dark:text-zinc-900">
                        Produção
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {step === "form" && (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-5"
                    >
                        {/* Key Type */}
                        <div className="p-5 rounded-[24px] bg-white/60 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.06] backdrop-blur-xl">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-3 block">
                                Tipo de Chave
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {keyTypes.map((kt) => (
                                    <button
                                        key={kt.id}
                                        onClick={() => setKeyType(kt.id)}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all duration-200",
                                            keyType === kt.id
                                                ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-lg"
                                                : "bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10"
                                        )}
                                    >
                                        {kt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Pix Key Input */}
                        <div className="p-5 rounded-[24px] bg-white/60 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.06] backdrop-blur-xl">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-3 block">
                                <Key className="w-3 h-3 inline mr-1.5 -mt-0.5" />
                                Chave Pix do destinatário
                            </label>
                            <input
                                value={pixKey}
                                onChange={(e) => setPixKey(e.target.value)}
                                placeholder={keyType === "cpf" ? "000.000.000-00" : keyType === "email" ? "email@example.com" : keyType === "telefone" ? "+5511999999999" : "Chave EVP"}
                                className="w-full h-12 px-4 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 text-sm font-bold text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/30 dark:focus:ring-white/30 transition-all"
                            />
                        </div>

                        {/* Value Input */}
                        <div className="p-5 rounded-[24px] bg-white/60 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.06] backdrop-blur-xl">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-3 block">
                                <DollarSign className="w-3 h-3 inline mr-1.5 -mt-0.5" />
                                Valor (R$)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={valor}
                                onChange={(e) => setValor(e.target.value)}
                                placeholder="0,00"
                                className="w-full h-14 px-4 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 text-2xl font-black text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900/30 dark:focus:ring-white/30 transition-all"
                            />
                        </div>

                        {/* Description */}
                        <div className="p-5 rounded-[24px] bg-white/60 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.06] backdrop-blur-xl">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-3 block">
                                <FileText className="w-3 h-3 inline mr-1.5 -mt-0.5" />
                                Descrição (Opcional)
                            </label>
                            <input
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                placeholder="Descreva o motivo da transferência"
                                className="w-full h-12 px-4 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/30 dark:focus:ring-white/30 transition-all"
                            />
                        </div>

                        {/* Submit */}
                        <button
                            onClick={handleTransfer}
                            disabled={isProcessing || !pixKey.trim() || !valor}
                            className={cn(
                                "w-full h-14 rounded-2xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300",
                                pixKey.trim() && valor
                                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 shadow-2xl"
                                    : "bg-zinc-100 dark:bg-white/5 text-zinc-400 cursor-not-allowed"
                            )}
                        >
                            {isProcessing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Transferir via Pix
                                </>
                            )}
                        </button>
                    </motion.div>
                )}

                {step === "success" && (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-12 text-center"
                    >
                        <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-white/10 flex items-center justify-center mb-6">
                            <CheckCircle2 className="w-10 h-10 text-zinc-900 dark:text-white" />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
                            Transferência Enviada
                        </h3>
                        <p className="text-sm text-zinc-500 mt-2 max-w-sm">
                            Transferência Pix enviada com sucesso via NeuroFinance.
                        </p>
                        {txResult?.payment_id && (
                            <div className="mt-4 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-white/5 text-[10px] font-mono text-zinc-500">
                                ID: {txResult.payment_id}
                            </div>
                        )}
                        <button
                            onClick={handleReset}
                            className="mt-8 px-8 h-12 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black font-black text-[10px] uppercase tracking-wider hover:opacity-90 transition-opacity"
                        >
                            Nova Transferência
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
