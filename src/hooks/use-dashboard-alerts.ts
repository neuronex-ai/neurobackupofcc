import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/SessionContextProvider';
import { format, isSameDay } from 'date-fns';
import { isCancelledAppointmentStatus } from '@/lib/appointment-status';

export interface DashboardAlert {
  id: string;
  type: 'success' | 'warning' | 'info' | 'destructive';
  title: string;
  message: string;
  time: string;
  actionLink?: string;
}

const fetchAlerts = async (userId: string): Promise<DashboardAlert[]> => {
  const alerts: DashboardAlert[] = [];
  const now = new Date();

  // Fetch settings first
  const { data: settings } = await supabase
    .from('user_notification_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  const inAppEnabled = settings?.in_app_enabled ?? true;

  if (!inAppEnabled) return []; // If all in-app alerts are off, return early.

  // 1. Verificar Conexão de Pagamentos (NeuroFinance / Asaas BaaS)
  const { data: bankAccounts } = await supabase
    .from('user_bank_accounts')
    .select('id, onboarding_completed, account_status')
    .eq('user_id', userId);

  const hasActiveAccount = bankAccounts?.some(a => a.onboarding_completed && a.account_status === 'active');
  if (!hasActiveAccount) {
    alerts.push({
      id: 'payment-connect',
      type: 'warning',
      title: 'Pagamentos Pendentes',
      message: 'Configure sua conta de recebimentos para habilitar cobranças automáticas.',
      time: 'Importante',
      actionLink: '/integrations'
    });
  }

  // 2. Verificar Faturas Vencidas
  if (settings?.in_app_overdue_invoices ?? true) {
    const { data: overdueInvoices } = await supabase
      .from('invoices')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .lt('due_date', format(now, 'yyyy-MM-dd'));

    if (overdueInvoices && overdueInvoices.length > 0) {
      const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      alerts.push({
        id: 'overdue-invoices',
        type: 'destructive',
        title: 'Faturas Vencidas',
        message: `${overdueInvoices.length} fatura(s) em atraso totalizando R$ ${totalOverdue.toLocaleString('pt-BR')}.`,
        time: 'Financeiro',
        actionLink: '/financeiro'
      });
    }
  }

  // 3. Verificar Pagamentos Recebidos (últimas 24h) - White-label
  if (settings?.in_app_overdue_invoices ?? true) { // Reusing financial setting
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const { data: recentPayments } = await supabase
      .from('invoices')
      .select('amount, patient_id')
      .eq('user_id', userId)
      .eq('status', 'paid')
      .gte('updated_at', yesterday.toISOString());

    if (recentPayments && recentPayments.length > 0) {
      const totalReceived = recentPayments.reduce((sum, inv) => sum + inv.amount, 0);
      alerts.push({
        id: 'recent-payments',
        type: 'success',
        title: 'Pagamento Recebido',
        message: `${recentPayments.length} pagamento(s) confirmado(s): R$ ${totalReceived.toLocaleString('pt-BR')}.`,
        time: 'Financeiro',
        actionLink: '/financeiro'
      });
    }
  }

  // 4. Verificar Pacientes Pendentes
  if (settings?.in_app_new_patients ?? true) {
    const { count: pendingPatients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (pendingPatients && pendingPatients > 0) {
      alerts.push({
        id: 'pending-patients',
        type: 'info',
        title: 'Novos Pacientes',
        message: `${pendingPatients} cadastro(s) aguardando revisão ou aprovação.`,
        time: 'Pacientes',
        actionLink: '/pacientes'
      });
    }
  }

  // 5. Verificar Reagendamentos Recentes (últimas 24h)
  if (settings?.in_app_system_updates ?? true) {
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const { data: recentReschedules } = await supabase
      .from('appointments')
      .select('id, start_time, created_at, updated_at, status, notes, patient:patient_id(name)')
      .eq('user_id', userId)
      .gte('updated_at', yesterday.toISOString());

    // Filter: only appointments where updated_at > created_at (meaning they were modified)
    const rescheduled = recentReschedules?.filter(apt => {
      if (isCancelledAppointmentStatus(apt.status, apt.notes)) return false;
      const created = new Date(apt.created_at).getTime();
      const updated = new Date(apt.updated_at).getTime();
      return (updated - created) > 60000; // Modified at least 1 minute after creation
    });

    if (rescheduled && rescheduled.length > 0) {
      alerts.push({
        id: 'recent-reschedules',
        type: 'info',
        title: 'Consultas Reagendadas',
        message: `${rescheduled.length} consulta(s) foram reagendadas recentemente.`,
        time: 'Agenda',
        actionLink: '/agenda'
      });
    }
  }

  // 6. Verificar Próximas Consultas
  if (settings?.in_app_system_updates ?? true) {
    const { data: upcomingAppointments, error: aptError } = await supabase
      .from('appointments')
      .select('id, start_time, status, notes, patient:patient_id(name)')
      .eq('user_id', userId)
      .gte('start_time', now.toISOString())
      .neq('type', 'block')
      .order('start_time', { ascending: true })
      .limit(10);

    const visibleUpcoming = (upcomingAppointments || [])
      .filter((apt) => !isCancelledAppointmentStatus(apt.status, apt.notes))
      .slice(0, 3);

    if (aptError) {
      console.error("Error fetching upcoming appointments for alerts:", aptError);
    } else if (visibleUpcoming.length > 0) {
      visibleUpcoming.forEach((apt, index) => {
        const startTime = new Date(apt.start_time);
        const isToday = isSameDay(now, startTime);
        const timeStr = format(startTime, 'HH:mm');
        const dateStr = isToday ? 'hoje' : `em ${format(startTime, 'dd/MM')}`;
        const patientName = Array.isArray(apt.patient) ? apt.patient[0]?.name : (apt.patient as any)?.name;

        alerts.push({
          id: `upcoming-apt-${apt.id}`,
          type: 'info',
          title: index === 0 ? 'Próxima Sessão' : 'Agendamento Futuro',
          message: `Consulta com ${patientName || 'Paciente'} ${dateStr} às ${timeStr}.`,
          time: 'Agenda',
          actionLink: `/agenda?appointmentId=${apt.id}` // Link específico
        });
      });
    } else {
      alerts.push({
        id: 'free-day',
        type: 'info',
        title: 'Agenda Livre',
        message: 'Nenhum atendimento futuro agendado.',
        time: 'Agenda',
        actionLink: '/agenda'
      });
    }
  }

  return alerts;
};

export const useDashboardAlerts = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['dashboardAlerts', user?.id],
    queryFn: () => fetchAlerts(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });
};
