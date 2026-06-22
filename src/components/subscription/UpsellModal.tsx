import { motion } from "framer-motion";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    FeatureKey,
    FEATURE_NAMES,
    FEATURE_UPSELL_PLANS,
    PLAN_FEATURES
} from "@/types/subscription";
import { PLAN_PRICE_LABELS } from "@/lib/subscription-plans";
import {
    Sparkles,
    Zap,
    Crown,
    ChevronRight,
    Check,
    Lock,
    Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UpsellModalProps {
    feature: FeatureKey;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const PLAN_ICONS = {
    Essential: Sparkles,
    Professional: Zap,
    Enterprise: Crown,
};

const PLAN_PRICES = {
    Essential: 'Gratuito',
    Professional: PLAN_PRICE_LABELS.Professional,
    Enterprise: PLAN_PRICE_LABELS.Enterprise,
};

const PLAN_DESCRIPTIONS = {
    Essential: 'Ideal para quem está começando',
    Professional: 'Para consultórios em crescimento',
    Enterprise: 'Gestão completa para clínicas',
};

export const UpsellModal = ({ feature, open, onOpenChange }: UpsellModalProps) => {
    const requiredPlan = FEATURE_UPSELL_PLANS[feature];
    const featureName = FEATURE_NAMES[feature];
    const Icon = PLAN_ICONS[requiredPlan];
    const [isLoading, setIsLoading] = useState(false);

    const handleUpgrade = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                body: { planId: requiredPlan },
            });
            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            } else {
                toast.error("Erro ao criar sessão de pagamento.");
            }
        } catch (err: any) {
            console.error("Checkout error:", err);
            toast.error("Erro ao iniciar checkout. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    const planFeatures = PLAN_FEATURES[requiredPlan];

    const enabledFeatures = Object.entries(FEATURE_NAMES)
        .filter(([key]) => {
            const featureKey = key as FeatureKey;
            if (featureKey === 'unlimited_patients') {
                return planFeatures.maxPatients === 'unlimited';
            }
            const planFeatureKey = `has${featureKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}` as keyof typeof planFeatures;
            return planFeatures[planFeatureKey] === true;
        })
        .map(([, name]) => name);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="z-[9999] sm:max-w-[520px] p-0 bg-zinc-950/90 backdrop-blur-[80px] border border-white/[0.08] overflow-hidden rounded-[28px] shadow-2xl shadow-black/80">
                {/* Ambient glow */}
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/[0.03] blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />

                <div className="relative">
                    {/* Header */}
                    <div className="p-8 pb-6 border-b border-white/[0.05]">
                        <div className="flex items-start gap-4">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-12 h-12 rounded-2xl bg-white/[0.06] flex items-center justify-center border border-white/[0.08] shrink-0"
                            >
                                <Lock className="w-5 h-5 text-white/60" />
                            </motion.div>
                            <div className="space-y-1.5">
                                <DialogTitle className="text-lg font-bold text-white tracking-tight">
                                    Funcionalidade Premium
                                </DialogTitle>
                                <DialogDescription className="text-white/40 text-sm leading-relaxed">
                                    <span className="font-semibold text-white">{featureName}</span> está disponível a partir do plano{' '}
                                    <span className="font-semibold text-white">{requiredPlan}</span>.
                                </DialogDescription>
                            </div>
                        </div>
                    </div>

                    {/* Plan Card */}
                    <div className="p-6 sm:p-8">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 relative overflow-hidden"
                        >
                            {/* Recommended badge — monochrome */}
                            {requiredPlan === 'Professional' && (
                                <div className="absolute top-0 right-0 px-4 py-1.5 bg-white text-black text-[9px] font-black uppercase tracking-[0.15em] rounded-bl-2xl">
                                    Recomendado
                                </div>
                            )}

                            {/* Plan info row */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                                    <Icon className="w-5 h-5 text-white/80" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg tracking-tight">{requiredPlan}</h3>
                                    <p className="text-[11px] text-white/40 font-medium">{PLAN_DESCRIPTIONS[requiredPlan]}</p>
                                </div>
                                <div className="ml-auto text-right">
                                    <p className="text-xl font-bold text-white">{PLAN_PRICES[requiredPlan].split('/')[0]}</p>
                                    <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold">
                                        {PLAN_PRICES[requiredPlan].includes('/') ? '/mês' : ''}
                                    </p>
                                </div>
                            </div>

                            {/* Features list — monochrome checks */}
                            <div className="space-y-3 mb-6">
                                {enabledFeatures.slice(0, 5).map((fname, i) => (
                                    <motion.div
                                        key={fname}
                                        initial={{ x: -10, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 + i * 0.05 }}
                                        className="flex items-center gap-3 text-sm"
                                    >
                                        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                        </div>
                                        <span className="text-white/70 font-medium">{fname}</span>
                                    </motion.div>
                                ))}
                                {enabledFeatures.length > 5 && (
                                    <p className="text-xs text-white/30 pl-8">
                                        + {enabledFeatures.length - 5} recursos adicionais
                                    </p>
                                )}
                            </div>

                            {/* CTA Button */}
                            <Button
                                onClick={handleUpgrade}
                                disabled={isLoading}
                                className="w-full h-14 rounded-2xl font-bold uppercase text-[11px] tracking-[0.2em] transition-all duration-300 bg-white text-black hover:bg-zinc-200 shadow-[0_0_30px_-8px_rgba(255,255,255,0.1)] disabled:opacity-60"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        Fazer Upgrade Agora
                                        <ChevronRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </motion.div>

                        {/* Secondary action */}
                        <div className="mt-4 text-center">
                            <Button
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                className="text-[11px] text-white/30 hover:text-white hover:bg-white/5 uppercase tracking-widest"
                            >
                                Continuar no plano atual
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
