import { motion } from "framer-motion";
import {
    Users,
    Calendar,
    DollarSign,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Loader2
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/SessionContextProvider";

interface ClinicMetricsCardsProps {
    organizationId?: string;
}

interface MetricCard {
    label: string;
    value: string | number;
    change?: number;
    icon: typeof Users;
}

// Apple-family easing
const appleEase = [0.22, 1, 0.36, 1] as const;

const useClinicMetrics = (organizationId?: string) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['clinicMetrics', organizationId, user?.id],
        queryFn: async (): Promise<MetricCard[]> => {
            const userId = user?.id;
            if (!userId) return [];

            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
            const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
            const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

            // Fetch all data in parallel
            const [
                patientsResult,
                appointmentsThisMonth,
                appointmentsPrevMonth,
                financialEntriesThisMonth,
                financialEntriesPrevMonth,
            ] = await Promise.all([
                supabase.from('patients').select('id', { count: 'exact', head: true }).eq('user_id', userId),
                supabase.from('appointments').select('patient_id').eq('user_id', userId)
                    .gte('start_time', startOfMonth).lte('start_time', endOfMonth)
                    .neq('type', 'block'),
                supabase.from('appointments').select('patient_id').eq('user_id', userId)
                    .gte('start_time', startOfPrevMonth).lte('start_time', endOfPrevMonth)
                    .neq('type', 'block'),
                supabase.from('financial_entries').select('amount').eq('professional_id', userId).eq('type', 'income').eq('status', 'paid')
                    .gte('paid_at', startOfMonth).lte('paid_at', endOfMonth),
                supabase.from('financial_entries').select('amount').eq('professional_id', userId).eq('type', 'income').eq('status', 'paid')
                    .gte('paid_at', startOfPrevMonth).lte('paid_at', endOfPrevMonth),
            ]);

            const totalPatients = patientsResult.count || 0;
            const consultasThisMonth = appointmentsThisMonth.data?.length || 0;
            const consultasPrevMonth = appointmentsPrevMonth.data?.length || 0;

            const revenueThisMonth = financialEntriesThisMonth.data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
            const revenuePrevMonth = financialEntriesPrevMonth.data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

            // Return rate: patients with 2+ appointments this month
            const patientAppointmentCounts = new Map<string, number>();
            appointmentsThisMonth.data?.forEach(a => {
                if (a.patient_id) {
                    patientAppointmentCounts.set(a.patient_id, (patientAppointmentCounts.get(a.patient_id) || 0) + 1);
                }
            });
            const uniquePatients = patientAppointmentCounts.size;
            const returningPatients = Array.from(patientAppointmentCounts.values()).filter(c => c >= 2).length;
            const returnRate = uniquePatients > 0 ? Math.round((returningPatients / uniquePatients) * 100) : 0;

            const calcChange = (current: number, previous: number) => {
                if (previous === 0) return current > 0 ? 100 : 0;
                return Math.round(((current - previous) / previous) * 100);
            };

            return [
                {
                    label: "Pacientes Totais",
                    value: totalPatients,
                    change: calcChange(totalPatients, totalPatients), // Patients are cumulative, no change calc for now
                    icon: Users,
                },
                {
                    label: "Consultas Este Mês",
                    value: consultasThisMonth,
                    change: calcChange(consultasThisMonth, consultasPrevMonth),
                    icon: Calendar,
                },
                {
                    label: "Receita Mensal",
                    value: formatCurrency(revenueThisMonth),
                    change: calcChange(revenueThisMonth, revenuePrevMonth),
                    icon: DollarSign,
                },
                {
                    label: "Taxa de Retorno",
                    value: `${returnRate}%`,
                    change: 0, // Would need two months to compare
                    icon: Activity,
                },
            ];
        },
        enabled: !!user?.id,
        staleTime: 5 * 60 * 1000, // 5 min cache
    });
};

export const ClinicMetricsCards = ({ organizationId }: ClinicMetricsCardsProps) => {
    const { data: metrics, isLoading } = useClinicMetrics(organizationId);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-[140px] rounded-2xl bg-card/40 border border-border/10 animate-pulse flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/30" />
                    </div>
                ))}
            </div>
        );
    }

    if (!metrics || metrics.length === 0) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, i) => {
                const Icon = metric.icon;
                const isPositive = (metric.change || 0) >= 0;

                return (
                    <motion.div
                        key={metric.label}
                        initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ delay: i * 0.06, duration: 0.5, ease: appleEase }}
                    >
                        <GlassCard className="p-6 card-lift cursor-default group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-foreground/[0.06] flex items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110">
                                    <Icon className="w-5 h-5 text-foreground/70" />
                                </div>

                                {metric.change !== undefined && metric.change !== 0 && (
                                    <div className={cn(
                                        "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold",
                                        isPositive
                                            ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400"
                                            : "bg-red-500/10 text-red-500 dark:text-red-400"
                                    )}>
                                        {isPositive ? (
                                            <ArrowUpRight className="w-3 h-3" />
                                        ) : (
                                            <ArrowDownRight className="w-3 h-3" />
                                        )}
                                        {Math.abs(metric.change)}%
                                    </div>
                                )}
                            </div>

                            <p className="text-2xl font-bold text-foreground tracking-tight mb-1">
                                {metric.value}
                            </p>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                {metric.label}
                            </p>
                        </GlassCard>
                    </motion.div>
                );
            })}
        </div>
    );
};
