import { NeuroNexCard } from "@/components/financeiro/NeuroNexCard";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-profile";
import { useFinancialAccount } from "@/hooks/use-financial-account";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Building2, ShieldCheck, Zap } from "lucide-react";
import React, { useState } from "react";
import { CustomOnboardingFlow } from "@/components/financeiro/CustomOnboardingFlow";
interface NeuroNexPayWizardProps {

    onSuccess?: () => void;
    onSkipDocuments?: () => void;
    isMobile?: boolean;
}

// ─── NEUROFINANCE ONBOARDING ─────────────────────────────────────
// NeuroFinance onboarding wizard — premium financial experience.
// ─────────────────────────────────────────────────────────────────

export const NeuroNexPayWizard = ({ onSkipDocuments, onSuccess, isMobile = false }: NeuroNexPayWizardProps) => {
    const { data: profile } = useProfile();
    const [showWizard, setShowWizard] = useState(false);

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className={cn(
                "items-center h-full animate-fade-in",
                isMobile ? "flex flex-col gap-8 px-1" : "grid grid-cols-1 lg:grid-cols-2 gap-12"
            )}
        >
            {/* Card Preview */}
            <div className="flex flex-col items-center justify-center relative py-8 lg:py-0">
                <div className="absolute inset-0 blur-[120px] rounded-full pointer-events-none opacity-20 bg-zinc-500/10" />
                <motion.div whileHover={{ scale: 1.05, rotateY: 5 }}
                    className={cn("relative z-10", isMobile ? "w-full max-w-[260px]" : "w-full max-w-[280px] sm:max-w-sm")}
                >
                    <NeuroNexCard
                        name={profile ? `${profile.first_name} ${profile.last_name}` : "MEMBRO NEURONEX"}
                        showSensitive={false}
                        className="shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]"
                    />
                </motion.div>
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                {!showWizard ? (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-10 max-w-md mx-auto lg:mx-0 text-center lg:text-left"
                    >
                        <div className="space-y-3">
                            <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                                <div className="px-3 py-1.5 bg-zinc-100 dark:bg-white/10 rounded-full border border-zinc-200 dark:border-white/10 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-white flex items-center gap-2">
                                    <Zap className="w-3 h-3" />
                                    Em Migração
                                </div>
                            </div>

                            <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                                Ative seu ecossistema financeiro premium e receba seus honorários com agilidade.
                                Toda a gestão de pagamentos via PIX, Boleto e Cartão em um só lugar.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {[
                                { icon: Building2, label: 'Conta Financeira NeuroFinance', description: 'Gestão financeira integrada e simplificada' },
                                { icon: ShieldCheck, label: 'PIX, Boleto e Checkout', description: 'Recebimentos automáticos integrados' },
                            ].map((item, i) => (
                                <div key={i} className="group p-5 rounded-[24px] bg-white/60 dark:bg-white/[0.015] border border-zinc-200/50 dark:border-white/[0.04] hover:border-zinc-300 dark:hover:border-white/[0.08] transition-all flex items-center gap-4">
                                    <div className="p-3 bg-zinc-100 dark:bg-white/5 rounded-full text-zinc-900 dark:text-white shrink-0 group-hover:bg-zinc-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all duration-300">
                                        <item.icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{item.label}</h4>
                                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium mt-0.5">{item.description}</p>
                                    </div>
                                    <div className="px-2.5 py-1 bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 text-[8px] font-black uppercase tracking-wider rounded-full border border-zinc-200 dark:border-white/10">
                                        Em breve
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={() => setShowWizard(true)}
                                className="w-full h-14 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl hover:scale-[1.02] transition-all"
                            >
                                Criar Conta NeuroFinance
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>

                            {onSkipDocuments && (
                                <Button
                                    onClick={onSkipDocuments}
                                    variant="outline"
                                    className="w-full h-14 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                                >
                                    Prosseguir para o Painel
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            )}
                        </div>

                        <div className="flex items-center justify-center gap-2">
                            <div className="h-px w-6 bg-zinc-200 dark:bg-zinc-800" />
                            <p className="text-[9px] text-zinc-400 dark:text-zinc-600 uppercase tracking-widest font-bold">Segurança Bancária Nível Institucional</p>
                            <div className="h-px w-6 bg-zinc-200 dark:bg-zinc-800" />
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="wizard"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="w-full relative z-20 flex pt-4 lg:pt-0"
                    >
                        <CustomOnboardingFlow
                            onCancel={() => setShowWizard(false)}
                            onComplete={() => {
                                setShowWizard(false);
                                if (onSuccess) onSuccess();
                            }}
                        />
                    </motion.div>

                )}
            </AnimatePresence>
        </motion.div>
    );
};
