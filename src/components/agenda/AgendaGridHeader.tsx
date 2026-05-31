"use client";

import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DayActionMenu } from './DayActionMenu';

interface AgendaGridHeaderProps {
  days: Date[];
}

export const AgendaGridHeader = ({ days }: AgendaGridHeaderProps) => {
  return (
    <div className="grid grid-cols-[auto_1fr] sticky top-0 z-20 bg-black/40 backdrop-blur-md border-b border-white/5">
      <div className="w-20 border-r border-white/5" /> {/* Spacer for time gutter */}
      <div className={cn(
        "grid flex-1 divide-x divide-white/5",
        days.length === 7 ? "grid-cols-7" : "grid-cols-1"
      )}>
        {days.map(day => (
          <div key={day.toISOString()} className="flex flex-col items-center justify-center py-3 bg-white/[0.01] relative group">
            
            {/* Header Content */}
            <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {format(day, 'EEE', { locale: ptBR })}
                </span>
                <span className={cn(
                "text-2xl font-light mt-1",
                isToday(day) ? "text-primary font-bold" : "text-white"
                )}>
                {format(day, 'd')}
                </span>
            </div>

            {/* Action Menu (Top Right of Column Header) */}
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <DayActionMenu date={day} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};