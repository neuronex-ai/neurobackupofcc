import { motion } from "framer-motion";
import {
    QrCode,
    Key,
    ShieldCheck,
    TrendingUp,
    Landmark,
    Receipt,
    FileText,
    LayoutDashboard,
    Users,
    Settings,
    BadgeCent,
    ChevronLeft,
    CreditCard,
    ArrowDownLeft,
    PieChart,
    History as HistoryIcon,
    Calendar,
    Send,
    Barcode,
    FolderOpen,
    Activity,
    LayoutList
} from "lucide-react";

import { CashFlowScenarios } from "@/components/financeiro/CashFlowScenarios";
import { InvoicesListPanel } from "@/components/financeiro/InvoicesListPanel";
import { NeuroNexBankPanel } from "@/components/financeiro/NeuroNexBankPanel";
import { FinancialStatement } from "@/components/financeiro/FinancialStatement";
import { SmartSplit } from "@/components/financeiro/SmartSplit";
import { InvoicesHistoryList } from "@/components/financeiro/invoice/InvoicesHistoryList";
import { BankTransferView } from "@/components/financeiro/BankTransferView";
import { BankAccountsView } from "@/components/financeiro/BankAccountsView";
import { FinancialAnalyticsChart } from "@/components/financeiro/FinancialAnalyticsChart";
import TransactionDetailView from "@/components/financeiro/TransactionDetailView";

import { PixPagarCopiaCola } from "@/components/financeiro/pix/PixPagarCopiaCola";
import { PixTransferir } from "@/components/financeiro/pix/PixTransferir";
import { PixGerarQrCode } from "@/components/financeiro/pix/PixGerarQrCode";
import { PixReceber } from "@/components/financeiro/pix/PixReceber";
import { PixChaves } from "@/components/financeiro/pix/PixChaves";
import { PixSalarios } from "@/components/financeiro/pix/PixSalarios";
import { PixLimites } from "@/components/financeiro/pix/PixLimites";

import { PagamentosAgendamento } from "@/components/financeiro/pagamentos/PagamentosAgendamento";
import { PagamentosDDA } from "@/components/financeiro/pagamentos/PagamentosDDA";
import { PagamentosGrupos } from "@/components/financeiro/pagamentos/PagamentosGrupos";
import { Transaction } from "@/types";
import { AsaasRegulatoryFooter } from "@/components/financeiro/AsaasRegulatoryFooter";

export type FinanceView =
    | 'conta-digital'
    | 'pix'
    | 'pix-pagar'
    | 'pix-transferir'
    | 'pix-qrcode'
    | 'pix-receber'
    | 'pix-chaves'
    | 'pix-salarios'
    | 'pix-limites'
    | 'transferencias'
    | 'pagamentos'
    | 'pagamentos-agendar'
    | 'pagamentos-dda'
    | 'pagamentos-grupos'
    | 'contas-bancarias'
    | 'extrato'
    | 'cartoes'
    | 'fluxo-caixa'
    | 'receitas'
    | 'despesas'
    | 'cobrancas-historia'
    | 'cobrancas-config'
    | 'fiscal-painel'
    | 'fiscal-lista'
    | 'repasses-convenio'
    | 'repasses-profissional'
    | 'repasses-salas'
    | 'configuracoes';

const SectionHeader = ({
    icon: Icon,
    title,
    subtitle,
    action,
    onBack,
}: {
    icon: any;
    title: string;
    subtitle: string;
    action?: React.ReactNode;
    onBack?: () => void;
}) => (
    <div className="rounded-[32px] bg-white/60 dark:bg-white/[0.015] backdrop-blur-2xl border border-zinc-200/50 dark:border-white/[0.05] p-7 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.3)] relative overflow-hidden">
        <div className="absolute inset-0 premium-noise opacity-[0.02] dark:opacity-[0.04] pointer-events-none mix-blend-overlay" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-[16px] bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center shadow-2xl shrink-0 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <Icon className="w-5 h-5 relative z-10" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none">{title}</h3>
                    <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-[0.2em] mt-1.5">{subtitle}</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                {action}
                {onBack && (
                    <button
                        onClick={onBack}
                        className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-white/5 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-white/10 transition-all group/back"
                    >
                        <ChevronLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                )}
            </div>
        </div>
    </div>
);

const ContentWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-[32px] bg-white/40 dark:bg-white/[0.01] backdrop-blur-xl border border-zinc-200/50 dark:border-white/[0.04] p-6 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 premium-noise opacity-[0.015] dark:opacity-[0.03] pointer-events-none mix-blend-overlay" />
        <div className="relative z-10">{children}</div>
    </div>
);

export interface FinancialDashboardProps {
    selectedTransaction: Transaction | null;
    setSelectedTransaction: (t: Transaction | null) => void;
    activeView: FinanceView;
    setActiveView: (view: FinanceView) => void;
    allTransactions: Transaction[];
    isLoadingTransactions: boolean;
    metrics: any;

    currentMonthShort: string;
    motionProps: any;
    extratoTab: 'realizado' | 'futuro' | 'assinaturas';
    setExtratoTab: (tab: 'realizado' | 'futuro' | 'assinaturas') => void;
    realizedTransactions: Transaction[];
    futureTransactions: Transaction[];
    subscriptionTransactions: Transaction[];
    isNbStatementLoading: boolean;
}

export function FinancialDashboard({
    selectedTransaction,
    setSelectedTransaction,
    activeView,
    setActiveView,
    allTransactions,
    isLoadingTransactions,
    metrics,

    currentMonthShort,
    motionProps,
    extratoTab,
    setExtratoTab,
    realizedTransactions,
    futureTransactions,
    subscriptionTransactions,
    isNbStatementLoading
}: FinancialDashboardProps) {

    const handleGoBack = () => {
        setActiveView('conta-digital');
        setSelectedTransaction(null);
    };

    if (selectedTransaction) {
        return (
            <motion.div {...motionProps} key="transaction-detail" className="px-6 py-6">
                <TransactionDetailView
                    transaction={selectedTransaction}
                    onBack={() => setSelectedTransaction(null)}
                />
            </motion.div>
        );
    }

    switch (activeView) {
        case 'conta-digital':
            return (
                <motion.div {...motionProps} key="conta-digital" className="px-6 py-6 space-y-6">
                    <NeuroNexBankPanel
                        transactions={allTransactions}
                        isLoadingTransactions={isLoadingTransactions}
                        onNavigate={setActiveView as any}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        <motion.div
                            whileHover={{ y: -4, scale: 1.01 }}
                            className="p-8 rounded-[40px] bg-white/60 dark:bg-white/[0.015] backdrop-blur-2xl border border-zinc-200/50 dark:border-white/[0.04] shadow-xl relative overflow-hidden group/widget"
                        >
                            <div className="absolute inset-0 premium-noise opacity-[0.02] dark:opacity-[0.04] pointer-events-none mix-blend-overlay" />
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex flex-col">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 dark:text-zinc-500 mb-1">Faturamento Mensal</p>
                                </div>
                                <div className="px-3 py-1.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black text-[9px] font-black tracking-widest uppercase shadow-lg">
                                    {currentMonthShort}
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl font-light text-zinc-400 italic">R$</span>
                                <p className="text-4xl xl:text-5xl font-black text-zinc-900 dark:text-white tracking-[-0.05em]">
                                    {(metrics?.currentMonthRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -4, scale: 1.01 }}
                            className="p-8 rounded-[40px] bg-zinc-900 dark:bg-white shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] dark:shadow-[0_24px_48px_-12px_rgba(255,255,255,0.05)] relative overflow-hidden group/widget"
                        >
                            <div className="absolute inset-0 premium-noise opacity-[0.05] pointer-events-none mix-blend-overlay" />
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex flex-col">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 dark:text-black/40 mb-1">Lucro L├¡quido</p>
                                </div>
                                <div className="px-3 py-1.5 rounded-full bg-white/10 dark:bg-black/5 text-white dark:text-black text-[9px] font-black tracking-widest uppercase border border-white/10 dark:border-black/5">
                                    {currentMonthShort}
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl font-light text-white/30 dark:text-black/30 italic">R$</span>
                                <p className="text-4xl xl:text-5xl font-black text-white dark:text-zinc-900 tracking-[-0.05em]">
                                    {(metrics?.netProfit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </motion.div>
                    </div>
                    <FinancialAnalyticsChart />
                    <AsaasRegulatoryFooter />
                </motion.div>
            );

        case 'extrato':
            return (
                <motion.div {...motionProps} key="extrato" className="px-6 py-6">
                    <div className="max-w-6xl mx-auto space-y-6">
                        <SectionHeader icon={FileText} title="Extrato Detalhado" subtitle="Hist├│rico Unificado • NeuroFinance & Manual" onBack={handleGoBack} />

                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-2 p-1.5 rounded-[24px] bg-white/60 dark:bg-white/[0.015] border border-zinc-200/50 dark:border-white/10 w-fit">
                                {[
                                    { id: 'realizado', label: 'Realizado', icon: Activity },
                                    { id: 'futuro', label: 'Futuro & Pendente', icon: Calendar },
                                    { id: 'assinaturas', label: 'Gest├úo de Assinaturas', icon: LayoutList }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setExtratoTab(tab.id as any)}
                                        className={`flex items-center gap-2 px-6 py-2.5 rounded-[16px] transition-all duration-300 ${extratoTab === tab.id
                                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-md'
                                            : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'
                                            }`}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        <span className="text-xs font-bold tracking-wide">{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            <ContentWrapper>
                                {extratoTab === 'realizado' && (
                                    <FinancialStatement
                                        transactions={realizedTransactions}
                                        isLoading={isLoadingTransactions || isNbStatementLoading}
                                        onSelectTransaction={setSelectedTransaction}
                                    />
                                )}
                                {extratoTab === 'futuro' && (
                                    <FinancialStatement
                                        transactions={futureTransactions}
                                        isLoading={isLoadingTransactions || isNbStatementLoading}
                                        onSelectTransaction={setSelectedTransaction}
                                    />
                                )}
                                {extratoTab === 'assinaturas' && (
                                    <FinancialStatement
                                        transactions={subscriptionTransactions}
                                        isLoading={isLoadingTransactions || isNbStatementLoading}
                                        onSelectTransaction={setSelectedTransaction}
                                    />
                                )}
                            </ContentWrapper>
                        </div>
                    </div>
                </motion.div >
            );

        case 'receitas':
            return (
                <motion.div {...motionProps} key="receitas" className="px-6 py-6">
                    <SectionHeader icon={TrendingUp} title="Receitas" subtitle="Entradas e Rendimentos" onBack={handleGoBack} />
                    <ContentWrapper>
                        <FinancialStatement transactions={allTransactions.filter(t => t.type === 'income')} isLoading={isLoadingTransactions} onSelectTransaction={setSelectedTransaction} />
                    </ContentWrapper>
                </motion.div>
            );

        case 'despesas':
            return (
                <motion.div {...motionProps} key="despesas" className="px-6 py-6">
                    <SectionHeader icon={PieChart} title="Despesas" subtitle="Sa├¡das e Custos" onBack={handleGoBack} />
                    <ContentWrapper>
                        <FinancialStatement transactions={allTransactions.filter(t => t.type === 'expense')} isLoading={isLoadingTransactions} onSelectTransaction={setSelectedTransaction} />
                    </ContentWrapper>
                </motion.div>
            );

        case 'pix': return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={BadgeCent} title="├ürea Pix" subtitle="Gest├úo Pix" onBack={handleGoBack} /><ContentWrapper><PixReceber /></ContentWrapper></motion.div>;
        case 'pix-pagar': return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={QrCode} title="Pagar Pix" subtitle="Copia e Cola" onBack={() => setActiveView('pix')} /><ContentWrapper><PixPagarCopiaCola /></ContentWrapper></motion.div>;
        case 'pix-transferir': return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={Send} title="Transferir" subtitle="Pix Gr├ítis" onBack={() => setActiveView('pix')} /><ContentWrapper><PixTransferir /></ContentWrapper></motion.div>;
        case 'pix-qrcode': return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={QrCode} title="QR Code" subtitle="Gerar cobran├ºa" onBack={() => setActiveView('pix')} /><ContentWrapper><PixGerarQrCode /></ContentWrapper></motion.div>;
        case 'pix-receber': return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={ArrowDownLeft} title="Receber" subtitle="├ürea de recebimentos" onBack={() => setActiveView('pix')} /><ContentWrapper><PixReceber /></ContentWrapper></motion.div>;
        case 'pix-chaves': return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={Key} title="Chaves" subtitle="Minhas chaves" onBack={() => setActiveView('pix')} /><ContentWrapper><PixChaves /></ContentWrapper></motion.div>;
        case 'pix-salarios': return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={Users} title="Sal├írios" subtitle="Pagamento em lote" onBack={() => setActiveView('pix')} /><ContentWrapper><PixSalarios /></ContentWrapper></motion.div>;
        case 'pix-limites': return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={ShieldCheck} title="Limites" subtitle="Configura├º├Áes de seguran├ºa" onBack={() => setActiveView('pix')} /><ContentWrapper><PixLimites /></ContentWrapper></motion.div>;
        case 'transferencias': return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={Send} title="Saque" subtitle="Envio de fundos" onBack={handleGoBack} /><ContentWrapper><BankTransferView /></ContentWrapper></motion.div>;
        case 'pagamentos': return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={Receipt} title="Pagamentos" subtitle="Gest├úo de contas" onBack={handleGoBack} /><ContentWrapper><PagamentosAgendamento /></ContentWrapper></motion.div>;
        case 'pagamentos-agendar': return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={Calendar} title="Agendar" subtitle="Agendamento de boletos" onBack={() => setActiveView('pagamentos')} /><ContentWrapper><PagamentosAgendamento /></ContentWrapper></motion.div>;
        case 'pagamentos-dda': return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={Barcode} title="DDA" subtitle="Consulta de boletos" onBack={() => setActiveView('pagamentos')} /><ContentWrapper><PagamentosDDA /></ContentWrapper></motion.div>;
        case 'pagamentos-grupos': return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={FolderOpen} title="Grupos" subtitle="Organiza├º├úo de pagamentos" onBack={() => setActiveView('pagamentos')} /><ContentWrapper><PagamentosGrupos /></ContentWrapper></motion.div>;
        case 'contas-bancarias': return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={Landmark} title="Contas" subtitle="Contas de destino" onBack={handleGoBack} /><ContentWrapper><BankAccountsView /></ContentWrapper></motion.div>;
        case 'cartoes': return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={CreditCard} title="Cart├Áes" subtitle="Gest├úo de cart├Áes" onBack={handleGoBack} /><ContentWrapper><div className="py-20 text-center"><CreditCard className="w-12 h-12 text-zinc-300 mx-auto mb-4" /><p className="text-xs text-zinc-500 uppercase font-black tracking-widest">M├│dulo de Cart├Áes em fase final de homologa├º├úo.</p></div></ContentWrapper></motion.div>;
        case 'fluxo-caixa': return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={TrendingUp} title="Fluxo" subtitle="An├ílise de caixa" onBack={handleGoBack} /><div className="h-[500px] rounded-[32px] overflow-hidden"><CashFlowScenarios /></div></motion.div>;
        case 'cobrancas-historia': return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={HistoryIcon} title="Faturas" subtitle="Gest├úo de cobran├ºas" onBack={handleGoBack} /><ContentWrapper><InvoicesListPanel /></ContentWrapper></motion.div>;
        case 'fiscal-painel': return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={LayoutDashboard} title="Fiscal" subtitle="Painel fiscal" onBack={handleGoBack} /><ContentWrapper><InvoicesHistoryList /></ContentWrapper></motion.div>;
        case 'repasses-profissional': return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={Users} title="Split" subtitle="Gest├úo de repasses" onBack={handleGoBack} /><ContentWrapper><SmartSplit /></ContentWrapper></motion.div>;
        case 'configuracoes': return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={Settings} title="Configura├º├Áes" subtitle="Prefer├¬ncias do sistema" onBack={handleGoBack} /><ContentWrapper><div className="py-20 text-center"><Settings className="w-12 h-12 text-zinc-300 mx-auto mb-4" /><p className="text-xs text-zinc-500 uppercase font-black tracking-widest">Configura├º├Áes avan├ºadas em desenvolvimento.</p></div></ContentWrapper></motion.div>;

        default: return null;
    }
}
