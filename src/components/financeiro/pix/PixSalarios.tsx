/**
 * ─── PixSalarios — Pagar Salários via Pix ───────────────────────
 * Batch PIX payments for employee salaries.
 * Uses NeuroFinance / Asaas BaaS payment API.
 * ─────────────────────────────────────────────────────────────────
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Upload,
    Plus,
    Trash2,
    Send,
    Loader2,
    CheckCircle2,
    FileSpreadsheet,
} from "lucide-react";
import { useNeuroFinancePix } from "@/hooks/use-neurofinance-pix";
import { toast } from "sonner";

interface Funcionario {
    id: string;
    nome: string;
    cpf: string;
    pixKey: string;
    valor: string;
}

export function PixSalarios() {
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState<"list" | "success">("list");
    const { sendPix } = useNeuroFinancePix();

    const addFuncionario = () => {
        setFuncionarios(prev => [...prev, {
            id: crypto.randomUUID(),
            nome: "",
            cpf: "",
            pixKey: "",
            valor: "",
        }]);
    };

    const removeFuncionario = (id: string) => {
        setFuncionarios(prev => prev.filter(f => f.id !== id));
    };

    const updateFuncionario = (id: string, field: keyof Funcionario, value: string) => {
        setFuncionarios(prev => prev.map(f =>
            f.id === id ? { ...f, [field]: value } : f
        ));
    };

    const totalPagamento = funcionarios.reduce((sum, f) => sum + (parseFloat(f.valor) || 0), 0);

    const handleProcessBatch = async () => {
        const valid = funcionarios.filter(f => f.nome && f.pixKey && f.valor && parseFloat(f.valor) > 0);
        if (valid.length === 0) {
            toast.error("Adicione pelo menos um funcionário com dados válidos.");
            return;
        }

        setIsProcessing(true);
        try {
            // Process each salary payment as an individual PIX transfer
            for (const func of valid) {
                await sendPix.mutateAsync({
                    valor: parseFloat(func.valor),
                    pixKey: func.pixKey,
                    descricao: `Pagamento de salário - ${func.nome}`,
                    type: 'transfer'
                });
            }

            setStep("success");
            toast.success(`${valid.length} pagamentos processados com sucesso!`);
        } catch (error: any) {
            // Error handling is managed by the hook's toast
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setFuncionarios([]);
        setStep("list");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="p-6 rounded-[28px] bg-zinc-900 dark:bg-white border border-zinc-800 dark:border-zinc-200">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 dark:bg-black/5 text-white dark:text-zinc-900 flex items-center justify-center shadow-lg">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-tight text-white dark:text-zinc-900">
                            Pagar Salários via Pix
                        </h3>
                        <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-0.5">
                            Pagamentos em lote via Pix • NeuroFinance API
                        </p>
                    </div>
                    <div className="ml-auto px-3 py-1 rounded-full bg-white/10 dark:bg-black/5 text-[8px] font-black uppercase tracking-widest text-white dark:text-zinc-900">
                        Produção
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {step === "list" && (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {/* Actions Bar */}
                        <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                Funcionários ({funcionarios.length})
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-zinc-200 dark:hover:bg-white/10 transition-all"
                                >
                                    <Upload className="w-3 h-3" />
                                    Importar CSV
                                </button>
                                <button
                                    onClick={addFuncionario}
                                    className="px-3 py-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                                >
                                    <Plus className="w-3 h-3" />
                                    Adicionar
                                </button>
                            </div>
                        </div>

                        {/* Employees List */}
                        {funcionarios.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center rounded-[24px] bg-white/60 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.06] border-dashed">
                                <FileSpreadsheet className="w-12 h-12 text-zinc-200 dark:text-zinc-700 mb-4" />
                                <p className="text-sm font-bold text-zinc-400">Nenhum funcionário adicionado</p>
                                <p className="text-[10px] text-zinc-400 mt-1">
                                    Adicione funcionários manualmente ou importe via CSV
                                </p>
                                <button
                                    onClick={addFuncionario}
                                    className="mt-6 px-6 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5"
                                >
                                    <Plus className="w-3 h-3" />
                                    Adicionar Funcionário
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {funcionarios.map((func, i) => (
                                    <motion.div
                                        key={func.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        className="p-5 rounded-[20px] bg-white/60 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.06]"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="w-6 h-6 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center text-[9px] font-black">
                                                {i + 1}
                                            </span>
                                            <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 flex-1">
                                                Funcionário
                                            </span>
                                            <button
                                                onClick={() => removeFuncionario(func.id)}
                                                className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center hover:bg-red-100 transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3 text-red-500" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                                            <input
                                                value={func.nome}
                                                onChange={(e) => updateFuncionario(func.id, "nome", e.target.value)}
                                                placeholder="Nome completo"
                                                className="col-span-2 h-10 px-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/30 dark:focus:ring-white/30"
                                            />
                                            <input
                                                value={func.cpf}
                                                onChange={(e) => updateFuncionario(func.id, "cpf", e.target.value)}
                                                placeholder="CPF"
                                                className="h-10 px-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/30 dark:focus:ring-white/30"
                                            />
                                            <input
                                                value={func.pixKey}
                                                onChange={(e) => updateFuncionario(func.id, "pixKey", e.target.value)}
                                                placeholder="Chave Pix"
                                                className="md:col-span-2 h-10 px-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/30 dark:focus:ring-white/30"
                                            />
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={func.valor}
                                                onChange={(e) => updateFuncionario(func.id, "valor", e.target.value)}
                                                placeholder="R$ 0,00"
                                                className="h-10 px-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 text-xs font-bold text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/30 dark:focus:ring-white/30"
                                            />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* Total & Submit */}
                        {funcionarios.length > 0 && (
                            <div className="space-y-3">
                                <div className="p-5 rounded-[20px] bg-zinc-900 dark:bg-white flex items-center justify-between">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                                        Total a Pagar
                                    </span>
                                    <span className="text-xl font-black text-white dark:text-black">
                                        R$ {totalPagamento.toFixed(2)}
                                    </span>
                                </div>

                                <button
                                    onClick={handleProcessBatch}
                                    disabled={isProcessing || funcionarios.length === 0}
                                    className={cn(
                                        "w-full h-14 rounded-2xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300",
                                        "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 shadow-2xl"
                                    )}
                                >
                                    {isProcessing ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Processar Pagamentos em Lote
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
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
                            Pagamentos Processados
                        </h3>
                        <p className="text-sm text-zinc-500 mt-2 max-w-sm">
                            Os pagamentos foram enviados individualmente pela API Pix da Asaas.
                        </p>
                        <button
                            onClick={handleReset}
                            className="mt-8 px-8 h-12 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black font-black text-[10px] uppercase tracking-wider hover:opacity-90 transition-opacity"
                        >
                            Novo Lote de Pagamento
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
