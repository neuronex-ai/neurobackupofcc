/**
 * ─── PagamentosAgendamento — Agendar Pagamentos ─────────────────
 * Schedule payments via NeuroFinance / Asaas BaaS.
 * Supports both boletos (bar code) and PIX (key/br_code).
 *
 * Flow:
 *   1. Add payment items (boleto or Pix)
 *   2. Submit for decode/validation → returns group_id
 *   3. Review validated items
 *   4. Submit group for approval
 * ─────────────────────────────────────────────────────────────────
 */

import { useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Loader2,
    Trash2,
    Send,
    CheckCircle2,
    AlertCircle,
    Calendar,
    FileText,
    Barcode,
    QrCode,
} from "lucide-react";
import { useNeuroFinanceScheduledPayments, type SchedulePaymentItem } from "@/hooks/use-neurofinance-scheduled-payments";
import { toast } from "sonner";

type PaymentType = "boleto" | "pix";

interface PaymentFormItem {
    id: string;
    type: PaymentType;
    content: string;
    amount: string;
    description: string;
    transaction_date: string;
    beneficiary_name: string;
}

const emptyItem = (): PaymentFormItem => ({
    id: crypto.randomUUID(),
    type: "boleto",
    content: "",
    amount: "",
    description: "",
    transaction_date: new Date().toISOString().split("T")[0],
    beneficiary_name: "",
});

export function PagamentosAgendamento() {
    const [items, setItems] = useState<PaymentFormItem[]>([emptyItem()]);
    const [step, setStep] = useState<"form" | "review" | "success">("form");
    const [groupResult, setGroupResult] = useState<any>(null);
    const { decodePayments, submitForApproval } = useNeuroFinanceScheduledPayments();

    const addItem = () => setItems([...items, emptyItem()]);

    const removeItem = (id: string) => {
        if (items.length === 1) return;
        setItems(items.filter((i) => i.id !== id));
    };

    const updateItem = (id: string, field: keyof PaymentFormItem, value: string) => {
        setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
    };

    const totalAmount = items.reduce((sum, item) => {
        const val = parseFloat(item.amount);
        return sum + (isNaN(val) ? 0 : val);
    }, 0);

    const handleDecode = async () => {
        const validItems = items.filter((i) => i.content.trim() && parseFloat(i.amount) > 0);
        if (validItems.length === 0) {
            toast.error("Adicione pelo menos um pagamento com conteúdo e valor válidos.");
            return;
        }

        try {
            const paymentItems: SchedulePaymentItem[] = validItems.map((i) => ({
                amount: parseFloat(i.amount),
                content: i.content.trim(),
                description: i.description || `Pagamento ${i.type === "boleto" ? "Boleto" : "Pix"} via NeuroFinance`,
                transaction_date: i.transaction_date || undefined,
                beneficiary_name: i.beneficiary_name || undefined,
            }));

            const result = await decodePayments.mutateAsync(paymentItems);
            setGroupResult(result);
            setStep("review");
        } catch {
            // Error handled by mutation
        }
    };

    const handleSubmitForApproval = async () => {
        if (!groupResult?.group_id) {
            toast.error("Nenhum grupo para submeter.");
            return;
        }
        try {
            await submitForApproval.mutateAsync({ groupId: groupResult.group_id });
            setStep("success");
        } catch {
            // Error handled by mutation
        }
    };

    const handleReset = () => {
        setItems([emptyItem()]);
        setGroupResult(null);
        setStep("form");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="p-6 rounded-[28px] bg-zinc-900 dark:bg-white border border-zinc-800 dark:border-zinc-200">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 dark:bg-black/5 text-white dark:text-zinc-900 flex items-center justify-center shadow-lg">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-tight text-white dark:text-zinc-900">
                            Agendar Pagamentos
                        </h3>
                        <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-0.5">
                            Boletos e Pix • NeuroFinance API
                        </p>
                    </div>
                    <div className="ml-auto px-3 py-1 rounded-full bg-white/10 dark:bg-black/5 text-[8px] font-black uppercase tracking-widest text-white dark:text-zinc-900">
                        Sandbox
                    </div>
                </div>
            </div>

            {/* How it works */}
            <div className="p-4 rounded-[20px] bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.06]">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-zinc-900 dark:text-white mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-300 mb-1">
                            Como funciona
                        </p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                            Cadastre seus pagamentos (boletos ou Pix) → Envie para validação → Revise os itens → Submeta para processamento via NeuroFinance.
                            Os pagamentos serão processados pela plataforma NeuroFinance.
                        </p>
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {/* ─── STEP 1: Form ─────────────────────────────────────── */}
                {step === "form" && (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {items.map((item, idx) => (
                            <div
                                key={item.id}
                                className="p-5 rounded-[24px] bg-white/60 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.06] space-y-4"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                        Pagamento #{idx + 1}
                                    </span>
                                    {items.length > 1 && (
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="p-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* Type selector */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => updateItem(item.id, "type", "boleto")}
                                        className={cn(
                                            "flex-1 h-10 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all",
                                            item.type === "boleto"
                                                ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-lg"
                                                : "bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-white/10"
                                        )}
                                    >
                                        <Barcode className="w-3.5 h-3.5" />
                                        Boleto
                                    </button>
                                    <button
                                        onClick={() => updateItem(item.id, "type", "pix")}
                                        className={cn(
                                            "flex-1 h-10 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all",
                                            item.type === "pix"
                                                ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-lg"
                                                : "bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-white/10"
                                        )}
                                    >
                                        <QrCode className="w-3.5 h-3.5" />
                                        Pix
                                    </button>
                                </div>

                                {/* Content (barcode / pix key) */}
                                <div>
                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2 block">
                                        {item.type === "boleto" ? (
                                            <><Barcode className="w-3 h-3 inline mr-1.5 -mt-0.5" />Código de Barras / Linha Digitável</>
                                        ) : (
                                            <><QrCode className="w-3 h-3 inline mr-1.5 -mt-0.5" />Chave Pix / BR Code (Copia e Cola)</>
                                        )}
                                    </label>
                                    <input
                                        value={item.content}
                                        onChange={(e) => updateItem(item.id, "content", e.target.value)}
                                        placeholder={item.type === "boleto" ? "33691991800000005000000003048720009765974213" : "CPF, CNPJ, e-mail, telefone ou chave aleatória"}
                                        className="w-full h-10 px-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 text-xs font-mono text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/30 dark:focus:ring-white/30 transition-all"
                                    />
                                </div>

                                {/* Amount + Date */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2 block">
                                            Valor (R$)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            value={item.amount}
                                            onChange={(e) => updateItem(item.id, "amount", e.target.value)}
                                            placeholder="0,00"
                                            className="w-full h-10 px-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 text-sm font-black text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900/30 dark:focus:ring-white/30 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2 block">
                                            <Calendar className="w-3 h-3 inline mr-1.5 -mt-0.5" />Data da Transação
                                        </label>
                                        <input
                                            type="date"
                                            value={item.transaction_date}
                                            onChange={(e) => updateItem(item.id, "transaction_date", e.target.value)}
                                            className="w-full h-10 px-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/30 dark:focus:ring-white/30 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Description + Beneficiary */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2 block">
                                            <FileText className="w-3 h-3 inline mr-1.5 -mt-0.5" />Descrição
                                        </label>
                                        <input
                                            value={item.description}
                                            onChange={(e) => updateItem(item.id, "description", e.target.value)}
                                            placeholder="Ex: Aluguel do mês"
                                            className="w-full h-10 px-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/30 dark:focus:ring-white/30 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2 block">
                                            Beneficiário
                                        </label>
                                        <input
                                            value={item.beneficiary_name}
                                            onChange={(e) => updateItem(item.id, "beneficiary_name", e.target.value)}
                                            placeholder="Nome do beneficiário"
                                            className="w-full h-10 px-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/30 dark:focus:ring-white/30 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Add More + Total */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={addItem}
                                className="flex-1 h-12 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-dashed border-zinc-300 dark:border-white/10 text-zinc-500 font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-white/10 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                Adicionar Pagamento
                            </button>
                            <div className="px-5 py-3 rounded-2xl bg-zinc-900 dark:bg-white/5 text-center">
                                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 block">Total</span>
                                <span className="text-sm font-black text-white dark:text-zinc-200">{formatCurrency(totalAmount)}</span>
                            </div>
                        </div>

                        {/* Submit for Decode */}
                        <button
                            onClick={handleDecode}
                            disabled={decodePayments.isPending || items.every((i) => !i.content.trim())}
                            className={cn(
                                "w-full h-14 rounded-2xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300",
                                items.some((i) => i.content.trim() && parseFloat(i.amount) > 0)
                                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-2xl hover:opacity-90"
                                    : "bg-zinc-100 dark:bg-white/5 text-zinc-400 cursor-not-allowed"
                            )}
                        >
                            {decodePayments.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Enviar para Validação ({items.length} pagamento{items.length > 1 ? "s" : ""})
                                </>
                            )}
                        </button>
                    </motion.div>
                )}

                {/* ─── STEP 2: Review ───────────────────────────────────── */}
                {step === "review" && groupResult && (
                    <motion.div
                        key="review"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-5"
                    >
                        <div className="p-6 rounded-[28px] bg-white dark:bg-white/[0.03] border border-zinc-200/50 dark:border-white/[0.06]">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/10 flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5 text-zinc-900 dark:text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-tight text-zinc-900 dark:text-white">
                                        Grupo Criado com Sucesso
                                    </h3>
                                    <p className="text-[10px] text-zinc-500 mt-0.5">
                                        Os pagamentos foram enviados para pré-processamento via NeuroFinance.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center p-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03]">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Group ID</span>
                                    <span className="text-[10px] font-mono text-zinc-700 dark:text-zinc-300">{groupResult.group_id}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03]">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Total de Itens</span>
                                    <span className="text-[10px] font-black text-zinc-700 dark:text-zinc-300">{items.length}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03]">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Valor Total</span>
                                    <span className="text-sm font-black text-zinc-900 dark:text-white">{formatCurrency(totalAmount)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Items Preview */}
                        <div className="space-y-2">
                            {items.filter(i => i.content.trim()).map((item, idx) => (
                                <div key={item.id} className="p-4 rounded-[20px] bg-white/60 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.06]">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
                                            "bg-zinc-100 dark:bg-white/10"
                                        )}>
                                            {item.type === "boleto" ? (
                                                <Barcode className="w-4 h-4 text-zinc-900 dark:text-white" />
                                            ) : (
                                                <QrCode className="w-4 h-4 text-zinc-900 dark:text-white" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black text-zinc-700 dark:text-zinc-200 truncate">
                                                {item.description || `Pagamento #${idx + 1}`}
                                            </p>
                                            <p className="text-[9px] font-mono text-zinc-400 truncate">{item.content}</p>
                                        </div>
                                        <span className="text-sm font-black text-zinc-900 dark:text-white whitespace-nowrap">
                                            {formatCurrency(parseFloat(item.amount) || 0)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleSubmitForApproval}
                                disabled={submitForApproval.isPending}
                                className="flex-1 h-14 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 shadow-2xl transition-all"
                            >
                                {submitForApproval.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Enviar para Aprovação
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleReset}
                                className="h-14 px-6 rounded-2xl bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 font-black text-[10px] uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-white/10 transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ─── STEP 3: Success ──────────────────────────────────── */}
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
                            Pagamentos Submetidos
                        </h3>
                        <p className="text-sm text-zinc-500 mt-2 max-w-sm">
                            O grupo de pagamentos foi enviado para processamento via NeuroFinance.
                            Os pagamentos serão processados e você receberá uma confirmação.
                        </p>
                        {groupResult?.group_id && (
                            <div className="mt-4 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-white/5 text-[10px] font-mono text-zinc-500">
                                Group ID: {groupResult.group_id}
                            </div>
                        )}
                        <button
                            onClick={handleReset}
                            className="mt-8 px-8 h-12 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black font-black text-[10px] uppercase tracking-wider hover:opacity-90 transition-opacity"
                        >
                            Novo Agendamento
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
