import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  FileText,
  DollarSign,
  Briefcase,
  X,
  CreditCard,
  Banknote,
  QrCode,
  Repeat,
  Loader2,
  Building2,
  Video
} from "lucide-react";
import { format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { usePatients } from "@/hooks/use-patients";
import { useAddAppointment } from "@/hooks/use-add-appointment";
import { useActivePatientPackages } from "@/hooks/use-active-patient-packages";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Esquema de validação
const formSchemaBase = z.object({
  isBlock: z.boolean().default(false),
  patientId: z.string().optional(),
  date: z.date({ required_error: "Selecione uma data" }).refine(
    (d) => d >= startOfDay(new Date()),
    { message: "Não é possível agendar para datas passadas" }
  ),
  startTime: z.string().min(1, "Horário de início obrigatório"),
  duration: z.number().min(30, "Mínimo 30 minutos"),
  type: z.enum(["first_visit", "follow_up", "emergency", "block"]).default("follow_up"),
  modality: z.enum(["presencial", "online"]).default("presencial"),
  notes: z.string().optional(),
  shouldCreateTransaction: z.boolean().default(false),
  transactionAmount: z.coerce.number().optional(),
  transactionMethod: z.enum(['pix', 'money', 'credit_card', 'debit_card', 'boleto', 'mixed']).optional(),
  installments: z.coerce.number().min(1).default(1),
  usePackage: z.boolean().default(false),
  packageId: z.string().optional(),
  recurrence: z.boolean().default(false),
  recurrenceCount: z.coerce.number().min(1).max(20).optional(),
});

const formSchema = formSchemaBase.refine(data => {
  if (!data.isBlock) {
    return !!data.patientId && data.patientId.length > 0;
  }
  return true;
}, {
  message: "Selecione um paciente",
  path: ["patientId"]
});

interface NewAppointmentModalProps {
  isOpen?: boolean;
  open?: boolean; // Alias for isOpen for backward compatibility
  onOpenChange?: (open: boolean) => void;
  selectedDate?: Date | null;
  initialDate?: Date | null; // Added for compatibility
  selectedTime?: string | null;
  children?: React.ReactNode;
}

export function NewAppointmentModal({
  isOpen: externalIsOpen,
  open: externalOpen, // Alias
  onOpenChange: externalOnOpenChange,
  selectedDate,
  initialDate,
  selectedTime,
  children
}: NewAppointmentModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Prefer explicit isOpen, then open, then internal state
  const isOpen = externalIsOpen !== undefined
    ? externalIsOpen
    : externalOpen !== undefined
      ? externalOpen
      : internalIsOpen;

  const onOpenChange = externalOnOpenChange || setInternalIsOpen;

  const [step, setStep] = useState(1);
  const { data: patients } = usePatients();
  const { mutate: createAppointment, isPending } = useAddAppointment();

  // Prefer selectedDate, fallback to initialDate
  const effectiveDate = selectedDate || initialDate;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isBlock: false,
      patientId: "",
      date: effectiveDate || new Date(),
      startTime: selectedTime || "09:00",
      duration: 50,
      type: "follow_up",
      modality: "presencial",
      notes: "",
      shouldCreateTransaction: true,
      transactionAmount: 0,
      transactionMethod: "pix",
      installments: 1,
      usePackage: false,
      recurrence: false,
      recurrenceCount: 4,
    },
  });

  // Atualizar data quando selecionada externamente
  useEffect(() => {
    if (effectiveDate) {
      form.setValue("date", effectiveDate);
    }
  }, [effectiveDate, form]);

  // Atualizar horário quando selecionado externamente
  useEffect(() => {
    if (selectedTime) {
      form.setValue("startTime", selectedTime);
    }
  }, [selectedTime, form]);

  const selectedPatientId = form.watch("patientId");
  const usePackage = form.watch("usePackage");

  // Buscar pacotes ativos do paciente selecionado
  const { data: activePackages } = useActivePatientPackages(selectedPatientId || "");

  // Auto-fill price if package is selected or standard price
  useEffect(() => {
    if (usePackage && activePackages?.length) {
      // Se usar pacote, o valor da transação deve ser 0 (ou tecnicamente calculado do pacote, mas não cobrado agora)
      // Aqui simplificamos para 0 pois o pacote já foi pago
      form.setValue("transactionAmount", 0);
    } else {
      // Sugerir valor padrão (ex: 150) - futuramente virá das configs
      if (form.getValues("transactionAmount") === 0) {
        form.setValue("transactionAmount", 150);
      }
    }
  }, [usePackage, activePackages, form]);


  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Construct start and end dates
    const startDateTime = new Date(values.date);
    const [hours, minutes] = values.startTime.split(':').map(Number);
    startDateTime.setHours(hours, minutes, 0, 0);

    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + values.duration);

    // Map form values to backend expected format
    const appointmentPayload = {
      patient_id: values.isBlock ? null : values.patientId,
      start_time: startDateTime,
      end_time: endDateTime,
      type: values.isBlock ? 'block' : (values.modality as 'presencial' | 'online'),
      notes: values.notes ? `${values.type === 'first_visit' && !values.isBlock ? '[Primeira Consulta] ' : ''}${values.notes}` : (values.type === 'first_visit' && !values.isBlock ? 'Primeira Consulta' : ''),
      location: values.isBlock ? null : (values.modality === 'online' ? 'Online (Google Meet)' : 'Consultório')
    };

    createAppointment(appointmentPayload as any, {
      onSuccess: () => {
        onOpenChange(false);
        form.reset();
        setStep(1);
      },
    });
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  // Renderização dos passos
  const renderStep1_BasicInfo = () => {
    const isBlock = form.watch('isBlock');

    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
              <div className={`p-2 rounded-full ${isBlock ? 'bg-rose-500/10' : 'bg-secondary/20'}`}>
                {isBlock ? <Clock className={`h-5 w-5 text-rose-500`} /> : <User className="h-5 w-5 text-foreground" />}
              </div>
              {isBlock ? "Bloqueio de Agenda" : "Quem será atendido?"}
            </h3>
            <p className="text-sm font-medium text-muted-foreground ml-1">
              {isBlock ? "Defina o horário e adicione o motivo do bloqueio." : "Selecione o paciente e o horário da sessão."}
            </p>
          </div>

          <FormField
            control={form.control}
            name="isBlock"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3 space-y-0 bg-rose-500/10 text-rose-500 px-4 py-2 rounded-full border border-rose-500/20 shadow-sm shrink-0">
                <FormLabel className="text-[10px] font-black uppercase tracking-widest cursor-pointer mt-0">Bloquear Agenda</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(val) => {
                      field.onChange(val);
                      if (val) {
                        form.setValue("patientId", "");
                        form.clearErrors("patientId");
                      }
                    }}
                    className="data-[state=checked]:bg-rose-500"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {!isBlock && (
          <FormField
            control={form.control}
            name="patientId"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <FormLabel className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground ml-1">Paciente</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-16 bg-zinc-100/60 dark:bg-secondary/20 border-zinc-200 dark:border-border/10 hover:bg-zinc-200/60 dark:hover:bg-secondary/30 focus:bg-zinc-200/60 dark:focus:bg-secondary/30 rounded-[24px] focus:ring-0 text-foreground font-medium text-lg px-6 shadow-inner transition-all data-[state=open]:border-primary/50">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white dark:bg-popover/95 backdrop-blur-3xl border-zinc-200 dark:border-border/10 rounded-2xl overflow-hidden shadow-2xl z-[9999]">
                    {patients?.map(p => (
                      <SelectItem key={p.id} value={p.id} className="text-foreground/70 focus:bg-accent focus:text-foreground py-4 px-4 cursor-pointer text-base">
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-rose-400 pl-1" />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-1 gap-6">
          <div className="flex gap-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex-1 flex flex-col space-y-3">
                  <FormLabel className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground ml-1">Data</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "h-16 w-full pl-6 text-left font-medium bg-zinc-100/60 dark:bg-secondary/20 border-zinc-200 dark:border-border/10 hover:bg-zinc-200/60 dark:hover:bg-secondary/30 rounded-[24px] text-lg text-foreground shadow-sm transition-all relative overflow-hidden group",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          {field.value ? (
                            format(field.value, "dd MMM", { locale: ptBR })
                          ) : (
                            <span>--/--</span>
                          )}
                          <CalendarIcon className="ml-auto h-5 w-5 opacity-40 group-hover:opacity-100 transition-opacity mr-2" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white dark:bg-popover border-zinc-200 dark:border-border/10 rounded-3xl shadow-[0_0_50px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_0_50px_-10px_rgba(0,0,0,0.4)] overflow-hidden" align="start">
                      <div className="p-4 bg-zinc-50 dark:bg-secondary/10 backdrop-blur-md">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < startOfDay(new Date())}
                          initialFocus
                          className="bg-transparent text-foreground rounded-xl"
                          classNames={{
                            day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90 rounded-full font-bold",
                            day_today: "bg-secondary text-foreground rounded-full",
                          }}
                        />
                      </div>
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
                <FormItem className="w-[140px] space-y-3">
                  <FormLabel className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground ml-1">Horário</FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <Input
                        type="time"
                        {...field}
                        className="h-16 bg-zinc-100/60 dark:bg-secondary/20 border-zinc-200 dark:border-border/10 hover:bg-zinc-200/60 dark:hover:bg-secondary/30 focus:bg-zinc-200/60 dark:focus:bg-secondary/30 rounded-[24px] px-4 text-center text-lg font-bold text-foreground transition-all focus:border-border/20 focus:ring-0"
                      />
                      <Clock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/20 pointer-events-none" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="pt-2">
          <FormField
            control={form.control}
            name="recurrence"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-[24px] border border-zinc-200 dark:border-border/10 bg-zinc-100/60 dark:bg-secondary/20 p-5 hover:bg-zinc-200/60 dark:hover:bg-secondary/30 transition-all">
                <div className="space-y-1">
                  <FormLabel className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-muted-foreground/60" />
                    Repetir Semanalmente?
                  </FormLabel>
                  <p className="text-xs text-muted-foreground/60">
                    Cria agendamentos automáticos para as próximas semanas.
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-foreground"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {form.watch("recurrence") && (
            <div className="mt-4 animate-in slide-in-from-top-2">
              <FormField
                control={form.control}
                name="recurrenceCount"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground ml-1">Quantas sessões?</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        className="h-16 bg-zinc-100/60 dark:bg-secondary/20 border-zinc-200 dark:border-border/10 hover:bg-zinc-200/60 dark:hover:bg-secondary/30 focus:bg-zinc-200/60 dark:focus:bg-secondary/30 rounded-[24px] px-6 text-lg font-medium text-foreground transition-all focus:border-border/20 focus:ring-0"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        {isBlock && (
          <div className="pt-2 animate-in slide-in-from-bottom-2">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground ml-1">Motivo / Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="min-h-[100px] bg-zinc-100/60 dark:bg-secondary/20 border-zinc-200 dark:border-border/10 hover:bg-zinc-200/60 dark:hover:bg-secondary/30 focus:bg-zinc-200/60 dark:focus:bg-secondary/30 rounded-[24px] resize-none text-foreground px-6 py-4 text-base transition-all focus:border-border/20 focus:ring-0 placeholder:text-muted-foreground/50"
                      placeholder="Ex: Reunião externa, almoço, curso..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </div>
    );
  };

  const renderStep2_Details = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="space-y-2 mb-6">
        <h3 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-full bg-secondary/20"><FileText className="h-5 w-5 text-foreground" /></div>
          Detalhes da Sessão
        </h3>
        <p className="text-sm font-medium text-muted-foreground ml-1">Defina o tipo de atendimento e observações.</p>
      </div>

      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem className="space-y-4">
            <FormLabel className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground ml-1">Tipo de Sessão</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="h-16 bg-zinc-100/60 dark:bg-secondary/20 border-zinc-200 dark:border-border/10 hover:bg-zinc-200/60 dark:hover:bg-secondary/30 focus:bg-zinc-200/60 dark:focus:bg-secondary/30 rounded-[24px] focus:ring-0 text-foreground font-medium text-lg px-6 shadow-inner transition-all">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-white dark:bg-popover/95 backdrop-blur-3xl border-zinc-200 dark:border-border/10 rounded-2xl overflow-hidden shadow-2xl z-[9999]">
                <SelectItem value="first_visit" className="text-foreground/70 focus:bg-accent focus:text-foreground py-4 px-4 cursor-pointer text-base">Primeira Consulta (Avaliação)</SelectItem>
                <SelectItem value="follow_up" className="text-foreground/70 focus:bg-accent focus:text-foreground py-4 px-4 cursor-pointer text-base">Sessão de Acompanhamento</SelectItem>
                <SelectItem value="emergency" className="text-rose-400 focus:bg-rose-500/10 focus:text-rose-300 py-4 px-4 cursor-pointer text-base">Emergência / Encaixe</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage className="text-rose-400 pl-1" />
          </FormItem>
        )}
      />

      {/* Modality Selector */}
      <FormField
        control={form.control}
        name="modality"
        render={({ field }) => (
          <FormItem className="space-y-4">
            <FormLabel className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground ml-1">Modalidade</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="grid grid-cols-2 gap-3"
              >
                {[
                  { id: 'presencial', icon: Building2, label: 'Presencial' },
                  { id: 'online', icon: Video, label: 'Online' }
                ].map((m) => (
                  <FormItem key={m.id}>
                    <FormControl>
                      <RadioGroupItem value={m.id} id={`modality-${m.id}`} className="peer sr-only" />
                    </FormControl>
                    <label
                      htmlFor={`modality-${m.id}`}
                      className="flex flex-col items-center justify-center p-4 rounded-[20px] border border-zinc-200 dark:border-border/10 bg-zinc-100/60 dark:bg-secondary/20 hover:bg-zinc-200/60 dark:hover:bg-secondary/30 peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all text-muted-foreground active:scale-95"
                    >
                      <m.icon className="h-6 w-6 mb-2" />
                      <span className="text-[9px] font-black uppercase tracking-widest">{m.label}</span>
                    </label>
                  </FormItem>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="duration"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground ml-1">Duração (min)</FormLabel>
            <FormControl>
              <Input
                type="number"
                {...field}
                onChange={e => field.onChange(Number(e.target.value))}
                className="h-16 bg-zinc-100/60 dark:bg-secondary/20 border-zinc-200 dark:border-border/10 hover:bg-zinc-200/60 dark:hover:bg-secondary/30 focus:bg-zinc-200/60 dark:focus:bg-secondary/30 rounded-[24px] px-6 text-lg font-medium text-foreground transition-all focus:border-border/20 focus:ring-0"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground ml-1">Observações</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Ex: Paciente relatou ansiedade..."
                className="bg-zinc-100/60 dark:bg-secondary/20 border-zinc-200 dark:border-border/10 hover:bg-zinc-200/60 dark:hover:bg-secondary/30 focus:bg-zinc-200/60 dark:focus:bg-secondary/30 rounded-[24px] min-h-[120px] resize-none text-foreground px-6 py-4 text-base transition-all focus:border-border/20 focus:ring-0 placeholder:text-muted-foreground/50"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderStep3_Financial = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="space-y-2 mb-6">
        <h3 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-full bg-secondary/20"><DollarSign className="h-5 w-5 text-foreground" /></div>
          Fluxo Financeiro
        </h3>
        <p className="text-sm font-medium text-muted-foreground ml-1">Como será cobrado este atendimento?</p>
      </div>

      {/* Pacotes - Se o paciente tiver */}
      {activePackages && activePackages.length > 0 && (
        <FormField
          control={form.control}
          name="usePackage"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-[24px] border border-zinc-200 dark:border-border/10 bg-zinc-100/60 dark:bg-secondary/20 p-5 hover:bg-zinc-200/60 dark:hover:bg-secondary/30 transition-all">
              <div className="space-y-1">
                <FormLabel className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground/60" />
                  Debitar de Pacote Ativo?
                </FormLabel>
                <p className="text-xs text-muted-foreground/60">
                  O paciente possui {activePackages.length} pacote(s) ativo(s).
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-foreground"
                />
              </FormControl>
            </FormItem>
          )}
        />
      )}

      {usePackage ? (
        <FormField
          control={form.control}
          name="packageId"
          render={({ field }) => (
            <div className="space-y-3 animate-in slide-in-from-top-2">
              <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid gap-3">
                {activePackages?.map(pkg => (
                  <div key={pkg.id}>
                    <RadioGroupItem value={pkg.id} id={pkg.id} className="peer sr-only" />
                    <label
                      htmlFor={pkg.id}
                      className="flex flex-col items-start justify-between rounded-[24px] border border-zinc-200 dark:border-border/10 bg-zinc-100/60 dark:bg-secondary/20 p-5 hover:bg-zinc-200/60 dark:hover:bg-secondary/30 hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="font-bold text-base text-foreground">{pkg.description}</span>
                        <span className="text-xs font-mono text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full">{pkg.total_sessions - pkg.sessions_used} restantes</span>
                      </div>
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}
        />
      ) : (
        <>
          <FormField
            control={form.control}
            name="shouldCreateTransaction"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-[24px] border border-zinc-200 dark:border-border/10 bg-zinc-100/60 dark:bg-secondary/20 p-5 hover:bg-zinc-200/60 dark:hover:bg-secondary/30 transition-all">
                <div className="space-y-1">
                  <FormLabel className="text-sm font-bold text-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground/60" />
                    Gerar Lançamento Financeiro?
                  </FormLabel>
                  <p className="text-xs text-muted-foreground/60">
                    Registrar automaticamente como "A Receber" ou "Pago".
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-foreground"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {form.watch("shouldCreateTransaction") && (
            <div className="space-y-6 pt-2 animate-in slide-in-from-top-2">
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="transactionAmount"
                  render={({ field }) => (
                    <FormItem className="flex-1 space-y-3">
                      <FormLabel className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground ml-1">Valor (R$)</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/30 text-sm font-bold">R$</span>
                          <Input
                            type="number"
                            {...field}
                            className="h-16 bg-zinc-100/60 dark:bg-secondary/20 border-zinc-200 dark:border-border/10 hover:bg-zinc-200/60 dark:hover:bg-secondary/30 focus:bg-zinc-200/60 dark:focus:bg-secondary/30 rounded-[24px] pl-11 text-lg font-bold text-foreground transition-all focus:border-border/20 focus:ring-0"
                          />
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="installments"
                  render={({ field }) => (
                    <FormItem className="w-[120px] space-y-3">
                      <FormLabel className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground ml-1">Parcelas</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          min={1}
                          className="h-16 bg-zinc-100/60 dark:bg-secondary/20 border-zinc-200 dark:border-border/10 hover:bg-zinc-200/60 dark:hover:bg-secondary/30 focus:bg-zinc-200/60 dark:focus:bg-secondary/30 rounded-[24px] text-center text-lg font-bold text-foreground transition-all focus:border-border/20 focus:ring-0"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="transactionMethod"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground ml-1">Forma de Pagamento</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-3 gap-3"
                      >
                        {[
                          { id: 'pix', icon: QrCode, label: 'Pix' },
                          { id: 'money', icon: Banknote, label: 'Dinheiro' },
                          { id: 'credit_card', icon: CreditCard, label: 'Cartão' }
                        ].map((m) => (
                          <FormItem key={m.id}>
                            <FormControl>
                              <RadioGroupItem value={m.id} id={m.id} className="peer sr-only" />
                            </FormControl>
                            <label
                              htmlFor={m.id}
                              className="flex flex-col items-center justify-center p-4 rounded-[20px] border border-zinc-200 dark:border-border/10 bg-zinc-100/60 dark:bg-secondary/20 hover:bg-zinc-200/60 dark:hover:bg-secondary/30 peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all text-muted-foreground active:scale-95"
                            >
                              <m.icon className="h-6 w-6 mb-2" />
                              <span className="text-[9px] font-black uppercase tracking-widest">{m.label}</span>
                            </label>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={onOpenChange}
      trigger={children}
      className="bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-[40px] border border-zinc-200 dark:border-white/[0.08] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] rounded-[28px] p-0 overflow-hidden sm:max-w-[600px] max-h-[90vh] flex flex-col"
    >
      <div className="flex flex-col flex-1 min-h-0 bg-gradient-to-b from-zinc-50/50 dark:from-card/50 to-transparent">
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{form.watch('isBlock') ? "Bloqueio de Agenda" : "Novo Agendamento"}</h2>
            {!form.watch('isBlock') && (
              <div className="flex items-center gap-2 mt-2">
                <div className={`h-1.5 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-primary w-10' : 'bg-primary/20 w-6'}`} />
                <div className={`h-1.5 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-primary w-10' : 'bg-primary/20 w-6'}`} />
                <div className={`h-1.5 rounded-full transition-all duration-500 ${step >= 3 ? 'bg-primary w-10' : 'bg-primary/20 w-6'}`} />
              </div>
            )}
          </div>

          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full w-10 h-10 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all active:scale-90">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Body */}
        <div className="px-8 py-4 overflow-y-auto custom-scrollbar flex-1 min-h-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {step === 1 && renderStep1_BasicInfo()}
              {step === 2 && renderStep2_Details()}
              {step === 3 && renderStep3_Financial()}
            </form>
          </Form>
        </div>

        {/* Footer */}
        <div className="p-6 bg-zinc-50/60 dark:bg-card/60 border-t border-zinc-200 dark:border-border/10 flex justify-between items-center backdrop-blur-xl shrink-0">
          {step > 1 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={prevStep}
              className="text-muted-foreground hover:text-foreground rounded-full px-6 h-12 transition-all hover:bg-secondary/50 active:scale-95"
            >
              Voltar
            </Button>
          ) : (
            <div /> /* Spacer */
          )}

          {(!form.watch('isBlock') && step < 3) ? (
            <Button
              type="button"
              onClick={async () => {
                const isValid = await form.trigger(["patientId", "date", "startTime"]);
                if (isValid) nextStep();
              }}
              className="rounded-full px-8 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-none transition-all active:scale-95 tracking-wide"
            >
              Continuar
            </Button>
          ) : (
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={isPending}
              className={cn("rounded-full px-8 h-12 font-bold tracking-wide shadow-lg hover:shadow-xl transition-all active:scale-95", form.watch('isBlock') ? "bg-rose-500 text-white hover:bg-rose-600" : "bg-primary text-primary-foreground")}
            >
              {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : (form.watch('isBlock') ? "Concluir Bloqueio" : "Registrar Agendamento")}
            </Button>
          )}
        </div>
      </div>
    </ResponsiveModal>
  );
}