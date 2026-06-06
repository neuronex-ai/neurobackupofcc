import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getAppointmentStatusMeta } from '@/lib/appointment-status';
import { useDashboardActivities, type ActivityType, type DashboardActivity } from '@/hooks/use-dashboard-activities';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity, CalendarClock, CheckCircle2, CreditCard, FileText, NotebookPen, RefreshCw, Sparkles, X } from 'lucide-react';

interface PatientActivitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ActivityFilter = 'all' | 'appointments' | 'payments' | 'anamnesis' | 'notes';

const FILTERS: Array<{ id: ActivityFilter; label: string }> = [
  { id: 'all', label: 'Tudo' },
  { id: 'appointments', label: 'Consultas' },
  { id: 'payments', label: 'Pagamentos' },
  { id: 'anamnesis', label: 'Anamnese' },
  { id: 'notes', label: 'Notas' },
];

const APPOINTMENT_TYPES: ActivityType[] = ['appointment_scheduled', 'appointment_status', 'appointment_rescheduled'];

export const PatientActivitiesModal = ({ isOpen, onClose }: PatientActivitiesModalProps) => {
  const { data: activities, isLoading, isError, refetch, isFetching } = useDashboardActivities();
  const [filter, setFilter] = useState<ActivityFilter>('all');

  const filteredActivities = useMemo(() => {
    const items = activities || [];
    if (filter === 'all') return items;
    if (filter === 'appointments') return items.filter((activity) => APPOINTMENT_TYPES.includes(activity.type));
    if (filter === 'payments') return items.filter((activity) => activity.type === 'payment_received');
    if (filter === 'anamnesis') return items.filter((activity) => activity.type === 'anamnesis_updated');
    return items.filter((activity) => activity.type === 'note_created');
  }, [activities, filter]);

  const getIcon = (activity: DashboardActivity) => {
    if (activity.type === 'appointment_status') {
      const meta = getAppointmentStatusMeta(activity.status || 'unscored');
      return <meta.icon className={cn('w-4 h-4', meta.textClassName)} />;
    }

    switch (activity.type) {
      case 'appointment_scheduled':
        return <CheckCircle2 className="w-4 h-4 text-zinc-500 dark:text-zinc-300" />;
      case 'appointment_rescheduled':
        return <CalendarClock className="w-4 h-4 text-zinc-500 dark:text-zinc-300" />;
      case 'payment_received':
        return <CreditCard className="w-4 h-4 text-zinc-500 dark:text-zinc-300" />;
      case 'anamnesis_updated':
        return <FileText className="w-4 h-4 text-zinc-500 dark:text-zinc-300" />;
      case 'note_created':
        return <NotebookPen className="w-4 h-4 text-zinc-500 dark:text-zinc-300" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getBgColor = (type: ActivityType, status?: string) => {
    if (type === 'appointment_status') {
      return getAppointmentStatusMeta(status || 'unscored').softClassName;
    }

    return 'bg-zinc-50/90 dark:bg-white/[0.045] border-zinc-200/80 dark:border-white/10';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[880px] w-[95vw] max-h-[86vh] p-0 bg-white dark:bg-[#080809] text-zinc-950 dark:text-white border border-zinc-200/80 dark:border-white/10 overflow-hidden flex flex-col rounded-[34px] shadow-[0_42px_120px_-42px_rgba(24,24,27,0.38)]">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_16%_0%,rgba(255,255,255,0.85),transparent_28%),radial-gradient(circle_at_92%_8%,rgba(161,161,170,0.18),transparent_30%)] dark:bg-[radial-gradient(circle_at_16%_0%,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_92%_8%,rgba(161,161,170,0.12),transparent_30%)]" />

        <div className="relative flex items-center justify-between gap-4 px-8 py-6 bg-white/70 dark:bg-zinc-950/[0.72] border-b border-zinc-200/70 dark:border-white/10 shrink-0 backdrop-blur-2xl">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-zinc-950 dark:bg-white flex items-center justify-center text-white dark:text-zinc-950 shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-black tracking-tight text-zinc-950 dark:text-white">Atividades de pacientes</h2>
              <p className="text-[10px] uppercase tracking-[0.22em] font-black text-zinc-400">
                {activities?.length || 0} registros do mês atual
              </p>
            </div>
          </div>

          <DialogClose className="h-11 w-11 rounded-2xl bg-zinc-100/90 dark:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-all">
            <X className="w-5 h-5" />
          </DialogClose>
        </div>

        <div className="relative px-8 pt-6">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => setFilter(item.id)}
                className={cn(
                  'h-9 px-4 rounded-2xl text-[10px] font-black uppercase tracking-wider border transition-all',
                  filter === item.id
                    ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-transparent shadow-sm'
                    : 'bg-white/70 dark:bg-white/[0.04] text-zinc-400 border-zinc-200/70 dark:border-white/10 hover:text-zinc-950 dark:hover:text-white'
                )}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="relative flex-1 overflow-y-auto p-8 custom-scrollbar">
          {isLoading ? (
            <div className="h-full flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-white" />
            </div>
          ) : isError ? (
            <div className="min-h-[300px] flex flex-col items-center justify-center text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200/80 dark:border-rose-500/20 flex items-center justify-center text-rose-500">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-zinc-800 dark:text-zinc-100">Não foi possível carregar as atividades.</p>
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1">Tente sincronizar novamente em alguns instantes.</p>
              </div>
              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={isFetching}
                className="h-10 rounded-xl gap-2 border-zinc-200 bg-white text-zinc-800 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
              >
                <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
                Tentar novamente
              </Button>
            </div>
          ) : filteredActivities.length > 0 ? (
            <div className="space-y-5 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-zinc-200/80 dark:before:bg-white/10">
              {filteredActivities.map((activity, index) => {
                const statusMeta = activity.status ? getAppointmentStatusMeta(activity.status) : null;

                return (
                  <motion.div
                    key={`${activity.type}-${activity.id}-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.035 }}
                    className="relative pl-12"
                  >
                    <div className={cn('absolute left-0 top-2 w-10 h-10 rounded-2xl border flex items-center justify-center z-10 shadow-sm', getBgColor(activity.type, activity.status))}>
                      {getIcon(activity)}
                    </div>

                    <div className="bg-white dark:bg-white/[0.035] rounded-[26px] border border-zinc-200/80 dark:border-white/10 p-5 flex items-center justify-between gap-4 group hover:border-zinc-300 dark:hover:bg-white/[0.06] hover:shadow-[0_18px_48px_-30px_rgba(0,0,0,0.35)] transition-all">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-xs font-black text-zinc-950 dark:text-white uppercase tracking-widest truncate">{activity.patient_name}</span>
                          <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                            {format(activity.date, "HH:mm '•' dd/MM", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed">
                          <span className="font-black text-zinc-800 dark:text-zinc-100">{activity.typeLabel || 'Atividade'}</span>
                          <span className="mx-1.5 text-zinc-300">•</span>
                          {activity.description}
                          {statusMeta && (
                            <span className={cn('ml-2 font-black', statusMeta.textClassName)}>
                              {statusMeta.label}
                            </span>
                          )}
                          {activity.amount !== undefined && (
                            <span className="ml-2 font-black text-zinc-950 dark:text-white">
                              R$ {activity.amount.toFixed(2).replace('.', ',')}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="min-h-[300px] flex flex-col items-center justify-center text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-zinc-700 dark:text-zinc-200">Nenhuma atividade encontrada.</p>
                <p className="text-xs font-semibold text-zinc-400 mt-1">Os registros do mês aparecerão aqui em ordem cronológica.</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
