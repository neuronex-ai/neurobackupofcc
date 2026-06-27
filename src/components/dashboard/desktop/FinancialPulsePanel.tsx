"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Landmark, WalletCards, ArrowRight, Lock, Rocket, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useDashboardManagerialMetrics } from "@/hooks/use-dashboard-managerial-metrics";
import { useNeurofinanceSnapshot } from "@/hooks/use-neurofinance-snapshot";
import { useCurrentSubscription } from "@/hooks/use-current-subscription";
import { useFinancialAccount } from "@/hooks/use-financial-account";
import { SYNAPSE_PAGE_ACTION_EVENT } from "@/lib/synapse-interface-actions";

const formatCurrency = (val: number) => 
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

const PulseMetric = ({ label, value, color = "default" }: { label: string; value: string; color?: "default" | "success" | "warning" | "danger" }) => (
  <div className="rounded-[22px] border border-zinc-200/70 bg-zinc-50/70 p-4 text-center dark:border-white/10 dark:bg-white/[0.035]">
    <p className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-400 dark:text-white/32">{label}</p>
    <p className={cn(
      "mt-3 text-xl font-black tracking-[-0.04em] tabular-nums",
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
  
  const { data: managerial, isLoading: mgLoading } = useDashboardManagerialMetrics();
  const { data: neuroSnapshot, isLoading: snLoading } = useNeurofinanceSnapshot();
  const { data: subscription } = useCurrentSubscription();
  const { isConnected: nfConnected, isLoading: nfLoading } = useFinancialAccount();

  // Lógica de Permissões:
  // - Psicólogo que está no plano Essencial ou Teste Grátis: Não tem acesso.
  // - Psicólogo PAGOU pelo Pro ou Enterprise (access_state === 'paid_access'): Tem acesso real.
  const hasNFPlanAccess = (
    subscription?.plan_code === "professional" || 
    subscription?.plan_code === "enterprise"
  ) && (
    subscription?.access_state === 'paid_access' || 
    subscription?.admin_override
  );

  const handleChargePatient = () => {
    // Dispara o evento que o DesktopFinanceiro escuta para abrir o modal de nova transação
    // Ou simplesmente redireciona para a tela de conta digital com intenção de cobrar
    window.dispatchEvent(new CustomEvent(SYNAPSE_PAGE_ACTION_EVENT, {
      detail: { action: "open_modal", modal: "new_transaction" }
    }));
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[34px] border border-border/70 bg-card/88 shadow-[0_28px_92px_-72px_rgba(24,24,27,0.58)] dark:border-white/[0.065] dark:bg-card/92"
    >
      <div className="p-7 md:p-8">
        <div className="flex flex-col gap-8">
          {/* Liquid Glass Toggle */}
          <div className="flex justify-center">
            <div className="relative flex w-full max-w-[340px] items-center rounded-full border border-zinc-200/50 bg-zinc-100/50 p-1.5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
              <motion.div
                className="absolute inset-y-1.5 rounded-full bg-white shadow-sm dark:bg-white/10"
                initial={false}
                animate={{ 
                  x: mode === "managerial" ? 0 : "100%",
                  width: "calc(50% - 6px)"
                }}
                transition={{ type: "spring", stiffness: 300, damping: 32 }}
              />
              <button
                onClick={() => setMode("managerial")}
                className={cn(
                  "relative z-10 w-1/2 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                  mode === "managerial" ? "text-zinc-950 dark:text-white" : "text-zinc-400 dark:text-white/25 hover:text-zinc-600"
                )}
              >
                Gestão Gerencial
              </button>
              <button
                onClick={() => setMode("neuro")}
                className={cn(
                  "relative z-10 w-1/2 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                  mode === "neuro" ? "text-zinc-950 dark:text-white" : "text-zinc-400 dark:text-white/25 hover:text-zinc-600"
                )}
              >
                NeuroFinance
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {mode === "managerial" ? (
              <motion.div
                key="managerial"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="space-y-1.5">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 dark:text-white/30">Fluxo Interno</p>
                  <h2 className="text-2xl font-black tracking-[-0.05em] text-zinc-950 dark:text-white">Pulso de Caixa</h2>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <PulseMetric label="Resultado" value={mgLoading ? "..." : formatCurrency(managerial?.result || 0)} color={managerial?.result && managerial.result >= 0 ? "success" : "danger"} />
                  <PulseMetric label="Receitas" value={mgLoading ? "..." : formatCurrency(managerial?.income || 0)} color="success" />
                  <PulseMetric label="Despesas" value={mgLoading ? "..." : formatCurrency(managerial?.expense || 0)} color="danger" />
                  <PulseMetric label="A receber" value={mgLoading ? "..." : formatCurrency(managerial?.receivable || 0)} color="warning" />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={() => navigate("/financeiro?view=gestao-fluxo-caixa")} 
                    className="h-12 min-w-[180px] flex-1 rounded-2xl bg-zinc-950 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-black dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                  >
                    Ver fluxo de caixa <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/financeiro?view=gestao-inadimplencia")} 
                    className="h-12 min-w-[140px] flex-1 rounded-2xl border-zinc-200 bg-white/70 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70"
                  >
                    Cobrar
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="neuro"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="min-h-[220px]"
              >
                {!hasNFPlanAccess ? (
                  <div className="flex flex-col items-center justify-center gap-6 rounded-[34px] border border-dashed border-indigo-500/25 bg-indigo-50/50 p-10 text-center dark:border-indigo-500/15 dark:bg-indigo-500/5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-indigo-600 text-white shadow-[0_20px_50px_-12px_rgba(79,70,229,0.5)]">
                      <Lock className="h-7 w-7" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-black tracking-[-0.03em] text-zinc-950 dark:text-white">Recurso do Plano Profissional</h3>
                      <p className="max-w-xs text-sm font-medium leading-relaxed text-zinc-500 dark:text-white/40">
                        Automatize seu consultório com recebimentos via Pix e Cartão direto no prontuário.
                      </p>
                    </div>
                    <Button onClick={() => navigate("/ajustes?tab=assinatura")} className="h-12 w-full max-w-[240px] rounded-2xl bg-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-indigo-700">
                      Liberar NeuroFinance <Rocket className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ) : !nfConnected ? (
                  <div className="flex flex-col items-center justify-center gap-6 rounded-[34px] border border-dashed border-amber-500/25 bg-amber-50/50 p-10 text-center dark:border-amber-500/15 dark:bg-amber-300/5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-amber-500 text-white shadow-[0_20px_50px_-12px_rgba(245,158,11,0.4)]">
                      <CreditCard className="h-7 w-7" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-black tracking-[-0.03em] text-zinc-950 dark:text-white">Ative sua Conta Digital</h3>
                      <p className="max-w-xs text-sm font-medium leading-relaxed text-zinc-500 dark:text-white/40">
                        Você já tem acesso ao recurso! Agora falta apenas ativar sua conta NeuroFinance para começar a receber.
                      </p>
                    </div>
                    <Button onClick={() => navigate("/financeiro?view=conta-digital")} className="h-12 w-full max-w-[240px] rounded-2xl bg-amber-600 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-amber-700">
                      Ativar conta agora <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 dark:text-white/30">Saldo Bancário</p>
                      <h2 className="text-2xl font-black tracking-[-0.05em] text-zinc-950 dark:text-white">Balanço Disponível</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <PulseMetric label="Saldo" value={snLoading ? "..." : formatCurrency((neuroSnapshot?.available_balance || 0) / 100)} color="success" />
                      <PulseMetric label="Entrou" value={snLoading ? "..." : formatCurrency((neuroSnapshot?.gross_received || 0) / 100)} color="success" />
                      <PulseMetric label="Saiu" value={snLoading ? "..." : formatCurrency((neuroSnapshot?.total_outflow || 0) / 100)} color="danger" />
                      <PulseMetric label="Vai cair" value={snLoading ? "..." : formatCurrency((neuroSnapshot?.pending_receivables || 0) / 100)} color="warning" />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button 
                        onClick={() => navigate("/financeiro?view=transferencias")} 
                        className="h-12 min-w-[180px] flex-1 rounded-2xl bg-zinc-950 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-black dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                      >
                        Sacar <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => navigate("/financeiro?view=conta-digital&action=charge")} 
                        className="h-12 min-w-[140px] flex-1 rounded-2xl border-zinc-200 bg-white/70 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70"
                      >
                        Cobrar paciente
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );
};