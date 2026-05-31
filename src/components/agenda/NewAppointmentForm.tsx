import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Loader2, Plus, Ban, MapPin, Video, Sparkles } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, setHours, setMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePatients } from "@/hooks/use-patients";
import { useAddAppointment } from "@/hooks/use-add-appointment";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSmartAvailability, AvailableSlot } from "@/hooks/use-smart-availability";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAppointments } from "@/hooks/use-appointments";
import { toast } from "sonner";

const FormSchema = z.object({
  type: z.enum(["presencial", "online", "block"], { required_error: "O tipo é obrigatório." }),
  patient_id: z.string().optional(),
  date: z.date({ required_error: "A data é obrigatória." }),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, { message: "Formato de hora inválido." }),
  duration: z.string().min(1, { message: "Duração é obrigatória." }),
  notes: z.string().optional(),
  location: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.type !== 'block' && !data.patient_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Selecione um paciente.",
      path: ['patient_id'],
    });
  }
  if (data.type === 'presencial' && !data.location) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Endereço obrigatório.",
      path: ['location'],
    });
  }
});

type NewAppointmentFormValues = z.infer<typeof FormSchema>;

interface NewAppointmentFormProps {
  onSuccess: () => void;
  initialDate?: Date;
}

// Will compute dynamically based on working hours

const durationOptions = [
  { value: "30", label: "30 min" },
  { value: "50", label: "50 min" },
  { value: "60", label: "1 hora" },
  { value: "90", label: "1h 30m" },
  { value: "120", label: "2 horas" },
];

export const NewAppointmentForm = ({ onSuccess, initialDate }: NewAppointmentFormProps) => {
  const { user } = useAuth();
  const { data: patients, isLoading: isLoadingPatients } = usePatients();
  const { mutate, isPending } = useAddAppointment();

  // Smart Availability Logic
  const { findSlots, slots, isSearching } = useSmartAvailability();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [workingHours, setWorkingHours] = useState<any>(null);

  const { data: allAppointments } = useAppointments();

  useEffect(() => {
    if (user?.id) {
      supabase.from('profiles').select('working_hours').eq('id', user.id).single()
        .then(({ data }) => {
          if (data?.working_hours) setWorkingHours(data.working_hours);
        });
    }
  }, [user]);

  const form = useForm<NewAppointmentFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      patient_id: "",
      date: initialDate || new Date(),
      startTime: initialDate ? format(initialDate, 'HH:mm') : '09:00',
      duration: "50",
      type: "presencial",
      notes: "",
      location: "",
    },
  });

  const appointmentType = form.watch("type");
  const selectedDate = form.watch("date");

  const timeSlots = useMemo(() => {
    let startHour = 7;
    let endHour = 20;

    if (workingHours && selectedDate) {
      const dayId = selectedDate.getDay().toString();
      const hw = workingHours[dayId];
      if (hw && typeof hw.enabled === 'boolean') {
        if (!hw.enabled) return []; // Dia inativo
        startHour = parseInt(hw.start.split(':')[0]);
        endHour = parseInt(hw.end.split(':')[0]);
      }
    }

    const generatedSlots = [];
    for (let i = startHour; i <= endHour; i++) {
      generatedSlots.push(`${String(i).padStart(2, '0')}:00`);
      generatedSlots.push(`${String(i).padStart(2, '0')}:30`);
    }

    const now = new Date();
    if (selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')) {
      return generatedSlots.filter(time => {
        const [h, m] = time.split(':').map(Number);
        const slotDate = new Date(now);
        slotDate.setHours(h, m, 0, 0);
        return slotDate > now;
      });
    }

    return generatedSlots;
  }, [workingHours, selectedDate]);

  const handleFindSlots = () => {
    if (!user) return;

    // Configurações padrão de busca: próximos 5 dias, 50min, período 'all'
    findSlots({
      startDate: new Date(),
      daysToScan: 5,
      durationMinutes: 50,
      period: 'all',
      userId: user.id
    });
    setShowSuggestions(true);
  };

  const handleSelectSlot = (slot: AvailableSlot) => {
    form.setValue('date', slot.start);
    form.setValue('startTime', format(slot.start, 'HH:mm'));
    setShowSuggestions(false);
  };

  const onSubmit = (values: NewAppointmentFormValues) => {
    const [hour, minute] = values.startTime.split(':').map(Number);

    let startTime = values.date;
    startTime = setHours(startTime, hour);
    startTime = setMinutes(startTime, minute);

    const durationMinutes = parseInt(values.duration, 10);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    const patientId = values.type === 'block' || !values.patient_id ? null : values.patient_id;

    const appointmentData = {
      patient_id: patientId,
      start_time: startTime,
      end_time: endTime,
      type: values.type,
      notes: values.notes || (values.type === 'block' ? "Bloqueio de Agenda" : ""),
      location: values.type === 'presencial' ? values.location || null : null,
    };

    const now = new Date();
    if (startTime < now) {
      toast.error("Não é possível agendar consultas em horários retroativos.");
      return;
    }

    if (workingHours) {
      const dayId = startTime.getDay().toString();
      const hw = workingHours[dayId];
      if (hw && !hw.enabled) {
        toast.error("Você não atende neste dia da semana (verifique suas configurações de grade).");
        return;
      }
    }

    const hasConflict = allAppointments?.some(app => {
      if (app.status === 'cancelled') return false;
      const appStart = new Date(app.start_time);
      const appEnd = new Date(app.end_time);
      return startTime < appEnd && endTime > appStart;
    });

    if (hasConflict) {
      toast.error("Já existe um agendamento ou bloqueio neste horário.");
      return;
    }

    mutate(appointmentData, {
      onSuccess: () => {
        form.reset();
        onSuccess();
      },
    });
  };

  const inputStyle = "bg-zinc-900/50 border-white/5 focus:bg-zinc-900 focus:border-white/20 h-10 rounded-lg transition-all text-zinc-200 placeholder:text-zinc-600";
  const labelStyle = "text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1.5";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className={labelStyle}>Tipo de Evento</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-3 gap-2"
                >
                  <FormItem>
                    <RadioGroupItem value="presencial" id="presencial" className="sr-only peer" />
                    <FormLabel htmlFor="presencial" className="flex flex-col items-center justify-center rounded-lg border border-white/5 bg-zinc-900/30 p-3 hover:bg-zinc-800 hover:text-white peer-data-[state=checked]:border-white/20 peer-data-[state=checked]:bg-zinc-800 cursor-pointer text-zinc-400 transition-all">
                      <MapPin className="mb-2 h-4 w-4" />
                      <span className="text-xs font-medium">Presencial</span>
                    </FormLabel>
                  </FormItem>
                  <FormItem>
                    <RadioGroupItem value="online" id="online" className="sr-only peer" />
                    <FormLabel htmlFor="online" className="flex flex-col items-center justify-center rounded-lg border border-white/5 bg-zinc-900/30 p-3 hover:bg-zinc-800 hover:text-white peer-data-[state=checked]:border-white/20 peer-data-[state=checked]:bg-zinc-800 cursor-pointer text-zinc-400 transition-all">
                      <Video className="mb-2 h-4 w-4" />
                      <span className="text-xs font-medium">Online</span>
                    </FormLabel>
                  </FormItem>
                  <FormItem>
                    <RadioGroupItem value="block" id="block" className="sr-only peer" />
                    <FormLabel htmlFor="block" className="flex flex-col items-center justify-center rounded-lg border border-white/5 bg-zinc-900/30 p-3 hover:bg-zinc-800 hover:text-white peer-data-[state=checked]:border-white/20 peer-data-[state=checked]:bg-zinc-800 cursor-pointer text-zinc-400 transition-all">
                      <Ban className="mb-2 h-4 w-4" />
                      <span className="text-xs font-medium">Bloqueio</span>
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {appointmentType !== 'block' && (
          <FormField
            control={form.control}
            name="patient_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyle}>Paciente</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger disabled={isLoadingPatients} className={inputStyle}>
                      <SelectValue placeholder={isLoadingPatients ? "Carregando..." : "Selecione um paciente"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-zinc-950 border-zinc-800">
                    {patients?.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* --- SMART SLOT FINDER SECTION --- */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <FormLabel className={labelStyle}>Data e Hora</FormLabel>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleFindSlots}
              disabled={isSearching}
              className="h-6 text-[10px] text-primary hover:text-primary/80 hover:bg-primary/10 px-2 rounded-full font-bold uppercase tracking-wide gap-1"
            >
              {isSearching ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              Sugerir Horários
            </Button>
          </div>

          <AnimatePresence>
            {showSuggestions && slots.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl grid grid-cols-3 gap-2 mb-4">
                  {slots.slice(0, 6).map((slot, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectSlot(slot)}
                      className="flex flex-col items-center p-2 rounded-lg bg-black/40 border border-white/5 hover:border-primary/30 hover:bg-primary/10 transition-all group"
                    >
                      <span className="text-[10px] font-bold text-zinc-400 group-hover:text-primary uppercase">{format(slot.start, 'EEE, dd')}</span>
                      <span className="text-sm font-bold text-white group-hover:text-primary">{format(slot.start, 'HH:mm')}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col sm:col-span-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full justify-start text-left font-normal bg-zinc-900/50 border-white/5 hover:bg-zinc-900 hover:text-white text-zinc-300", !field.value && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "dd/MM") : <span>Selecione</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-zinc-950 border-zinc-800" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem className="sm:col-span-1">
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={inputStyle}><SelectValue placeholder="Hora" /></SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-zinc-950 border-zinc-800 h-48">
                      {timeSlots.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem className="sm:col-span-1">
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className={inputStyle}><SelectValue placeholder="Duração" /></SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-zinc-950 border-zinc-800">
                      {durationOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {appointmentType === 'presencial' && (
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelStyle}>Endereço</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Consultório Principal" {...field} className={inputStyle} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelStyle}>
                {appointmentType === 'block' ? "Motivo do Bloqueio" : "Notas"}
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={appointmentType === 'block' ? "Ex: Almoço, Reunião..." : "Notas sobre o agendamento..."}
                  {...field}
                  rows={3}
                  className="bg-zinc-900/50 border-white/5 focus:bg-zinc-900 focus:border-white/20 rounded-lg text-zinc-200 placeholder:text-zinc-600 resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full h-11 bg-white text-black hover:bg-white/90 font-bold shadow-lg shadow-white/5 rounded-xl uppercase tracking-widest text-xs" disabled={isPending || (appointmentType !== 'block' && isLoadingPatients)}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : appointmentType === 'block' ? (
            <Ban className="h-4 w-4 mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          {isPending ? "Salvando..." : appointmentType === 'block' ? "Bloquear Horário" : "Confirmar Agendamento"}
        </Button>
      </form>
    </Form>
  );
};