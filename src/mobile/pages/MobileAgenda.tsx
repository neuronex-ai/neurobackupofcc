import { NewAppointmentModal } from "@/components/agenda/NewAppointmentModal";
import { Button } from "@/components/ui/button";
import { useAppointmentsByDateRange } from "@/hooks/use-appointments-by-date-range";
import { getAppointmentStatusMeta, isCancelledAppointmentStatus } from "@/lib/appointment-status";
import { cn } from "@/lib/utils";
import {
  addDays,
  addMonths,
  endOfDay,
  endOfMonth,
  format,
  getDay,
  getDaysInMonth,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  MapPin,
  Plus,
  Search,
  Video,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MobileEmptyState,
  MobilePageHeader,
  MobilePageScaffold,
  MobileSectionHeader,
  MobileSegmentedControl,
  MobileSkeletonCard,
} from "../components/MobilePagePrimitives";

type ViewMode = "week" | "month";
type AppointmentItem = any;

const getInitials = (name?: string | null) => {
  const parts = String(name || "Paciente").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "PA";
};

export const MobileAgenda = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const weekStart = useMemo(
    () => startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 }),
    [weekOffset],
  );
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);

  const dayQuery = useAppointmentsByDateRange(startOfDay(selectedDate), endOfDay(selectedDate));
  const monthQuery = useAppointmentsByDateRange(startOfDay(monthStart), endOfDay(monthEnd));

  const selectedDayAppointments = useMemo(() => {
    const source = viewMode === "month" ? monthQuery.data || [] : dayQuery.data || [];
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return source
      .filter((appointment: AppointmentItem) =>
        isSameDay(new Date(appointment.start_time), selectedDate) &&
        !isCancelledAppointmentStatus(appointment.status, appointment.notes) &&
        appointment.type !== "block",
      )
      .filter((appointment: AppointmentItem) => {
        if (!normalizedSearch) return true;
        return `${appointment.patient_name || ""} ${appointment.notes || ""}`.toLowerCase().includes(normalizedSearch);
      })
      .sort((left: AppointmentItem, right: AppointmentItem) =>
        new Date(left.start_time).getTime() - new Date(right.start_time).getTime(),
      );
  }, [dayQuery.data, monthQuery.data, searchTerm, selectedDate, viewMode]);

  const appointmentsByDay = useMemo(() => {
    const counts: Record<string, number> = {};
    (monthQuery.data || [])
      .filter((appointment: AppointmentItem) =>
        !isCancelledAppointmentStatus(appointment.status, appointment.notes) && appointment.type !== "block",
      )
      .forEach((appointment: AppointmentItem) => {
        const key = format(new Date(appointment.start_time), "yyyy-MM-dd");
        counts[key] = (counts[key] || 0) + 1;
      });
    return counts;
  }, [monthQuery.data]);

  const calendarDays = useMemo(() => {
    const firstDay = startOfMonth(calendarMonth);
    const leadingDays = (getDay(firstDay) + 6) % 7;
    const days: Array<Date | null> = Array.from({ length: leadingDays }, () => null);
    for (let day = 1; day <= getDaysInMonth(calendarMonth); day += 1) {
      days.push(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day));
    }
    return days;
  }, [calendarMonth]);

  const selectToday = () => {
    const now = new Date();
    setSelectedDate(now);
    setCalendarMonth(now);
    setWeekOffset(0);
  };

  const selectWeekDay = (day: Date) => {
    setSelectedDate(day);
    if (!isSameMonth(day, calendarMonth)) setCalendarMonth(day);
  };

  const changeView = (nextView: ViewMode) => {
    setViewMode(nextView);
    setSearchTerm("");
    if (nextView === "month") setCalendarMonth(selectedDate);
  };

  const openAppointment = (appointment: AppointmentItem) => {
    const isPast = new Date(appointment.end_time) < new Date();
    const isOnline = appointment.type === "online" || appointment.type === "teleconsulta" || Boolean(appointment.google_meet_link);

    if (isOnline && !isPast) {
      navigate("/teleconsulta", { state: { activeAppointmentId: appointment.id } });
      return;
    }

    if (appointment.patient_id) {
      navigate(`/pacientes/${appointment.patient_id}`);
    }
  };

  const loading = viewMode === "month" ? monthQuery.isLoading : dayQuery.isLoading;

  return (
    <MobilePageScaffold>
      <MobilePageHeader
        eyebrow={format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
        title="Agenda"
        description="Alterne entre a semana e o mês sem perder o dia selecionado."
        actions={(
          <div className="flex gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                setSearchOpen((current) => !current);
                if (searchOpen) setSearchTerm("");
              }}
              className="h-10 w-10 rounded-[14px]"
            >
              {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              <span className="sr-only">{searchOpen ? "Fechar busca" : "Buscar"}</span>
            </Button>
            <NewAppointmentModal>
              <Button type="button" size="icon" className="h-10 w-10 rounded-[14px]">
                <Plus className="h-4 w-4" />
                <span className="sr-only">Novo agendamento</span>
              </Button>
            </NewAppointmentModal>
          </div>
        )}
      />

      <div className="space-y-4 pb-2">
        {searchOpen ? (
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/45" />
            <input
              autoFocus
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar paciente ou anotação"
              className="h-11 w-full rounded-[15px] border border-border/45 bg-card/70 pl-10 pr-4 text-sm outline-none focus:border-foreground/25 dark:border-white/10 dark:bg-white/[0.03]"
            />
          </div>
        ) : null}

        <MobileSegmentedControl
          value={viewMode}
          onValueChange={changeView}
          ariaLabel="Visualização da agenda"
          options={[
            { value: "week", label: "Semana", icon: List },
            { value: "month", label: "Mês", icon: Grid3X3 },
          ]}
        />

        {viewMode === "week" ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between rounded-[16px] border border-border/40 bg-card/65 p-1 dark:border-white/10 dark:bg-white/[0.025]">
              <Button variant="ghost" size="icon" onClick={() => setWeekOffset((current) => current - 1)} className="h-9 w-9 rounded-xl">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" onClick={selectToday} className="h-9 rounded-xl px-4 text-[8px] font-black uppercase tracking-[0.12em]">
                Hoje
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setWeekOffset((current) => current + 1)} className="h-9 w-9 rounded-xl">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
              {weekDays.map((day) => {
                const selected = isSameDay(day, selectedDate);
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => selectWeekDay(day)}
                    className={cn(
                      "flex min-w-[3.45rem] snap-start flex-col items-center rounded-[16px] border px-2 py-2.5 transition-colors active:opacity-80",
                      selected
                        ? "border-foreground bg-foreground text-background"
                        : isToday(day)
                          ? "border-border bg-foreground/[0.05] text-foreground"
                          : "border-transparent text-muted-foreground",
                    )}
                  >
                    <span className="text-[7px] font-black uppercase tracking-[0.11em] opacity-65">
                      {format(day, "EEE", { locale: ptBR }).slice(0, 3)}
                    </span>
                    <span className="mt-1 text-lg font-black leading-none">{format(day, "d")}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="space-y-3">
            <div className="flex items-center justify-between rounded-[16px] border border-border/40 bg-card/65 p-1 dark:border-white/10 dark:bg-white/[0.025]">
              <Button variant="ghost" size="icon" onClick={() => setCalendarMonth((current) => subMonths(current, 1))} className="h-9 w-9 rounded-xl">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <button type="button" onClick={selectToday} className="px-3 text-[10px] font-black capitalize tracking-[-0.01em] text-foreground">
                {format(calendarMonth, "MMMM yyyy", { locale: ptBR })}
              </button>
              <Button variant="ghost" size="icon" onClick={() => setCalendarMonth((current) => addMonths(current, 1))} className="h-9 w-9 rounded-xl">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="rounded-[20px] border border-border/40 bg-card/65 p-2.5 dark:border-white/10 dark:bg-white/[0.025]">
              <div className="grid grid-cols-7 gap-1">
                {["S", "T", "Q", "Q", "S", "S", "D"].map((label, index) => (
                  <div key={`${label}-${index}`} className="py-1 text-center text-[7px] font-black uppercase text-muted-foreground/45">{label}</div>
                ))}
                {calendarDays.map((day, index) => {
                  if (!day) return <div key={`empty-${index}`} className="aspect-square" />;
                  const selected = isSameDay(day, selectedDate);
                  const count = appointmentsByDay[format(day, "yyyy-MM-dd")] || 0;
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "relative flex aspect-square items-center justify-center rounded-[12px] text-[11px] font-black transition-colors",
                        selected
                          ? "bg-foreground text-background"
                          : isToday(day)
                            ? "bg-foreground/[0.06] text-foreground"
                            : "text-muted-foreground active:bg-foreground/[0.05]",
                      )}
                    >
                      {format(day, "d")}
                      {count > 0 ? (
                        <span className={cn("absolute bottom-1 h-1 w-1 rounded-full", selected ? "bg-background/60" : "bg-foreground/45")} />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        <section className="space-y-3">
          <MobileSectionHeader
            eyebrow={format(selectedDate, "EEEE", { locale: ptBR })}
            title={format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
            description={selectedDayAppointments.length ? `${selectedDayAppointments.length} compromisso${selectedDayAppointments.length === 1 ? "" : "s"}` : "Sem compromissos neste dia"}
          />

          {loading ? (
            <div className="space-y-2">
              <MobileSkeletonCard lines={1} />
              <MobileSkeletonCard lines={1} />
            </div>
          ) : selectedDayAppointments.length === 0 ? (
            <MobileEmptyState
              icon={CalendarIcon}
              title={searchTerm ? "Nada encontrado" : "Dia livre"}
              description={searchTerm ? "Nenhum compromisso corresponde à busca." : "Use este espaço para organizar notas, retornos ou criar um novo agendamento."}
              className="min-h-[230px] rounded-[20px] border border-dashed border-border/45"
              action={(
                <NewAppointmentModal>
                  <Button className="h-11 rounded-xl px-5 text-[8px] font-black uppercase tracking-[0.12em]">
                    <Plus className="mr-2 h-4 w-4" /> Novo agendamento
                  </Button>
                </NewAppointmentModal>
              )}
            />
          ) : (
            <div className="space-y-2">
              {selectedDayAppointments.map((appointment: AppointmentItem) => {
                const status = getAppointmentStatusMeta(appointment.status, appointment.notes);
                const isPast = new Date(appointment.end_time) < new Date();
                const online = appointment.type === "online" || appointment.type === "teleconsulta" || Boolean(appointment.google_meet_link);

                return (
                  <button
                    key={appointment.id}
                    type="button"
                    onClick={() => openAppointment(appointment)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-[18px] border border-border/40 bg-card/68 p-3.5 text-left transition-colors active:bg-foreground/[0.04] dark:border-white/10 dark:bg-white/[0.025]",
                      isPast && "opacity-50",
                    )}
                  >
                    <div className="shrink-0 text-center">
                      <p className="text-sm font-black text-foreground">{format(new Date(appointment.start_time), "HH:mm")}</p>
                      <p className="mt-1 text-[8px] font-medium text-muted-foreground/55">{format(new Date(appointment.end_time), "HH:mm")}</p>
                    </div>
                    <div className="min-w-0 flex-1 border-l border-border/40 pl-3 dark:border-white/10">
                      <p className="truncate text-[13px] font-black tracking-[-0.015em] text-foreground">{appointment.patient_name || "Paciente sem nome"}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-foreground/[0.045] px-2 py-1 text-[7px] font-black uppercase tracking-[0.09em] text-muted-foreground">
                          {online ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                          {online ? "Online" : "Presencial"}
                        </span>
                        <span className={cn("rounded-full px-2 py-1 text-[7px] font-black uppercase tracking-[0.09em]", status.softClassName, status.textClassName)}>
                          {status.label}
                        </span>
                      </div>
                      {appointment.notes ? <p className="mt-2 line-clamp-2 text-[9px] font-medium leading-relaxed text-muted-foreground/60">{appointment.notes}</p> : null}
                    </div>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/[0.035] text-[8px] font-black text-muted-foreground">
                      {getInitials(appointment.patient_name)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </MobilePageScaffold>
  );
};
