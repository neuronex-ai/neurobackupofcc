import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FeatureKey, FEATURE_NAMES, FEATURE_UPSELL_PLANS } from "@/types/subscription";
import { motion } from "framer-motion";
import {
    BarChart3, Brain, Crown, DollarSign, Key, Lock,
    Sparkles, Users, Video, Zap
} from "lucide-react";
import { useState } from "react";
import { UpsellModal } from "./UpsellModal";

interface LockedFeatureScreenProps {
    feature: FeatureKey;
    title?: string;
    description?: string;
    className?: string;
}

const FEATURE_ICONS: Record<FeatureKey, React.ElementType> = {
    ai_copilot: Brain,
    telemedicine: Video,
    advanced_finance: DollarSign,
    patient_portal: Users,
    unlimited_patients: Users,
    multiple_professionals: Users,
    admin_dashboard: BarChart3,
    performance_reports: BarChart3,
    api_access: Key,
};

export const LockedFeatureScreen = ({
    feature,
    title,
    description,
    className
}: LockedFeatureScreenProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const featureName = title || FEATURE_NAMES[feature];
    const requiredPlan = FEATURE_UPSELL_PLANS[feature];
    const FeatureIcon = FEATURE_ICONS[feature];

    const defaultDescription = `Realize ${featureName.toLowerCase()} com qualidade profissional, integração total com o prontuário e ferramentas avançadas. Disponível a partir do plano ${requiredPlan}.`;

    return (
        <>
            <div className={cn(
                "min-h-[calc(100vh-80px)] flex items-center justify-center relative overflow-hidden",
                className
            )}>
                {/* Ambient radial glow */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="relative z-10 max-w-lg text-center px-6 flex flex-col items-center"
                >
                    {/* Icon Container — Clean monochrome glass */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 180, damping: 20 }}
                        className="w-20 h-20 mb-10 rounded-[22px] bg-white/[0.04] border border-white/[0.08] flex items-center justify-center relative shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]"
                    >
                        <FeatureIcon className="w-8 h-8 text-white/80" />
                        {/* Lock badge */}
                        <div className="absolute -bottom-2.5 -right-2.5 w-8 h-8 rounded-xl bg-zinc-950 border border-white/10 flex items-center justify-center shadow-lg">
                            <Lock className="w-3.5 h-3.5 text-white/50" />
                        </div>
                    </motion.div>

                    {/* Title + Description */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="space-y-4 mb-8"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                            {featureName}
                        </h2>
                        <p className="text-white/40 leading-relaxed max-w-md mx-auto text-sm sm:text-base">
                            {description || defaultDescription}
                        </p>
                    </motion.div>

                    {/* Plan badge — monochrome */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/[0.04] border border-white/[0.08] mb-10"
                    >
                        {requiredPlan === 'Enterprise' ? (
                            <Crown className="w-4 h-4 text-white/70" />
                        ) : (
                            <Zap className="w-4 h-4 text-white/70" />
                        )}
                        <span className="text-[11px] font-bold text-white/80 uppercase tracking-[0.15em]">
                            Disponível no plano {requiredPlan}
                        </span>
                    </motion.div>

                    {/* CTA Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="h-14 px-10 rounded-2xl font-bold uppercase text-[11px] tracking-[0.2em] transition-all duration-300 bg-white text-black hover:bg-zinc-200 shadow-[0_0_40px_-10px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.25)] hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Sparkles className="w-4 h-4 mr-3" />
                            Desbloquear Agora
                        </Button>
                    </motion.div>
                </motion.div>
            </div>

            <UpsellModal
                feature={feature}
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
            />
        </>
    );
};
