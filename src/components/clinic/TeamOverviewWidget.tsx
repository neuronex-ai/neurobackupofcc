import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import {
    useOrganizationMembers
} from "@/hooks/use-organization";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { endOfDay, startOfDay, startOfMonth } from "date-fns";
import { motion } from "framer-motion";
import {
    Calendar, ChevronRight, Crown, Loader2, TrendingUp, Users
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TeamOverviewWidgetProps {
    organizationId?: string;
}

/**
 * Fetches real appointment counts for each member: today + this month.
 */
const useTeamPerformance = (memberIds: string[]) => {
    return useQuery({
        queryKey: ['team-performance', memberIds],
        queryFn: async () => {
            if (memberIds.length === 0) return new Map<string, { today: number; month: number }>();

            const now = new Date();
            const todayStart = startOfDay(now).toISOString();
            const todayEnd = endOfDay(now).toISOString();
            const monthStart = startOfMonth(now).toISOString();

            // Fetch today's appointments for all members
            const { data: todayAppts } = await supabase
                .from('appointments')
                .select('user_id')
                .in('user_id', memberIds)
                .gte('start_time', todayStart)
                .lte('start_time', todayEnd)
                .in('status', ['confirmed', 'completed']);

            // Fetch this month's appointments for all members
            const { data: monthAppts } = await supabase
                .from('appointments')
                .select('user_id')
                .in('user_id', memberIds)
                .gte('start_time', monthStart)
                .lte('start_time', todayEnd)
                .in('status', ['confirmed', 'completed']);

            const perfMap = new Map<string, { today: number; month: number }>();

            // Initialize all members with 0
            for (const id of memberIds) {
                perfMap.set(id, { today: 0, month: 0 });
            }

            // Count today's appointments per member
            todayAppts?.forEach(apt => {
                const existing = perfMap.get(apt.user_id)!;
                existing.today += 1;
            });

            // Count this month's appointments per member
            monthAppts?.forEach(apt => {
                const existing = perfMap.get(apt.user_id)!;
                existing.month += 1;
            });

            return perfMap;
        },
        enabled: memberIds.length > 0,
        staleTime: 5 * 60 * 1000,
    });
};

export const TeamOverviewWidget = ({ organizationId }: TeamOverviewWidgetProps) => {
    const navigate = useNavigate();
    const { data: members, isLoading } = useOrganizationMembers(organizationId || null);

    const activeMembers = members?.filter(m => m.status === 'active') || [];
    const memberIds = activeMembers.map(m => m.user_id);

    const { data: perfMap, isLoading: isLoadingPerf } = useTeamPerformance(memberIds);

    return (
        <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Visão Geral da Equipe</h3>
                        <p className="text-xs text-muted-foreground">{activeMembers.length} profissionais ativos</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/ajustes?tab=organization')}
                    className="text-xs text-muted-foreground hover:text-white"
                >
                    Gerenciar
                    <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-secondary/10 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : activeMembers.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Nenhum profissional na equipe.</p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/ajustes?tab=organization')}
                        className="mt-4"
                    >
                        Adicionar Profissional
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {activeMembers.slice(0, 5).map((member, i) => {
                        const displayName = member.user?.user_metadata?.full_name ||
                            member.user?.email?.split('@')[0] ||
                            'Profissional';
                        const initials = displayName.substring(0, 2).toUpperCase();
                        const avatarUrl = member.user?.user_metadata?.avatar_url;
                        const isAdmin = member.role === 'admin';

                        const perf = perfMap?.get(member.user_id);
                        const todayCount = perf?.today ?? 0;
                        const monthCount = perf?.month ?? 0;

                        return (
                            <motion.div
                                key={member.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex items-center justify-between p-4 bg-secondary/5 border border-white/5 rounded-xl hover:border-white/10 transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <Avatar className="h-11 w-11 border border-white/10">
                                            <AvatarImage src={avatarUrl} />
                                            <AvatarFallback className="bg-secondary text-white font-bold text-sm">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        {isAdmin && (
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                                                <Crown className="w-2.5 h-2.5 text-black" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white text-sm">{displayName}</p>
                                        <p className="text-xs text-muted-foreground capitalize">
                                            {member.role === 'admin' ? 'Administrador' :
                                                member.role === 'professional' ? 'Profissional' :
                                                    member.role}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    {/* Today's Sessions */}
                                    <div className="text-right hidden sm:block">
                                        <div className="flex items-center gap-1.5 justify-end">
                                            <Calendar className="w-3 h-3 text-blue-400" />
                                            {isLoadingPerf ? (
                                                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                                            ) : (
                                                <span className="font-bold text-white">{todayCount}</span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">hoje</p>
                                    </div>

                                    {/* Monthly Stats */}
                                    <div className="text-right hidden md:block">
                                        <div className="flex items-center gap-1.5 justify-end">
                                            <TrendingUp className="w-3 h-3 text-emerald-400" />
                                            {isLoadingPerf ? (
                                                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                                            ) : (
                                                <span className="font-bold text-white">{monthCount}</span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">este mês</p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}

                    {activeMembers.length > 5 && (
                        <Button
                            variant="ghost"
                            className="w-full text-xs text-muted-foreground hover:text-white"
                            onClick={() => navigate('/ajustes?tab=organization')}
                        >
                            Ver todos os {activeMembers.length} profissionais
                        </Button>
                    )}
                </div>
            )}
        </GlassCard>
    );
};
