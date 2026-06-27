"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Landmark, WalletCards, ArrowRight, Lock, Rocket, PiggyBank, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useDashboardManagerialMetrics } from "@/hooks/use-dashboard-managerial-metrics";
import { useNeurofinanceSnapshot } from "@/hooks/use-neurofinance-snapshot";
import { useCurrentSubscription } from "@/hooks/use-current-subscription";
import { useFinancialAccount } from "@/hooks/use-financial-account";

const formatCurrency = (val: number) => 
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

const PulseMetric = ({ label, value, color = "default" }: { label: string; value: string; color?: "default" | "success" | "warning" | "danger" }) => (
  <div className="rounded-[22px] border border-zinc-200/70 bg-zinc-50/70 p-4 text-center dark:border-white/10 dark:bg-white/[0.035]">
    <p className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-400 dark:text-white/32">{label}</p>
    <p className={cn(
      "mt-3 text-lg font-black tracking-[-0.04em] tabular-nums lg:text-xl",
      color === "success" && "text-emerald-600 dark:text-emerald-400",
      color === "warning" && "text-amber-600 dark:text-amber-400",
      color === "danger" && "text-rose-600 dark:text-rose-400",
      color === "default" && "text-zinc-950 dark:text-white"
    )}>{value}</p>
  </div>
);

export const FinancialPulsePanel = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"managerial" | "neuro">("managerial");
  
  const { data: managerial, isLoading: loadingManagerial } = useDashboardManagerialMetrics();
  const { data: neuroSnapshot } = useNeurofinanceSnapshot();
  const { data: subscription } = useCurrentSubscription();
  const { isConnected: nfConnected, isLoading: nfLoading } = useFinancialAccount();

  // Lógica de acesso NeuroFinance:
  // 1. Deve ser plano Professional ou Enterprise
  // 2. O estado de acesso deve ser "paid_access" ou "admin_override" (Não pode ser Trial)
  const hasPlanAccess = (subscription?.plan_code === "professional" || subscription?.plan_code === "enterprise" || subscription?.admin_override);
  const isPaidUser = subscription?.effective_access_state === "paid_access" || subscription?.admin_override;
  const canAccessNeuroFinance = hasPlanAccess && isPaidUser;

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[34px] border border-border/70 bg-card/88 shadow-xl dark:border-white/[0.065] dark:bg-card/92"
    >
      <div className="p-7 md:p-8">
        <div className="flex flex-col gap-6">
          {/* Liquid Glass Toggle */}
          <div className="flex justify-center">
            <div className="relative flex w-full max-w-[320px] items-center rounded-full border border-zinc-200/50 bg-zinc-100/50 p-1.5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
              <motion.div
                className="absolute inset-y-1.5 rounded-full bg-white shadow-sm dark:bg-white/10"
                initial={false}
                animate={{ 
                  x: mode === "managerial" ? 0 : "100%",
                  width: "calc(50% - 6px)"
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              <button
                onClick={() => setMode("managerial")}
                className={cn(
                  "relative z-10 w-1/2 py-2 text-[10px] font-black uppercase tracking-[0.15em] transition-colors",
                  mode === "managerial" ? "text-zinc-950 dark:text-white" : "text-zinc-400 dark:text-white/30"
                )}
              >
                Gestão Financeira
              </button>
              <button
                onClick={() => setMode("neuro")}
                className={cn(
                  "relative z-10 w-1/2 py-2 text-[10px] font-black uppercase tracking-[0.15em] transition-colors",
                  mode === "neuro" ? "text-zinc-950 dark:text-white" : "text-zinc-400 dark:text-white/30"
                )}
              >
                NeuroFinance
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {mode === "managerial" ? (
                <motion.div
                  key="managerial"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-black uppercase tracking-[0.28em] text-zinc-400 dark:text-white/32">Fluxo Gerencial</p>
                      <h2 className="text-2xl font-black tracking-[-0.045em] text-zinc-950 dark:text-white">Pulso de Caixa</h2>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/5">
                      <Landmark className="h-5 w-5 text-zinc-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <PulseMetric label="Resultado" value={formatCurrency(managerial?.result || 0)} color={managerial?.result && managerial.result >= 0 ? "success" : "danger"} />
                    <PulseMetric label="Receitas" value={formatCurrency(managerial?.income || 0)} color="success" />
                    <PulseMetric label="Despesas" value={formatCurrency(managerial?.expense || 0)} color="danger" />
                    <PulseMetric label="A receber" value={formatCurrency(managerial?.receivable || 0)} color="warning" />
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      onClick={() => navigate("/financeiro", { state: { view: "gestao-fluxo-caixa" } })} 
                      className="h-12 flex-1 rounded-2xl bg-zinc-950 text-[9px] font-black uppercase tracking-[0.16em] text-white dark:bg-white dark:text-zinc-950"
                    >
                      Ver fluxo de caixa <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate("/financeiro", { state: { view: "gestao-inadimplencia" } })} 
                      className="h-12 flex-1 rounded-2xl border-zinc-200 bg-white/70 text-[9px] font-black uppercase tracking-[0.16em] dark:border-white/10 dark:bg-white/[0.04]"
                    >
                      Cobrar
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="neuro"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  {!canAccessNeuroFinance ? (
                    <div className="flex flex-col items-center justify-center gap-6 rounded-[30px] border border-dashed border-indigo-500/30 bg-indigo-50/50 p-8 text-center dark:bg-indigo-500/5">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                        <Lock className="h-6 w-6" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-black tracking-tight text-zinc-950 dark:text-white">Recurso Exclusivo</h3>
                        <p className="max-w-xs text-sm font-medium text-zinc-500 dark:text-white/50">
                          O NeuroFinance está disponível apenas para assinantes pagantes dos planos Profissional e Enterprise.
                        </p>
                      </div>
                      <Button onClick={() => navigate("/ajustes?tab=assinatura")} className="h-12 w-full rounded-2xl bg-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-indigo-700">
                        Fazer upgrade <Rocket className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  ) : !nfConnected ? (
                    <div className="flex flex-col items-center justify-center gap-6 rounded-[30px] border border-dashed border-amber-500/30 bg-amber-50/50 p-8 text-center dark:bg-amber-500/5">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
                        <WalletCards className="h-6 w-6" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-black tracking-tight text-zinc-950 dark:text-white">Ative sua Conta</h3>
                        <p className="max-w-xs text-sm font-medium text-zinc-500 dark:text-white/50">
                          Sua assinatura permite o uso do NeuroFinance. Ative sua conta bancária agora para automatizar cobranças.
                        </p>
                      </div>
                      <Button 
                        onClick={() => navigate("/financeiro", { state: { view: "conta-digital" } })} 
                        className="h-12 w-full rounded-2xl bg-amber-600 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-amber-700"
                      >
                        Ativar NeuroFinance <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1.5">
                          <p className="text-[9px] font-black uppercase tracking-[0.28em] text-zinc-400 dark:text-white/32">Saldo em Tempo Real</p>
                          <h2 className="text-2xl font-black tracking-[-0.045em] text-zinc-950 dark:text-white">Balanço Bancário</h2>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/5">
                          <PiggyBank className="h-5 w-5 text-zinc-400" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <PulseMetric label="Saldo" value={formatCurrency((neuroSnapshot?.available_balance || 0) / 100)} color="success" />
                        <PulseMetric label="Entrou" value={formatCurrency((neuroSnapshot?.gross_received || 0) / 100)} color="success" />
                        <PulseMetric label="Saiu" value={formatCurrency((neuroSnapshot?.total_outflow || 0) / 100)} color="danger" />
                        <PulseMetric label="Vai cair" value={formatCurrency((neuroSnapshot?.pending_receivables || 0) / 100)} color="warning" />
                      </div>

                      <div className="flex gap-3">
                        <Button 
                          onClick={() => navigate("/financeiro", { state: { view: "transferencias" } })} 
                          className="h-12 flex-1 rounded-2xl bg-zinc-950 text-[9px] font-black uppercase tracking-[0.16em] text-white dark:bg-white dark:text-zinc-950"
                        >
                          Sacar <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => navigate("/financeiro", { state: { view: "conta-digital", action: "new-charge" } })} 
                          className="h-12 flex-1 rounded-2xl border-zinc-200 bg-white/70 text-[9px] font-black uppercase tracking-[0.16em] dark:border-white/10 dark:bg-white/[0.04]"
                        >
                          <PlusCircle className="mr-2 h-3.5 w-3.5" /> Cobrar Paciente
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.section>
  );
};