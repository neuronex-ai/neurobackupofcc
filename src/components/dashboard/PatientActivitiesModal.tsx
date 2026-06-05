import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { X, Activity, CheckCircle2, XCircle, CreditCard, FileText, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDashboardActivities, ActivityType, DashboardActivity } from '@/hooks/use-dashboard-activities';

interface PatientActivitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PatientActivitiesModal = ({ isOpen, onClose }: PatientActivitiesModalProps) => {
  const { data: activities, isLoading } = useDashboardActivities();

  const getIcon = (type: ActivityType) => {
    switch (type) {
      case 'appointment_confirmed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'appointment_cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'payment_received': return <CreditCard className="w-4 h-4 text-blue-500" />;
      case 'anamnesis_updated': return <FileText className="w-4 h-4 text-purple-500" />;
      case 'note_created': return <Activity className="w-4 h-4 text-zinc-500" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getBgColor = (type: ActivityType) => {
    switch (type) {
      case 'appointment_confirmed': return 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20';
      case 'appointment_cancelled': return 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20';
      case 'payment_received': return 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20';
      case 'anamnesis_updated': return 'bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20';
      default: return 'bg-zinc-50 dark:bg-white/5 border-zinc-100 dark:border-white/5';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px] w-[95vw] max-h-[85vh] p-0 bg-[#F8F9FA] dark:bg-[#080809] border-none overflow-hidden flex flex-col rounded-[32px]">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 bg-white dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-white/5 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Atividades Recentes</h2>
              <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Últimos 7 dias de atividades dos pacientes</p>
            </div>
          </div>

          <DialogClose className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all">
            <X className="w-5 h-5" />
          </DialogClose>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {isLoading ? (
            <div className="h-full flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-white" />
            </div>
          ) : activities && activities.length > 0 ? (
            <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-zinc-200 dark:before:bg-white/5">
              {activities.map((activity: DashboardActivity, idx: number) => (
                <motion.div 
                  key={activity.id + idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="relative pl-12"
                >
                  {/* Timeline Point */}
                  <div className={cn(
                    "absolute left-0 top-2 w-10 h-10 rounded-xl border flex items-center justify-center z-10",
                    getBgColor(activity.type)
                  )}>
                    {getIcon(activity.type)}
                  </div>

                  <div className="bg-white dark:bg-zinc-900/40 rounded-[24px] border border-zinc-100 dark:border-white/5 p-5 flex items-center justify-between group hover:shadow-lg transition-all">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest">{activity.patient_name}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                          {format(activity.date, "HH:mm '•' dd/MM", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {activity.description}
                        {activity.amount && (
                          <span className="ml-2 font-bold text-zinc-900 dark:text-white">
                            R$ {activity.amount.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </p>
                    </div>

                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-zinc-50 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center opacity-40">Nenhuma atividade recente encontrada.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
