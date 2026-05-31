"use client";

import { cn } from "@/lib/utils";
import { Shield, Zap, Crown, LucideIcon } from "lucide-react";
import { UpgradePlanModal } from "./UpgradePlanModal";

interface SubscriptionBadgeProps {
    plan: string;
    className?: string;
}

interface PlanConfig {
    label: string;
    icon: LucideIcon;
    styles: string;
}

export const SubscriptionBadge = ({ plan, className }: SubscriptionBadgeProps) => {
    const configs: Record<string, PlanConfig> = {
        'Essential': {
            label: "Essential",
            icon: Shield,
            styles: "bg-white/[0.04] text-zinc-400 border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12]",
        },
        'Professional': {
            label: "Professional",
            icon: Zap,
            styles: "bg-white/[0.06] text-zinc-300 border-white/[0.08] hover:bg-white/[0.10] hover:border-white/[0.14]",
        },
        'Enterprise': {
            label: "Enterprise",
            icon: Crown,
            styles: "bg-white/[0.08] text-zinc-200 border-white/[0.10] hover:bg-white/[0.12] hover:border-white/[0.16]",
        }
    };

    const config = configs[plan] || {
        label: "Essential",
        icon: Shield,
        styles: "bg-white/[0.03] text-zinc-500/80/80 border-white/[0.04] hover:bg-white/[0.06]",
    };

    const Icon = config.icon;

    return (
        <UpgradePlanModal currentPlan={plan}>
            <div className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-300 cursor-pointer active:scale-95 group shadow-sm",
                config.styles,
                className
            )}>
                <Icon className="w-3 h-3 group-hover:scale-110 transition-transform duration-500" />
                {config.label}
                <div className="ml-1 w-1 h-1 rounded-full bg-current opacity-20" />
            </div>
        </UpgradePlanModal>
    );
};