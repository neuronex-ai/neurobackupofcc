import { useDroppable } from "@dnd-kit/core";
import { useMemo, useState, useEffect, memo } from "react";
import { cn } from "@/lib/utils";
import { isToday, isSameDay, getHours, getMinutes, setHours, setMinutes } from "date-fns";
import { DraggableAppointmentItem } from "./DraggableAppointmentItem";
import { Appointment } from "@/types";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const START_HOUR = 7;
const END_HOUR = 21;
const HOUR_HEIGHT = 80;
const MINUTE_HEIGHT = HOUR_HEIGHT / 60;
const TOTAL_HEIGHT = (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT;

interface DayColumnProps {
    day: Date;
    index: number;
    appointments: Appointment[] | undefined;
    privacyMode: boolean;
    onSlotDoubleClick: (date: Date) => void;
    onResizeStart: (e: React.MouseEvent, appointment: Appointment) => void;
}

const CurrentTimeLine = () => {
    const [offset, setOffset] = useState(-1);

    useEffect(() => {
        const updatePosition = () => {
            const now = new Date();
            const hour = now.getHours();
            const minutes = now.getMinutes();
            if (hour >= START_HOUR && hour <= END_HOUR) {
                setOffset(((hour - START_HOUR) * 60 + minutes) * MINUTE_HEIGHT);
            } else {
                setOffset(-1);
            }
        };
        updatePosition();
        const interval = setInterval(updatePosition, 60000);
        return () => clearInterval(interval);
    }, []);

    if (offset < 0) return null;

    return (
        <div className="absolute left-0 right-0 z-30 pointer-events-none flex items-center" style={{ top: `${offset}px` }}>
            <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))] ring-2 ring-[#101010]" />
            <div className="h-px w-full bg-primary" />
        </div>
    );
};

export const DayColumn = memo(({
    day,
    index,
    appointments,
    privacyMode,
    onSlotDoubleClick,
    onResizeStart
}: DayColumnProps) => {
    const { setNodeRef, isOver } = useDroppable({ id: `day-${index}`, data: { date: day, index } });
    const isTodayColumn = isToday(day);

    const dayAppointments = useMemo(() =>
        appointments?.filter(apt => isSameDay(new Date(apt.start_time), day)) || [],
        [appointments, day]);

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "relative border-r border-white/[0.04] last:border-r-0 group/column transition-colors duration-200",
                isOver && "bg-primary/5",
                isTodayColumn && "bg-white/[0.01]"
            )}
            onDoubleClick={(e) => {
                if (e.target !== e.currentTarget) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const y = e.clientY - rect.top;
                const minutesClicked = Math.floor(y / MINUTE_HEIGHT);
                const hourClicked = Math.floor(minutesClicked / 60) + START_HOUR;
                const minuteClicked = minutesClicked % 60;
                const roundedMinute = Math.floor(minuteClicked / 15) * 15;
                onSlotDoubleClick(setMinutes(setHours(day, hourClicked), roundedMinute));
            }}
            style={{
                height: TOTAL_HEIGHT,
                // CSS Trick: Linhas de grade desenhadas via gradiente (muito mais leve que divs)
                backgroundImage: `linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)`,
                backgroundSize: `100% ${HOUR_HEIGHT}px`
            }}
        >
            {isTodayColumn && <CurrentTimeLine />}

            {dayAppointments.map(apt => {
                const startTime = new Date(apt.start_time);
                const startMinutesTotal = (getHours(startTime) - START_HOUR) * 60 + getMinutes(startTime);
                const top = startMinutesTotal * MINUTE_HEIGHT;

                const endTime = new Date(apt.end_time);
                const durationMinutes = (endTime.getTime() - startTime.getTime()) / 60000;
                const height = durationMinutes * MINUTE_HEIGHT;

                if (top < 0) return null;

                return (
                    <DraggableAppointmentItem
                        key={apt.id}
                        appointment={apt}
                        geometry={{ top, height }}
                        privacyMode={privacyMode}
                        onResizeStart={onResizeStart}
                    />
                );
            })}

            {/* "+" Button for quick scheduling */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover/column:opacity-100 transition-opacity">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 text-primary pointer-events-auto hover:scale-110 transition-transform shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]"
                    onClick={() => {
                        const defaultDate = setHours(setMinutes(day, 9), 0); // Default to 09:00 if it's the current day or future
                        onSlotDoubleClick(defaultDate);
                    }}
                >
                    <Plus className="h-6 w-6" />
                </Button>
            </div>
        </div>
    );
});