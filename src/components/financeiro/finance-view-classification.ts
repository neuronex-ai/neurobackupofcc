import type { FinanceView } from "./FinancialDashboard";

export const MANAGEMENT_FINANCE_VIEWS: FinanceView[] = [
  "gestao-visao-geral",
  "gestao-fluxo-caixa",
  "gestao-receitas",
  "gestao-despesas",
  "gestao-cobrancas",
  "gestao-inadimplencia",
  "gestao-planejamento",
  "gestao-relatorios",
];

export const LEGACY_MANAGEMENT_VIEW_REDIRECTS: Partial<Record<FinanceView, FinanceView>> = {
  "fluxo-caixa": "gestao-fluxo-caixa",
  receitas: "gestao-receitas",
  despesas: "gestao-despesas",
};

export const isManagementFinanceView = (view: FinanceView) => MANAGEMENT_FINANCE_VIEWS.includes(view);

export const isNeuroFinanceView = (view: FinanceView) => !isManagementFinanceView(view) && !LEGACY_MANAGEMENT_VIEW_REDIRECTS[view];
