import { GlassCard } from "@/components/ui/GlassCard";
import { InviteActionWidget } from "./InviteActionWidget";
import { ExpandClinicWidget } from "./ExpandClinicWidget";


export const DashboardHeaderWidget = () => {
    return (
        <GlassCard 
            className="w-full h-full rounded-[32px] md:rounded-[40px] border-zinc-200 dark:border-white/[0.06]" 
            innerClassName="p-0 h-full" 
            delay={120}
        >
            <div className="grid grid-cols-1 lg:grid-cols-9 h-full items-stretch divide-y lg:divide-y-0 lg:divide-x divide-zinc-100 dark:divide-white/[0.04]">

                {/* 1. Integrations List (Left) */}
                <div className="lg:col-span-3 h-full relative">
                    <InviteActionWidget />
                </div>

                {/* 2. Expand Clinic (Center/Right) */}
                <div className="lg:col-span-6 h-full relative p-0 flex flex-col justify-center min-h-[240px] md:min-h-0">
                    <ExpandClinicWidget />
                </div>
            </div>
        </GlassCard>
    );
};