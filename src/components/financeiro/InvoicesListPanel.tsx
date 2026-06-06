"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
    Calendar,
    CheckCircle2,
    Clock,
    Copy,
    ExternalLink,
    Filter,
    Loader2,
    Mail,
    MoreVertical,
    Pencil,
    Plus,
    Printer,
    RefreshCw,
    Search,
    Trash2,
    User,
    WalletCards,
    XCircle,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useInvoices } from "@/hooks/use-invoices";
import { usePatients } from "@/hooks/use-patients";
import { formatCurrency, cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { NewInvoiceModal } from "@/components/financeiro/NewInvoiceModal";
import type { Invoice } from "@/types";

type ChargeStatusFilter =
    | "pending"
    | "overdue"
    | "paid"
    | "confirmed"
    | "cancelled"
    | "refunded"
    | "partial_refund"
    | "analysis"
    | "chargeback";

type ChargeTypeFilter = "single" | "subscription" | "installment";

const statusCopy: Record<string, { label: string; tone: string; icon: any }> = {
    pending: { label: "Aguardando pagamento", tone: "text-amber-600 bg-amber-500/10 border-amber-500/20", icon: Clock },
    open: { label: "Aguardando pagamento", tone: "text-amber-600 bg-amber-500/10 border-amber-500/20", icon: Clock },
    overdue: { label: "Vencida", tone: "text-red-600 bg-red-500/10 border-red-500/20", icon: XCircle },
    paid: { label: "Recebida", tone: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 },
    confirmed: { label: "Confirmada", tone: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 },
    received: { label: "Recebida", tone: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 },
    cancelled: { label: "Estornada", tone: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20", icon: XCircle },
    refunded: { label: "Estornada", tone: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20", icon: XCircle },
    analysis: { label: "Em análise", tone: "text-blue-600 bg-blue-500/10 border-blue-500/20", icon: Clock },
    chargeback: { label: "Chargeback", tone: "text-red-600 bg-red-500/10 border-red-500/20", icon: XCircle },
};

const filterStatusOptions: { id: ChargeStatusFilter; label: string }[] = [
    { id: "pending", label: "Aguardando pagamento" },
    { id: "overdue", label: "Vencida" },
    { id: "paid", label: "Recebida" },
    { id: "confirmed", label: "Confirmada" },
    { id: "cancelled", label: "Cobrança estornada" },
    { id: "refunded", label: "Estorno solicitado" },
    { id: "partial_refund", label: "Estornada parcialmente" },
    { id: "analysis", label: "Pagamento em análise" },
    { id: "chargeback", label: "Chargeback" },
];

const filterTypeOptions: { id: ChargeTypeFilter; label: string }[] = [
    { id: "single", label: "Avulsas" },
    { id: "subscription", label: "Assinaturas" },
    { id: "installment", label: "Parceladas" },
];

const getInvoiceStatus = (invoice: Invoice) => {
    const rawStatus = String((invoice as any).status || "pending").toLowerCase();
    if (rawStatus === "cancelled") return "cancelled";
    return rawStatus;
};

const getPaymentMethod = (invoice: Invoice) => {
    const raw = String(
        (invoice as any).payment_method_type ||
        (invoice as any).payment_method ||
        (invoice as any).billing_type ||
        ""
    ).toLowerCase();

    if (raw.includes("pix")) return "Pix";
    if (raw.includes("card") || raw.includes("cart")) return "Cartão";
    if (raw.includes("boleto")) return "Boleto";
    return (invoice as any).payment_url ? "Link de pagamento" : "Pergunte ao cliente";
};

const getChargeType = (invoice: Invoice): ChargeTypeFilter => {
    const text = `${invoice.description || ""} ${(invoice as any).type || ""} ${(invoice as any).category || ""}`.toLowerCase();
    if (text.includes("assinatura") || text.includes("recorr")) return "subscription";
    if (text.includes("parcela")) return "installment";
    return "single";
};

export const InvoicesListPanel = () => {
    const { data: invoices = [], isLoading } = useInvoices();
    const { data: patients = [] } = usePatients();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [checkingId, setCheckingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [dueStart, setDueStart] = useState("");
    const [dueEnd, setDueEnd] = useState("");
    const [receivedStart, setReceivedStart] = useState("");
    const [receivedEnd, setReceivedEnd] = useState("");
    const [statusFilters, setStatusFilters] = useState<ChargeStatusFilter[]>([]);
    const [typeFilters, setTypeFilters] = useState<ChargeTypeFilter[]>([]);

    const getPatientName = (patientId: string) =>
        patients.find((patient) => patient.id === patientId)?.name || "Cliente";

    const toggleStatus = (id: ChargeStatusFilter) => {
        setStatusFilters((current) =>
            current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
        );
    };

    const toggleType = (id: ChargeTypeFilter) => {
        setTypeFilters((current) =>
            current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
        );
    };

    const clearFilters = () => {
        setDueStart("");
        setDueEnd("");
        setReceivedStart("");
        setReceivedEnd("");
        setStatusFilters([]);
        setTypeFilters([]);
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            const [invoiceResult, nbResult] = await Promise.all([
                supabase.from("invoices").delete().eq("id", id),
                supabase.from("nb_payments").delete().eq("id", id),
            ]);

            if (invoiceResult.error && nbResult.error) {
                throw new Error("Erro ao excluir a cobrança.");
            }

            toast.success("Cobrança removida.");
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
            queryClient.invalidateQueries({ queryKey: ["nb_payments"] });
        } catch (error) {
            console.error("Erro ao excluir cobrança:", error);
            toast.error("Não foi possível excluir a cobrança.");
        } finally {
            setDeletingId(null);
        }
    };

    const handleCheckStatus = async (invoiceId: string) => {
        setCheckingId(invoiceId);
        try {
            const { data, error } = await supabase.functions.invoke("check-invoice-status", {
                body: { invoiceId },
            });
            if (error) throw error;

            if (data.status === "paid") {
                toast.success(data.updated ? "Pagamento confirmado. Status atualizado." : "Este pagamento já está confirmado.");
            } else if (data.status === "expired") {
                toast.warning("Link de pagamento expirado. Gere uma nova cobrança.");
            } else if (data.message?.includes("No payment record")) {
                toast.info("Nenhum link de pagamento vinculado a esta cobrança.");
            } else {
                toast.info("Status sincronizado com sucesso.");
            }
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
        } catch (error) {
            console.error("Erro ao sincronizar cobrança:", error);
            toast.error("Erro ao sincronizar status.");
        } finally {
            setCheckingId(null);
        }
    };

    const filteredInvoices = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();
        return invoices.filter((invoice) => {
            const patientName = getPatientName(invoice.patient_id);
            const status = getInvoiceStatus(invoice);
            const type = getChargeType(invoice);
            const dueDate = invoice.due_date ? new Date(invoice.due_date) : null;
            const createdDate = invoice.created_at ? new Date(invoice.created_at) : null;

            const matchesSearch =
                !normalizedQuery ||
                patientName.toLowerCase().includes(normalizedQuery) ||
                invoice.description?.toLowerCase().includes(normalizedQuery) ||
                invoice.invoice_number?.toLowerCase().includes(normalizedQuery);

            const matchesStatus = statusFilters.length === 0 || statusFilters.includes(status as ChargeStatusFilter);
            const matchesType = typeFilters.length === 0 || typeFilters.includes(type);
            const matchesDueStart = !dueStart || (dueDate && dueDate >= new Date(`${dueStart}T00:00:00`));
            const matchesDueEnd = !dueEnd || (dueDate && dueDate <= new Date(`${dueEnd}T23:59:59`));
            const matchesReceivedStart = !receivedStart || (createdDate && createdDate >= new Date(`${receivedStart}T00:00:00`));
            const matchesReceivedEnd = !receivedEnd || (createdDate && createdDate <= new Date(`${receivedEnd}T23:59:59`));

            return matchesSearch && matchesStatus && matchesType && matchesDueStart && matchesDueEnd && matchesReceivedStart && matchesReceivedEnd;
        });
    }, [dueEnd, dueStart, invoices, receivedEnd, receivedStart, searchQuery, statusFilters, typeFilters, patients]);

    const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + (Number(invoice.amount) || 0), 0);
    const activeFilters = statusFilters.length + typeFilters.length + Number(!!dueStart) + Number(!!dueEnd) + Number(!!receivedStart) + Number(!!receivedEnd);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-300 dark:text-zinc-700" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Buscando cobranças...</p>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-[32px] border border-zinc-200/60 bg-white/70 p-5 shadow-[0_24px_80px_-58px_rgba(0,0,0,0.65)] backdrop-blur-3xl dark:border-white/[0.07] dark:bg-white/[0.025]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,.72),transparent_36%),radial-gradient(circle_at_100%_100%,rgba(0,0,0,.045),transparent_40%)] dark:bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,.06),transparent_36%)]" />
            <div className="premium-noise pointer-events-none absolute inset-0 opacity-[0.015] dark:opacity-[0.04]" />

            <div className="relative z-10 space-y-5">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="relative min-w-[280px] flex-1 max-w-xl">
                            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Procurar por nome, descrição ou número"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                className="h-12 w-full rounded-[18px] border border-zinc-200 bg-white/80 pl-11 pr-4 text-sm font-medium text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-400 dark:border-white/10 dark:bg-white/[0.035] dark:text-white dark:focus:border-white/20"
                            />
                        </div>

                        <AdvancedFilters
                            activeFilters={activeFilters}
                            dueStart={dueStart}
                            dueEnd={dueEnd}
                            receivedStart={receivedStart}
                            receivedEnd={receivedEnd}
                            statusFilters={statusFilters}
                            typeFilters={typeFilters}
                            setDueStart={setDueStart}
                            setDueEnd={setDueEnd}
                            setReceivedStart={setReceivedStart}
                            setReceivedEnd={setReceivedEnd}
                            toggleStatus={toggleStatus}
                            toggleType={toggleType}
                            clearFilters={clearFilters}
                        />
                    </div>

                    <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                        <Button
                            variant="outline"
                            onClick={() => toast.info("Selecione cobranças na lista para executar ações em lote.")}
                            className="h-12 rounded-[18px] border-zinc-200 bg-white/70 px-5 text-[10px] font-black uppercase tracking-[0.18em] dark:border-white/10 dark:bg-white/[0.035]"
                        >
                            <MoreVertical className="mr-2 h-4 w-4" />
                            Ações em lote
                        </Button>
                        <NewInvoiceModal>
                            <Button className="h-12 rounded-[18px] bg-zinc-950 px-6 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-[0_22px_52px_-34px_rgba(0,0,0,0.9)] hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100">
                                <Plus className="mr-2 h-4 w-4" />
                                Nova cobrança
                            </Button>
                        </NewInvoiceModal>
                    </div>
                </div>

                <div className="overflow-hidden rounded-[24px] border border-zinc-200/70 bg-white/55 dark:border-white/[0.08] dark:bg-white/[0.02]">
                    <div className="grid grid-cols-[minmax(190px,1.25fr)_120px_minmax(180px,1.2fr)_150px_145px_170px] gap-4 border-b border-zinc-200/70 px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400 dark:border-white/[0.08]">
                        <span>Nome</span>
                        <span>Valor</span>
                        <span>Descrição</span>
                        <span>Forma de pagamento</span>
                        <span>Vencimento</span>
                        <span className="text-right">Ações</span>
                    </div>

                    <div className="divide-y divide-zinc-200/60 dark:divide-white/[0.06]">
                        {filteredInvoices.length === 0 ? (
                            <div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center">
                                <WalletCards className="mb-4 h-9 w-9 text-zinc-300 dark:text-zinc-700" />
                                <p className="text-sm font-black uppercase tracking-tight text-zinc-900 dark:text-white">Nenhuma cobrança encontrada</p>
                                <p className="mt-2 max-w-sm text-xs font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">
                                    Ajuste os filtros ou crie uma nova cobrança para enviar ao paciente.
                                </p>
                            </div>
                        ) : (
                            filteredInvoices.map((invoice, index) => (
                                <InvoiceRow
                                    key={invoice.id}
                                    invoice={invoice}
                                    index={index}
                                    name={getPatientName(invoice.patient_id)}
                                    onCheck={handleCheckStatus}
                                    onDelete={handleDelete}
                                    isChecking={checkingId === invoice.id}
                                    isDeleting={deletingId === invoice.id}
                                />
                            ))
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-2 px-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                        {filteredInvoices.length} cobrança{filteredInvoices.length === 1 ? "" : "s"} no valor total de {formatCurrency(totalAmount)}
                    </span>
                    <span className="text-zinc-400">
                        de {invoices.length} cobrança{invoices.length === 1 ? "" : "s"} existentes
                    </span>
                </div>
            </div>
        </div>
    );
};

function AdvancedFilters({
    activeFilters,
    dueStart,
    dueEnd,
    receivedStart,
    receivedEnd,
    statusFilters,
    typeFilters,
    setDueStart,
    setDueEnd,
    setReceivedStart,
    setReceivedEnd,
    toggleStatus,
    toggleType,
    clearFilters,
}: {
    activeFilters: number;
    dueStart: string;
    dueEnd: string;
    receivedStart: string;
    receivedEnd: string;
    statusFilters: ChargeStatusFilter[];
    typeFilters: ChargeTypeFilter[];
    setDueStart: (value: string) => void;
    setDueEnd: (value: string) => void;
    setReceivedStart: (value: string) => void;
    setReceivedEnd: (value: string) => void;
    toggleStatus: (id: ChargeStatusFilter) => void;
    toggleType: (id: ChargeTypeFilter) => void;
    clearFilters: () => void;
}) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="h-12 rounded-[18px] border-zinc-200 bg-white/70 px-5 text-[10px] font-black uppercase tracking-[0.18em] dark:border-white/10 dark:bg-white/[0.035]"
                >
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros {activeFilters > 0 ? `(${activeFilters})` : ""}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" sideOffset={12} className="w-[min(960px,calc(100vw-56px))] overflow-hidden rounded-[28px] border-zinc-200 bg-white/95 p-0 shadow-[0_36px_90px_-36px_rgba(0,0,0,0.45)] backdrop-blur-3xl dark:border-white/10 dark:bg-zinc-950/95">
                <div className="grid gap-8 p-7 lg:grid-cols-[1.1fr_1fr_1.35fr]">
                    <div className="space-y-5">
                        <FilterDateGroup title="Período de vencimento" start={dueStart} end={dueEnd} onStart={setDueStart} onEnd={setDueEnd} />
                        <FilterDateGroup title="Período de recebimento" start={receivedStart} end={receivedEnd} onStart={setReceivedStart} onEnd={setReceivedEnd} />
                    </div>

                    <FilterCheckGroup
                        title="Tipos de cobrança"
                        options={filterTypeOptions}
                        selected={typeFilters}
                        onToggle={toggleType}
                    />

                    <FilterCheckGroup
                        title="Situações das cobranças"
                        options={filterStatusOptions}
                        selected={statusFilters}
                        onToggle={toggleStatus}
                        twoColumns
                    />
                </div>
                <div className="flex items-center justify-between border-t border-zinc-200/70 bg-zinc-50/80 px-7 py-4 dark:border-white/10 dark:bg-white/[0.025]">
                    <Button variant="outline" onClick={() => toast.info("Filtros avançados serão reunidos aqui em breve.")} className="h-11 rounded-full px-6 text-[10px] font-black uppercase tracking-[0.16em]">
                        Filtros avançados
                    </Button>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={clearFilters} className="h-11 rounded-full px-6 text-[10px] font-black uppercase tracking-[0.16em]">
                            Limpar
                        </Button>
                        <Button className="h-11 rounded-full bg-zinc-950 px-7 text-[10px] font-black uppercase tracking-[0.16em] text-white dark:bg-white dark:text-zinc-950">
                            Aplicar
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

function FilterDateGroup({
    title,
    start,
    end,
    onStart,
    onEnd,
}: {
    title: string;
    start: string;
    end: string;
    onStart: (value: string) => void;
    onEnd: (value: string) => void;
}) {
    return (
        <div>
            <p className="mb-3 text-sm font-black tracking-tight text-zinc-900 dark:text-white">{title}</p>
            <div className="flex items-center gap-3">
                <DateInput value={start} onChange={onStart} />
                <span className="text-xs font-semibold text-zinc-400">até</span>
                <DateInput value={end} onChange={onEnd} />
            </div>
        </div>
    );
}

function DateInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    return (
        <div className="relative">
            <input
                type="date"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-11 w-[150px] rounded-[14px] border border-zinc-200 bg-white px-3 pr-9 text-xs font-bold text-zinc-700 outline-none dark:border-white/10 dark:bg-white/[0.035] dark:text-white"
            />
            <Calendar className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
        </div>
    );
}

function FilterCheckGroup<T extends string>({
    title,
    options,
    selected,
    onToggle,
    twoColumns = false,
}: {
    title: string;
    options: { id: T; label: string }[];
    selected: T[];
    onToggle: (id: T) => void;
    twoColumns?: boolean;
}) {
    return (
        <div>
            <p className="mb-4 text-sm font-black tracking-tight text-zinc-900 dark:text-white">{title}</p>
            <div className={cn("grid gap-3", twoColumns ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
                {options.map((option) => (
                    <label key={option.id} className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                        <Checkbox checked={selected.includes(option.id)} onCheckedChange={() => onToggle(option.id)} />
                        {option.label}
                    </label>
                ))}
            </div>
        </div>
    );
}

function InvoiceRow({
    invoice,
    index,
    name,
    onCheck,
    onDelete,
    isChecking,
    isDeleting,
}: {
    invoice: Invoice;
    index: number;
    name: string;
    onCheck: (id: string) => void;
    onDelete: (id: string) => void;
    isChecking: boolean;
    isDeleting: boolean;
}) {
    const status = getInvoiceStatus(invoice);
    const copy = statusCopy[status] || statusCopy.pending;
    const StatusIcon = copy.icon;
    const dueDate = invoice.due_date ? new Date(invoice.due_date) : null;
    const isOverdue = status === "overdue";

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.025, duration: 0.28 }}
            className="grid grid-cols-[minmax(190px,1.25fr)_120px_minmax(180px,1.2fr)_150px_145px_170px] items-center gap-4 px-5 py-3 text-sm text-zinc-700 transition-colors hover:bg-zinc-50/80 dark:text-zinc-200 dark:hover:bg-white/[0.035]"
        >
            <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300">
                    <User className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                    <p className="truncate font-bold text-zinc-950 dark:text-white">{name}</p>
                    <p className="truncate text-[10px] font-semibold text-zinc-400">{invoice.invoice_number}</p>
                </div>
            </div>

            <span className="font-black text-zinc-950 dark:text-white">{formatCurrency(invoice.amount)}</span>
            <span className="truncate font-medium">{invoice.description || "Cobrança enviada pelo NeuroFinance"}</span>
            <span className="font-semibold text-zinc-500 dark:text-zinc-400">{getPaymentMethod(invoice)}</span>

            <div className="flex min-w-0 items-center gap-2">
                <span className={cn("font-bold", isOverdue && "text-red-600 dark:text-red-400")}>
                    {dueDate ? format(dueDate, "dd/MM/yyyy") : "Sem data"}
                </span>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border", copy.tone)}>
                                <StatusIcon className="h-3 w-3" />
                            </span>
                        </TooltipTrigger>
                        <TooltipContent className="text-[9px] font-bold uppercase tracking-widest">{copy.label}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <div className="flex items-center justify-end gap-1.5">
                <ActionButton label="Sincronizar" onClick={() => onCheck(invoice.id)} disabled={isChecking}>
                    {isChecking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                </ActionButton>
                <ActionButton label="Copiar link" onClick={() => {
                    if (!invoice.payment_url && !invoice.pdf_url) return toast.info("Esta cobrança ainda não possui link.");
                    navigator.clipboard.writeText(invoice.payment_url || invoice.pdf_url || "");
                    toast.success("Link copiado.");
                }}>
                    <Copy className="h-3.5 w-3.5" />
                </ActionButton>
                <ActionButton label="Abrir cobrança" onClick={() => {
                    if (!invoice.payment_url && !invoice.pdf_url) return toast.info("Esta cobrança ainda não possui link.");
                    window.open(invoice.payment_url || invoice.pdf_url || "", "_blank");
                }}>
                    <ExternalLink className="h-3.5 w-3.5" />
                </ActionButton>
                <ActionButton label="Editar" onClick={() => toast.info("Edição de cobrança será aberta pelo painel de detalhes.")}>
                    <Pencil className="h-3.5 w-3.5" />
                </ActionButton>
                <ActionButton label="Imprimir" onClick={() => toast.info("Abra a cobrança para imprimir o documento atualizado.")}>
                    <Printer className="h-3.5 w-3.5" />
                </ActionButton>
                <ActionButton label="Enviar por e-mail" onClick={() => toast.info("Envio por e-mail será conectado ao template profissional.")}>
                    <Mail className="h-3.5 w-3.5" />
                </ActionButton>
                <ActionButton label="Remover" onClick={() => onDelete(invoice.id)} disabled={isDeleting} danger>
                    {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </ActionButton>
            </div>
        </motion.div>
    );
}

function ActionButton({
    label,
    children,
    onClick,
    disabled,
    danger,
}: {
    label: string;
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    danger?: boolean;
}) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        onClick={onClick}
                        disabled={disabled}
                        className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition-all hover:bg-zinc-100 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-45 dark:hover:bg-white/[0.08] dark:hover:text-white",
                            danger && "hover:text-red-600 dark:hover:text-red-400"
                        )}
                    >
                        {children}
                    </button>
                </TooltipTrigger>
                <TooltipContent className="text-[9px] font-bold uppercase tracking-widest">{label}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
