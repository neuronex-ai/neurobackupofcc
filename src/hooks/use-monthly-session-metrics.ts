import { useAuth } from '@/components/auth/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { Appointment } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { 
  startOfMonth, 
  endOfMonth, 
  formatISO, 
  parseISO,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  format,
  isAfter
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const useMonthlySessionMetrics = (selectedDate: Date) => {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['monthly-session-metrics', selectedDate.toISOString(), userId],
    queryFn: async () => {
      if (!userId) return null;

      const startMonth = startOfMonth(selectedDate);
      const endMonth = endOfMonth(selectedDate);
      const startYear = startOfYear(selectedDate);
      const endYear = endOfYear(selectedDate);

      // 1. Fetch Month Appointments
      const { data: monthApts, error: monthError } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', formatISO(startMonth))
        .lte('start_time', formatISO(endMonth));

      if (monthError) throw monthError;

      // 2. Fetch Year Appointments (for chart)
      const { data: yearApts, error: yearError } = await supabase
        .from('appointments')
        .select('start_time, end_time, status, notes')
        .eq('user_id', userId)
        .gte('start_time', formatISO(startYear))
        .lte('start_time', formatISO(endYear));

      if (yearError) throw yearError;

      // 3. Fetch Birthdays Today
      const today = new Date();
      const todayMonth = today.getMonth() + 1;
      const todayDay = today.getDate();

      // Supabase doesn't have a direct date_part for birth_date easily via JS client without RPC or raw SQL
      // For MVP we fetch all patients and filter locally if list is small, or use a better strategy.
      // Given the constraints, let's fetch patients and filter.
      const { data: allPatients, error: patientsError } = await supabase
        .from('patients')
        .select('id, name, birth_date')
        .eq('user_id', userId);

      if (patientsError) throw patientsError;

      const birthdayPatients = allPatients?.filter(p => {
        if (!p.birth_date) return false;
        const bDate = parseISO(p.birth_date);
        return (bDate.getMonth() + 1) === todayMonth && bDate.getDate() === todayDay;
      }) || [];

      // 4. Patient Activity (Notes)
      const { count: activityCount, error: notesError } = await supabase
        .from('session_notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', formatISO(startMonth))
        .lte('created_at', formatISO(endMonth));

      if (notesError) throw notesError;

      // --- CALCULATIONS ---
      
      const appointments = (monthApts || []) as Appointment[];
      
      // KPIs
      const totalScheduled = appointments.length;
      const present = appointments.filter(a => a.status === 'completed').length;
      const absent = appointments.filter(a => a.status === 'pending' && isAfter(new Date(), new Date(a.end_time))).length; // Simple proxy for absent if not completed
      const clientCancelled = appointments.filter(a => a.status === 'cancelled' && a.notes?.toLowerCase().includes('cliente')).length;
      const proCancelled = appointments.filter(a => a.status === 'cancelled' && a.notes?.toLowerCase().includes('profissional')).length;
      const confirmed = appointments.filter(a => a.status === 'confirmed').length;
      const unscored = appointments.filter(a => a.status === 'pending').length;

      // Patient Metrics
      const patientAptCounts: Record<string, number> = {};
      const patientsWithFutureApts = new Set();
      const now = new Date();
      
      appointments.forEach(a => {
        if (a.patient_id) {
          patientAptCounts[a.patient_id] = (patientAptCounts[a.patient_id] || 0) + 1;
          if (isAfter(new Date(a.start_time), now)) {
            patientsWithFutureApts.add(a.patient_id);
          }
        }
      });

      const topPatientId = Object.entries(patientAptCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      const topPatientName = allPatients?.find(p => p.id === topPatientId)?.name || 'Nenhum';
      const topPatientCount = patientAptCounts[topPatientId || ''] || 0;

      const onlineCount = appointments.filter(a => a.type === 'online').length;
      const presencialCount = appointments.filter(a => a.type === 'presencial').length;
      const onlinePerc = totalScheduled > 0 ? (onlineCount / totalScheduled) * 100 : 0;
      const presencialPerc = totalScheduled > 0 ? (presencialCount / totalScheduled) * 100 : 0;

      // Active Patients Logic
      const totalActivePatients = allPatients?.length || 0;
      const withFuture = patientsWithFutureApts.size;
      const withoutFuture = totalActivePatients - withFuture;

      // Chart Data
      const months = eachMonthOfInterval({ start: startYear, end: endYear });
      const chartData = months.map(m => {
        const monthStart = startOfMonth(m);
        const monthEnd = endOfMonth(m);
        const monthAptsFilter = (yearApts || []).filter(a => {
          const d = parseISO(a.start_time);
          return d >= monthStart && d <= monthEnd;
        });

        return {
          name: format(m, 'MMMM', { locale: ptBR }),
          'Não pontuado': monthAptsFilter.filter(a => a.status === 'pending').length,
          'Presença': monthAptsFilter.filter(a => a.status === 'completed').length,
          'Ausência': monthAptsFilter.filter(a => a.status === 'pending' && isAfter(now, parseISO(a.end_time))).length,
          'Cancelamento pelo paciente': monthAptsFilter.filter(a => a.status === 'cancelled' && (a as any).notes?.toLowerCase().includes('cliente')).length,
          'Cancelamento pelo Profissional': monthAptsFilter.filter(a => a.status === 'cancelled' && (a as any).notes?.toLowerCase().includes('profissional')).length,
        };
      });

      return {
        kpis: {
          totalScheduled,
          present,
          absent,
          clientCancelled,
          proCancelled,
          confirmed,
          unscored
        },
        patients: {
          totalActive: totalActivePatients,
          withFuture,
          withoutFuture,
          topPatientName,
          topPatientCount,
          onlinePerc,
          presencialPerc,
          reschedules: 0 // Placeholder
        },
        chartData,
        birthdayCount: birthdayPatients.length,
        activityCount: activityCount || 0
      };
    },
    enabled: !!userId,
  });
};
