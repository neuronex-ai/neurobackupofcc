import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, Cake, Activity } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useMonthlySessionMetrics } from '@/hooks/use-monthly-session-metrics';
import { SessionsMetricsModal } from './SessionsMetricsModal';
import { BirthdaysModal } from './BirthdaysModal';
import { PatientActivitiesModal } from './PatientActivitiesModal';

export const DashboardKpiCards = () => {
  const { data } = useMonthlySessionMetrics(new Date());
  const [isSessionsModalOpen, setIsSessionsModalOpen] = useState(false);
  const [isBirthdaysModalOpen, setIsBirthdaysModalOpen] = useState(false);
  const [isActivitiesModalOpen, setIsActivitiesModalOpen] = useState(false);

  const kpis = [
    {
      id: 'sessions',
      title: 'sessões agendadas',
      value: data?.kpis.totalScheduled || 0,
      label: 'no mês de ' + new Date().toLocaleString('pt-BR', { month: 'long' }),
      icon: CalendarCheck,
      color: 'zinc',
      onClick: () => setIsSessionsModalOpen(true)
    },
    {
      id: 'birthdays',
      title: 'aniversariantes',
      value: data?.birthdayCount || 0,
      label: 'neste mês',
      icon: Cake,
      color: 'zinc',
      onClick: () => setIsBirthdaysModalOpen(true)
    },
    {
      id: 'activities',
      title: 'atividades de pacientes',
      value: data?.activityCount || 0,
      label: 'registradas este mês',
      icon: Activity,
      color: 'zinc',
      onClick: () => setIsActivitiesModalOpen(true)
    }
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.1, duration: 0.6 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={kpi.onClick}
              className="cursor-pointer group"
            >
              <GlassCard className="h-full border-zinc-100 dark:border-white/[0.04] group-hover:border-zinc-300 dark:group-hover:border-white/20 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.02)]" innerClassName="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                      {kpi.title}
                    </h4>
                    <div className="flex items-baseline gap-2">
                       <span className="text-4xl font-black text-black dark:text-white tabular-nums tracking-tighter">
                        {kpi.value}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 capitalize">
                        {kpi.label}
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] flex items-center justify-center border border-zinc-100 dark:border-white/5 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-all duration-500 shadow-sm">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      <SessionsMetricsModal 
        isOpen={isSessionsModalOpen} 
        onClose={() => setIsSessionsModalOpen(false)} 
      />
      <BirthdaysModal
        isOpen={isBirthdaysModalOpen}
        onClose={() => setIsBirthdaysModalOpen(false)}
        birthdays={data?.monthlyBirthdays || []}
      />
      <PatientActivitiesModal
        isOpen={isActivitiesModalOpen}
        onClose={() => setIsActivitiesModalOpen(false)}
      />
    </>
  );
};
