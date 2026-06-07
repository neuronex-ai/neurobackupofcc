import { motion } from "framer-motion";
import type { ReactNode } from "react";
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
    ArrowDownLeft,
    PieChart,
    Calendar,
    Send,
    Barcode,
    FolderOpen,
    Activity,
    LayoutList,
    Repeat,
    WalletCards,
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
import { PagamentosGrupos } from "@/components/financeiro/pagamentos/PagamentosGrupos";
import { AsaasRegulatoryFooter } from "@/components/financeiro/AsaasRegulatoryFooter";
import { FiscalConfigPanel } from "@/components/settings/FiscalConfigPanel";
import { NeuroFinanceTariffs } from "@/components/financeiro/NeuroFinanceTariffs";
import { AnticipationsList } from "@/components/financeiro/antecipacoes/AnticipationsList";
import { AnticipationRequest } from "@/components/financeiro/antecipacoes/AnticipationRequest";
import { AutomaticAnticipation } from "@/components/financeiro/antecipacoes/AutomaticAnticipation";
import { SalesSimulator } from "@/components/financeiro/cobrancas/SalesSimulator";
import { ChargebacksPanel } from "@/components/financeiro/cobrancas/ChargebacksPanel";
import type { Transaction } from "@/types";

export type FinanceView =
    | "conta-digital"
    | "pix"
    | "pix-pagar"
    | "pix-transferir"
    | "pix-qrcode"
    | "pix-receber"
    | "pix-chaves"
    | "pix-salarios"
    | "pix-limites"
    | "transferencias"
    | "pagamentos"
    | "pagamentos-boletos"
    | "pagamentos-pix"
    | "pagamentos-agendar"
    | "pagamentos-grupos"
    | "contas-bancarias"
    | "extrato"
    | "fluxo-caixa"
    | "receitas"
    | "despesas"
    | "cobrancas-historia"
    | "cobrancas-config"
    | "cobrancas-simulador"
    | "cobrancas-chargebacks"
    | "antecipacoes"
    | "antecipacoes-lista"
    | "antecipacoes-solicitar"
    | "antecipacoes-automatica"
    | "antecipacoes-simulador"
    | "antecipacoes-historico"
    | "fiscal-painel"
    | "fiscal-lista"
    | "repasses-convenio"
    | "repasses-profissional"
    | "repasses-salas"
    | "tarifas"
    | "configuracoes";

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
    action?: ReactNode;
    onBack?: () => void;
}) => (
    <div className="relative overflow-hidden rounded-[32px] border border-zinc-200/50 bg-white/60 p-7 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.04)] backdrop-blur-2xl dark:border-white/[0.05] dark:bg-white/[0.015] dark:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.3)]">
        <div className="premium-noise pointer-events-none absolute inset-0 opacity-[0.02] mix-blend-overlay dark:opacity-[0.04]" />
        <div className="relative z-10 flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-5">
                <div className="group relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-zinc-900 text-white shadow-2xl dark:bg-white dark:text-black">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <Icon className="relative z-10 h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-lg font-black uppercase leading-none tracking-tight text-zinc-900 dark:text-white">{title}</h3>
                    <p className="mt-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">{subtitle}</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                {action}
                {onBack && (
                    <button
                        onClick={onBack}
                        className="group/back flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 transition-all hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10"
                    >
                        <ChevronLeft className="h-5 w-5 text-zinc-600 transition-transform group-hover/back:-translate-x-0.5 dark:text-zinc-400" />
                    </button>
                )}
            </div>
        </div>
    </div>
);

const ContentWrapper = ({ children }: { children: ReactNode }) => (
    <div className="relative overflow-hidden rounded-[32px] border border-zinc-200/50 bg-white/40 p-6 shadow-sm backdrop-blur-xl dark:border-white/[0.04] dark:bg-white/[0.01]">
        <div className="premium-noise pointer-events-none absolute inset-0 opacity-[0.015] mix-blend-overlay dark:opacity-[0.03]" />
        <div className="relative z-10">{children}</div>
    </div>
);

const CapabilityNotice = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[24px] border border-dashed border-zinc-200 bg-zinc-50/50 px-8 text-center dark:border-white/10 dark:bg-white/[0.015]">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <Icon className="h-6 w-6 text-zinc-500" />
        </div>
        <h4 className="text-sm font-black uppercase tracking-[0.12em] text-zinc-900 dark:text-white">{title}</h4>
        <p className="mt-2 max-w-md text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{description}</p>
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
    extratoTab: "realizado" | "futuro" | "assinaturas";
    setExtratoTab: (tab: "realizado" | "futuro" | "assinaturas") => void;
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
    isNbStatementLoading,
}: FinancialDashboardProps) {
    const handleGoBack = () => {
        setActiveView("conta-digital");
        setSelectedTransaction(null);
    };

    if (selectedTransaction) {
        return (
            <motion.div {...motionProps} key="transaction-detail" className="px-6 py-6">
                <TransactionDetailView transaction={selectedTransaction} onBack={() => setSelectedTransaction(null)} />
            </motion.div>
        );
    }

    switch (activeView) {
        case "conta-digital":
            return (
                <motion.div {...motionProps} key="conta-digital" className="space-y-6 px-6 py-6">
                    <NeuroNexBankPanel transactions={allTransactions} isLoadingTransactions={isLoadingTransactions} onNavigate={setActiveView as any} />

                    <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
                        <motion.div whileHover={{ y: -4, scale: 1.01 }} className="group/widget relative overflow-hidden rounded-[40px] border border-zinc-200/50 bg-white/60 p-8 shadow-xl backdrop-blur-2xl dark:border-white/[0.04] dark:bg-white/[0.015]">
                            <div className="premium-noise pointer-events-none absolute inset-0 opacity-[0.02] mix-blend-overlay dark:opacity-[0.04]" />
                            <div className="mb-6 flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 dark:text-zinc-500">Faturamento mensal</p>
                                <div className="rounded-full bg-zinc-900 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white shadow-lg dark:bg-white dark:text-black">{currentMonthShort}</div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl font-light italic text-zinc-400">R$</span>
                                <p className="text-4xl font-black tracking-[-0.05em] text-zinc-900 dark:text-white xl:text-5xl">
                                    {(metrics?.currentMonthRevenue || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </motion.div>

                        <motion.div whileHover={{ y: -4, scale: 1.01 }} className="group/widget relative overflow-hidden rounded-[40px] bg-zinc-900 p-8 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] dark:bg-white dark:shadow-[0_24px_48px_-12px_rgba(255,255,255,0.05)]">
                            <div className="premium-noise pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay" />
                            <div className="mb-6 flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 dark:text-black/40">Lucro líquido</p>
                                <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white dark:border-black/5 dark:bg-black/5 dark:text-black">{currentMonthShort}</div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl font-light italic text-white/30 dark:text-black/30">R$</span>
                                <p className="text-4xl font-black tracking-[-0.05em] text-white dark:text-zinc-900 xl:text-5xl">
                                    {(metrics?.netProfit || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </motion.div>
                    </div>
                    <FinancialAnalyticsChart />
                    <AsaasRegulatoryFooter />
                </motion.div>
            );

        case "extrato":
            return (
                <motion.div {...motionProps} key="extrato" className="px-6 py-6">
                    <div className="mx-auto max-w-6xl space-y-6">
                        <SectionHeader icon={FileText} title="Extrato detalhado" subtitle="Histórico unificado NeuroFinance e manual" onBack={handleGoBack} />
                        <div className="flex flex-col gap-6">
                            <div className="flex w-fit items-center gap-2 rounded-[24px] border border-zinc-200/50 bg-white/60 p-1.5 dark:border-white/10 dark:bg-white/[0.015]">
                                {[
                                    { id: "realizado", label: "Realizado", icon: Activity },
                                    { id: "futuro", label: "Futuro e pendente", icon: Calendar },
                                    { id: "assinaturas", label: "Assinaturas", icon: LayoutList },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setExtratoTab(tab.id as any)}
                                        className={`flex items-center gap-2 rounded-[16px] px-6 py-2.5 transition-all duration-300 ${extratoTab === tab.id ? "bg-zinc-900 text-white shadow-md dark:bg-white dark:text-black" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/5 dark:hover:text-white"}`}
                                    >
                                        <tab.icon className="h-4 w-4" />
                                        <span className="text-xs font-bold tracking-wide">{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            <ContentWrapper>
                                {extratoTab === "realizado" && <FinancialStatement transactions={realizedTransactions} isLoading={isLoadingTransactions || isNbStatementLoading} onSelectTransaction={setSelectedTransaction} />}
                                {extratoTab === "futuro" && <FinancialStatement transactions={futureTransactions} isLoading={isLoadingTransactions || isNbStatementLoading} onSelectTransaction={setSelectedTransaction} />}
                                {extratoTab === "assinaturas" && <FinancialStatement transactions={subscriptionTransactions} isLoading={isLoadingTransactions || isNbStatementLoading} onSelectTransaction={setSelectedTransaction} />}
                            </ContentWrapper>
                        </div>
                    </div>
                </motion.div>
            );

        case "receitas":
            return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={TrendingUp} title="Receitas" subtitle="Entradas confirmadas" onBack={handleGoBack} /><ContentWrapper><FinancialStatement transactions={allTransactions.filter((t) => t.type === "income")} isLoading={isLoadingTransactions} onSelectTransaction={setSelectedTransaction} /></ContentWrapper></motion.div>;
        case "despesas":
            return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={PieChart} title="Despesas" subtitle="Saídas e custos" onBack={handleGoBack} /><ContentWrapper><FinancialStatement transactions={allTransactions.filter((t) => t.type === "expense")} isLoading={isLoadingTransactions} onSelectTransaction={setSelectedTransaction} /></ContentWrapper></motion.div>;
        case "pix":
            return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={BadgeCent} title="Área Pix" subtitle="Tudo que você faz com Pix" onBack={handleGoBack} /><ContentWrapper><PixReceber /></ContentWrapper></motion.div>;
        case "pix-pagar":
            return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={QrCode} title="Pagar Pix" subtitle="Cole o Pix e pague" onBack={() => setActiveView("pix")} /><ContentWrapper><PixPagarCopiaCola /></ContentWrapper></motion.div>;
        case "pix-transferir":
            return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={Send} title="Transferir" subtitle="Envie para uma chave Pix" onBack={() => setActiveView("pix")} /><ContentWrapper><PixTransferir /></ContentWrapper></motion.div>;
        case "pix-qrcode":
            return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={QrCode} title="QR Code" subtitle="Gere um Pix para receber" onBack={() => setActiveView("pix")} /><ContentWrapper><PixGerarQrCode /></ContentWrapper></motion.div>;
        case "pix-receber":
            return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={ArrowDownLeft} title="Receber" subtitle="Acompanhe o que entrou" onBack={() => setActiveView("pix")} /><ContentWrapper><PixReceber /></ContentWrapper></motion.div>;
        case "pix-chaves":
            return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={Key} title="Chaves Pix" subtitle="Suas chaves para receber" onBack={() => setActiveView("pix")} /><ContentWrapper><PixChaves /></ContentWrapper></motion.div>;
        case "pix-salarios":
            return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={Users} title="Salários" subtitle="Pix em lote para sua equipe" onBack={() => setActiveView("pix")} /><ContentWrapper><PixSalarios /></ContentWrapper></motion.div>;
        case "pix-limites":
            return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={ShieldCheck} title="Limites" subtitle="Segurança da conta" onBack={() => setActiveView("pix")} /><ContentWrapper><PixLimites /></ContentWrapper></motion.div>;
        case "transferencias":
            return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={Send} title="Saque" subtitle="Envie fundos para sua conta" onBack={handleGoBack} /><ContentWrapper><BankTransferView /></ContentWrapper></motion.div>;
        case "pagamentos":
            return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={Receipt} title="Pagamentos" subtitle="Pague boletos e Pix" onBack={handleGoBack} /><ContentWrapper><PagamentosAgendamento /></ContentWrapper></motion.div>;
        case "pagamentos-boletos":
            return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={Barcode} title="Pagar boletos" subtitle="Linha digitável, imagem ou PDF" onBack={() => setActiveView("pagamentos")} /><ContentWrapper><PagamentosAgendamento /></ContentWrapper></motion.div>;
        case "pagamentos-pix":
            return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={QrCode} title="Pagar Pix" subtitle="Use o saldo da conta para pagar" onBack={() => setActiveView("pagamentos")} /><ContentWrapper><PixPagarCopiaCola /></ContentWrapper></motion.div>;
        case "pagamentos-agendar":
            return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={Calendar} title="Pagar contas" subtitle="Boletos e Pix de fornecedores" onBack={() => setActiveView("pagamentos")} /><ContentWrapper><PagamentosAgendamento /></ContentWrapper></motion.div>;
        case "pagamentos-grupos":
            return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={FolderOpen} title="Pagamentos em lote" subtitle="Organize várias contas de uma vez" onBack={() => setActiveView("pagamentos")} /><ContentWrapper><PagamentosGrupos /></ContentWrapper></motion.div>;
        case "contas-bancarias":
            return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={Landmark} title="Contas" subtitle="Conta bancária de destino" onBack={handleGoBack} /><ContentWrapper><BankAccountsView /></ContentWrapper></motion.div>;
        case "fluxo-caixa":
            return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={TrendingUp} title="Fluxo" subtitle="Análise de caixa" onBack={handleGoBack} /><div className="h-[500px] overflow-hidden rounded-[32px]"><CashFlowScenarios /></div></motion.div>;
        case "cobrancas-historia":
            return <motion.div {...motionProps} className="space-y-6 px-6 py-6"><SectionHeader icon={WalletCards} title="Todas as cobranças" subtitle="Veja, filtre e crie cobranças" onBack={handleGoBack} /><InvoicesListPanel /></motion.div>;
        case "cobrancas-config":
            return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={Settings} title="Regras automáticas" subtitle="Como o sistema cobra por você" onBack={handleGoBack} /><ContentWrapper><CapabilityNotice icon={Settings} title="Cobrança no piloto automático" description="Aqui reuniremos regras simples para cobrar consultas, pacotes e assinaturas sem trabalho manual." /></ContentWrapper></motion.div>;
        case "cobrancas-simulador":
            return <motion.div {...motionProps} className="space-y-6 px-6 py-6"><SectionHeader icon={BadgeCent} title="Simulador de vendas" subtitle="Veja taxas e valor líquido antes de cobrar" onBack={handleGoBack} /><SalesSimulator /></motion.div>;
        case "cobrancas-chargebacks":
            return <motion.div {...motionProps} className="space-y-6 px-6 py-6"><SectionHeader icon={Activity} title="Chargebacks" subtitle="Contestações e reversões de pagamento" onBack={handleGoBack} /><ChargebacksPanel /></motion.div>;
        case "antecipacoes-lista":
            return <motion.div {...motionProps} className="space-y-6 px-6 py-6"><SectionHeader icon={Repeat} title="Minhas antecipações" subtitle="Acompanhe solicitações e créditos" onBack={handleGoBack} /><AnticipationsList /></motion.div>;
        case "antecipacoes":
        case "antecipacoes-solicitar":
            return <motion.div {...motionProps} className="space-y-6 px-6 py-6"><SectionHeader icon={TrendingUp} title="Antecipar recebimento" subtitle="Receba antes o que já está previsto" onBack={handleGoBack} /><AnticipationRequest /></motion.div>;
        case "antecipacoes-automatica":
            return <motion.div {...motionProps} className="space-y-6 px-6 py-6"><SectionHeader icon={Repeat} title="Antecipação automática" subtitle="Configure quando estiver disponível" onBack={handleGoBack} /><AutomaticAnticipation /></motion.div>;
        case "antecipacoes-simulador":
            return <motion.div {...motionProps} className="space-y-6 px-6 py-6"><SectionHeader icon={WalletCards} title="Simular antecipação" subtitle="Veja o valor antes de confirmar" onBack={() => setActiveView("antecipacoes-solicitar")} /><AnticipationRequest /></motion.div>;
        case "antecipacoes-historico":
            return <motion.div {...motionProps} className="space-y-6 px-6 py-6"><SectionHeader icon={Repeat} title="Histórico de antecipações" subtitle="O que já foi antecipado" onBack={() => setActiveView("antecipacoes-lista")} /><AnticipationsList /></motion.div>;
        case "fiscal-painel":
            return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={LayoutDashboard} title="NFS-e automática" subtitle="Emissão Asaas após pagamento" onBack={handleGoBack} /><ContentWrapper><FiscalConfigPanel /></ContentWrapper></motion.div>;
        case "fiscal-lista":
            return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={FileText} title="Minhas NFS-e" subtitle="Histórico fiscal" onBack={handleGoBack} /><ContentWrapper><InvoicesHistoryList /></ContentWrapper></motion.div>;
        case "repasses-profissional":
            return <motion.div {...motionProps} className="space-y-6 px-6 py-6"><SectionHeader icon={Users} title="Split & Repasses" subtitle="Destino bancário e regras de divisão" onBack={handleGoBack} /><ContentWrapper><BankAccountsView /></ContentWrapper><ContentWrapper><SmartSplit /></ContentWrapper></motion.div>;
        case "tarifas":
            return <motion.div {...motionProps} className="space-y-6 px-6 py-6"><SectionHeader icon={Receipt} title="Tarifas" subtitle="Custos e prazos, sem letras miúdas" onBack={handleGoBack} /><NeuroFinanceTariffs /></motion.div>;
        case "configuracoes":
            return <motion.div {...motionProps} className="px-6 py-6"><SectionHeader icon={Settings} title="Configurações" subtitle="Preferências do sistema" onBack={handleGoBack} /><ContentWrapper><div className="py-20 text-center"><Settings className="mx-auto mb-4 h-12 w-12 text-zinc-300" /><p className="text-xs font-black uppercase tracking-widest text-zinc-500">Configurações avançadas em desenvolvimento.</p></div></ContentWrapper></motion.div>;
        default:
            return null;
    }
}
