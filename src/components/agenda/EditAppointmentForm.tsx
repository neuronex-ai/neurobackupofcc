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
import { Calendar as CalendarIcon, Loader2, Ban, MapPin, Video } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, setHours, setMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePatients } from "@/hooks/use-patients";
import { useUpdateAppointment } from "@/hooks/use-update-appointment";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Appointment } from "@/types";

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

type EditAppointmentFormValues = z.infer<typeof FormSchema>;

interface EditAppointmentFormProps {
  appointment: Appointment;
  onSuccess: () => void;
}

const timeSlots = Array.from({ length: (20 - 7) * 2 }, (_, i) => {
  const hour = 7 + Math.floor(i / 2);
  const minute = (i % 2) * 30;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
});

const durationOptions = [
  { value: "30", label: "30 minutos" },
  { value: "50", label: "50 minutos" },
  { value: "60", label: "1 hora" },
  { value: "90", label: "1 hora e 30 minutos" },
  { value: "120", label: "2 horas" },
];

export const EditAppointmentForm = ({ appointment, onSuccess }: EditAppointmentFormProps) => {
  const { data: patients, isLoading: isLoadingPatients } = usePatients();
  const { mutate, isPending } = useUpdateAppointment();

  const startTime = new Date(appointment.start_time);
  const endTime = new Date(appointment.end_time);
  const durationMinutes = (endTime.getTime() - startTime.getTime()) / 60000;

  const form = useForm<EditAppointmentFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      patient_id: appointment.patient_id || "",
      date: startTime,
      startTime: format(startTime, 'HH:mm'),
      duration: String(durationMinutes),
      type: appointment.type,
      notes: appointment.notes || "",
      location: appointment.location || "",
    },
  });

  const appointmentType = form.watch("type");

  const onSubmit = (values: EditAppointmentFormValues) => {
    const [hour, minute] = values.startTime.split(':').map(Number);

    let newStartTime = values.date;
    newStartTime = setHours(newStartTime, hour);
    newStartTime = setMinutes(newStartTime, minute);

    const newDurationMinutes = parseInt(values.duration, 10);
    const newEndTime = new Date(newStartTime.getTime() + newDurationMinutes * 60000);

    const patientId = values.type === 'block' || !values.patient_id ? null : values.patient_id;

    const appointmentData = {
      patient_id: patientId,
      start_time: newStartTime.toISOString(),
      end_time: newEndTime.toISOString(),
      type: values.type,
      notes: values.notes || (values.type === 'block' ? "Bloqueio de Agenda" : ""),
      location: values.type === 'presencial' ? values.location || null : null,
    };

    mutate({ id: appointment.id, updates: appointmentData }, {
      onSuccess: () => {
        onSuccess();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Tipo de Evento</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-3 gap-3"
                >
                  <FormItem>
                    <RadioGroupItem value="presencial" id="presencial-edit" className="sr-only peer" />
                    <FormLabel htmlFor="presencial-edit" className="flex flex-col items-center justify-center rounded-2xl border-2 border-white/[0.08] bg-white/[0.03] p-5 hover:bg-white/[0.05] transition-all peer-data-[state=checked]:bg-zinc-900 dark:peer-data-[state=checked]:bg-white peer-data-[state=checked]:text-white dark:peer-data-[state=checked]:text-zinc-950 peer-data-[state=checked]:border-zinc-900 dark:peer-data-[state=checked]:border-white cursor-pointer shadow-xl">
                      <MapPin className="mb-2 h-6 w-6" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Presencial</span>
                    </FormLabel>
                  </FormItem>
                  <FormItem>
                    <RadioGroupItem value="online" id="online-edit" className="sr-only peer" />
                    <FormLabel htmlFor="online-edit" className="flex flex-col items-center justify-center rounded-2xl border-2 border-white/[0.08] bg-white/[0.03] p-5 hover:bg-white/[0.05] transition-all peer-data-[state=checked]:bg-zinc-900 dark:peer-data-[state=checked]:bg-white peer-data-[state=checked]:text-white dark:peer-data-[state=checked]:text-zinc-950 peer-data-[state=checked]:border-zinc-900 dark:peer-data-[state=checked]:border-white cursor-pointer shadow-xl">
                      <Video className="mb-2 h-6 w-6" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Online</span>
                    </FormLabel>
                  </FormItem>
                  <FormItem>
                    <RadioGroupItem value="block" id="block-edit" className="sr-only peer" />
                    <FormLabel htmlFor="block-edit" className="flex flex-col items-center justify-center rounded-2xl border-2 border-white/[0.08] bg-white/[0.03] p-5 hover:bg-white/[0.05] transition-all peer-data-[state=checked]:bg-zinc-900 dark:peer-data-[state=checked]:bg-white peer-data-[state=checked]:text-white dark:peer-data-[state=checked]:text-zinc-950 peer-data-[state=checked]:border-zinc-900 dark:peer-data-[state=checked]:border-white cursor-pointer shadow-xl">
                      <Ban className="mb-2 h-6 w-6" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Bloqueio</span>
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
                <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Paciente</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger disabled={isLoadingPatients}>
                      <SelectValue placeholder={isLoadingPatients ? "Carregando..." : "Selecione um paciente"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col sm:col-span-1">
                <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Data</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "dd/MM/yyyy") : <span>Selecione</span>}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
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
                <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Início</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Hora" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
                <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Duração</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Duração" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {durationOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {appointmentType === 'presencial' && (
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Endereço</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Consultório Principal" {...field} />
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
              <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                {appointmentType === 'block' ? "Motivo do Bloqueio" : "Notas"}
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={appointmentType === 'block' ? "Ex: Almoço, Reunião..." : "Notas sobre o agendamento..."}
                  {...field}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full h-14 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 font-black uppercase text-[10px] tracking-[0.4em] shadow-2xl transition-all hover:scale-[1.02] active:scale-95 duration-500" disabled={isPending || isLoadingPatients}>
          {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Salvar Ajustes"}
        </Button>
      </form>
    </Form>
  );
};