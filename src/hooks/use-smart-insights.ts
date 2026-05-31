import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/SessionContextProvider';
import { subDays, subMonths } from 'date-fns';

export interface SmartInsight {
  id: string;
  type: 'pattern' | 'action' | 'risk' | 'opportunity';
  title: string;
  message: string;
  icon: 'trend-down' | 'trend-up' | 'alert' | 'sparkle' | 'dollar' | 'calendar' | 'users';
  actionLabel?: string;
  actionLink?: string;
}

const fetchSmartInsights = async (userId: string): Promise<SmartInsight[]> => {
  const insights: SmartInsight[] = [];
  const now = new Date();

  // ── 1. Pacientes sem sessão há mais de 30 dias ──
  const thirtyDaysAgo = subDays(now, 30);
  const { data: activePatients } = await supabase
    .from('patients')
    .select('id, name')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (activePatients && activePatients.length > 0) {
    const patientIds = activePatients.map(p => p.id);
    const { data: recentApts } = await supabase
      .from('appointments')
      .select('patient_id, start_time')
      .eq('user_id', userId)
      .in('patient_id', patientIds)
      .in('status', ['completed', 'confirmed'])
      .gte('start_time', thirtyDaysAgo.toISOString());

    const patientsWithRecentSession = new Set(recentApts?.map(a => a.patient_id) || []);
    const dormantPatients = activePatients.filter(p => !patientsWithRecentSession.has(p.id));

    if (dormantPatients.length > 0) {
      insights.push({
        id: 'dormant-patients',
        type: 'risk',
        title: 'Pacientes Inativos',
        message: `${dormantPatients.length} paciente(s) ativo(s) sem sessão há mais de 30 dias. Considere entrar em contato.`,
        icon: 'users',
        actionLabel: 'Ver Pacientes',
        actionLink: '/pacientes',
      });
    }
  }

  // ── 2. Revenue leakage: sessões completadas sem cobrança ──
  const twoMonthsAgo = subMonths(now, 2);
  const { data: completedApts } = await supabase
    .from('appointments')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('start_time', twoMonthsAgo.toISOString());

  if (completedApts && completedApts.length > 0) {
    const completedIds = completedApts.map(a => a.id);
    const { data: billed } = await supabase
      .from('transactions')
      .select('appointment_id')
      .eq('user_id', userId)
      .in('appointment_id', completedIds);

    const billedSet = new Set(billed?.map(t => t.appointment_id) || []);
    const unbilledCount = completedIds.filter(id => !billedSet.has(id)).length;

    if (unbilledCount > 0) {
      insights.push({
        id: 'revenue-leakage',
        type: 'opportunity',
        title: 'Receita Não Cobrada',
        message: `${unbilledCount} sessão(ões) concluída(s) sem lançamento financeiro nos últimos 2 meses.`,
        icon: 'dollar',
        actionLabel: 'Ver Financeiro',
        actionLink: '/financeiro',
      });
    }
  }

  // ── 3. Taxa de confirmação da semana ──
  const sevenDaysAgo = subDays(now, 7);
  const fourteenDaysAgo = subDays(now, 14);

  const { data: thisWeekApts } = await supabase
    .from('appointments')
    .select('id, status')
    .eq('user_id', userId)
    .gte('start_time', sevenDaysAgo.toISOString())
    .lte('start_time', now.toISOString())
    .neq('type', 'block');

  const { data: lastWeekApts } = await supabase
    .from('appointments')
    .select('id, status')
    .eq('user_id', userId)
    .gte('start_time', fourteenDaysAgo.toISOString())
    .lt('start_time', sevenDaysAgo.toISOString())
    .neq('type', 'block');

  if (thisWeekApts && lastWeekApts && lastWeekApts.length > 0) {
    const thisWeekConfirmed = thisWeekApts.filter(a => a.status === 'confirmed' || a.status === 'completed').length;
    const lastWeekConfirmed = lastWeekApts.filter(a => a.status === 'confirmed' || a.status === 'completed').length;
    const thisWeekRate = thisWeekApts.length > 0 ? thisWeekConfirmed / thisWeekApts.length : 0;
    const lastWeekRate = lastWeekApts.length > 0 ? lastWeekConfirmed / lastWeekApts.length : 0;

    if (lastWeekRate > 0 && thisWeekRate < lastWeekRate * 0.85) {
      const dropPercent = Math.round((1 - thisWeekRate / lastWeekRate) * 100);
      insights.push({
        id: 'confirmation-drop',
        type: 'pattern',
        title: 'Queda nas Confirmações',
        message: `A taxa de confirmação caiu ${dropPercent}% esta semana. Considere enviar lembretes automáticos.`,
        icon: 'trend-down',
        actionLabel: 'Ver Agenda',
        actionLink: '/agenda',
      });
    } else if (thisWeekRate > lastWeekRate * 1.1 && lastWeekRate > 0) {
      insights.push({
        id: 'confirmation-up',
        type: 'pattern',
        title: 'Confirmações em Alta',
        message: `A taxa de confirmação subiu ${Math.round((thisWeekRate / lastWeekRate - 1) * 100)}% esta semana! Continue assim.`,
        icon: 'trend-up',
      });
    }
  }

  // ── 4. Crescimento da clínica (novos pacientes) ──
  if (activePatients) {
    const { count: newThisMonth } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', subDays(now, 30).toISOString());

    if (newThisMonth && newThisMonth > 0) {
      insights.push({
        id: 'growth',
        type: 'opportunity',
        title: 'Crescimento da Clínica',
        message: `${newThisMonth} novo(s) paciente(s) cadastrado(s) este mês. Sua base está crescendo!`,
        icon: 'sparkle',
      });
    }
  }

  // ── 5. Agenda vazia nos próximos 3 dias ──
  const threeDaysFromNow = subDays(now, -3);
  const { count: upcomingCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('start_time', now.toISOString())
    .lte('start_time', threeDaysFromNow.toISOString())
    .neq('status', 'cancelled')
    .neq('type', 'block');

  if (upcomingCount === 0) {
    insights.push({
      id: 'empty-agenda',
      type: 'action',
      title: 'Agenda Livre',
      message: 'Nenhum agendamento nos próximos 3 dias. Aproveite para entrar em contato com pacientes inativos.',
      icon: 'calendar',
      actionLabel: 'Abrir Agenda',
      actionLink: '/agenda',
    });
  }

  return insights.slice(0, 4);
};

export const useSmartInsights = () => {
  const { user } = useAuth();

  return useQuery<SmartInsight[]>({
    queryKey: ['smartInsights', user?.id],
    queryFn: () => fetchSmartInsights(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
  });
};
