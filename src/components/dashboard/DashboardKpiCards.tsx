import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, Cake, Activity } from 'lucide-react';
import { startOfMonth } from 'date-fns';
import { GlassCard } from '@/components/ui/GlassCard';
import { useMonthlySessionMetrics } from '@/hooks/use-monthly-session-metrics';
import { SessionsMetricsModal } from './SessionsMetricsModal';
import { BirthdaysModal } from './BirthdaysModal';
import { PatientActivitiesModal } from './PatientActivitiesModal';
import { useDashboardActivities } from '@/hooks/use-dashboard-activities';

export const DashboardKpiCards = () => {
  const [currentMonth] = useState(() => startOfMonth(new Date()));
  const { data } = useMonthlySessionMetrics(currentMonth);
  const { data: activities } = useDashboardActivities(currentMonth);
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
      value: activities?.length || 0,
      label: 'registradas este mês',
      icon: Activity,
      color: 'zinc',
      onClick: () => setIsActivitiesModalOpen(true)
    }
  ];

  return (
    <>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.1, duration: 0.6 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              onClick={kpi.onClick}
              className="cursor-pointer group"
            >
              <GlassCard className="h-full !rounded-[24px] border-zinc-200/70 bg-white/78 shadow-[0_16px_44px_-38px_rgba(24,24,27,0.4)] transition-colors duration-300 group-hover:border-zinc-300 dark:border-white/[0.055] dark:bg-[#0b0c0e]/88 dark:group-hover:border-white/15" innerClassName="p-5">
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
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200/70 bg-zinc-50 text-zinc-400 shadow-sm transition-colors duration-300 group-hover:text-zinc-900 dark:border-white/[0.06] dark:bg-white/[0.035] dark:group-hover:text-white">
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
