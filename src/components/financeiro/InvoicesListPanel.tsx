"use client";

import { useInvoices } from "@/hooks/use-invoices";
import { formatCurrency, cn } from "@/lib/utils";
import { Loader2, FileText, CheckCircle2, Clock, Trash2, Search, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { usePatients } from "@/hooks/use-patients";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const cardVariants = {
    initial: { opacity: 0, y: 10 },
    animate: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.04, duration: 0.5, ease: [0.23, 1, 0.32, 1] }
    }),
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } }
};

export const InvoicesListPanel = () => {
    const { data: invoices, isLoading } = useInvoices();
    const { data: patients } = usePatients();
    const queryClient = useQueryClient();
    const [checkingId, setCheckingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const getPatientName = (patientId: string) => {
        return patients?.find(p => p.id === patientId)?.name || "Paciente";
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            // Tenta deletar de ambas as tabelas (transição)
            const [invoiceResult, nbResult] = await Promise.all([
                supabase.from('invoices').delete().eq('id', id),
                supabase.from('nb_payments').delete().eq('id', id)
            ]);

            if (invoiceResult.error && nbResult.error) {
                throw new Error("Erro ao excluir em ambas as tabelas");
            }

            toast.success("Cobrança removida");
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['nb_payments'] });
        } catch (e) {
            console.error('Erro ao excluir:', e);
            toast.error("Não foi possível excluir");
        } finally {
            setDeletingId(null);
        }
    };


    const handleCheckStatus = async (invoiceId: string) => {
        setCheckingId(invoiceId);
        try {
            const { data, error } = await supabase.functions.invoke('check-invoice-status', {
                body: { invoiceId }
            });
            if (error) throw error;

            if (data.status === 'paid') {
                toast.success(data.updated ? "✅ Pagamento confirmado! Status atualizado." : "✅ Este pagamento já está confirmado.");
            } else if (data.status === 'expired') {
                toast.warning("⏰ Link de pagamento expirado. Gere um novo.");
            } else if (data.message?.includes('No payment record')) {
                toast.info("Nenhum link de pagamento vinculado a esta fatura.");
            } else {
                toast.info("Ainda pendente. Sincronizado com sucesso.");
            }
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
        } catch (e) {
            console.error('Erro ao sincronizar:', e);
            toast.error("Erro ao sincronizar status");
        } finally {
            setCheckingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-300 dark:text-zinc-700" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Buscando dados...</p>
            </div>
        );
    }

    const filteredInvoices = invoices?.filter(inv => {
        const patientName = getPatientName(inv.patient_id).toLowerCase();
        return patientName.includes(searchQuery.toLowerCase()) || inv.description?.toLowerCase().includes(searchQuery.toLowerCase());
    }) || [];

    const pending = filteredInvoices.filter(i => (i.status as string) === 'pending' || (i.status as string) === 'open');
    const history = filteredInvoices.filter(i => (i.status as string) !== 'pending' && (i.status as string) !== 'open');

    return (
        <div className="space-y-8 bg-white dark:bg-zinc-950 rounded-[32px] border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Cobranças</h2>
                    <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.15em] mt-1">Gestão de pagamentos</p>
                </div>

                <div className="relative group max-w-sm w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100 transition-colors" />
                    <input
                        type="text"
                        placeholder="PROCURAR POR NOME OU DESCRIÇÃO..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-11 pr-4 py-3 text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-zinc-400 transition-all placeholder:text-zinc-400"
                    />
                </div>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="bg-zinc-100/50 dark:bg-zinc-900/50 p-1 rounded-2xl mb-8">
                    <TabsTrigger value="pending" className="rounded-xl px-8 py-2 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm transition-all">
                        Esperando ({pending.length})
                    </TabsTrigger>
                    <TabsTrigger value="history" className="rounded-xl px-8 py-2 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm transition-all">
                        Já Pagos
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pending">
                    <div className="grid gap-3">
                        {pending.length === 0 ? (
                            <div className="py-20 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-[24px]">
                                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Nada pendente no momento</p>
                            </div>
                        ) : pending.map((inv, idx) => (
                            <InvoiceItem
                                key={inv.id}
                                inv={inv}
                                index={idx}
                                name={getPatientName(inv.patient_id)}
                                onCheck={handleCheckStatus}
                                onDelete={handleDelete}
                                isChecking={checkingId === inv.id}
                                isDeleting={deletingId === inv.id}
                            />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="history">
                    <div className="grid gap-3">
                        {history.length === 0 ? (
                            <div className="py-20 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-[24px]">
                                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Histórico vazio</p>
                            </div>
                        ) : history.map((inv, idx) => (
                            <InvoiceItem
                                key={inv.id}
                                inv={inv}
                                index={idx}
                                name={getPatientName(inv.patient_id)}
                                onCheck={handleCheckStatus}
                                onDelete={handleDelete}
                                isChecking={checkingId === inv.id}
                                isDeleting={deletingId === inv.id}
                            />
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const InvoiceItem = ({ inv, index, name, onCheck, onDelete, isChecking, isDeleting }: any) => {
    const isPaid = inv.status === 'paid';
    const dueDate = new Date(inv.due_date);
    const isOverdue = !isPaid && dueDate < new Date();

    return (
        <motion.div
            custom={index}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            variants={cardVariants as any}
            initial="initial"
            animate="animate"
            whileHover={{ y: -2 }}
            className={cn(
                "flex flex-col md:flex-row items-center justify-between p-5 rounded-[24px] border transition-all duration-300",
                isPaid
                    ? "bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-100 dark:border-zinc-800/50"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:shadow-md"
            )}
        >
            <div className="flex items-center gap-5 w-full md:w-auto">
                <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                    isPaid ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400" :
                        isOverdue ? "bg-zinc-900 dark:bg-white text-white dark:text-black" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                )}>
                    {isPaid ? <CheckCircle2 className="w-5 h-5" /> : isOverdue ? <FileText className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </div>

                <div className="min-w-0">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{name}</h4>
                    <div className="flex items-center gap-3 mt-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                        <span>{inv.description || "Consulta"}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                        <span className={cn(isOverdue && "text-zinc-900 dark:text-white font-black")}>
                            {isPaid ? `Pago em ${format(new Date(inv.created_at), "dd/MM")}` : `Vence ${format(dueDate, "dd/MM")}`}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-10 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800">
                <div className="text-right">
                    <p className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{formatCurrency(inv.amount)}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mt-0.5">Valor total</p>
                </div>

                <div className="flex items-center gap-2">
                    {!isPaid && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => onCheck(inv.id)}
                                        disabled={isChecking}
                                        className="h-10 w-10 rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                    >
                                        {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="text-[9px] font-bold uppercase tracking-widest">Sincronizar</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    {!isPaid && (inv.payment_url || inv.pdf_url) && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => window.open(inv.payment_url || inv.pdf_url, '_blank')}
                            className="h-10 w-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-none hover:opacity-90 transition-opacity"
                        >
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                    )}

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onDelete(inv.id)}
                                    disabled={isDeleting}
                                    className="h-10 w-10 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                                >
                                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className="text-[9px] font-bold uppercase tracking-widest">Remover</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
        </motion.div>
    );
};