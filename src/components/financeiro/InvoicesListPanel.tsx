"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Copy,
    ExternalLink,
    Filter,
    Loader2,
    MoreVertical,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    User,
    WalletCards,
    XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useInvoiceActions, useInvoicesPage } from "@/hooks/use-invoices";
import { usePatients } from "@/hooks/use-patients";
import { formatCurrency, cn } from "@/lib/utils";
import { NewInvoiceModal } from "@/components/financeiro/NewInvoiceModal";
import type { Invoice } from "@/types";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

type ChargeStatusFilter = "pending" | "overdue" | "paid" | "cancelled";
type ChargeTypeFilter = "single" | "subscription" | "installment";

const statusCopy: Record<string, { label: string; tone: string; icon: any }> = {
    pending: { label: "Aguardando pagamento", tone: "text-amber-600 bg-amber-500/10 border-amber-500/20", icon: Clock },
    overdue: { label: "Vencida", tone: "text-red-600 bg-red-500/10 border-red-500/20", icon: XCircle },
    paid: { label: "Recebida", tone: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 },
    cancelled: { label: "Cancelada", tone: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20", icon: XCircle },
};

const filterStatusOptions: { id: ChargeStatusFilter; label: string }[] = [
    { id: "pending", label: "Aguardando pagamento" },
    { id: "overdue", label: "Vencida" },
    { id: "paid", label: "Recebida" },
    { id: "cancelled", label: "Cancelada ou estornada" },
];

const filterTypeOptions: { id: ChargeTypeFilter; label: string }[] = [
    { id: "single", label: "Avulsas" },
    { id: "subscription", label: "Assinaturas" },
    { id: "installment", label: "Parceladas" },
];

const getInvoiceStatus = (invoice: Invoice) => String((invoice as any).status || "pending").toLowerCase();

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
    return invoice.payment_url ? "Link de pagamento" : "A combinar";
};

const getChargeType = (invoice: Invoice): ChargeTypeFilter => {
    const text = `${invoice.description || ""} ${(invoice as any).type || ""} ${(invoice as any).category || ""}`.toLowerCase();
    if (text.includes("assinatura") || text.includes("recorr")) return "subscription";
    if (text.includes("parcela")) return "installment";
    return "single";
};

const getInvoiceLink = (invoice: Invoice) =>
    invoice.payment_url ||
    invoice.pdf_url ||
    (invoice as any).invoice_url ||
    (invoice as any).bank_slip_url ||
    (invoice as any).metadata?.asaas_invoice_url ||
    (invoice as any).metadata?.asaas_bank_slip_url ||
    "";

export const InvoicesListPanel = () => {
    const { data: patients = [] } = usePatients();
    const { runAction } = useInvoiceActions();
    const [page, setPage] = useState(1);
    const [pageSize] = useState(25);
    const [searchQuery, setSearchQuery] = useState("");
    const [dueStart, setDueStart] = useState("");
    const [dueEnd, setDueEnd] = useState("");
    const [receivedStart, setReceivedStart] = useState("");
    const [receivedEnd, setReceivedEnd] = useState("");
    const [statusFilters, setStatusFilters] = useState<ChargeStatusFilter[]>([]);
    const [typeFilters, setTypeFilters] = useState<ChargeTypeFilter[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    const { data, isLoading, isFetching } = useInvoicesPage({
        page,
        pageSize,
        search: searchQuery,
        status: statusFilters,
    });

    const invoices = data?.invoices || [];
    const total = data?.total || 0;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));

    const getPatientName = (patientId: string) =>
        patients.find((patient) => patient.id === patientId)?.name || "Cliente";

    const toggleStatus = (id: ChargeStatusFilter) => {
        setPage(1);
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
        setPage(1);
    };

    const filteredInvoices = useMemo(() => {
        return invoices.filter((invoice) => {
            const type = getChargeType(invoice);
            const dueDate = invoice.due_date ? new Date(invoice.due_date) : null;
            const createdDate = invoice.created_at ? new Date(invoice.created_at) : null;
            const matchesType = typeFilters.length === 0 || typeFilters.includes(type);
            const matchesDueStart = !dueStart || (dueDate && dueDate >= new Date(`${dueStart}T00:00:00`));
            const matchesDueEnd = !dueEnd || (dueDate && dueDate <= new Date(`${dueEnd}T23:59:59`));
            const matchesReceivedStart = !receivedStart || (createdDate && createdDate >= new Date(`${receivedStart}T00:00:00`));
            const matchesReceivedEnd = !receivedEnd || (createdDate && createdDate <= new Date(`${receivedEnd}T23:59:59`));
            return matchesType && matchesDueStart && matchesDueEnd && matchesReceivedStart && matchesReceivedEnd;
        });
    }, [dueEnd, dueStart, invoices, receivedEnd, receivedStart, typeFilters]);

    const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + (Number(invoice.amount) || 0), 0);
    const activeFilters = statusFilters.length + typeFilters.length + Number(!!dueStart) + Number(!!dueEnd) + Number(!!receivedStart) + Number(!!receivedEnd);
    const allVisibleSelected = filteredInvoices.length > 0 && filteredInvoices.every((invoice) => selectedIds.includes(invoice.id));

    const toggleSelected = (id: string) => {
        setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    };

    const toggleAllVisible = () => {
        if (allVisibleSelected) {
            setSelectedIds((current) => current.filter((id) => !filteredInvoices.some((invoice) => invoice.id === id)));
        } else {
            setSelectedIds((current) => Array.from(new Set([...current, ...filteredInvoices.map((invoice) => invoice.id)])));
        }
    };

    const runSingleAction = async (id: string, action: "sync" | "cancel") => {
        try {
            await runAction.mutateAsync({ id, action });
            toast.success(action === "sync" ? "Cobrança sincronizada." : "Cobrança cancelada.");
        } catch (error) {
            toast.error(getUserFacingErrorMessage(error, action === "sync" ? "load" : "delete"));
        }
    };

    const runBatchAction = async (action: "sync" | "cancel" | "copy") => {
        const selected = filteredInvoices.filter((invoice) => selectedIds.includes(invoice.id));
        if (selected.length === 0) return toast.info("Selecione pelo menos uma cobrança.");

        if (action === "copy") {
            const links = selected.map(getInvoiceLink).filter(Boolean);
            if (links.length === 0) return toast.info("As cobranças selecionadas ainda não possuem links.");
            await navigator.clipboard.writeText(links.join("\n"));
            toast.success("Links copiados.");
            return;
        }

        try {
            for (const invoice of selected) {
                if (action === "cancel" && !["pending", "overdue"].includes(getInvoiceStatus(invoice))) continue;
                await runAction.mutateAsync({ id: invoice.id, action });
            }
            toast.success(action === "sync" ? "Cobranças sincronizadas." : "Cobranças pendentes canceladas.");
            setSelectedIds([]);
        } catch (error) {
            toast.error(getUserFacingErrorMessage(error, action === "sync" ? "load" : "delete"));
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 py-32">
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
                                placeholder="Procurar por descrição ou número"
                                value={searchQuery}
                                onChange={(event) => { setSearchQuery(event.target.value); setPage(1); }}
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
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-12 rounded-[18px] border-zinc-200 bg-white/70 px-5 text-[10px] font-black uppercase tracking-[0.18em] dark:border-white/10 dark:bg-white/[0.035]"
                                >
                                    <MoreVertical className="mr-2 h-4 w-4" />
                                    Ações em lote
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-72 rounded-[24px] border-zinc-200 bg-white/95 p-2 shadow-2xl dark:border-white/10 dark:bg-zinc-950/95">
                                <BatchButton onClick={() => runBatchAction("sync")} icon={RefreshCw}>Sincronizar selecionadas</BatchButton>
                                <BatchButton onClick={() => runBatchAction("copy")} icon={Copy}>Copiar links</BatchButton>
                                <BatchButton onClick={() => runBatchAction("cancel")} icon={Trash2} danger>Cancelar pendentes</BatchButton>
                            </PopoverContent>
                        </Popover>
                        <NewInvoiceModal>
                            <Button className="h-12 rounded-[18px] bg-zinc-950 px-6 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-[0_22px_52px_-34px_rgba(0,0,0,0.9)] hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100">
                                <Plus className="mr-2 h-4 w-4" />
                                Nova cobrança
                            </Button>
                        </NewInvoiceModal>
                    </div>
                </div>

                <div className="overflow-hidden rounded-[24px] border border-zinc-200/70 bg-white/55 dark:border-white/[0.08] dark:bg-white/[0.02]">
                    <div className="grid grid-cols-[42px_minmax(190px,1.25fr)_120px_minmax(180px,1.2fr)_150px_145px_150px] gap-4 border-b border-zinc-200/70 px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400 dark:border-white/[0.08]">
                        <Checkbox checked={allVisibleSelected} onCheckedChange={toggleAllVisible} />
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
                                    selected={selectedIds.includes(invoice.id)}
                                    onToggleSelected={() => toggleSelected(invoice.id)}
                                    onOpen={() => setSelectedInvoice(invoice)}
                                    onSync={() => runSingleAction(invoice.id, "sync")}
                                    onCancel={() => runSingleAction(invoice.id, "cancel")}
                                    isWorking={runAction.isPending}
                                />
                            ))
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-3 px-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                        {filteredInvoices.length} cobrança{filteredInvoices.length === 1 ? "" : "s"} nesta página, somando {formatCurrency(totalAmount)}
                    </span>
                    <div className="flex items-center gap-3">
                        <span className="text-zinc-400">{isFetching ? "Atualizando..." : `${total} cobrança${total === 1 ? "" : "s"} no total`}</span>
                        <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1} className="h-9 rounded-full">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-[10px] font-black uppercase tracking-widest">{page}/{pageCount}</span>
                        <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page >= pageCount} className="h-9 rounded-full">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <InvoiceDetailDialog invoice={selectedInvoice} patientName={selectedInvoice ? getPatientName(selectedInvoice.patient_id) : ""} onOpenChange={(open) => !open && setSelectedInvoice(null)} onSync={runSingleAction} onCancel={runSingleAction} isWorking={runAction.isPending} />
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
                <Button variant="outline" className="h-12 rounded-[18px] border-zinc-200 bg-white/70 px-5 text-[10px] font-black uppercase tracking-[0.18em] dark:border-white/10 dark:bg-white/[0.035]">
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

                    <FilterCheckGroup title="Tipos de cobrança" options={filterTypeOptions} selected={typeFilters} onToggle={toggleType} />
                    <FilterCheckGroup title="Situação das cobranças" options={filterStatusOptions} selected={statusFilters} onToggle={toggleStatus} twoColumns />
                </div>
                <div className="flex items-center justify-end gap-3 border-t border-zinc-200/70 bg-zinc-50/80 px-7 py-4 dark:border-white/10 dark:bg-white/[0.025]">
                    <Button variant="outline" onClick={clearFilters} className="h-11 rounded-full px-6 text-[10px] font-black uppercase tracking-[0.16em]">
                        Limpar
                    </Button>
                    <Button className="h-11 rounded-full bg-zinc-950 px-7 text-[10px] font-black uppercase tracking-[0.16em] text-white dark:bg-white dark:text-zinc-950">
                        Aplicar
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

function FilterDateGroup({ title, start, end, onStart, onEnd }: { title: string; start: string; end: string; onStart: (value: string) => void; onEnd: (value: string) => void; }) {
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
            <input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-[150px] rounded-[14px] border border-zinc-200 bg-white px-3 pr-9 text-xs font-bold text-zinc-700 outline-none dark:border-white/10 dark:bg-white/[0.035] dark:text-white" />
            <Calendar className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
        </div>
    );
}

function FilterCheckGroup<T extends string>({ title, options, selected, onToggle, twoColumns = false }: { title: string; options: { id: T; label: string }[]; selected: T[]; onToggle: (id: T) => void; twoColumns?: boolean; }) {
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
    selected,
    onToggleSelected,
    onOpen,
    onSync,
    onCancel,
    isWorking,
}: {
    invoice: Invoice;
    index: number;
    name: string;
    selected: boolean;
    onToggleSelected: () => void;
    onOpen: () => void;
    onSync: () => void;
    onCancel: () => void;
    isWorking: boolean;
}) {
    const status = getInvoiceStatus(invoice);
    const copy = statusCopy[status] || statusCopy.pending;
    const StatusIcon = copy.icon;
    const dueDate = invoice.due_date ? new Date(invoice.due_date) : null;
    const isOverdue = status === "overdue";
    const link = getInvoiceLink(invoice);

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.025, duration: 0.28 }}
            className="grid grid-cols-[42px_minmax(190px,1.25fr)_120px_minmax(180px,1.2fr)_150px_145px_150px] items-center gap-4 px-5 py-3 text-sm text-zinc-700 transition-colors hover:bg-zinc-50/80 dark:text-zinc-200 dark:hover:bg-white/[0.035]"
        >
            <Checkbox checked={selected} onCheckedChange={onToggleSelected} />
            <button type="button" onClick={onOpen} className="flex min-w-0 items-center gap-3 text-left">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300">
                    <User className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                    <p className="truncate font-bold text-zinc-950 dark:text-white">{name}</p>
                    <p className="truncate text-[10px] font-semibold text-zinc-400">{invoice.invoice_number}</p>
                </div>
            </button>

            <span className="font-black text-zinc-950 dark:text-white">{formatCurrency(invoice.amount)}</span>
            <button type="button" onClick={onOpen} className="truncate text-left font-medium">{invoice.description || "Cobrança enviada pelo NeuroFinance"}</button>
            <span className="font-semibold text-zinc-500 dark:text-zinc-400">{getPaymentMethod(invoice)}</span>

            <div className="flex min-w-0 items-center gap-2">
                <span className={cn("font-bold", isOverdue && "text-red-600 dark:text-red-400")}>{dueDate ? format(dueDate, "dd/MM/yyyy") : "Sem data"}</span>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border", copy.tone)}><StatusIcon className="h-3 w-3" /></span>
                        </TooltipTrigger>
                        <TooltipContent className="text-[9px] font-bold uppercase tracking-widest">{copy.label}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <div className="flex items-center justify-end gap-1.5">
                <ActionButton label="Detalhes" onClick={onOpen}><ExternalLink className="h-3.5 w-3.5" /></ActionButton>
                <ActionButton label="Sincronizar" onClick={onSync} disabled={isWorking}>{isWorking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}</ActionButton>
                <ActionButton label="Copiar link" onClick={() => {
                    if (!link) return toast.info("Esta cobrança ainda não possui link.");
                    navigator.clipboard.writeText(link);
                    toast.success("Link copiado.");
                }}><Copy className="h-3.5 w-3.5" /></ActionButton>
                <ActionButton label="Cancelar" onClick={onCancel} disabled={isWorking || !["pending", "overdue"].includes(status)} danger><Trash2 className="h-3.5 w-3.5" /></ActionButton>
            </div>
        </motion.div>
    );
}

function InvoiceDetailDialog({
    invoice,
    patientName,
    onOpenChange,
    onSync,
    onCancel,
    isWorking,
}: {
    invoice: Invoice | null;
    patientName: string;
    onOpenChange: (open: boolean) => void;
    onSync: (id: string, action: "sync" | "cancel") => void;
    onCancel: (id: string, action: "sync" | "cancel") => void;
    isWorking: boolean;
}) {
    if (!invoice) return null;
    const status = getInvoiceStatus(invoice);
    const link = getInvoiceLink(invoice);
    const receipt = (invoice as any).receipt_url || (invoice as any).metadata?.asaas_transaction_receipt_url || "";
    const bankSlip = (invoice as any).bank_slip_url || (invoice as any).metadata?.asaas_bank_slip_url || "";

    return (
        <Dialog open={Boolean(invoice)} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl overflow-hidden rounded-[32px] border-zinc-200 bg-white/95 p-0 shadow-[0_40px_120px_-44px_rgba(0,0,0,0.55)] backdrop-blur-3xl dark:border-white/10 dark:bg-zinc-950/95">
                <div className="border-b border-zinc-200/70 p-7 dark:border-white/10">
                    <DialogTitle className="text-2xl font-black tracking-tight text-zinc-950 dark:text-white">Detalhes da cobrança</DialogTitle>
                    <DialogDescription className="mt-1 text-sm font-medium text-zinc-500">Informações atualizadas da cobrança enviada ao cliente.</DialogDescription>
                </div>

                <div className="space-y-5 p-7">
                    <div className="rounded-[28px] border border-zinc-200 bg-zinc-50/70 p-6 dark:border-white/10 dark:bg-white/[0.035]">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">Cliente</p>
                                <h3 className="mt-1 text-xl font-black text-zinc-950 dark:text-white">{patientName}</h3>
                                <p className="mt-2 text-sm font-medium text-zinc-500">{invoice.description || "Cobrança NeuroFinance"}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">Valor</p>
                                <p className="mt-1 text-2xl font-black text-zinc-950 dark:text-white">{formatCurrency(invoice.amount)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <DetailItem label="Status" value={statusCopy[status]?.label || status} />
                        <DetailItem label="Forma de pagamento" value={getPaymentMethod(invoice)} />
                        <DetailItem label="Vencimento" value={invoice.due_date ? format(new Date(invoice.due_date), "dd/MM/yyyy") : "Sem data"} />
                        <DetailItem label="Identificador" value={invoice.gateway_payment_id || invoice.invoice_number || invoice.id} />
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                        <Button variant="outline" onClick={() => onSync(invoice.id, "sync")} disabled={isWorking} className="h-11 rounded-full">
                            {isWorking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Sincronizar
                        </Button>
                        <Button variant="outline" onClick={() => link ? window.open(link, "_blank", "noopener,noreferrer") : toast.info("Esta cobrança ainda não possui link.")} className="h-11 rounded-full">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Abrir cobrança
                        </Button>
                        <Button variant="outline" onClick={() => receipt ? window.open(receipt, "_blank", "noopener,noreferrer") : toast.info("Recibo ainda não disponível.")} className="h-11 rounded-full">
                            Recibo
                        </Button>
                        <Button variant="outline" onClick={() => bankSlip ? window.open(bankSlip, "_blank", "noopener,noreferrer") : toast.info("Boleto/fatura ainda não disponível.")} className="h-11 rounded-full">
                            Fatura
                        </Button>
                        <Button variant="outline" onClick={() => onCancel(invoice.id, "cancel")} disabled={isWorking || !["pending", "overdue"].includes(status)} className="h-11 rounded-full border-red-500/20 text-red-600 hover:text-red-700 dark:text-red-400">
                            Cancelar pendente
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="rounded-2xl border border-zinc-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.025]">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">{label}</p>
            <p className="mt-1 truncate text-sm font-black text-zinc-950 dark:text-white">{value}</p>
        </div>
    );
}

function BatchButton({ children, icon: Icon, onClick, danger }: { children: ReactNode; icon: any; onClick: () => void; danger?: boolean }) {
    return (
        <button type="button" onClick={onClick} className={cn("flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-xs font-black uppercase tracking-[0.12em] transition-all hover:bg-zinc-100 dark:hover:bg-white/[0.06]", danger ? "text-red-600 dark:text-red-400" : "text-zinc-700 dark:text-zinc-200")}>
            <Icon className="h-4 w-4" />
            {children}
        </button>
    );
}

function ActionButton({ label, children, onClick, disabled, danger }: { label: string; children: ReactNode; onClick?: () => void; disabled?: boolean; danger?: boolean; }) {
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
