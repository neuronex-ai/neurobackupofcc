"use client";

import { useMemo, useState } from "react";
import { addYears, isAfter, subMonths } from "date-fns";
import {
    Activity,
    ArrowDownLeft,
    ArrowDownWideNarrow,
    ArrowUpRight,
    ArrowUpNarrowWide,
    Calendar,
    Eye,
    EyeOff,
    Landmark,
    Loader2,
    RefreshCw,
    Search,
    Wallet,
} from "lucide-react";
import { toast } from "sonner";

import {
    AdvancedFilterPopover,
    FilterCheckGroup,
    FilterDateGroup,
} from "@/components/financeiro/AdvancedFilterPopover";
import { FinancialStatement } from "@/components/financeiro/FinancialStatement";
import {
    countDetailedStatementFilters,
    emptyDetailedStatementFilters,
    filterDetailedStatementTransactions,
    type DetailedStatementFilters,
    type StatementOriginFilter,
    type StatementPaymentMethodFilter,
    type StatementSortOrder,
    type StatementTransferMethodFilter,
} from "@/components/financeiro/statement/statement-utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useNeuroFinanceBalance } from "@/hooks/use-neurofinance-balance";
import { useNeuroFinanceStatement } from "@/hooks/use-neurofinance-statement";
import { usePatients } from "@/hooks/use-patients";
import { useTransactions } from "@/hooks/use-transactions";
import { cn, formatCurrency } from "@/lib/utils";
import { toUserFacingError } from "@/lib/user-facing-error";
import type { Transaction } from "@/types";

export type DetailedStatementTab = "realizado" | "futuro" | "assinaturas";

interface DetailedStatementPanelProps {
    tab: DetailedStatementTab;
    onTabChange: (tab: DetailedStatementTab) => void;
    onSelectTransaction: (transaction: Transaction) => void;
}

const paymentMethodOptions: { id: StatementPaymentMethodFilter; label: string }[] = [
    { id: "pix", label: "Pix" },
    { id: "boleto", label: "Boleto" },
    { id: "card", label: "Cartão" },
    { id: "cash", label: "Dinheiro" },
    { id: "convenio", label: "Convênio" },
    { id: "external_transfer", label: "Transferência externa" },
    { id: "manual", label: "Manual" },
    { id: "other", label: "Outro" },
];

const originOptions: { id: StatementOriginFilter; label: string }[] = [
    { id: "neurofinance", label: "NeuroFinance" },
    { id: "manual", label: "Manual" },
    { id: "agenda", label: "Agenda com dinheiro real" },
];

const transferMethodOptions: { id: StatementTransferMethodFilter; label: string }[] = [
    { id: "pix", label: "Via Pix" },
];

function toggleFilterValue<T extends string>(values: T[], value: T) {
    return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function mergeTransactions(manual: Transaction[], neuroFinance: Transaction[]) {
    const merged = new Map<string, Transaction>();

    for (const transaction of manual) {
        merged.set(transaction.external_reference || transaction.id, transaction);
    }

    for (const transaction of neuroFinance) {
        merged.set(transaction.external_reference || transaction.id, transaction);
    }

    return Array.from(merged.values());
}

function KpiCard({
    label,
    value,
    hidden,
    isLoading,
    icon: Icon,
}: {
    label: string;
    value: number;
    hidden: boolean;
    isLoading: boolean;
    icon: typeof Wallet;
}) {
    return (
        <div className="relative min-h-[112px] overflow-hidden rounded-[22px] border border-zinc-200/70 bg-white/75 p-5 shadow-[0_18px_54px_-42px_rgba(0,0,0,0.7)] dark:border-white/[0.07] dark:bg-white/[0.025]">
            <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400">
                <Icon className="h-4 w-4" />
            </div>
            <p className="pr-11 text-[9px] font-black uppercase tracking-[0.16em] text-zinc-400">{label}</p>
            {isLoading ? (
                <Skeleton className="mt-5 h-7 w-32 rounded-lg" />
            ) : (
                <p className="mt-4 text-xl font-black tracking-tight text-zinc-950 dark:text-white">
                    {hidden ? "R$ ••••••" : formatCurrency(value)}
                </p>
            )}
        </div>
    );
}

export function DetailedStatementPanel({
    tab,
    onTabChange,
    onSelectTransaction,
}: DetailedStatementPanelProps) {
    const [filters, setFilters] = useState<DetailedStatementFilters>(() => emptyDetailedStatementFilters());
    const [sortOrder, setSortOrder] = useState<StatementSortOrder>("desc");
    const [showValues, setShowValues] = useState(true);

    const queryStart = useMemo(
        () => filters.startDate ? new Date(`${filters.startDate}T00:00:00`) : subMonths(new Date(), 3),
        [filters.startDate],
    );
    const queryEnd = useMemo(
        () => filters.endDate ? new Date(`${filters.endDate}T23:59:59`) : addYears(new Date(), 2),
        [filters.endDate],
    );

    const transactionsQuery = useTransactions(queryStart, queryEnd, 1000);
    const statementQuery = useNeuroFinanceStatement(queryStart, queryEnd);
    const { data: patients = [] } = usePatients();
    const {
        data: balance,
        isLoading: isLoadingBalance,
        syncNow,
        isSyncing,
    } = useNeuroFinanceBalance();

    const allTransactions = useMemo(
        () => mergeTransactions(transactionsQuery.data || [], statementQuery.data || []),
        [statementQuery.data, transactionsQuery.data],
    );

    const filteredTransactions = useMemo(() => {
        const now = new Date();
        const tabTransactions = allTransactions.filter((transaction) => {
            if (tab === "assinaturas") {
                const text = `${transaction.description || ""} ${transaction.category || ""}`.toLowerCase();
                return text.includes("assinatura") || text.includes("recorr");
            }

            const isFuture = isAfter(new Date(transaction.date), now);
            if (tab === "futuro") return isFuture || transaction.status === "pending";
            return !isFuture && transaction.status === "completed";
        });

        return filterDetailedStatementTransactions(tabTransactions, filters, patients);
    }, [allTransactions, filters, patients, tab]);

    const activeFilters = countDetailedStatementFilters(filters);
    const isLoading = transactionsQuery.isLoading || statementQuery.isLoading;

    const updateFilter = <K extends keyof DetailedStatementFilters>(key: K, value: DetailedStatementFilters[K]) => {
        setFilters((current) => ({ ...current, [key]: value }));
    };

    const handleSync = async () => {
        try {
            await syncNow();
            await Promise.all([transactionsQuery.refetch(), statementQuery.refetch()]);
            toast.success("Dados financeiros atualizados.");
        } catch (error) {
            const friendlyError = toUserFacingError(error, "balance");
            toast.error(friendlyError.title, { description: friendlyError.message });
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <KpiCard label="Saldo disponível" value={balance.balance} hidden={!showValues} isLoading={isLoadingBalance} icon={Wallet} />
                <KpiCard label="Quanto entrou" value={balance.totalReceived} hidden={!showValues} isLoading={isLoadingBalance} icon={ArrowUpRight} />
                <KpiCard label="Quanto saiu" value={balance.paidOut} hidden={!showValues} isLoading={isLoadingBalance} icon={ArrowDownLeft} />
                <KpiCard label="Quanto vai cair" value={balance.pending} hidden={!showValues} isLoading={isLoadingBalance} icon={Calendar} />
            </div>

            <div className="flex flex-col gap-4 rounded-[24px] border border-zinc-200/60 bg-white/55 p-3 backdrop-blur-xl dark:border-white/[0.07] dark:bg-white/[0.018] xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    {([
                        { id: "realizado", label: "Realizado", icon: Activity },
                        { id: "futuro", label: "Futuro e pendente", icon: Calendar },
                        { id: "assinaturas", label: "Assinaturas", icon: Landmark },
                    ] as const).map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => onTabChange(item.id)}
                            className={cn(
                                "flex h-10 items-center gap-2 rounded-[14px] px-4 text-[10px] font-black uppercase tracking-[0.12em] transition-all",
                                tab === item.id
                                    ? "bg-zinc-950 text-white shadow-md dark:bg-white dark:text-zinc-950"
                                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-white/[0.06] dark:hover:text-white",
                            )}
                        >
                            <item.icon className="h-3.5 w-3.5" />
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <AdvancedFilterPopover
                        activeFilters={activeFilters}
                        onClear={() => setFilters(emptyDetailedStatementFilters())}
                        triggerLabel="Filtro"
                        widthClassName="w-[min(1080px,calc(100vw-56px))]"
                    >
                        <div className="grid max-h-[68vh] gap-8 overflow-y-auto p-7 custom-scrollbar lg:grid-cols-3">
                            <div className="space-y-7">
                                <FilterDateGroup
                                    title="Período das transações"
                                    start={filters.startDate}
                                    end={filters.endDate}
                                    onStart={(value) => updateFilter("startDate", value)}
                                    onEnd={(value) => updateFilter("endDate", value)}
                                />

                                <div>
                                    <p className="mb-3 text-sm font-black tracking-tight text-zinc-900 dark:text-white">Tipo</p>
                                    <Select value={filters.type} onValueChange={(value) => updateFilter("type", value as DetailedStatementFilters["type"])}>
                                        <SelectTrigger className="h-11 rounded-[14px] border-zinc-200 bg-white text-xs font-bold dark:border-white/10 dark:bg-white/[0.035]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Entradas e saídas</SelectItem>
                                            <SelectItem value="income">Entrada</SelectItem>
                                            <SelectItem value="expense">Saída</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <p className="mb-3 text-sm font-black tracking-tight text-zinc-900 dark:text-white">Destinatário das saídas</p>
                                    <div className="relative">
                                        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                        <input
                                            value={filters.recipientQuery}
                                            onChange={(event) => updateFilter("recipientQuery", event.target.value)}
                                            placeholder="Nome, conta ou chave Pix"
                                            className="h-11 w-full rounded-[14px] border border-zinc-200 bg-white pl-10 pr-3 text-xs font-bold text-zinc-800 outline-none placeholder:text-zinc-400 dark:border-white/10 dark:bg-white/[0.035] dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-7">
                                <FilterCheckGroup
                                    title="Método de pagamento / convênio"
                                    options={paymentMethodOptions}
                                    selected={filters.paymentMethods}
                                    onToggle={(value) => updateFilter("paymentMethods", toggleFilterValue(filters.paymentMethods, value))}
                                    twoColumns
                                />
                                <FilterCheckGroup
                                    title="Origem"
                                    options={originOptions}
                                    selected={filters.origins}
                                    onToggle={(value) => updateFilter("origins", toggleFilterValue(filters.origins, value))}
                                />
                                <FilterCheckGroup
                                    title="Método de transferência"
                                    options={transferMethodOptions}
                                    selected={filters.transferMethods}
                                    onToggle={(value) => updateFilter("transferMethods", toggleFilterValue(filters.transferMethods, value))}
                                />
                                <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                                    <Checkbox checked={filters.feesOnly} onCheckedChange={(checked) => updateFilter("feesOnly", checked === true)} />
                                    Mostrar somente taxas pagas
                                </label>
                            </div>

                            <div>
                                <p className="mb-4 text-sm font-black tracking-tight text-zinc-900 dark:text-white">Pacientes</p>
                                <div className="max-h-[430px] space-y-2 overflow-y-auto rounded-[18px] border border-zinc-200/70 bg-zinc-50/70 p-3 custom-scrollbar dark:border-white/10 dark:bg-white/[0.025]">
                                    {patients.length === 0 ? (
                                        <p className="px-2 py-5 text-center text-xs font-semibold text-zinc-400">Nenhum paciente disponível.</p>
                                    ) : patients.map((patient) => (
                                        <label key={patient.id} className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-sm font-semibold text-zinc-600 hover:bg-white dark:text-zinc-300 dark:hover:bg-white/[0.05]">
                                            <Checkbox
                                                checked={filters.patientIds.includes(patient.id)}
                                                onCheckedChange={() => updateFilter("patientIds", toggleFilterValue(filters.patientIds, patient.id))}
                                            />
                                            <span className="truncate">{patient.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </AdvancedFilterPopover>

                    <div className="flex items-center rounded-[16px] border border-zinc-200 bg-white/70 p-1 dark:border-white/10 dark:bg-white/[0.035]">
                        <button
                            type="button"
                            onClick={() => setSortOrder("desc")}
                            title="Mais recente para o mais antigo"
                            className={cn("flex h-9 items-center gap-2 rounded-xl px-3 text-[9px] font-black uppercase tracking-[0.1em] transition-all", sortOrder === "desc" ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "text-zinc-500 hover:text-zinc-950 dark:hover:text-white")}
                        >
                            <ArrowDownWideNarrow className="h-3.5 w-3.5" />
                            Recentes
                        </button>
                        <button
                            type="button"
                            onClick={() => setSortOrder("asc")}
                            title="Mais antigo para o mais recente"
                            className={cn("flex h-9 items-center gap-2 rounded-xl px-3 text-[9px] font-black uppercase tracking-[0.1em] transition-all", sortOrder === "asc" ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "text-zinc-500 hover:text-zinc-950 dark:hover:text-white")}
                        >
                            <ArrowUpNarrowWide className="h-3.5 w-3.5" />
                            Antigos
                        </button>
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowValues((current) => !current)}
                        title={showValues ? "Ocultar valores" : "Mostrar valores"}
                        aria-pressed={!showValues}
                        className="h-11 w-11 rounded-[16px] border-zinc-200 bg-white/70 dark:border-white/10 dark:bg-white/[0.035]"
                    >
                        {showValues ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleSync}
                        disabled={isSyncing}
                        title="Atualizar valores"
                        className="h-11 w-11 rounded-[16px] border-zinc-200 bg-white/70 dark:border-white/10 dark:bg-white/[0.035]"
                    >
                        {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            <div className="relative overflow-hidden rounded-[28px] border border-zinc-200/60 bg-white/45 p-5 shadow-sm backdrop-blur-xl dark:border-white/[0.05] dark:bg-white/[0.012]">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 px-1">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Movimentações encontradas</p>
                        <p className="mt-1 text-sm font-black text-zinc-900 dark:text-white">
                            {isLoading ? "Carregando..." : `${filteredTransactions.length} registro${filteredTransactions.length === 1 ? "" : "s"}`}
                        </p>
                    </div>
                    {(transactionsQuery.isFetching || statementQuery.isFetching) && !isLoading ? (
                        <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-400">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Atualizando
                        </span>
                    ) : null}
                </div>

                <FinancialStatement
                    transactions={filteredTransactions}
                    isLoading={isLoading}
                    onSelectTransaction={onSelectTransaction}
                    sortOrder={sortOrder}
                    groupByDate
                />
            </div>
        </div>
    );
}
