import { useMemo, useState } from "react";
import { format, isAfter, subMonths } from "date-fns";
import { ArrowLeft, Download, Plus, Receipt } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { FinancialManagementDashboard } from "@/components/financeiro/management/FinancialManagementDashboard";
import { NewInvoiceModal } from "@/components/financeiro/NewInvoiceModal";
import { NewTransactionModal } from "@/components/financeiro/NewTransactionModal";
import TransactionDetailView from "@/components/financeiro/TransactionDetailView";
import type { FinanceView } from "@/components/financeiro/FinancialDashboard";
import { Button } from "@/components/ui/button";
import { useTransactions } from "@/hooks/use-transactions";
import "@/styles/finance-management-mobile.css";
import type { Transaction } from "@/types";
import { MobilePageHeader, MobilePageScaffold } from "../../components/MobilePagePrimitives";

const routeToView: Record<string, FinanceView> = {
  "": "gestao-visao-geral",
  "visao-geral": "gestao-visao-geral",
  "fluxo-caixa": "gestao-fluxo-caixa",
  receitas: "gestao-receitas",
  despesas: "gestao-despesas",
  cobrancas: "gestao-cobrancas",
  inadimplencia: "gestao-inadimplencia",
  planejamento: "gestao-planejamento",
  relatorios: "gestao-relatorios",
};

const viewToRoute: Partial<Record<FinanceView, string>> = {
  "gestao-visao-geral": "/financeiro",
  "gestao-fluxo-caixa": "/financeiro/gestao/fluxo-caixa",
  "gestao-receitas": "/financeiro/gestao/receitas",
  "gestao-despesas": "/financeiro/gestao/despesas",
  "gestao-cobrancas": "/financeiro/gestao/cobrancas",
  "gestao-inadimplencia": "/financeiro/gestao/inadimplencia",
  "gestao-planejamento": "/financeiro/gestao/planejamento",
  "gestao-relatorios": "/financeiro/gestao/relatorios",
};

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function MobileFinancialManagementFlow() {
  const location = useLocation();
  const navigate = useNavigate();
  const route = location.pathname.replace(/^\/financeiro\/?/, "").replace(/^gestao\/?/, "").replace(/\/$/, "");
  const activeView = routeToView[route] || "gestao-visao-geral";
  const transactionQuery = useTransactions(subMonths(new Date(), 12));
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const allTransactions = transactionQuery.data || [];
  const realizedTransactions = useMemo(
    () => allTransactions.filter((item) => {
      const status = item.status;
      return !isAfter(new Date(item.date), new Date()) && (!status || status === "completed" || status === "paid");
    }),
    [allTransactions],
  );
  const futureTransactions = useMemo(
    () => allTransactions.filter((item) => isAfter(new Date(item.date), new Date()) || item.status === "pending" || item.status === "scheduled"),
    [allTransactions],
  );
  const subscriptionTransactions = useMemo(
    () => allTransactions.filter((item) => {
      const text = `${item.description || ""} ${item.category || ""}`.toLowerCase();
      return text.includes("assinatura") || text.includes("recorr");
    }),
    [allTransactions],
  );

  const setActiveView = (view: FinanceView) => {
    setSelectedTransaction(null);
    navigate(viewToRoute[view] || "/financeiro");
  };

  const exportForAccountant = () => {
    if (!allTransactions.length) {
      toast.info("Não existem movimentações para exportar.");
      return;
    }

    const headers = ["Data", "Tipo", "Descrição", "Categoria", "Status", "Valor", "Paciente", "Origem"];
    const lines = allTransactions
      .slice()
      .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime())
      .map((item) => [
        format(new Date(item.date), "dd/MM/yyyy"),
        item.type === "income" ? "Receita" : "Despesa",
        item.description || "",
        item.category || "",
        item.status || "",
        Number(item.amount || 0).toFixed(2).replace(".", ","),
        item.patient_name || item.patients?.name || "",
        item.origin || "manual",
      ].map(csvCell).join(";"));

    const content = `\uFEFF${headers.map(csvCell).join(";")}\n${lines.join("\n")}`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `neuronex-gestao-financeira-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast.success("Relatório financeiro exportado.");
  };

  return (
    <MobilePageScaffold contentClassName="pt-[5.75rem] px-3">
      <MobilePageHeader
        eyebrow="Controle do consultório"
        title="Gestão Financeira"
        description="Receitas, despesas, cobranças, inadimplência e planejamento sem depender de conta bancária."
        leading={activeView !== "gestao-visao-geral" || selectedTransaction ? (
          <Button variant="outline" size="icon" onClick={() => selectedTransaction ? setSelectedTransaction(null) : navigate("/financeiro")} className="h-11 w-11 rounded-2xl">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Voltar</span>
          </Button>
        ) : undefined}
        actions={(
          <div className="flex gap-2">
            {activeView === "gestao-relatorios" ? (
              <Button variant="outline" size="icon" onClick={exportForAccountant} className="h-11 w-11 rounded-2xl">
                <Download className="h-4 w-4" />
                <span className="sr-only">Exportar CSV</span>
              </Button>
            ) : (
              <NewInvoiceModal>
                <Button variant="outline" size="icon" className="h-11 w-11 rounded-2xl">
                  <Receipt className="h-4 w-4" />
                  <span className="sr-only">Nova cobrança</span>
                </Button>
              </NewInvoiceModal>
            )}
            <NewTransactionModal>
              <Button size="icon" className="h-11 w-11 rounded-2xl">
                <Plus className="h-4 w-4" />
                <span className="sr-only">Nova transação</span>
              </Button>
            </NewTransactionModal>
          </div>
        )}
      />

      <div className="management-mobile-flow -mx-3">
        {selectedTransaction ? (
          <div className="px-3 pb-8">
            <TransactionDetailView transaction={selectedTransaction} onBack={() => setSelectedTransaction(null)} />
          </div>
        ) : (
          <FinancialManagementDashboard
            activeView={activeView}
            setActiveView={setActiveView}
            allTransactions={allTransactions}
            realizedTransactions={realizedTransactions}
            futureTransactions={futureTransactions}
            subscriptionTransactions={subscriptionTransactions}
            isLoadingTransactions={transactionQuery.isLoading}
            setSelectedTransaction={setSelectedTransaction}
          />
        )}
      </div>
    </MobilePageScaffold>
  );
}
