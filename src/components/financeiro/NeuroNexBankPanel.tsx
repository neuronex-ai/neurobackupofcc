"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
    Wallet,
    ArrowUpRight,
    QrCode,
    Banknote,
    ReceiptText,
    X,
    Search,
    Download,
    Landmark,
    Settings,
    TrendingUp,
    Clock,
    ChevronRight,
    ArrowDownLeft,
    PieChart,
    Package,
    FileText
} from "lucide-react";
import { NeuroNexCard } from "@/components/financeiro/NeuroNexCard";
import { useProfile } from "@/hooks/use-profile";
import { toast } from "sonner";

import { NewInvoiceModal } from "./NewInvoiceModal";
import { NfseGenerateModal } from "./NfseGenerateModal";
import { AsaasGestaoModal } from "./AsaasGestaoModal";
import { GlobalPlanosModal } from "./GlobalPlanosModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FinancialStatement } from "./FinancialStatement";
import { Transaction } from "@/types";
import { useFinancialAccount } from "@/hooks/use-financial-account";
import { useNeuroFinanceBalance } from "@/hooks/use-neurofinance-balance";
import { motion, AnimatePresence } from "framer-motion";
import TransactionDetailView from "./TransactionDetailView";
import { useNeuroFinanceBalanceDetails } from "@/hooks/use-neurofinance-balance-details";


interface NeuroNexBankPanelProps {
    transactions?: Transaction[];
    isLoadingTransactions?: boolean;
    onNavigate?: (view: any) => void;
}

const MiniActionBlock = ({ icon: Icon, label, onClick, disabled = false, variant = 'default' }: any) => (
    <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        disabled={disabled}
        className={cn(
            "group shrink-0 flex flex-col items-center gap-1.5 transition-all duration-300 py-1",
            disabled && "opacity-40 cursor-not-allowed"
        )}
    >
        <div className={cn(
            "w-12 h-12 md:w-14 md:h-14 rounded-[20px] flex items-center justify-center transition-all duration-500 shadow-sm",
            variant === 'primary'
                ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-lg"
                : "bg-white dark:bg-white/[0.04] border border-zinc-200 dark:border-white/5 backdrop-blur-xl group-hover:bg-zinc-50 dark:group-hover:bg-white/10"
        )}>
            <Icon className={cn(
                "w-4 h-4 md:w-5 md:h-5 transition-transform duration-500 group-hover:scale-110",
                variant === 'default' && "text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white"
            )} />
        </div>
        <span className={cn(
            "text-[7px] md:text-[8px] font-black uppercase tracking-[0.1em] text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors text-center w-14 md:w-16 leading-tight"
        )}>
            {label}
        </span>
    </motion.button>
);

export const NeuroNexBankPanel = ({ transactions = [], isLoadingTransactions = false, onNavigate }: NeuroNexBankPanelProps) => {
    // 1. Hooks de dados
    const { isConnected } = useFinancialAccount();
    const { data: balanceData, isLoading: isLoadingBalance, refetch: refetchBalance } = useNeuroFinanceBalance();
    const { data: profile } = useProfile();

    // 2. Estado local
    const [isStatementOpen, setIsStatementOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
    const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);
    const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [cardExpanded, setCardExpanded] = useState(false);

    // 3. Memos e Callbacks (Nível Superior)
    const bankBalance = useMemo(() => balanceData || { balance: 0, pending: 0, totalReceived: 0, paidOut: 0 }, [balanceData]);

    const cardName = useMemo(() => profile
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim().toUpperCase()
        : "MEMBRO NEURONEX", [profile]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const matchesSearch = t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (t as any).patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.amount.toString().includes(searchQuery);
            return matchesSearch;
        });
    }, [transactions, searchQuery]);

    // Hooks individuais para cada modal (Real-time Asaas BaaS Data)
    const { data: incomeDetails, isLoading: isLoadingIncome, refetch: refetchIncome } = useNeuroFinanceBalanceDetails('total');
    const { data: expensesDetails, isLoading: isLoadingExpenses, refetch: refetchExpenses } = useNeuroFinanceBalanceDetails('andamento');
    const { data: pendingDetails, isLoading: isLoadingPending, refetch: refetchPending } = useNeuroFinanceBalanceDetails('futuro');

    // Refetch data when modals open
    useEffect(() => {
        if (isIncomeModalOpen) {
            refetchIncome();
            refetchBalance();
        }
    }, [isIncomeModalOpen, refetchIncome, refetchBalance]);

    useEffect(() => {
        if (isExpensesModalOpen) {
            refetchExpenses();
            refetchBalance();
        }
    }, [isExpensesModalOpen, refetchExpenses, refetchBalance]);

    useEffect(() => {
        if (isPendingModalOpen) {
            refetchPending();
            refetchBalance();
        }
    }, [isPendingModalOpen, refetchPending, refetchBalance]);

    // Fallbacks
    const incomeTransactions = useMemo(() => {
        const hasValidAsaasData = Array.isArray(incomeDetails) && incomeDetails.some(t => t && t.amount > 0 && t.date);
        if (hasValidAsaasData) return incomeDetails;
        return transactions.filter(t => t.type === 'income' && t.status === 'completed');
    }, [incomeDetails, transactions]);

    const expenseTransactions = useMemo(() => {
        const hasValidAsaasData = Array.isArray(expensesDetails) && expensesDetails.some(t => t && t.amount > 0 && t.date);
        if (hasValidAsaasData) return expensesDetails;
        return transactions.filter(t => t.type === 'expense' && t.status === 'completed');
    }, [expensesDetails, transactions]);

    const pendingTransactions = useMemo(() => {
        const hasValidAsaasData = Array.isArray(pendingDetails) && pendingDetails.some(t => t && t.amount > 0 && t.date);
        if (hasValidAsaasData) return pendingDetails;
        return transactions.filter(t => t.status === 'pending');
    }, [pendingDetails, transactions]);


    const actionButtons = useMemo(() => (
        <>
            <NewInvoiceModal>
                <MiniActionBlock icon={QrCode} label="Cobrar" variant="primary" />
            </NewInvoiceModal>

            <MiniActionBlock
                icon={ArrowUpRight}
                label="Repasse"
                onClick={() => onNavigate?.('transferencias')}
                disabled={!isConnected}
            />

            <NfseGenerateModal>
                <MiniActionBlock
                    icon={FileText}
                    label="NFS-e"
                    disabled={!isConnected}
                />
            </NfseGenerateModal>

            <MiniActionBlock
                icon={Banknote}
                label="Extrato"
                onClick={() => onNavigate?.('extrato')}
            />

            <AsaasGestaoModal>
                <MiniActionBlock
                    icon={PieChart}
                    label="Gestão"
                />
            </AsaasGestaoModal>

            <MiniActionBlock
                icon={Landmark}
                label="Conta Bancária"
                onClick={() => onNavigate?.('contas-bancarias')}
            />

            <GlobalPlanosModal>
                <MiniActionBlock
                    icon={Package}
                    label="Planos"
                />
            </GlobalPlanosModal>

            <MiniActionBlock
                icon={Settings}
                label="Configurações"
                onClick={() => onNavigate?.('configuracoes')}
            />
        </>
    ), [isConnected, onNavigate]);

    const handleExport = useCallback(() => {
        toast.promise(new Promise(resolve => setTimeout(resolve, 1500)), {
            loading: 'Gerando relatório...',
            success: 'Extrato exportado',
            error: 'Erro ao exportar',
        });
    }, []);

    const handleCloseStatement = useCallback(() => {
        setIsStatementOpen(false);
        setSelectedTransaction(null);
    }, []);

    const displayBalance = bankBalance?.balance;
    const faturamentoTotal = bankBalance?.totalReceived || 0;
    const quantoSaiu = bankBalance?.paidOut || 0;
    const quantoVaiCair = bankBalance?.pending || 0;

    return (
        <div className="w-full space-y-8">
            {/* Modal de Extrato Geral */}
            <Dialog open={isStatementOpen} onOpenChange={(open) => { if (!open) handleCloseStatement(); else setIsStatementOpen(true); }}>
                <DialogContent className="max-w-[1100px] h-[90vh] bg-white dark:bg-[#0A0A0B] border-zinc-200 dark:border-white/5 p-0 overflow-hidden flex flex-col rounded-[48px] shadow-2xl z-[150] backdrop-blur-3xl outline-none [&>button]:hidden">
                    <DialogHeader className="px-12 py-10 border-b border-zinc-100 dark:border-white/5 flex flex-row items-center justify-between space-y-0 bg-zinc-50/50 dark:bg-white/[0.01]">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-[20px] bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center shadow-2xl">
                                <ReceiptText className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-[0.2em] leading-none mb-2">Extrato</DialogTitle>
                                <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.4em] opacity-60">Histórico de Movimentações em Tempo Real</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {!selectedTransaction && (
                                <Button variant="outline" size="sm" onClick={handleExport} className="h-12 px-8 rounded-[20px] border-zinc-200 dark:border-white/10 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
                                    <Download className="w-4 h-4 mr-3" /> Exportar Tudo
                                </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={handleCloseStatement} className="h-12 w-12 rounded-full">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </DialogHeader>

                    {!selectedTransaction && (
                        <div className="px-12 py-6 border-b border-zinc-100 dark:border-white/5 bg-white dark:bg-[#0A0A0B]">
                            <div className="flex-1 w-full max-w-sm relative">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="PROCURAR TRANSAÇÃO..."
                                    className="w-full h-14 pl-14 pr-6 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 rounded-[24px] text-[10px] font-black tracking-[0.2em] uppercase focus:outline-none transition-all"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-12 bg-zinc-50/30 dark:bg-black/20 custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {selectedTransaction ? (
                                <TransactionDetailView
                                    key="detail"
                                    transaction={selectedTransaction}
                                    onBack={() => setSelectedTransaction(null)}
                                />
                            ) : (
                                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <FinancialStatement
                                        transactions={filteredTransactions}
                                        isLoading={isLoadingTransactions}
                                        onSelectTransaction={setSelectedTransaction}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal: Quanto Entrou */}
            <Dialog open={isIncomeModalOpen} onOpenChange={(open) => { if (!open) setSelectedTransaction(null); setIsIncomeModalOpen(open); }}>
                <DialogContent className="max-w-[800px] h-[80vh] bg-white dark:bg-[#0A0A0B] border-zinc-200 dark:border-white/5 p-0 overflow-hidden flex flex-col rounded-[48px] shadow-2xl z-[150] backdrop-blur-3xl outline-none [&>button]:hidden">
                    <DialogHeader className="px-10 py-8 border-b border-zinc-100 dark:border-white/5 flex flex-row items-center justify-between space-y-0 bg-zinc-50/50 dark:bg-white/[0.01]">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-[18px] bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center shadow-xl">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-[0.2em] leading-none mb-1.5">
                                    Quanto Entrou
                                </DialogTitle>
                                <p className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.3em] opacity-60">Volume Bruto de Pagamentos (Asaas)</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => { setIsIncomeModalOpen(false); setSelectedTransaction(null); }} className="h-10 w-10 rounded-full">
                            <X className="h-5 w-5" />
                        </Button>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto p-10 bg-zinc-50/30 dark:bg-black/20 custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {selectedTransaction ? (
                                <TransactionDetailView
                                    key="income-detail"
                                    transaction={selectedTransaction}
                                    onBack={() => setSelectedTransaction(null)}
                                />
                            ) : (
                                <motion.div key="income-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <FinancialStatement
                                        transactions={incomeTransactions}
                                        isLoading={isLoadingIncome}
                                        onSelectTransaction={setSelectedTransaction}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal: Quanto Saiu */}
            <Dialog open={isExpensesModalOpen} onOpenChange={(open) => { if (!open) setSelectedTransaction(null); setIsExpensesModalOpen(open); }}>
                <DialogContent className="max-w-[800px] h-[80vh] bg-white dark:bg-[#0A0A0B] border-zinc-200 dark:border-white/5 p-0 overflow-hidden flex flex-col rounded-[48px] shadow-2xl z-[150] backdrop-blur-3xl outline-none [&>button]:hidden">
                    <DialogHeader className="px-10 py-8 border-b border-zinc-100 dark:border-white/5 flex flex-row items-center justify-between space-y-0 bg-zinc-50/50 dark:bg-white/[0.01]">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-[18px] bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 flex items-center justify-center shadow-xl">
                                <ArrowDownLeft className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-[0.2em] leading-none mb-1.5">
                                    Quanto Saiu
                                </DialogTitle>
                                <p className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.3em] opacity-60">Saques e Transferências Efetuadas</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => { setIsExpensesModalOpen(false); setSelectedTransaction(null); }} className="h-10 w-10 rounded-full">
                            <X className="h-5 w-5" />
                        </Button>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto p-10 bg-zinc-50/30 dark:bg-black/20 custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {selectedTransaction ? (
                                <TransactionDetailView
                                    key="expense-detail"
                                    transaction={selectedTransaction}
                                    onBack={() => setSelectedTransaction(null)}
                                />
                            ) : (
                                <motion.div key="expense-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <FinancialStatement
                                        transactions={expenseTransactions}
                                        isLoading={isLoadingExpenses}
                                        onSelectTransaction={setSelectedTransaction}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal: Vai Cair */}
            <Dialog open={isPendingModalOpen} onOpenChange={(open) => { if (!open) setSelectedTransaction(null); setIsPendingModalOpen(open); }}>
                <DialogContent className="max-w-[800px] h-[80vh] bg-white dark:bg-[#0A0A0B] border-zinc-200 dark:border-white/5 p-0 overflow-hidden flex flex-col rounded-[48px] shadow-2xl z-[150] backdrop-blur-3xl outline-none [&>button]:hidden">
                    <DialogHeader className="px-10 py-8 border-b border-zinc-100 dark:border-white/5 flex flex-row items-center justify-between space-y-0 bg-zinc-50/50 dark:bg-white/[0.01]">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-[18px] bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-xl">
                                <Clock className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-[0.2em] leading-none mb-1.5">
                                    Vai Cair
                                </DialogTitle>
                                <p className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.3em] opacity-60">Saldos Pendentes de Liquidação</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => { setIsPendingModalOpen(false); setSelectedTransaction(null); }} className="h-10 w-10 rounded-full">
                            <X className="h-5 w-5" />
                        </Button>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto p-10 bg-zinc-50/30 dark:bg-black/20 custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {selectedTransaction ? (
                                <TransactionDetailView
                                    key="pending-detail"
                                    transaction={selectedTransaction}
                                    onBack={() => setSelectedTransaction(null)}
                                />
                            ) : (
                                <motion.div key="pending-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <FinancialStatement
                                        transactions={pendingTransactions}
                                        isLoading={isLoadingPending}
                                        onSelectTransaction={setSelectedTransaction}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="w-full rounded-[40px] bg-white dark:bg-[#0A0A0B] border border-zinc-200 dark:border-white/5 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] overflow-hidden relative group/panel">
                <div className="flex flex-col lg:flex-row items-stretch relative z-10">
                    <div className="flex-[2.5] p-6 md:p-10 flex flex-col justify-center relative z-10">
                        <div className="space-y-6 md:space-y-10">
                            <div className="flex items-center gap-4 pl-2">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-[18px] bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center shadow-lg">
                                    <Wallet className="h-4 w-4 md:h-5 md:w-5" />
                                </div>
                                <div>
                                    <h2 className="text-base md:text-lg font-black text-zinc-900 dark:text-white tracking-[0.1em] uppercase leading-none mb-1">NeuroFinance</h2>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-[8px] md:text-[9px] text-zinc-400 font-black uppercase tracking-[0.2em]">Conta PJ Conectada</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col xl:flex-row items-center gap-6 xl:gap-8 w-full max-w-4xl">
                                <motion.div
                                    whileHover={{ scale: 1.01 }}
                                    onClick={() => onNavigate?.('extrato')}
                                    className="flex-1 space-y-4 bg-zinc-50 dark:bg-gradient-to-br dark:from-[#1A1A1C] dark:to-[#0D0D0F] border border-zinc-200 dark:border-white/5 rounded-[32px] p-6 lg:p-8 w-full shadow-sm dark:shadow-xl cursor-pointer group/balance"
                                >
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-[10px] md:text-xs font-black text-zinc-400 uppercase tracking-[0.3em]">Saldo Disponível</span>
                                        <div className="h-8 md:h-10 px-5 rounded-full flex items-center gap-2.5 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/5 shadow-sm group-hover/balance:bg-zinc-100 dark:group-hover/balance:bg-white/10 transition-colors">
                                            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.15em] text-zinc-500 group-hover/balance:text-zinc-900 dark:group-hover/balance:text-white mt-0.5">Ver Extrato</span>
                                            <ChevronRight className="h-4 w-4 text-zinc-400 group-hover/balance:text-zinc-900 dark:group-hover/balance:text-white" />
                                        </div>
                                    </div>

                                    {isLoadingBalance ? (
                                        <Skeleton className="h-16 md:h-20 w-full md:w-[80%] bg-zinc-100 dark:bg-white/5 rounded-[16px]" />
                                    ) : (
                                        <div className="flex items-baseline gap-3 md:gap-4">
                                            <span className="text-2xl md:text-4xl text-zinc-400 dark:text-white/30 font-light translate-y-[-4px] md:translate-y-[-6px] italic">R$</span>
                                            <p className="text-5xl md:text-6xl lg:text-[72px] font-black tracking-[-0.05em] text-zinc-900 dark:text-white leading-none">
                                                {(displayBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    )}
                                </motion.div>

                                <div className="flex flex-col justify-center gap-2 md:gap-3 w-full xl:w-auto shrink-0 bg-zinc-100/50 dark:bg-white/5 p-3 rounded-[32px] border border-zinc-200/50 dark:border-white/5 backdrop-blur-xl h-full min-h-[160px]">
                                    <div
                                        className="px-4 py-3 rounded-[20px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 shadow-lg cursor-pointer hover:scale-[1.02] transition-transform w-full xl:w-[110px]"
                                        onClick={() => setIsStatementOpen(true)}
                                    >
                                        <p className="text-[7.5px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.15em] mb-1.5 leading-none">Quanto Entrou</p>
                                        <p className="text-sm md:text-base font-black text-zinc-900 dark:text-white tracking-tighter leading-none flex items-baseline gap-1">
                                            <span className="text-[9px] text-zinc-400 font-medium italic">R$</span>
                                            {isLoadingBalance ? "..." : faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>

                                    <div
                                        className="px-4 py-2 cursor-pointer hover:bg-zinc-200/50 dark:hover:bg-white/5 rounded-[20px] transition-colors w-full xl:w-[110px]"
                                        onClick={() => setIsExpensesModalOpen(true)}
                                    >
                                        <p className="text-[7.5px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.15em] mb-1.5 leading-none">Quanto Saiu</p>
                                        <p className="text-[13px] md:text-sm font-bold text-zinc-900 dark:text-white/90 leading-none flex items-baseline gap-1">
                                            <span className="text-[8px] text-zinc-400 font-light italic">R$</span>
                                            {isLoadingBalance ? "..." : quantoSaiu.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>

                                    <div
                                        className="px-4 py-2 cursor-pointer hover:bg-zinc-200/50 dark:hover:bg-white/5 rounded-[20px] transition-colors w-full xl:w-[110px]"
                                        onClick={() => setIsPendingModalOpen(true)}
                                    >
                                        <p className="text-[7.5px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.15em] mb-1.5 leading-none">Vai Cair</p>
                                        <p className="text-[13px] md:text-sm font-bold text-zinc-900 dark:text-white/90 leading-none flex items-baseline gap-1">
                                            <span className="text-[8px] text-zinc-400 font-light italic">R$</span>
                                            {isLoadingBalance ? "..." : quantoVaiCair.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="flex-1 bg-zinc-50/50 dark:bg-black/20 lg:border-l border-zinc-200 dark:border-white/5 relative flex flex-col items-center justify-center p-6 md:p-8">
                        <div className="relative z-10 w-full flex flex-col items-center transform scale-75 md:scale-90 xl:scale-100 transition-all duration-700">
                            <NeuroNexCard
                                name={cardName}
                                bankName="NeuroFinance"
                                agency="0001"
                                account="**** 8820"
                                isExpanded={cardExpanded}
                                showSensitive={true}
                                onToggle={() => setCardExpanded(!cardExpanded)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative group/actions py-1.5 bg-white dark:bg-white/[0.015] border border-zinc-200 dark:border-white/[0.05] rounded-[24px] px-8 shadow-sm">
                <div className="flex items-center justify-center gap-6 md:gap-10 lg:gap-14 overflow-x-auto no-scrollbar py-1">
                    {actionButtons}
                </div>
            </div>
        </div>
    );
};