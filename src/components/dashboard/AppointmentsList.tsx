import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, Video, MapPin, Loader2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppointmentDetailModal } from "../agenda/AppointmentDetailModal";
import { Appointment } from "@/types";

interface AppointmentsListProps {
  appointments: Appointment[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

const getInitials = (name: string) => {
  if (!name) return "??";
  const names = name.split(' ');
  return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
};

export const AppointmentsList = ({ appointments, isLoading, error }: AppointmentsListProps) => {

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-300 dark:text-zinc-600" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-4 text-red-500/80 dark:text-red-400/80 text-xs">Erro ao carregar.</div>;
  }

  if (!appointments || appointments.length === 0) {
    return (
      <div className="col-span-full text-center py-14 text-zinc-500/80/80 dark:text-zinc-500/80/80 flex flex-col items-center border border-dashed border-zinc-200 dark:border-white/[0.06] rounded-[20px]">
        <Calendar className="h-7 w-7 mb-2 opacity-30" />
        <p className="text-xs">Nenhuma consulta recente.</p>
      </div>
    );
  }

  const groupedAppointments = appointments.reduce((acc, apt) => {
    const dateKey = format(new Date(apt.start_time), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(apt);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const sortedDates = Object.keys(groupedAppointments).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  return (
    <div className="relative space-y-8 pl-2">
      {/* Vertical timeline line */}
      <div className="absolute left-[29px] top-2 bottom-2 w-px bg-gradient-to-b from-zinc-200 dark:from-white/[0.06] via-zinc-100 dark:via-white/[0.03] to-transparent z-0" />

      {sortedDates.map((dateKey, index) => {
        const dayAppointments = groupedAppointments[dateKey].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        const dateObj = new Date(dateKey + 'T00:00:00');

        return (
          <div key={dateKey} className="relative z-10 animate-fade-up" style={{ animationDelay: `${index * 80}ms` }}>

            {/* Day Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex flex-col items-center justify-center w-14 h-14 rounded-[18px] bg-zinc-50 dark:bg-[#0A0A0C] border border-zinc-200 dark:border-white/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.4)] z-10">
                <span className="text-[9px] font-bold text-zinc-500/80/80 dark:text-zinc-500/80/80 uppercase tracking-wider">{format(dateObj, 'MMM', { locale: ptBR })}</span>
                <span className="text-xl font-bold text-zinc-800 dark:text-zinc-200 leading-none">{format(dateObj, 'dd')}</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-zinc-200 dark:from-white/[0.06] to-transparent" />
            </div>

            {/* Day Appointments Grid */}
            <div className="ml-[3.5rem] grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {dayAppointments.map((apt) => (
                <AppointmentDetailModal key={apt.id} appointment={apt}>
                  <div className={cn(
                    "group flex items-center gap-3 p-3.5 rounded-[18px] cursor-pointer transition-all duration-300 ease-apple",
                    "bg-zinc-50/50 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.04]",
                    "hover:bg-zinc-100/80 dark:hover:bg-white/[0.05] hover:border-zinc-300 dark:hover:border-white/[0.10] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
                    "active:scale-[0.98]"
                  )}>
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-10 w-10 border border-zinc-200 dark:border-white/[0.06] group-hover:border-zinc-300 dark:group-hover:border-white/[0.12] transition-colors">
                        <AvatarFallback className="bg-zinc-100 dark:bg-white/[0.03] text-zinc-500/80/80 dark:text-zinc-400 text-[10px] font-bold">
                          {getInitials(apt.patient_name || '')}
                        </AvatarFallback>
                      </Avatar>
                      {apt.type === 'online' && (
                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-[#0A0A0C] p-0.5 rounded-full">
                          <div className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 p-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/20">
                            <Video className="h-2.5 w-2.5" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate pr-2">{apt.patient_name}</p>
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500/80/80 bg-zinc-100/60 dark:bg-white/[0.03] px-1.5 py-0.5 rounded-lg border border-zinc-200/60 dark:border-white/[0.03]">
                          <Clock className="h-2.5 w-2.5" />
                          {format(new Date(apt.start_time), 'HH:mm')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500/80/80 dark:text-zinc-500/80/80">
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          apt.status === 'confirmed' ? "bg-emerald-400" : apt.status === 'pending' ? "bg-amber-400" : "bg-zinc-400 dark:bg-zinc-600"
                        )} />
                        <span>{apt.status === 'confirmed' ? 'Confirmada' : apt.status === 'pending' ? 'Pendente' : apt.status}</span>
                        {apt.type === 'presencial' && <MapPin className="h-2.5 w-2.5 ml-auto opacity-40" />}
                      </div>
                    </div>
                  </div>
                </AppointmentDetailModal>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};