import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NewRecurringAppointmentSchema, NewRecurringAppointmentFormValues } from "@/lib/validation";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
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
import { Calendar as CalendarIcon, Loader2, Repeat, Clock, MapPin, Video, CalendarDays, ArrowRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePatients } from "@/hooks/use-patients";
import { useAddRecurringAppointment } from "@/hooks/use-add-recurring-appointment";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface NewRecurringAppointmentFormProps {
    onSuccess: () => void;
    initialDate?: Date;
}

const timeSlots = Array.from({ length: (20 - 7) * 2 }, (_, i) => {
    const hour = 7 + Math.floor(i / 2);
    const minute = (i % 2) * 30;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
});

export const NewRecurringAppointmentForm = ({ onSuccess, initialDate }: NewRecurringAppointmentFormProps) => {
    const { data: patients, isLoading: isLoadingPatients } = usePatients();
    const { mutate, isPending } = useAddRecurringAppointment();

    const form = useForm<NewRecurringAppointmentFormValues>({
        resolver: zodResolver(NewRecurringAppointmentSchema),
        defaultValues: {
            patient_id: "",
            date: initialDate || new Date(),
            startTime: initialDate ? format(initialDate, 'HH:mm') : '09:00',
            duration: "50",
            type: "presencial",
            notes: "",
            location: "",
            repetition: "weekly",
            endDate: initialDate ? new Date(initialDate.getFullYear(), initialDate.getMonth() + 3, initialDate.getDate()) : addMonths(new Date(), 3),
        },
    });

    const appointmentType = form.watch("type");
    const repetitionType = form.watch("repetition");
    const startDate = form.watch("date");

    const onSubmit = (values: NewRecurringAppointmentFormValues) => {
        mutate(values, {
            onSuccess: () => {
                form.reset();
                onSuccess();
            },
        });
    };

    // Helper para estimar quantidade de sessões
    const getEstimatedSessions = () => {
        const end = form.watch("endDate");
        if (!startDate || !end) return 0;

        const diffTime = Math.abs(end.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (repetitionType === 'weekly') return Math.floor(diffDays / 7);
        if (repetitionType === 'biweekly') return Math.floor(diffDays / 14);
        if (repetitionType === 'monthly') return Math.floor(diffDays / 30);
        return 0;
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                {/* Paciente Selector - Highlighted */}
                <FormField
                    control={form.control}
                    name="patient_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider font-semibold ml-1">Paciente</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger disabled={isLoadingPatients} className="h-12 bg-[#151518] border-white/10 rounded-xl text-white focus:ring-primary/20">
                                        <SelectValue placeholder={isLoadingPatients ? "Carregando..." : "Selecione o paciente"} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-[#151518] border-white/10">
                                    {patients?.map((patient) => (
                                        <SelectItem key={patient.id} value={patient.id} className="text-sm">
                                            {patient.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Configuration Block */}
                <div className="p-5 rounded-[24px] bg-white/[0.02] border border-white/5 space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                            <Clock className="h-4 w-4" />
                        </div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Horário & Frequência</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel className="text-[10px] text-zinc-500 font-bold uppercase">Início</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn("w-full h-11 pl-3 text-left font-normal bg-black/20 border-white/10 hover:bg-black/40 rounded-xl", !field.value && "text-muted-foreground")}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                                    {field.value ? format(field.value, "dd/MM") : <span>Data</span>}
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 bg-[#0A0A0B] border-white/10" align="start">
                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} />
                                        </PopoverContent>
                                    </Popover>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="startTime"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] text-zinc-500 font-bold uppercase">Hora</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-11 bg-black/20 border-white/10 rounded-xl"><SelectValue placeholder="Hora" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-[#151518] border-white/10 h-48">
                                            {timeSlots.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="repetition"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] text-zinc-500 font-bold uppercase">Repetição</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="grid grid-cols-3 gap-2"
                                    >
                                        {['weekly', 'biweekly', 'monthly'].map((opt) => (
                                            <FormItem key={opt} className="space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value={opt} id={opt} className="peer sr-only" />
                                                </FormControl>
                                                <label
                                                    htmlFor={opt}
                                                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/5 bg-white/[0.02] peer-aria-checked:bg-primary/10 peer-aria-checked:border-primary/40 peer-aria-checked:text-primary cursor-pointer transition-all hover:bg-white/[0.05]"
                                                >
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">
                                                        {opt === 'weekly' ? 'Semanal' : opt === 'biweekly' ? 'Quinzenal' : 'Mensal'}
                                                    </span>
                                                </label>
                                            </FormItem>
                                        ))}
                                    </RadioGroup>
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col pt-2 border-t border-white/5">
                                <div className="flex justify-between items-center mb-1">
                                    <FormLabel className="text-[10px] text-zinc-500 font-bold uppercase">Validade da Série</FormLabel>
                                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                        ~{getEstimatedSessions()} sessões
                                    </span>
                                </div>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn("w-full h-11 justify-start text-left font-normal bg-black/20 border-white/10 hover:bg-black/40 rounded-xl", !field.value && "text-muted-foreground")}
                                            >
                                                <div className="flex items-center gap-2 w-full">
                                                    <CalendarDays className="h-4 w-4 opacity-50" />
                                                    <span>Até: {field.value ? format(field.value, "dd 'de' MMMM, yyyy", { locale: ptBR }) : <span>Definir Fim</span>}</span>
                                                    <ArrowRight className="ml-auto h-3 w-3 opacity-30" />
                                                </div>
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-[#0A0A0B] border-white/10" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            initialFocus
                                            locale={ptBR}
                                            disabled={(date) => date < form.getValues('date')}
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Details Block */}
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider font-semibold ml-1">Modalidade</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-11 bg-[#151518] border-white/10 rounded-xl"><SelectValue /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-[#1A1A1D] border-white/10">
                                        <SelectItem value="presencial">
                                            <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-emerald-400" /> Presencial</div>
                                        </SelectItem>
                                        <SelectItem value="online">
                                            <div className="flex items-center gap-2"><Video className="h-3.5 w-3.5 text-primary" /> Online</div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />
                    {appointmentType === 'presencial' && (
                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider font-semibold ml-1">Sala</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Consultório 1" {...field} className="h-11 bg-[#151518] border-white/10 rounded-xl" />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    )}
                </div>

                <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-white text-black hover:bg-white/90 font-bold uppercase text-xs tracking-widest shadow-lg shadow-white/5 transition-all active:scale-95"
                    disabled={isPending || isLoadingPatients}
                >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Repeat className="h-4 w-4 mr-2" />}
                    {isPending ? "Processando..." : "Confirmar Recorrência"}
                </Button>
            </form>
        </Form>
    );
};