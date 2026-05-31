import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Appointment } from "@/types";
import { cn } from "@/lib/utils";
import { AppointmentDetailModal } from "./AppointmentDetailModal";
import { Lock, Video, MapPin } from "lucide-react";
import { format } from "date-fns";

interface DraggableAppointmentItemProps {
  appointment: Appointment;
  geometry: { top: number; height: number };
  privacyMode: boolean;
  isOverlay?: boolean;
  onResizeStart?: (e: React.MouseEvent, appointment: Appointment) => void;
}

export const DraggableAppointmentItem = ({ 
    appointment, 
    geometry, 
    privacyMode, 
    isOverlay = false,
    onResizeStart
}: DraggableAppointmentItemProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ 
    id: appointment.id, 
    data: { appointment, geometry } 
  });
  
  const isOriginalBeingDragged = isDragging && !isOverlay;

  const style = {
    top: isOverlay ? 0 : `${geometry.top}px`,
    height: `${geometry.height}px`,
    transform: isOverlay ? undefined : CSS.Translate.toString(transform),
    zIndex: isOverlay ? 999 : (isDragging ? 50 : 20),
    opacity: isOriginalBeingDragged ? 0.3 : 1,
    left: '4px',
    right: '4px',
  };

  const isBlock = appointment.type === 'block';
  const isCancelled = appointment.status === 'cancelled';
  const isSmall = geometry.height < 50;

  if (isCancelled) return null;

  const title = isBlock ? (appointment.notes || "Bloqueio") : (privacyMode ? "Paciente" : appointment.patient_name);
  const timeRange = `${format(new Date(appointment.start_time), 'HH:mm')} - ${format(new Date(appointment.end_time), 'HH:mm')}`;

  const InnerContent = (
    <div
      data-appointment-id={appointment.id}
      className={cn(
          "h-full w-full rounded-lg overflow-hidden cursor-pointer select-none transition-all duration-200 group flex flex-col justify-center p-3 relative border-l-4",
          isBlock 
            ? "bg-zinc-800/70 border-zinc-600" 
            : "bg-zinc-900 border-primary shadow-lg shadow-black/20",
          isOverlay && "shadow-2xl scale-105 ring-2 ring-primary"
      )}
      {...listeners} 
      {...attributes}
    >
        <div className="flex items-start justify-between w-full">
            <div className="flex flex-col min-w-0">
                <span className={cn(
                    "font-semibold truncate leading-tight text-white",
                    isSmall ? "text-xs" : "text-sm",
                    isBlock && "text-zinc-400 italic"
                )}>
                    {title}
                </span>
                {!isSmall && (
                    <span className="text-xs text-white/50 font-mono font-medium truncate mt-0.5">
                        {timeRange}
                    </span>
                )}
            </div>
            
            <div className="flex items-center gap-1.5 text-white/40 shrink-0">
                {privacyMode && !isBlock && <Lock className="w-3.5 h-3.5" />}
                {!isBlock && (
                    appointment.type === 'online' ? <Video className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />
                )}
            </div>
        </div>
          
        {isBlock && (
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:6px_6px] opacity-50 pointer-events-none" />
        )}

        {/* Resize Handle */}
        {!isBlock && (
          <div 
              onMouseDown={(e) => { e.stopPropagation(); onResizeStart?.(e, appointment); }}
              className="absolute bottom-0 left-0 right-0 h-2.5 cursor-ns-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
              <div className="w-6 h-0.5 bg-white/30 rounded-full" />
          </div>
        )}
    </div>
  );

  if (isOverlay) return <div style={style} className="absolute w-full">{InnerContent}</div>;

  return (
    <div ref={setNodeRef} style={style} className="absolute" onDoubleClick={(e) => e.stopPropagation()}>
       <AppointmentDetailModal appointment={appointment}>
          {InnerContent}
       </AppointmentDetailModal>
    </div>
  );
};