"use client";

import { Appointment } from "@/types";
import { isSameDay, setMonth, setYear, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigation } from "react-day-picker";
import { normalizeAppointmentStatus } from "@/lib/appointment-status";

interface SidebarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  appointments: Appointment[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTag: string | null;
  onTagChange: (tag: string | null) => void;
}

const TAGS = ['Online', 'Presencial', 'Primeira Vez'];

const CustomCaption = () => {
  const { goToMonth, nextMonth, previousMonth, displayMonths } = useNavigation();
  const displayMonth = displayMonths[0];

  const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  return (
    <div className="mb-6 flex items-center justify-between px-1">
      <button
        onClick={() => previousMonth && goToMonth(previousMonth)}
        disabled={!previousMonth}
        className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] text-white/52 shadow-sm transition-all hover:bg-white/[0.12] hover:text-white active:scale-95 disabled:opacity-20 dark:border-zinc-950/10 dark:bg-zinc-950/[0.055] dark:text-zinc-950/52 dark:hover:bg-zinc-950/[0.08] dark:hover:text-zinc-950 motion-reduce:transition-none motion-reduce:active:scale-100"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-white transition-all hover:opacity-70 dark:text-zinc-950 motion-reduce:transition-none">
            {format(displayMonth, "MMMM yyyy", { locale: ptBR })}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] overflow-hidden rounded-[32px] border border-zinc-200 bg-white p-0 shadow-2xl dark:border-white/10 dark:bg-zinc-950" align="center" sideOffset={12}>
          <div className="flex flex-row h-[280px]">
            <ScrollArea className="w-[100px] border-r border-zinc-100 dark:border-white/[0.05] bg-zinc-50/50 dark:bg-white/[0.01]">
              <div className="flex flex-col p-3 gap-1.5">
                {years.map(year => (
                  <button
                    key={year}
                    onClick={() => goToMonth(setYear(displayMonth, year))}
                    className={cn(
                      "px-3 py-2 text-[9px] font-black rounded-xl transition-all text-left uppercase",
                      displayMonth.getFullYear() === year 
                        ? "bg-zinc-900 dark:bg-white text-white dark:text-black" 
                        : "text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    )}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </ScrollArea>
            <div className="flex-1 p-5 grid grid-cols-2 gap-2 content-start">
              {months.map((month, index) => (
                <button
                  key={month}
                  onClick={() => goToMonth(setMonth(displayMonth, index))}
                  className={cn(
                    "px-2 py-2.5 text-[8px] font-black uppercase tracking-wider rounded-xl transition-all border",
                    displayMonth.getMonth() === index 
                      ? "bg-zinc-900 dark:bg-white border-transparent text-white dark:text-black" 
                      : "bg-transparent border-zinc-100 dark:border-white/[0.03] text-zinc-400 hover:border-zinc-300 dark:hover:border-white/10"
                  )}
                >
                  {month.substring(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <button
        onClick={() => nextMonth && goToMonth(nextMonth)}
        disabled={!nextMonth}
        className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] text-white/52 shadow-sm transition-all hover:bg-white/[0.12] hover:text-white active:scale-95 disabled:opacity-20 dark:border-zinc-950/10 dark:bg-zinc-950/[0.055] dark:text-zinc-950/52 dark:hover:bg-zinc-950/[0.08] dark:hover:text-zinc-950 motion-reduce:transition-none motion-reduce:active:scale-100"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export const Sidebar = ({
  selectedDate,
  onDateChange,
  appointments,
  searchQuery,
  onSearchChange,
  selectedTag,
  onTagChange
}: SidebarProps) => {
  const todayAppointments = appointments.filter(app =>
    isSameDay(new Date(app.start_time), selectedDate)
  );

  const attended = todayAppointments.filter(a => normalizeAppointmentStatus(a.status, a.notes) === 'attended').length;
  const unscored = todayAppointments.filter(a => normalizeAppointmentStatus(a.status, a.notes) === 'unscored').length;

  return (
    <div className="custom-scrollbar flex h-full flex-col space-y-4 overflow-y-auto pr-1">
      
      {/* 1. Calendar Section - High Fidelity Monochrome */}
      <div className="relative shrink-0 overflow-hidden rounded-[34px] border border-zinc-950 bg-zinc-950 p-6 text-white shadow-[0_24px_74px_-56px_rgba(0,0,0,0.72)] ring-1 ring-white/[0.025] transition-all duration-500 dark:border-white dark:bg-white dark:text-zinc-950 dark:shadow-[0_24px_68px_-58px_rgba(255,255,255,0.32)] motion-reduce:transition-none">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(255,255,255,0.025),transparent_34%)] dark:bg-[radial-gradient(circle_at_16%_0%,rgba(0,0,0,0.035),transparent_34%)]" />
        
        <div className="relative z-10 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.08] shadow-sm dark:border-zinc-950/10 dark:bg-zinc-950/[0.055]">
              <CalendarIcon className="h-3.5 w-3.5 text-white/58 dark:text-zinc-950/56" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white dark:text-zinc-950">Calendário</span>
              <span className="text-[7px] font-bold uppercase tracking-widest text-white/38 dark:text-zinc-950/38">Agenda</span>
            </div>
          </div>
          <button
            onClick={() => onDateChange(new Date())}
            className="rounded-lg border border-white/10 bg-white/[0.08] px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-white/52 shadow-sm transition-all hover:bg-white/[0.12] hover:text-white dark:border-zinc-950/10 dark:bg-zinc-950/[0.055] dark:text-zinc-950/52 dark:hover:bg-zinc-950/[0.08] dark:hover:text-zinc-950 motion-reduce:transition-none"
          >
            Hoje
          </button>
        </div>

        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onDateChange(date)}
          locale={ptBR}
          className="relative z-10 w-full p-0"
          components={{
            Caption: CustomCaption
          }}
          classNames={{
            month: "space-y-4 w-full",
            caption: "hidden",
            nav: "hidden",
            table: "w-full border-collapse",
            head_row: "flex w-full justify-between mb-4",
            head_cell: "text-white/24 dark:text-zinc-950/28 w-8 font-black text-[8px] uppercase text-center",
            row: "flex w-full mt-1.5 justify-between px-0.5",
            cell: "h-8 w-8 text-center text-[10px] p-0 relative flex items-center justify-center",
            day: "h-7 w-7 p-0 font-bold text-white/45 dark:text-zinc-950/45 hover:text-white dark:hover:text-zinc-950 hover:bg-white/[0.08] dark:hover:bg-zinc-950/[0.055] rounded-lg transition-all flex items-center justify-center",
            day_selected: "!bg-white dark:!bg-zinc-950 !text-zinc-950 dark:!text-white font-black shadow-lg rounded-lg scale-105",
            day_today: "text-white dark:text-zinc-950 font-black ring-1 ring-white/20 dark:ring-zinc-950/20",
            day_outside: "text-white/12 dark:text-zinc-950/12 opacity-50",
            day_disabled: "opacity-10",
          }}
        />
      </div>

      {/* 2. Metrics Section - Unified Monochrome */}
      <div className="grid shrink-0 grid-cols-2 gap-3 px-0.5">
        <MetricCard label="Presenças" value={attended} />
        <MetricCard label="Não pontuados" value={unscored} />
      </div>

      {/* 3. Search & Filters - Minimalist Area */}
      <div className="flex flex-1 flex-col gap-8 rounded-[34px] border border-border/65 bg-card/70 p-6 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.035]">
        
        {/* Search Block */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 opacity-40">
            <Search className="h-3 w-3" />
            <label className="text-[8px] font-black uppercase tracking-[0.3em]">Buscar Paciente</label>
          </div>
          <div className="relative">
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Digite o nome..."
              className="h-11 rounded-2xl border-zinc-200 bg-white px-5 text-[10px] font-bold text-zinc-900 shadow-sm transition-all placeholder:text-zinc-300 focus:ring-0 dark:border-white/[0.08] dark:bg-zinc-950 dark:text-white motion-reduce:transition-none"
            />
          </div>
        </div>

        {/* Tags Block */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 opacity-40">
            <Filter className="h-3 w-3" />
            <span className="text-[8px] font-black uppercase tracking-[0.3em]">Filtros</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => onTagChange(selectedTag === tag ? null : tag)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all border",
                  selectedTag === tag
                    ? "scale-105 border-transparent bg-zinc-950 text-white shadow-md dark:bg-white dark:text-zinc-950"
                    : "border-zinc-200 bg-white text-zinc-400 hover:text-zinc-950 dark:border-white/[0.08] dark:bg-white/[0.045] dark:hover:text-white"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Brand Accent */}
        <div className="mt-auto pt-6 border-t border-zinc-200/50 dark:border-white/[0.03] flex items-center justify-between opacity-30">
          <span className="text-[7px] font-black uppercase tracking-[0.3em]">Synapse Agenda</span>
          <div className="w-1 h-1 rounded-full bg-zinc-900 dark:bg-white" />
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value }: { label: string, value: number }) => (
  <div className="group rounded-[24px] border border-border/65 bg-card/78 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-white/[0.08] dark:bg-white/[0.04] dark:hover:border-white/14 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">{label}</span>
        <div className="h-0.5 w-3 bg-zinc-100 dark:bg-white/[0.05] group-hover:w-6 transition-all" />
      </div>
      <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter leading-none">
        {value.toString().padStart(2, '0')}
      </span>
    </div>
  </div>
);
