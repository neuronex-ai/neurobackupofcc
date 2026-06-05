import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getAppointmentStatusMeta } from '@/lib/appointment-status';
import { useDashboardActivities, type ActivityType, type DashboardActivity } from '@/hooks/use-dashboard-activities';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity, CalendarClock, ChevronRight, CreditCard, FileText, NotebookPen, X } from 'lucide-react';

interface PatientActivitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PatientActivitiesModal = ({ isOpen, onClose }: PatientActivitiesModalProps) => {
  const { data: activities, isLoading } = useDashboardActivities();

  const getIcon = (activity: DashboardActivity) => {
    if (activity.type === 'appointment_status') {
      const meta = getAppointmentStatusMeta(activity.status || 'unscored');
      return <meta.icon className={cn('w-4 h-4', meta.textClassName)} />;
    }

    switch (activity.type) {
      case 'appointment_rescheduled':
        return <CalendarClock className="w-4 h-4 text-zinc-500" />;
      case 'payment_received':
        return <CreditCard className="w-4 h-4 text-blue-500" />;
      case 'anamnesis_updated':
        return <FileText className="w-4 h-4 text-purple-500" />;
      case 'note_created':
        return <NotebookPen className="w-4 h-4 text-zinc-500" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getBgColor = (type: ActivityType, status?: string) => {
    if (type === 'appointment_status') {
      return getAppointmentStatusMeta(status || 'unscored').softClassName;
    }

    switch (type) {
      case 'payment_received':
        return 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20';
      case 'anamnesis_updated':
        return 'bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20';
      default:
        return 'bg-zinc-50 dark:bg-white/5 border-zinc-100 dark:border-white/5';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[820px] w-[95vw] max-h-[85vh] p-0 bg-[#F8F9FA] dark:bg-[#080809] border-none overflow-hidden flex flex-col rounded-[32px]">
        <div className="flex items-center justify-between px-8 py-6 bg-white dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-white/5 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Atividades de pacientes</h2>
              <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Registros reais do mês atual</p>
            </div>
          </div>

          <DialogClose className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all">
            <X className="w-5 h-5" />
          </DialogClose>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {isLoading ? (
            <div className="h-full flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-white" />
            </div>
          ) : activities && activities.length > 0 ? (
            <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-zinc-200 dark:before:bg-white/5">
              {activities.map((activity, index) => (
                <motion.div
                  key={`${activity.type}-${activity.id}-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="relative pl-12"
                >
                  <div className={cn('absolute left-0 top-2 w-10 h-10 rounded-xl border flex items-center justify-center z-10', getBgColor(activity.type, activity.status))}>
                    {getIcon(activity)}
                  </div>

                  <div className="bg-white dark:bg-zinc-900/40 rounded-[24px] border border-zinc-100 dark:border-white/5 p-5 flex items-center justify-between gap-4 group hover:shadow-lg transition-all">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest truncate">{activity.patient_name}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                          {format(activity.date, "HH:mm '•' dd/MM", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {activity.description}
                        {activity.status && (
                          <span className={cn('ml-2 font-black', getAppointmentStatusMeta(activity.status).textClassName)}>
                            {getAppointmentStatusMeta(activity.status).label}
                          </span>
                        )}
                        {activity.amount !== undefined && (
                          <span className="ml-2 font-bold text-zinc-900 dark:text-white">
                            R$ {activity.amount.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </p>
                    </div>

                    <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-xl bg-zinc-50 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-sm font-bold text-zinc-400">Nenhuma atividade encontrada neste mês.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
