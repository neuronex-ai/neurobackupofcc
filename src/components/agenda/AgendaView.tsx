"use client";

import { useAppointmentsByRange } from '@/hooks/use-appointments-by-range';
import { useUpdateAppointment } from '@/hooks/use-update-appointment';
import { cn } from '@/lib/utils';
import { Appointment } from '@/types';
import { addDays, endOfWeek } from 'date-fns';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AgendaGridHeader } from './AgendaGridHeader';
import { DayColumn } from './DayColumn';
import { NewAppointmentModal } from './NewAppointmentModal';

const START_HOUR = 7;
const END_HOUR = 21;
const HOUR_HEIGHT = 80;
const MINUTE_HEIGHT = HOUR_HEIGHT / 60;
const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);

interface AgendaViewProps {
  weekStart: Date;
  privacyMode: boolean;
  view: 'week' | 'day';
  currentDate: Date;
}

export const AgendaView = ({ weekStart, privacyMode, view, currentDate }: AgendaViewProps) => {
  const [newAppointmentDate, setNewAppointmentDate] = useState<Date | undefined>();
  const [resizingAppointment, setResizingAppointment] = useState<{ appointment: Appointment, initialY: number, initialHeight: number } | null>(null);
  const { mutate: updateAppointment } = useUpdateAppointment();

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const { data: appointments } = useAppointmentsByRange(weekStart, weekEnd);

  const days = view === 'week' 
    ? Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    : [currentDate];

  const handleSlotDoubleClick = (date: Date) => {
    setNewAppointmentDate(date);
  };

  const handleResizeStart = (e: React.MouseEvent, appointment: Appointment) => {
    e.preventDefault();
    const target = e.currentTarget.closest('[data-appointment-id]') as HTMLElement;
    if (!target) return;
    
    setResizingAppointment({
      appointment,
      initialY: e.clientY,
      initialHeight: target.offsetHeight,
    });
  };

  // Optimized resizing logic attached to window only when active
  useEffect(() => {
    if (!resizingAppointment) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { appointment, initialY, initialHeight } = resizingAppointment;
      const deltaY = e.clientY - initialY;
      const newHeight = Math.max(30 * MINUTE_HEIGHT, initialHeight + deltaY);
      
      const appointmentElement = document.querySelector(`[data-appointment-id="${appointment.id}"]`) as HTMLElement;
      if (appointmentElement) {
        appointmentElement.style.height = `${newHeight}px`;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
        const { appointment, initialY, initialHeight } = resizingAppointment;
        const deltaY = e.clientY - initialY;
        const newHeight = Math.max(30 * MINUTE_HEIGHT, initialHeight + deltaY);
        
        // Round to nearest 15 minutes
        const durationMinutes = Math.round(newHeight / MINUTE_HEIGHT / 15) * 15;
        const newEndTime = new Date(new Date(appointment.start_time).getTime() + durationMinutes * 60000);

        updateAppointment(
          { id: appointment.id, updates: { end_time: newEndTime.toISOString() } },
          {
            onSuccess: () => toast.success("Duração atualizada."),
            onError: () => {
                toast.error("Falha ao atualizar.");
                const appointmentElement = document.querySelector(`[data-appointment-id="${appointment.id}"]`) as HTMLElement;
                if(appointmentElement) appointmentElement.style.height = `${initialHeight}px`;
            },
          }
        );
        setResizingAppointment(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingAppointment, updateAppointment]);

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0A0A0B]/20">
        <AgendaGridHeader days={days} />
        
        {/* Usando transform-gpu para acelerar renderização do scroll */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative transform-gpu">
          <div className="grid grid-cols-[auto_1fr] min-h-full">
            {/* Time Gutter */}
            <div className="w-20 text-right pr-6 text-xs text-muted-foreground font-mono relative border-r border-white/5 bg-white/[0.005]">
              {hours.map(hour => (
                <div key={hour} className="relative" style={{ height: `${HOUR_HEIGHT}px` }}>
                  <span className="absolute -top-2 right-4">{`${String(hour).padStart(2, '0')}:00`}</span>
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className={cn(
              "grid flex-1 divide-x divide-white/5",
              view === 'week' ? "grid-cols-7" : "grid-cols-1"
            )}>
              {days.map((day, index) => (
                <DayColumn
                  key={day.toISOString()}
                  day={day}
                  index={index}
                  appointments={appointments}
                  privacyMode={privacyMode}
                  onSlotDoubleClick={handleSlotDoubleClick}
                  onResizeStart={handleResizeStart}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      {newAppointmentDate && (
        <NewAppointmentModal
          initialDate={newAppointmentDate}
          onOpenChange={(isOpen) => !isOpen && setNewAppointmentDate(undefined)}
          open={!!newAppointmentDate}
        />
      )}
    </>
  );
};