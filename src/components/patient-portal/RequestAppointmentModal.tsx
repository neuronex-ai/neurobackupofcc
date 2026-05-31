import { useAuth } from "@/components/auth/SessionContextProvider";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePatientData } from "@/hooks/use-patient-data";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { addMinutes, format, setHours, setMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, CalendarPlus, CheckCircle, Loader2, MapPin, Video } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const RequestAppointmentSchema = z.object({
  date: z.date({ required_error: "Selecione uma data." }),
  time: z.string({ required_error: "Selecione um horário." }),
  type: z.enum(["presencial", "online"], { required_error: "Selecione o tipo." }),
});

type RequestAppointmentFormValues = z.infer<typeof RequestAppointmentSchema>;

interface RequestAppointmentModalProps {
  children?: React.ReactNode;
}

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", 
  "13:00", "14:00", "15:00", "16:00", 
  "17:00", "18:00", "19:00"
];

export const RequestAppointmentModal = ({ children }: RequestAppointmentModalProps) => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { data: patientData } = usePatientData(user?.email || '');
  const isMobile = useIsMobile();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RequestAppointmentFormValues>({
    resolver: zodResolver(RequestAppointmentSchema),
    defaultValues: {
        type: "online",
        date: new Date(),
    }
  });

  const onSubmit = async (values: RequestAppointmentFormValues) => {
    if (!patientData) {
        toast.error("Erro ao identificar perfil.");
        return;
    }

    setIsSubmitting(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
        const [hour, minute] = values.time.split(':').map(Number);
        const startTime = setMinutes(setHours(values.date, hour), minute);
        const endTime = addMinutes(startTime, 50);

        const { supabase } = await import("@/integrations/supabase/client");
        
        const { error } = await supabase.from('appointments').insert({
            user_id: patientData.user_id, // Therapist ID
            patient_id: patientData.id,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            type: values.type,
            status: 'pending',
            notes: 'Solicitação via Portal do Paciente'
        });

        if (error) throw error;

        toast.success("Solicitação enviada com sucesso!");
        setOpen(false);
        form.reset();
    } catch (error: any) {
        console.error(error);
        toast.error("Erro ao enviar solicitação.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const TriggerButton = children || (
    <Button className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-glow rounded-xl px-4 h-10 transition-all hover:scale-105 active:scale-95">
      <CalendarPlus className="h-4 w-4 stroke-[2.5]" />
      <span className="font-bold text-xs uppercase tracking-wide">Novo Horário</span>
    </Button>
  );

  const Header = () => (
    <div className="text-center mb-8 pt-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(139,92,246,0.2)]">
            <CalendarPlus className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Solicitar Agendamento</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-[240px] mx-auto">
            Escolha sua preferência. Seu terapeuta confirmará a disponibilidade.
        </p>
    </div>
  );

  const FormContent = () => (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Type Selection - Visual Cards */}
            <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
                <FormItem className="space-y-3">
                    <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider font-bold ml-1">Modalidade</FormLabel>
                    <FormControl>
                        <RadioGroup 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            className="grid grid-cols-2 gap-3"
                        >
                            <FormItem>
                                <FormControl>
                                    <RadioGroupItem value="online" id="online" className="peer sr-only" />
                                </FormControl>
                                <label
                                    htmlFor="online"
                                    className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border border-white/10 bg-white/[0.02] peer-aria-checked:bg-primary/10 peer-aria-checked:border-primary/50 peer-aria-checked:text-white cursor-pointer transition-all hover:bg-white/[0.05]"
                                >
                                    <Video className="h-6 w-6 text-primary" />
                                    <span className="text-xs font-bold uppercase tracking-wide">Online</span>
                                </label>
                            </FormItem>
                            <FormItem>
                                <FormControl>
                                    <RadioGroupItem value="presencial" id="presencial" className="peer sr-only" />
                                </FormControl>
                                <label
                                    htmlFor="presencial"
                                    className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border border-white/10 bg-white/[0.02] peer-aria-checked:bg-emerald-500/10 peer-aria-checked:border-emerald-500/50 peer-aria-checked:text-white cursor-pointer transition-all hover:bg-white/[0.05]"
                                >
                                    <MapPin className="h-6 w-6 text-emerald-500" />
                                    <span className="text-xs font-bold uppercase tracking-wide">Presencial</span>
                                </label>
                            </FormItem>
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
            />

            {/* Date Selection */}
            <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                <FormItem className="flex flex-col space-y-3">
                    <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider font-bold ml-1">Data</FormLabel>
                    <Popover>
                    <PopoverTrigger asChild>
                        <FormControl>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full h-12 pl-4 text-left font-normal bg-white/[0.03] border-white/10 hover:bg-white/[0.08] hover:text-white rounded-xl transition-all",
                            !field.value && "text-muted-foreground"
                            )}
                        >
                            {field.value ? format(field.value, "EEEE, dd 'de' MMMM", { locale: ptBR }) : <span>Selecione uma data</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                        </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-white/10 bg-[#0A0A0B] rounded-2xl shadow-2xl" align="center">
                        <Calendar 
                            mode="single" 
                            selected={field.value} 
                            onSelect={field.onChange} 
                            initialFocus 
                            locale={ptBR} 
                            disabled={(date) => date < new Date()}
                            className="p-3"
                        />
                    </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
                )}
            />
            
            {/* Time Grid Selection */}
            <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                <FormItem className="space-y-3">
                    <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider font-bold ml-1">Horários Sugeridos</FormLabel>
                    <div className="grid grid-cols-4 gap-2">
                        {timeSlots.map((time) => (
                            <div key={time} className="relative">
                                <input
                                    type="radio"
                                    id={`time-${time}`}
                                    name="time"
                                    value={time}
                                    checked={field.value === time}
                                    onChange={field.onChange}
                                    className="peer sr-only"
                                />
                                <label
                                    htmlFor={`time-${time}`}
                                    className="flex items-center justify-center h-10 rounded-lg border border-white/10 bg-white/[0.02] text-xs font-medium text-muted-foreground cursor-pointer transition-all peer-checked:bg-white peer-checked:text-black peer-checked:font-bold hover:bg-white/[0.05]"
                                >
                                    {time}
                                </label>
                            </div>
                        ))}
                    </div>
                    <FormMessage />
                </FormItem>
                )}
            />

            <Button 
                type="submit" 
                className="w-full h-14 rounded-2xl shadow-lg mt-4 bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-widest gap-3 transition-all active:scale-95"
                disabled={isSubmitting}
            >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {isSubmitting ? "Enviando..." : "Confirmar Solicitação"}
            </Button>
        </form>
    </Form>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {TriggerButton}
        </DrawerTrigger>
        <DrawerContent className="bg-[#0A0A0B] border-t border-white/10 max-h-[90vh] outline-none">
            <div className="p-6 overflow-y-auto pb-10">
                <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/10 mb-2" />
                <Header />
                <FormContent />
            </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {TriggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] p-0 border border-white/10 bg-[#0A0A0B] shadow-2xl rounded-[32px] overflow-hidden outline-none">
        <div className="p-8 max-h-[85vh] overflow-y-auto custom-scrollbar">
            <Header />
            <FormContent />
        </div>
      </DialogContent>
    </Dialog>
  );
};