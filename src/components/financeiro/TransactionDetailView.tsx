"use client";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    ChevronLeft,
    FileText,
    Receipt,
    Calendar,
    User,
    CreditCard,
    Landmark,
    ShieldCheck,
    ArrowUpRight,
    ArrowDownLeft
} from "lucide-react";
import { Transaction } from "@/types";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface TransactionDetailViewProps {
    transaction: Transaction;
    onBack: () => void;
}

const TransactionDetailView = ({ transaction, onBack }: TransactionDetailViewProps) => {
    const isIncome = transaction.type === 'income';
    const isNeuro = !!(transaction.external_reference || (transaction as any).asaas_payment_id);
    const patientName = (transaction as any).patient_name || (transaction as any).patients?.name;

    const handleDownloadReceipt = () => {
        toast.promise(new Promise(resolve => setTimeout(resolve, 1500)), {
            loading: 'Gerando recibo oficial...',
            success: 'Recibo baixado com sucesso!',
            error: 'Erro ao gerar recibo.',
        });
        // Aqui simularíamos o download do PDF
        console.log("[transaction-detail] Downloading receipt for", transaction.id);
    };

    const handleDownloadInvoice = () => {
        if (!isNeuro) {
            toast.error("Fatura disponível apenas para transações via NeuroFinance");
            return;
        }
        toast.promise(new Promise(resolve => setTimeout(resolve, 1500)), {
            loading: 'Recuperando fatura...',
            success: 'Fatura baixada com sucesso!',
            error: 'Erro ao baixar fatura.',
        });
        console.log("[transaction-detail] Downloading invoice for", transaction.id);
    };

    const InfoRow = ({ icon: Icon, label, value, subValue }: any) => (
        <div className="flex items-start gap-4 p-5 rounded-[24px] bg-white dark:bg-white/[0.02] border border-zinc-100 dark:border-white/5">
            <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-white/5 flex items-center justify-center text-zinc-400">
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">{label}</span>
                <span className="text-[11px] font-black text-zinc-900 dark:text-white uppercase tracking-tight">{value}</span>
                {subValue && <span className="text-[9px] font-medium text-zinc-400 uppercase tracking-widest mt-0.5">{subValue}</span>}
            </div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-8 max-w-2xl mx-auto"
        >
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={onBack} className="h-10 px-4 rounded-full bg-zinc-100 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest">
                    <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
                </Button>
                <div className="flex items-center gap-2">
                    <Button onClick={handleDownloadReceipt} variant="outline" size="sm" className="h-10 px-6 rounded-full border-zinc-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest">
                        <Receipt className="w-3.5 h-3.5 mr-2" /> Recibo
                    </Button>
                    {isNeuro && (
                        <Button onClick={handleDownloadInvoice} variant="outline" size="sm" className="h-10 px-6 rounded-full border-zinc-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest">
                            <FileText className="w-3.5 h-3.5 mr-2" /> Fatura
                        </Button>
                    )}
                </div>
            </div>

            <div className="text-center space-y-4 py-6">
                <div className={cn(
                    "w-20 h-20 rounded-[32px] mx-auto flex items-center justify-center border shadow-2xl transition-transform hover:scale-105 duration-500",
                    isIncome ? "bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white" : "bg-zinc-100 dark:bg-white/10 text-zinc-400 border-zinc-200 dark:border-white/5"
                )}>
                    {isIncome ? <ArrowUpRight className="w-8 h-8" /> : <ArrowDownLeft className="w-8 h-8" />}
                </div>
                <div>
                    <h3 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">
                        {isIncome ? '+' : '-'} R$ {Math.abs(transaction.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.4em] mt-2">{transaction.description}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow
                    icon={Calendar}
                    label="Data e Hora"
                    value={transaction.date && !isNaN(new Date(transaction.date).getTime())
                        ? format(new Date(transaction.date), "dd 'de' MMMM, yyyy", { locale: ptBR })
                        : "DATA INDISPONÍVEL"}
                    subValue={transaction.date && !isNaN(new Date(transaction.date).getTime())
                        ? format(new Date(transaction.date), "HH:mm'h'")
                        : "HORÁRIO INDISPONÍVEL"}
                />
                <InfoRow
                    icon={ShieldCheck}
                    label="Status da Operação"
                    value={transaction.status === 'completed' ? "EFETIVADO" : "PENDENTE"}
                    subValue={isNeuro ? "CONCILIADO VIA NEUROFINANCE" : "REGISTRO MANUAL"}
                />
                {patientName && (
                    <InfoRow
                        icon={User}
                        label="Paciente Vinculado"
                        value={patientName}
                    />
                )}
                <InfoRow
                    icon={Landmark}
                    label="Origem"
                    value={isNeuro ? "NEUROFINANCE API (ASAAS)" : "LANÇAMENTO MANUAL"}
                    subValue={transaction.category?.toUpperCase() || "GERAL"}
                />
                <InfoRow
                    icon={CreditCard}
                    label="Forma de Pagamento"
                    value={transaction.payment_method?.toUpperCase() || (transaction as any).method?.toUpperCase() || "NÃO ESPECIFICADO"}
                    subValue={(transaction as any).installments ? `${(transaction as any).installments} PARCELAS` : "À VISTA"}
                />
                <InfoRow
                    icon={FileText}
                    label="ID da Transação"
                    value={transaction.id ? transaction.id.slice(0, 18).toUpperCase() : "N/A"}
                    subValue={transaction.external_reference || "N/A"}
                />
            </div>

            {isNeuro && (
                <div className="p-8 rounded-[32px] bg-zinc-900 dark:bg-white text-white dark:text-black mt-4 relative overflow-hidden group shadow-2xl">
                    <div className="absolute inset-0 premium-noise opacity-10 pointer-events-none" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] mb-1 opacity-70">Transação Segura</h4>
                            <p className="text-[13px] font-black uppercase tracking-tight">Processado via Synapse Intelligent Pay</p>
                        </div>
                        <ShieldCheck className="w-8 h-8 opacity-40 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default TransactionDetailView;