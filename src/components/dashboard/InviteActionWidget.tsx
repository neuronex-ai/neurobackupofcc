import { useNavigate } from "react-router-dom";
import { Sparkles, CreditCard, Calendar, CheckCircle2, ArrowRight, RotateCcw } from "lucide-react";
import { useTour } from "@/components/onboarding/TourContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const InviteActionWidget = () => {
    const navigate = useNavigate();
    const { startTour, isTourCompleted, resetTourCompleted } = useTour();

    const handleTourClick = () => {
        if (isTourCompleted) {
            // Reset and restart tour
            resetTourCompleted();
            toast.info("Reiniciando tour...");
            setTimeout(() => startTour(), 300);
        } else {
            toast.success("Iniciando tour guiado...");
            startTour();
        }
    };

    const shortcuts = [
        {
            id: 'tour',
            title: isTourCompleted ? 'Tour Finalizado' : 'Iniciar Tour',
            subtitle: isTourCompleted ? 'Concluído ✓' : 'Conheça o NeuroNex',
            icon: isTourCompleted ? CheckCircle2 : Sparkles,
            action: handleTourClick,
            status: isTourCompleted ? 'success' : 'pending'
        },
        {
            id: 'payments',
            title: 'Pagamentos',
            subtitle: 'Recebimentos',
            icon: CreditCard,
            action: () => navigate('/financeiro'),
            status: 'neutral'
        },
        {
            id: 'integrations',
            title: 'Google Workspace',
            subtitle: 'Workspace',
            icon: Calendar,
            action: () => navigate('/ajustes?tab=integrations'),
            status: 'neutral'
        }
    ];

    return (
        <div className="flex flex-col h-full p-5 lg:p-6 relative overflow-hidden transition-colors duration-500">
            {/* Header */}
            <div className="flex items-center justify-center mb-5 relative z-10">
                <div className="px-3 py-1 rounded-xl border border-black/[0.04] dark:border-white/[0.06] bg-zinc-50/60 dark:bg-white/[0.03]">
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500/80/80 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-500" />
                        Ações Rápidas
                    </span>
                </div>
            </div>

            {/* Cards List */}
            <div className="flex-1 space-y-2 relative z-10">
                {shortcuts.map((item) => (
                    <button
                        key={item.id}
                        onClick={item.action}
                        className={cn(
                            "w-full group relative overflow-hidden rounded-[14px] transition-all duration-300 ease-apple hover:scale-[1.01] active:scale-[0.98] border",
                            item.status === 'success'
                                ? "border-emerald-200/60 dark:border-emerald-500/10 hover:border-emerald-300/80 dark:hover:border-emerald-500/20"
                                : "border-zinc-200/60 dark:border-white/[0.04] hover:border-zinc-300/60 dark:hover:border-white/[0.08]"
                        )}
                    >
                        <div className={cn(
                            "relative p-3.5 rounded-[14px] flex items-center justify-between transition-colors duration-300",
                            item.status === 'success'
                                ? "bg-emerald-50/50 dark:bg-emerald-500/[0.03] hover:bg-emerald-100/50 dark:hover:bg-emerald-500/[0.06]"
                                : "bg-zinc-50/50 dark:bg-white/[0.02] hover:bg-zinc-100/80 dark:hover:bg-white/[0.04]"
                        )}>
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all ease-apple group-hover:scale-105",
                                    item.status === 'success'
                                        ? "bg-emerald-100/80 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/10"
                                        : "bg-zinc-100/80 dark:bg-white/[0.04] border border-zinc-200/60 dark:border-white/[0.04] group-hover:bg-zinc-200/80 dark:group-hover:bg-white/[0.06]"
                                )}>
                                    <item.icon className={cn(
                                        "w-4 h-4 transition-colors",
                                        item.status === 'success'
                                            ? "text-emerald-500 dark:text-emerald-400"
                                            : "text-zinc-500/80 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
                                    )} />
                                </div>
                                <div className="text-left space-y-0.5">
                                    <h3 className={cn(
                                        "text-[13px] font-medium tracking-tight transition-colors",
                                        item.status === 'success'
                                            ? "text-emerald-700 dark:text-emerald-300"
                                            : "text-zinc-800 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-zinc-100"
                                    )}>{item.title}</h3>
                                    <p className={cn(
                                        "text-[10px] font-medium",
                                        item.status === 'success'
                                            ? "text-emerald-500/70 dark:text-emerald-400/50"
                                            : "text-zinc-500/80 dark:text-zinc-500/80"
                                    )}>{item.subtitle}</p>
                                </div>
                            </div>

                            <div className="pr-0.5">
                                {item.status === 'success' ? (
                                    <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 transition-colors" title="Clique para refazer o tour">
                                        <RotateCcw className="w-3 h-3 text-emerald-500 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 absolute group-hover:opacity-0 transition-opacity" />
                                    </div>
                                ) : (
                                    <div className="w-7 h-7 rounded-full border border-zinc-200/60 dark:border-white/[0.06] flex items-center justify-center group-hover:border-zinc-300 dark:group-hover:border-white/[0.12] group-hover:bg-zinc-100 dark:group-hover:bg-white/[0.04] transition-all ease-apple">
                                        <ArrowRight className="w-3.5 h-3.5 text-zinc-500/80 dark:text-zinc-500/80 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Footer Link */}
            <div className="mt-4 text-center relative z-10">
                <button onClick={() => navigate('/ajustes')} className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500/80 dark:text-zinc-500/80 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors duration-300 ease-apple">
                    Ver Todas
                </button>
            </div>
        </div>
    );
};
