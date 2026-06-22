import type { SubscriptionPlan } from "@/types/subscription";

export const PROFESSIONAL_TRIAL_DAYS = 7;
export const PROFESSIONAL_PLAN_PRICE_CENTS = 14000;
export const PROFESSIONAL_PLAN_PRICE = "R$ 140,00";
export const PROFESSIONAL_PLAN_PERIOD = "/mês";
export const PROFESSIONAL_PLAN_PRICE_LABEL = `${PROFESSIONAL_PLAN_PRICE}${PROFESSIONAL_PLAN_PERIOD}`;

export const PLAN_PRICE_LABELS: Record<SubscriptionPlan, string> = {
  Essential: "Gratuito",
  Professional: PROFESSIONAL_PLAN_PRICE_LABEL,
  Enterprise: "Sob consulta",
};
