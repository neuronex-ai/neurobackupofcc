import { useState, useEffect, useMemo } from "react";
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
  Video,
  CalendarPlus,
  AlertTriangle,
  CheckCircle2,
  Package,
  Sparkles,
  Link2,
  StickyNote,
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
import { useAddAppointmentTransaction } from "@/hooks/use-add-appointment-transaction";
import { useAddRecurringAppointment } from "@/hooks/use-add-recurring-appointment";
import { useActivePatientPackages } from "@/hooks/use-active-patient-packages";
import { usePatientPackages } from "@/hooks/use-patient-packages";
import { useUsePackageSession } from "@/hooks/use-use-package-session";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
  buildEventMetadata,
  buildEventNotes as buildEventNotesFromMetadata,
  buildSessionMetadata,
} from "@/lib/appointment-metadata";

// ─── Validação ────────────────────────────────────────────────────────

const formSchema = z
  .object({
    eventType: z.enum(["session", "event"]).default("session"),

    // Sessão Clínica
    patientId: z.string().optional(),
    date: z.date({ required_error: "Selecione uma data" }).refine(
      (d) => d >= startOfDay(new Date()),
      { message: "Não é possível agendar para datas passadas" }
    ),
    startTime: z.string().min(1, "Horário de início obrigatório"),
    duration: z.number().min(15, "Mínimo 15 minutos"),
    type: z.enum(["first_visit", "follow_up", "emergency", "block"]).default("follow_up"),
    modality: z.enum(["presencial", "online"]).default("presencial"),
    notes: z.string().optional(),

    // Evento Geral
    eventTitle: z.string().optional(),
    eventCategory: z.string().optional(),
    endTime: z.string().optional(),
    eventLocation: z.string().optional(),

    // Financeiro
    shouldCreateTransaction: z.boolean().default(false),
    transactionAmount: z.coerce.number().optional(),
    transactionMethod: z.enum(["pix", "money", "credit_card", "debit_card", "boleto", "mixed"]).optional(),
    installments: z.coerce.number().min(1).default(1),
    usePackage: z.boolean().default(false),
    packageId: z.string().optional(),

    // Recorrência
    recurrence: z.boolean().default(false),
    recurrenceCount: z.coerce.number().min(1).max(20).optional(),
  })
  .refine(
    (data) => {
      if (data.eventType === "session") return !!data.patientId && data.patientId.length > 0;
      return true;
    },
    { message: "Selecione um paciente", path: ["patientId"] }
  )
  .refine(
    (data) => {
      if (data.eventType === "event") return !!data.eventTitle && data.eventTitle.length > 0;
      return true;
    },
    { message: "Informe o título do evento", path: ["eventTitle"] }
  )
  .refine(
    (data) => {
      if (data.eventType === "event") return !!data.eventCategory && data.eventCategory.length > 0;
      return true;
    },
    { message: "Selecione uma categoria", path: ["eventCategory"] }
  )
  .refine(
    (data) => {
      if (data.eventType === "event") return !!data.endTime && data.endTime.length > 0;
      return true;
    },
    { message: "Informe o horário final", path: ["endTime"] }
  )
  .refine(
    (data) => {
      if (data.eventType !== "session" || data.usePackage || !data.shouldCreateTransaction) return true;
      return typeof data.transactionAmount === "number" && data.transactionAmount > 0;
    },
    { message: "Informe um valor maior que zero", path: ["transactionAmount"] }
  );

type FormValues = z.infer<typeof formSchema>;

// ─── Constantes ───────────────────────────────────────────────────────

const EVENT_CATEGORIES = [
  { value: "reuniao", label: "Reunião" },
  { value: "supervisao", label: "Supervisão" },
  { value: "particular", label: "Particular" },
  { value: "bloqueio", label: "Bloqueio de Agenda" },
  { value: "formacao", label: "Formação / Curso" },
  { value: "administrativo", label: "Administrativo" },
  { value: "outro", label: "Outro" },
];

const addMinutesToTime = (time: string, minutesToAdd: number) => {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes + minutesToAdd, 0, 0);
  return format(date, "HH:mm");
};

// ─── Props ────────────────────────────────────────────────────────────

interface NewAppointmentModalProps {
  isOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  selectedDate?: Date | null;
  initialDate?: Date | null;
  selectedTime?: string | null;
  children?: React.ReactNode;
}

// ─── Pill Toggle ──────────────────────────────────────────────────────

function PillToggle({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const options = [
    { id: "session", icon: Sparkles, label: "Sessão Clínica" },
    { id: "event", icon: CalendarPlus, label: "Evento Geral" },
  ] as const;

  return (
    <div className="flex w-full rounded-[20px] bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/[0.06] p-1 gap-1 shadow-inner">
      {options.map((opt) => {
        const isActive = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "relative flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-[16px] text-[10px] font-black uppercase tracking-[0.12em] transition-all duration-300 select-none",
              isActive
                ? opt.id === "event"
                  ? "bg-violet-500 text-white shadow-lg shadow-violet-500/25"
                  : "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "text-muted-foreground hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-white/[0.06]"
            )}
          >
            <opt.icon className={cn("h-3.5 w-3.5 shrink-0 transition-transform duration-300", isActive && "scale-110")} />
            <span className="hidden sm:inline">{opt.label}</span>
            <span className="sm:hidden">{opt.id === "session" ? "Sessão" : "Evento"}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────

export function NewAppointmentModal({
  isOpen: externalIsOpen,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  selectedDate,
  initialDate,
  selectedTime,
  children,
}: NewAppointmentModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : externalOpen !== undefined ? externalOpen : internalIsOpen;
  const onOpenChange = externalOnOpenChange || setInternalIsOpen;

  const [step, setStep] = useState(1);
  const { data: patients } = usePatients();
  const { mutateAsync: createAppointment, isPending: isCreatingAppointment } = useAddAppointment();
  const { mutateAsync: createRecurringAppointments, isPending: isCreatingRecurringAppointments } = useAddRecurringAppointment();
  const { mutateAsync: createAppointmentTransaction, isPending: isCreatingTransaction } = useAddAppointmentTransaction();
  const { mutateAsync: debitPackageSession, isPending: isDebitingPackage } = useUsePackageSession();

  const effectiveDate = selectedDate || initialDate;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventType: "session",
      patientId: "",
      date: effectiveDate || new Date(),
      startTime: selectedTime || "09:00",
      duration: 50,
      type: "follow_up",
      modality: "presencial",
      notes: "",
      eventTitle: "",
      eventCategory: "",
      endTime: "",
      eventLocation: "",
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
    if (effectiveDate) form.setValue("date", effectiveDate);
  }, [effectiveDate, form]);

  useEffect(() => {
    if (selectedTime) form.setValue("startTime", selectedTime);
  }, [selectedTime, form]);

  const eventType = form.watch("eventType");
  const selectedPatientId = form.watch("patientId");
  const selectedPackageId = form.watch("packageId");
  const usePackageSwitch = form.watch("usePackage");
  const shouldCreateTransaction = form.watch("shouldCreateTransaction");
  const startTime = form.watch("startTime");

  useEffect(() => {
    if (eventType === "event" && !form.getValues("endTime")) {
      form.setValue("endTime", addMinutesToTime(startTime, 60));
    }
  }, [eventType, form, startTime]);

  // Reset step quando muda de tipo
  useEffect(() => {
    setStep(1);
  }, [eventType]);

  // ── Pacotes ativos ─────────────────────────────────────────────────
  const { data: activePackages, isLoading: isLoadingPackages } = useActivePatientPackages(
    eventType === "session" ? selectedPatientId || "" : ""
  );
  const { data: patientPackages, isLoading: isLoadingPatientPackages } = usePatientPackages(
    eventType === "session" ? selectedPatientId || "" : ""
  );

  const hasActivePackage = !!activePackages && activePackages.length > 0;
  const selectedPackage = useMemo(() => {
    return activePackages?.find((p) => p.id === selectedPackageId) || activePackages?.[0];
  }, [activePackages, selectedPackageId]);

  const remainingSessions = selectedPackage ? selectedPackage.total_sessions - selectedPackage.sessions_used : 0;
  const afterDebitSessions = remainingSessions - 1;
  const latestPackage = patientPackages?.[0];
  const latestPackageRemaining = latestPackage ? latestPackage.total_sessions - latestPackage.sessions_used : 0;
  const latestPackageIsExpired = !!latestPackage?.end_date && new Date(`${latestPackage.end_date}T23:59:59`) < new Date();
  const projectedUncoveredBalance = latestPackage ? Math.min(latestPackageRemaining - 1, -1) : -1;
  const isCheckingFinancialRules = isLoadingPackages || isLoadingPatientPackages;
  const isSubmitting =
    isCreatingAppointment ||
    isCreatingRecurringAppointments ||
    isCreatingTransaction ||
    isDebitingPackage;

  // Auto‑ativar pacote quando tem pacotes, ou abrir lançamento quando não tem
  useEffect(() => {
    if (eventType !== "session" || step !== 3) return;
    if (hasActivePackage) {
      form.setValue("usePackage", true);
      if (activePackages && activePackages.length > 0 && !form.getValues("packageId")) {
        form.setValue("packageId", activePackages[0].id);
      }
    } else {
      form.setValue("usePackage", false);
      form.setValue("shouldCreateTransaction", true);
      if (form.getValues("transactionAmount") === 0) {
        form.setValue("transactionAmount", 150);
      }
    }
  }, [hasActivePackage, activePackages, step, eventType, form]);

  // Zerar valor da transação quando usa pacote
  useEffect(() => {
    if (usePackageSwitch && activePackages?.length) {
      form.setValue("transactionAmount", 0);
      form.setValue("shouldCreateTransaction", false);
    }
  }, [usePackageSwitch, activePackages, form]);

  // ── Número total de passos ─────────────────────────────────────────
  const totalSteps = eventType === "event" ? 2 : 3;

  // ── Submit ─────────────────────────────────────────────────────────
  const onSubmit = async (values: FormValues) => {
    const startDateTime = new Date(values.date);
    const [hours, minutes] = values.startTime.split(":").map(Number);
    startDateTime.setHours(hours, minutes, 0, 0);

    let endDateTime: Date;

    if (values.eventType === "event" && values.endTime) {
      endDateTime = new Date(values.date);
      const [eh, em] = values.endTime.split(":").map(Number);
      endDateTime.setHours(eh, em, 0, 0);
      if (endDateTime <= startDateTime) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }
    } else {
      endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + values.duration);
    }

    let notesStr = values.notes || "";
    let locStr: string | null = null;

    const durationMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / 60000);
    const metadata = values.eventType === "event"
      ? buildEventMetadata({
          title: values.eventTitle || "Compromisso",
          category: values.eventCategory || "outro",
          categoryLabel: EVENT_CATEGORIES.find((item) => item.value === values.eventCategory)?.label,
          location: values.eventLocation || null,
          notes: values.notes || "",
          origin: "neuronex",
          syncStatus: "pending",
        })
      : buildSessionMetadata({
          sessionType: values.type,
          modality: values.modality,
          durationMinutes,
          notes: values.notes || "",
          origin: "neuronex",
          syncStatus: "pending",
          financial: {
            usePackage: values.usePackage,
            packageId: values.packageId || selectedPackage?.id || null,
            transactionAmount: values.shouldCreateTransaction ? values.transactionAmount || 0 : null,
            transactionMethod: values.transactionMethod || null,
            installments: values.installments || 1,
          },
        });

    if (values.eventType === "event") {
      notesStr = buildEventNotesFromMetadata(metadata);
    } else if (values.eventType === "session") {
      const prefix = values.type === "first_visit" ? "[Primeira Consulta] " : "";
      notesStr = `${prefix}${values.notes || (values.type === "first_visit" ? "Primeira Consulta" : "")}`;
      locStr = values.modality === "online" ? "Online (Google Meet)" : "Consultório";
    }

    const appointmentPayload = {
      patient_id: values.eventType === "session" ? values.patientId : null,
      start_time: startDateTime,
      end_time: endDateTime,
      type: values.eventType === "session" ? (values.modality as "presencial" | "online") : "block",
      notes: notesStr,
      location: values.eventType === "event" ? values.eventLocation || null : locStr,
      metadata,
    };

    const recurrenceCount = values.recurrence ? values.recurrenceCount || 1 : 1;
    let createdPrimaryAppointment: any = null;

    try {
      if (values.eventType === "session" && recurrenceCount > 1) {
        const recurrenceEndDate = new Date(startDateTime);
        recurrenceEndDate.setDate(recurrenceEndDate.getDate() + 7 * (recurrenceCount - 1));

        const createdAppointments = await createRecurringAppointments({
          patient_id: values.patientId!,
          date: startDateTime,
          startTime: values.startTime,
          duration: String(values.duration),
          type: values.modality,
          notes: notesStr,
          location: locStr || "",
          repetition: "weekly",
          endDate: recurrenceEndDate,
        });

        createdPrimaryAppointment = createdAppointments?.[0];
      } else {
        const createdAppointments = [];

        for (let index = 0; index < recurrenceCount; index += 1) {
          const occurrenceStart = new Date(startDateTime);
          occurrenceStart.setDate(occurrenceStart.getDate() + 7 * index);

          const occurrenceEnd = new Date(endDateTime);
          occurrenceEnd.setDate(occurrenceEnd.getDate() + 7 * index);

          const result = await createAppointment({
            ...appointmentPayload,
            start_time: occurrenceStart,
            end_time: occurrenceEnd,
          } as any);

          createdAppointments.push(result.newAppointment);
          if (!createdPrimaryAppointment) {
            createdPrimaryAppointment = result.newAppointment;
          }
        }

        createdPrimaryAppointment = createdAppointments[0] || createdPrimaryAppointment;
      }

      if (values.eventType === "session" && createdPrimaryAppointment) {
        if (values.usePackage && selectedPackage?.id && values.patientId) {
          await debitPackageSession({
            packageId: selectedPackage.id,
            patientId: values.patientId,
          });
        } else if (values.shouldCreateTransaction) {
          await createAppointmentTransaction({
            appointmentId: createdPrimaryAppointment.id,
            description: `Sessão - ${patients?.find((patient) => patient.id === values.patientId)?.name || "Paciente"}`,
            amount: values.transactionAmount || 0,
            type: "income",
            category: "Sessão",
            date: startDateTime,
            payment_method: values.transactionMethod || "pix",
            installments: values.installments || 1,
            patient_id: values.patientId || null,
            package_id: null,
            status: "pending",
          });
        }
      }

      onOpenChange(false);
      form.reset();
      setStep(1);
    } catch (error: any) {
      if (createdPrimaryAppointment) {
        toast.warning("Agendamento criado, mas o alinhamento financeiro precisa ser revisado.");
        onOpenChange(false);
        form.reset();
        setStep(1);
        return;
      }

      toast.error(error?.message || "Não foi possível registrar o agendamento.");
    }
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  // ─── Style tokens ────────────────────────────────────────────────
  const inputBase =
    "h-16 bg-zinc-100/60 dark:bg-secondary/20 border-zinc-200 dark:border-border/10 hover:bg-zinc-200/60 dark:hover:bg-secondary/30 focus:bg-zinc-200/60 dark:focus:bg-secondary/30 rounded-[24px] text-foreground transition-all focus:border-border/20 focus:ring-0";
  const labelBase = "text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground ml-1";
  const cardBase =
    "rounded-[24px] border border-zinc-200 dark:border-border/10 bg-zinc-100/60 dark:bg-secondary/20 p-5 hover:bg-zinc-200/60 dark:hover:bg-secondary/30 transition-all";
  const selectPopover = "bg-white dark:bg-popover/95 backdrop-blur-3xl border-zinc-200 dark:border-border/10 rounded-2xl overflow-hidden shadow-2xl z-[9999]";

  // ─── STEP 1 ───────────────────────────────────────────────────────

  const renderStep1 = () => {
    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
        {/* Pill Toggle */}
        <FormField
          control={form.control}
          name="eventType"
          render={({ field }) => (
            <FormItem>
              <PillToggle value={field.value} onChange={field.onChange} />
            </FormItem>
          )}
        />

        {/* ── Sessão Clínica ─────────────────────────── */}
        {eventType === "session" && (
          <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
                <div className="p-2 rounded-full bg-secondary/20">
                  <User className="h-5 w-5 text-foreground" />
                </div>
                Quem será atendido?
              </h3>
              <p className="text-sm font-medium text-muted-foreground ml-1">Selecione o paciente e o horário da sessão.</p>
            </div>

            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <FormLabel className={labelBase}>Paciente</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className={cn(inputBase, "font-medium text-lg px-6 shadow-inner data-[state=open]:border-primary/50")}>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className={selectPopover}>
                      {patients?.map((p) => (
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

            {renderDateTimeRow()}
            {renderRecurrenceToggle()}
          </div>
        )}

        {/* ── Evento Geral ───────────────────────────── */}
        {eventType === "event" && (
          <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
                <div className="p-2 rounded-full bg-violet-500/10">
                  <CalendarPlus className="h-5 w-5 text-violet-500" />
                </div>
                Novo Compromisso
              </h3>
              <p className="text-sm font-medium text-muted-foreground ml-1">Registre um evento ou compromisso administrativo.</p>
            </div>

            <FormField
              control={form.control}
              name="eventTitle"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className={labelBase}>Título do Evento</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: Supervisão Clínica, Reunião de Equipe..."
                      className={cn(inputBase, "px-6 text-lg font-medium")}
                    />
                  </FormControl>
                  <FormMessage className="text-rose-400 pl-1" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eventCategory"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className={labelBase}>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className={cn(inputBase, "font-medium text-lg px-6 shadow-inner")}>
                        <SelectValue placeholder="Selecione a categoria..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className={selectPopover}>
                      {EVENT_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value} className="text-foreground/70 focus:bg-accent focus:text-foreground py-4 px-4 cursor-pointer text-base">
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-rose-400 pl-1" />
                </FormItem>
              )}
            />

            {renderDateTimeRow(true)}
            {renderRecurrenceToggle()}
          </div>
        )}

        {/* ── Bloqueio ───────────────────────────────── */}
        {false && (
          <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
                <div className="p-2 rounded-full bg-rose-500/10">
                  <Clock className="h-5 w-5 text-rose-500" />
                </div>
                Bloqueio de Agenda
              </h3>
              <p className="text-sm font-medium text-muted-foreground ml-1">Defina o horário e adicione o motivo do bloqueio.</p>
            </div>

            {renderDateTimeRow()}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className={labelBase}>Motivo / Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className={cn(inputBase, "min-h-[100px] resize-none px-6 py-4 text-base placeholder:text-muted-foreground/50 h-auto")}
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

  // ─── Date & Time Row (shared) ─────────────────────────────────────

  const renderDateTimeRow = (showEndTime = false) => (
    <div className="grid grid-cols-1 gap-6">
      <div className={cn("flex gap-4", showEndTime && "flex-wrap")}>
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex-1 flex flex-col space-y-3 min-w-[140px]">
              <FormLabel className={labelBase}>Data</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(inputBase, "w-full pl-6 text-left font-medium text-lg shadow-sm relative overflow-hidden group", !field.value && "text-muted-foreground")}
                    >
                      <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {field.value ? format(field.value, "dd MMM", { locale: ptBR }) : <span>--/--</span>}
                      <CalendarIcon className="ml-auto h-5 w-5 opacity-40 group-hover:opacity-100 transition-opacity mr-2" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-white dark:bg-popover border-zinc-200 dark:border-border/10 rounded-3xl shadow-[0_0_50px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_0_50px_-10px_rgba(0,0,0,0.4)] overflow-hidden"
                  align="start"
                >
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
              <FormLabel className={labelBase}>{showEndTime ? "Início" : "Horário"}</FormLabel>
              <FormControl>
                <div className="relative group">
                  <Input type="time" {...field} className={cn(inputBase, "px-4 text-center text-lg font-bold")} />
                  <Clock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/20 pointer-events-none" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {showEndTime && (
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem className="w-[140px] space-y-3 animate-in fade-in-0 duration-200">
                <FormLabel className={labelBase}>Fim</FormLabel>
                <FormControl>
                  <div className="relative group">
                    <Input type="time" {...field} className={cn(inputBase, "px-4 text-center text-lg font-bold")} />
                    <Clock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/20 pointer-events-none" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </div>
  );

  // ─── Recurrence Toggle (shared) ───────────────────────────────────

  const renderRecurrenceToggle = () => (
    <div className="pt-2">
      <FormField
        control={form.control}
        name="recurrence"
        render={({ field }) => (
          <FormItem className={cn(cardBase, "flex flex-row items-center justify-between")}>
            <div className="space-y-1">
              <FormLabel className="text-sm font-bold text-foreground flex items-center gap-2">
                <Repeat className="h-4 w-4 text-muted-foreground/60" />
                Repetir Semanalmente?
              </FormLabel>
              <p className="text-xs text-muted-foreground/60">Cria agendamentos automáticos para as próximas semanas.</p>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-foreground" />
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
                <FormLabel className={labelBase}>{eventType === "event" ? "Quantas ocorrências?" : "Quantas sessões?"}</FormLabel>
                <FormControl>
                  <Input type="number" {...field} className={cn(inputBase, "px-6 text-lg font-medium")} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );

  // ─── STEP 2: Details ──────────────────────────────────────────────

  const renderStep2 = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      {eventType === "session" && (
        <>
          <div className="space-y-2 mb-6">
            <h3 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-full bg-secondary/20">
                <FileText className="h-5 w-5 text-foreground" />
              </div>
              Detalhes da Sessão
            </h3>
            <p className="text-sm font-medium text-muted-foreground ml-1">Defina o tipo de atendimento e observações.</p>
          </div>

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <FormLabel className={labelBase}>Tipo de Sessão</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className={cn(inputBase, "font-medium text-lg px-6 shadow-inner")}>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className={selectPopover}>
                    <SelectItem value="first_visit" className="text-foreground/70 focus:bg-accent focus:text-foreground py-4 px-4 cursor-pointer text-base">
                      Primeira Consulta (Avaliação)
                    </SelectItem>
                    <SelectItem value="follow_up" className="text-foreground/70 focus:bg-accent focus:text-foreground py-4 px-4 cursor-pointer text-base">
                      Sessão de Acompanhamento
                    </SelectItem>
                    <SelectItem value="emergency" className="text-rose-400 focus:bg-rose-500/10 focus:text-rose-300 py-4 px-4 cursor-pointer text-base">
                      Emergência / Encaixe
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-rose-400 pl-1" />
              </FormItem>
            )}
          />

          {/* Modality */}
          <FormField
            control={form.control}
            name="modality"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <FormLabel className={labelBase}>Modalidade</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-3">
                    {[
                      { id: "presencial", icon: Building2, label: "Presencial" },
                      { id: "online", icon: Video, label: "Online" },
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
                <FormLabel className={labelBase}>Duração (min)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className={cn(inputBase, "px-6 text-lg font-medium")}
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
                <FormLabel className={labelBase}>Observações</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ex: Paciente relatou ansiedade..."
                    className={cn(inputBase, "min-h-[120px] resize-none px-6 py-4 text-base placeholder:text-muted-foreground/50 h-auto")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}

      {eventType === "event" && (
        <>
          <div className="space-y-2 mb-6">
            <h3 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-full bg-violet-500/10">
                <StickyNote className="h-5 w-5 text-violet-500" />
              </div>
              Detalhes do Evento
            </h3>
            <p className="text-sm font-medium text-muted-foreground ml-1">Informações adicionais sobre o compromisso.</p>
          </div>

          <FormField
            control={form.control}
            name="eventLocation"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className={labelBase}>Local ou Link</FormLabel>
                <FormControl>
                  <div className="relative group">
                    <Link2 className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 pointer-events-none" />
                    <Input
                      {...field}
                      placeholder="Ex: Sala 202 ou https://meet.google.com/..."
                      className={cn(inputBase, "pl-12 text-base font-medium")}
                    />
                  </div>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className={labelBase}>Notas Internas</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Anotações privadas sobre o compromisso..."
                    className={cn(inputBase, "min-h-[120px] resize-none px-6 py-4 text-base placeholder:text-muted-foreground/50 h-auto")}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  );

  // ─── STEP 3: Financial Alignment (Session only) ───────────────────

  const renderStep3 = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="space-y-2 mb-6">
        <h3 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-full bg-secondary/20">
            <DollarSign className="h-5 w-5 text-foreground" />
          </div>
          Fluxo Financeiro
        </h3>
        <p className="text-sm font-medium text-muted-foreground ml-1">Como será cobrado este atendimento?</p>
      </div>

      {/* Loading */}
      {isCheckingFinancialRules && (
        <div className="flex items-center gap-3 p-5 rounded-[24px] bg-zinc-100/60 dark:bg-secondary/20 border border-zinc-200 dark:border-border/10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground font-medium">Verificando planos do paciente...</span>
        </div>
      )}

      {/* ── Cenário A: Paciente tem pacote ativo ─────────────── */}
      {!isCheckingFinancialRules && hasActivePackage && (
        <div className="space-y-4 animate-in fade-in-0 duration-300">
          {/* Info Card – saldo do pacote */}
          <div className="rounded-[24px] bg-emerald-500/5 dark:bg-emerald-500/[0.07] border border-emerald-500/20 p-5">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 shrink-0">
                <Package className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">Pacote Ativo Encontrado</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedPackage?.description || "Pacote"} —{" "}
                  <span className="font-bold text-emerald-500">{remainingSessions} sessões restantes</span>
                </p>
                {usePackageSwitch && (
                  <p className="text-xs text-muted-foreground/70 mt-1 animate-in fade-in-0 duration-200">
                    Após débito: <span className={cn("font-mono font-bold", afterDebitSessions <= 1 ? "text-amber-400" : "text-emerald-400")}>{afterDebitSessions}</span> sessões
                  </p>
                )}
              </div>
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            </div>
          </div>

          {/* Switch – usar pacote */}
          <FormField
            control={form.control}
            name="usePackage"
            render={({ field }) => (
              <FormItem className={cn(cardBase, "flex flex-row items-center justify-between")}>
                <div className="space-y-1">
                  <FormLabel className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground/60" />
                    Debitar desta sessão do pacote ativo?
                  </FormLabel>
                  <p className="text-xs text-muted-foreground/60">
                    {field.value
                      ? `Saldo restante passará de ${remainingSessions} para ${afterDebitSessions}.`
                      : "Desative para gerar uma cobrança avulsa."}
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(val) => {
                      field.onChange(val);
                      if (!val) {
                        form.setValue("shouldCreateTransaction", true);
                        if (form.getValues("transactionAmount") === 0) {
                          form.setValue("transactionAmount", 150);
                        }
                      }
                    }}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Seleção de pacote (quando tem múltiplos) */}
          {usePackageSwitch && activePackages && activePackages.length > 1 && (
            <FormField
              control={form.control}
              name="packageId"
              render={({ field }) => (
                <div className="space-y-3 animate-in slide-in-from-top-2">
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value || activePackages[0]?.id} className="grid gap-3">
                    {activePackages.map((pkg) => (
                      <div key={pkg.id}>
                        <RadioGroupItem value={pkg.id} id={pkg.id} className="peer sr-only" />
                        <label
                          htmlFor={pkg.id}
                          className={cn(
                            cardBase,
                            "flex flex-col items-start cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 active:scale-[0.98]"
                          )}
                        >
                          <div className="flex w-full items-center justify-between">
                            <span className="font-bold text-base text-foreground">{pkg.description}</span>
                            <span className="text-xs font-mono text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full">
                              {pkg.total_sessions - pkg.sessions_used} restantes
                            </span>
                          </div>
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}
            />
          )}
        </div>
      )}

      {/* ── Cenário B: Sem pacote ativo ──────────────────────── */}
      {!isCheckingFinancialRules && !hasActivePackage && (
        <div className="space-y-4 animate-in fade-in-0 duration-300">
          {/* Alerta sutil */}
          <div className="rounded-[24px] bg-amber-500/5 dark:bg-amber-500/[0.07] border border-amber-500/20 p-5">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">
                  {latestPackage
                    ? latestPackageIsExpired
                      ? "Pacote encontrado, mas expirado"
                      : "Pacote sem saldo disponível"
                    : "Nenhum pacote ativo encontrado"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {latestPackage
                    ? `Saldo atual: ${Math.max(latestPackageRemaining, 0)} sessão. Saldo projetado sem cobertura: ${projectedUncoveredBalance} sessão.`
                    : "O paciente não possui pacotes com saldo disponível. Gere um lançamento financeiro avulso ou continue sem cobrança."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Cenário C: Override / Lançamento Financeiro ──────── */}
      {!isCheckingFinancialRules && (!usePackageSwitch || !hasActivePackage) && (
        <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          <FormField
            control={form.control}
            name="shouldCreateTransaction"
            render={({ field }) => (
              <FormItem className={cn(cardBase, "flex flex-row items-center justify-between")}>
                <div className="space-y-1">
                  <FormLabel className="text-sm font-bold text-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground/60" />
                    Gerar Lançamento Financeiro?
                  </FormLabel>
                  <p className="text-xs text-muted-foreground/60">Registra como "A Receber". Desative para continuar sem cobrança.</p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-foreground" />
                </FormControl>
              </FormItem>
            )}
          />

          {shouldCreateTransaction && (
            <div className="space-y-6 pt-2 animate-in slide-in-from-top-2">
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="transactionAmount"
                  render={({ field }) => (
                    <FormItem className="flex-1 space-y-3">
                      <FormLabel className={labelBase}>Valor (R$)</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/30 text-sm font-bold">R$</span>
                          <Input type="number" {...field} className={cn(inputBase, "pl-11 text-lg font-bold")} />
                        </div>
                      </FormControl>
                      <FormMessage className="text-rose-400 pl-1" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="installments"
                  render={({ field }) => (
                    <FormItem className="w-[120px] space-y-3">
                      <FormLabel className={labelBase}>Parcelas</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} min={1} className={cn(inputBase, "text-center text-lg font-bold")} />
                      </FormControl>
                      <FormMessage className="text-rose-400 pl-1" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="transactionMethod"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className={labelBase}>Forma de Pagamento</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-3 gap-3">
                        {[
                          { id: "pix", icon: QrCode, label: "Pix" },
                          { id: "money", icon: Banknote, label: "Dinheiro" },
                          { id: "credit_card", icon: CreditCard, label: "Cartão" },
                        ].map((m) => (
                          <FormItem key={m.id}>
                            <FormControl>
                              <RadioGroupItem value={m.id} id={`pay-${m.id}`} className="peer sr-only" />
                            </FormControl>
                            <label
                              htmlFor={`pay-${m.id}`}
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
        </div>
      )}
    </div>
  );

  // ─── Progress Dots ────────────────────────────────────────────────

  const renderProgressDots = () => {
    if (totalSteps <= 1) return null;
    return (
      <div className="flex items-center gap-2 mt-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={cn("h-1.5 rounded-full transition-all duration-500", step >= i + 1 ? "bg-primary w-10" : "bg-primary/20 w-6")}
          />
        ))}
      </div>
    );
  };

  // ─── Modal Title ──────────────────────────────────────────────────

  const modalTitle = useMemo(() => {
    if (eventType === "event") return "Novo Compromisso";
    return "Novo Agendamento";
  }, [eventType]);

  // ─── Footer Button Logic ──────────────────────────────────────────

  const canAdvance = step < totalSteps;

  const handleContinue = async () => {
    if (eventType === "session" && step === 1) {
      const isValid = await form.trigger(["patientId", "date", "startTime"]);
      if (isValid) nextStep();
    } else if (eventType === "session" && step === 2) {
      const isValid = await form.trigger(["type", "modality", "duration"]);
      if (isValid) nextStep();
    } else if (eventType === "event" && step === 1) {
      const isValid = await form.trigger(["eventTitle", "eventCategory", "date", "startTime", "endTime"]);
      if (isValid) nextStep();
    } else {
      nextStep();
    }
  };

  const submitButtonLabel = useMemo(() => {
    if (eventType === "event") return "Registrar Evento";
    return "Registrar Agendamento";
  }, [eventType]);

  // ─── Render ───────────────────────────────────────────────────────

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
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{modalTitle}</h2>
            {renderProgressDots()}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="rounded-full w-10 h-10 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all active:scale-90"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Body */}
        <div className="px-8 py-4 overflow-y-auto custom-scrollbar flex-1 min-h-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
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
            <div />
          )}

          {canAdvance ? (
            <Button
              type="button"
              onClick={handleContinue}
              className="rounded-full px-8 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-none transition-all active:scale-95 tracking-wide"
            >
              Continuar
            </Button>
          ) : (
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className={cn(
                "rounded-full px-8 h-12 font-bold tracking-wide shadow-lg hover:shadow-xl transition-all active:scale-95",
                eventType === "event"
                  ? "bg-violet-500 text-white hover:bg-violet-600"
                  : "bg-primary text-primary-foreground"
              )}
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : submitButtonLabel}
            </Button>
          )}
        </div>
      </div>
    </ResponsiveModal>
  );
}
