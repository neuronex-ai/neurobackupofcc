import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
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
import { Calendar } from "@/components/ui/calendar";
import { useUpdatePatient } from "@/hooks/use-update-patient";
import { Patient } from "@/types";
import { User, Mail, Phone, FileText, Activity, Save, Loader2, AlertCircle, MapPin, AlertTriangle, Wallet, Calendar as CalendarIcon, CreditCard, Pill, Plus, Trash2 } from "lucide-react";
import { format, isValid, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

// Schema de validação
const EditPatientSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  email: z.string().email({ message: "Email inválido." }).optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  cpf: z.string().optional().or(z.literal("")),
  diagnosis: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  status: z.enum(["pending", "active", "inactive"]),
  birth_date: z.date().optional(),
  address: z.string().optional().or(z.literal("")),
  emergency_name: z.string().optional().or(z.literal("")),
  emergency_phone: z.string().optional().or(z.literal("")),
  payer_type: z.enum(["patient", "other"]).optional(),
  payer_name: z.string().optional().or(z.literal("")),
  payer_cpf: z.string().optional().or(z.literal("")),
  medications: z.array(z.object({
    name: z.string().min(1, "Nome necessário"),
    dosage: z.string().optional(),
    frequency: z.string().optional(),
  })).optional(),
});

type EditPatientFormValues = z.infer<typeof EditPatientSchema>;

interface EditPatientFormProps {
  patient: Patient;
  onSuccess: () => void;
}

export const EditPatientForm = ({ patient, onSuccess }: EditPatientFormProps) => {
  const { mutate, isPending } = useUpdatePatient();

  // Estado para o valor do input de data
  const [dateInputValue, setDateInputValue] = useState("");

  // Parse emergency contact string
  const emergencyParts = (patient.emergency_contact || "").split(" - ");
  const defaultEmergencyName = emergencyParts[0] || "";
  const defaultEmergencyPhone = emergencyParts.length > 1 ? emergencyParts.slice(1).join(" - ") : "";

  // Ensure correct date object from string
  let defaultBirthDate: Date | undefined;
  if (patient.birth_date) {
    const [y, m, d] = patient.birth_date.split('-').map(Number);
    defaultBirthDate = new Date(y, m - 1, d);
  }

  useEffect(() => {
    if (defaultBirthDate) {
      setDateInputValue(format(defaultBirthDate, 'dd/MM/yyyy'));
    }
  }, []);

  const form = useForm<EditPatientFormValues>({
    resolver: zodResolver(EditPatientSchema),
    defaultValues: {
      name: patient.name,
      email: patient.email || "",
      phone: patient.phone || "",
      cpf: patient.cpf || "",
      diagnosis: patient.diagnosis || "",
      notes: patient.notes || "",
      status: (patient.status as EditPatientFormValues['status']) || "pending",
      birth_date: defaultBirthDate,
      address: patient.address || "",
      emergency_name: defaultEmergencyName,
      emergency_phone: defaultEmergencyPhone,
      payer_type: patient.payer_type || "patient",
      payer_name: patient.payer_name || "",
      payer_cpf: patient.payer_cpf || "",
      medications: patient.medications || [],
    },
  });

  const { fields: medFields, append: appendMed, remove: removeMed } = useFieldArray({
    control: form.control,
    name: "medications"
  });

  const payerType = form.watch("payer_type");

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, onChange: (date: Date | undefined) => void) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);

    if (value.length >= 5) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
    } else if (value.length >= 3) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }

    setDateInputValue(value);

    if (value.length === 10) {
      const parsedDate = parse(value, 'dd/MM/yyyy', new Date());
      if (isValid(parsedDate) && parsedDate.getFullYear() > 1900) {
        onChange(parsedDate);
      }
    } else if (value.length === 0) {
      onChange(undefined);
    }
  };

  const onSubmit = (values: EditPatientFormValues) => {
    // Remover máscaras de CPF antes de enviar
    if (values.cpf) values.cpf = values.cpf.replace(/\D/g, '');
    if (values.payer_cpf) values.payer_cpf = values.payer_cpf.replace(/\D/g, '');

    // Re-combine fields
    const emergencyContact = [values.emergency_name, values.emergency_phone]
      .filter(Boolean)
      .join(" - ");

    const updates: Partial<Patient> = {
      name: values.name,
      email: values.email || null,
      phone: values.phone || null,
      cpf: values.cpf || null,
      diagnosis: values.diagnosis || null,
      notes: values.notes || null,
      status: values.status,
      birth_date: values.birth_date ? format(values.birth_date, 'yyyy-MM-dd') : null,
      address: values.address || null,
      emergency_contact: emergencyContact || null,
      payer_type: values.payer_type,
      payer_name: values.payer_name || null,
      payer_cpf: values.payer_cpf || null,
      medications: values.medications ? values.medications.map(m => ({
        name: m.name || "",
        dosage: m.dosage,
        frequency: m.frequency
      })) : [],
    };

    mutate({ id: patient.id, updates }, {
      onSuccess: () => {
        toast.success("Paciente atualizado com sucesso!");
        onSuccess();
      },
      onError: (error) => {
        toast.error(`Erro ao atualizar paciente: ${error.message}`);
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar pr-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <User className="h-3.5 w-3.5" /> Nome Completo
              </FormLabel>
              <FormControl>
                <Input placeholder="Nome do paciente" {...field} className="bg-secondary/20 border-border/20 hover:bg-secondary/30 focus:bg-secondary/40 focus:border-border/40 h-14 rounded-[20px] transition-all placeholder:text-muted-foreground/50 text-foreground font-medium shadow-sm backdrop-blur-md" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="birth_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
                  <CalendarIcon className="h-3.5 w-3.5" /> Nascimento
                </FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      placeholder="DD/MM/AAAA"
                      value={dateInputValue}
                      onChange={(e) => handleDateChange(e, field.onChange)}
                      className="bg-secondary/20 border-border/20 hover:bg-secondary/30 focus:bg-secondary/40 focus:border-border/40 h-14 w-full rounded-[20px] pr-12 transition-all font-mono placeholder:text-muted-foreground/50 text-foreground font-medium shadow-sm backdrop-blur-md"
                      maxLength={10}
                    />
                  </FormControl>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-11 w-11 rounded-r-xl text-muted-foreground hover:text-primary hover:bg-secondary/30"
                      >
                        <CalendarIcon className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-popover border-border/20 shadow-2xl" align="end">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          if (date) {
                            setDateInputValue(format(date, 'dd/MM/yyyy'));
                          }
                        }}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                        locale={ptBR}
                        className="p-3"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  <CreditCard className="h-3.5 w-3.5" /> CPF
                </FormLabel>
                <FormControl>
                  <Input placeholder="000.000.000-00" {...field} className="bg-secondary/20 border-border/20 hover:bg-secondary/30 focus:bg-secondary/40 focus:border-border/40 h-14 rounded-[20px] transition-all placeholder:text-muted-foreground/50 text-foreground font-medium shadow-sm backdrop-blur-md" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  <Phone className="h-3.5 w-3.5" /> Telefone
                </FormLabel>
                <FormControl>
                  <Input placeholder="(99) 99999-9999" {...field} className="bg-secondary/20 border-border/20 hover:bg-secondary/30 focus:bg-secondary/40 focus:border-border/40 h-14 rounded-[20px] transition-all placeholder:text-muted-foreground/50 text-foreground font-medium shadow-sm backdrop-blur-md" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  <Mail className="h-3.5 w-3.5" /> Email
                </FormLabel>
                <FormControl>
                  <Input placeholder="email@exemplo.com" {...field} className="bg-secondary/20 border-border/20 hover:bg-secondary/30 focus:bg-secondary/40 focus:border-border/40 h-14 rounded-[20px] transition-all placeholder:text-muted-foreground/50 text-foreground font-medium shadow-sm backdrop-blur-md" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <MapPin className="h-3.5 w-3.5" /> Endereço Completo
              </FormLabel>
              <FormControl>
                <Input placeholder="Rua, Nº, Bairro, Cidade - UF" {...field} className="bg-secondary/20 border-border/20 hover:bg-secondary/30 focus:bg-secondary/40 focus:border-border/40 h-14 rounded-[20px] transition-all placeholder:text-muted-foreground/50 text-foreground font-medium shadow-sm backdrop-blur-md" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contato de Emergência - Dividido */}
        <div className="p-6 rounded-[24px] bg-secondary/10 border border-border/20 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-secondary/30 flex items-center justify-center border border-border/20">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Contato de Emergência</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="emergency_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider ml-1">Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do contato" {...field} className="bg-secondary/20 border-border/20 hover:bg-secondary/30 focus:bg-secondary/40 focus:border-border/40 h-14 rounded-[20px] transition-all placeholder:text-muted-foreground/50 text-foreground font-medium shadow-sm backdrop-blur-md" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emergency_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider ml-1">Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="(99) 99999-9999" {...field} className="bg-secondary/20 border-border/20 hover:bg-secondary/30 focus:bg-secondary/40 focus:border-border/40 h-14 rounded-[20px] transition-all placeholder:text-muted-foreground/50 text-foreground font-medium shadow-sm backdrop-blur-md" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Financeiro */}
        <div className="p-6 rounded-[24px] bg-secondary/10 border border-border/20 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-secondary/30 flex items-center justify-center border border-border/20">
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Responsável Financeiro</span>
          </div>

          <FormField
            control={form.control}
            name="payer_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider ml-1">Quem paga as sessões?</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || 'patient'}>
                  <FormControl>
                    <SelectTrigger className="bg-secondary/20 border-border/20 hover:bg-secondary/30 focus:bg-secondary/40 focus:border-border/40 h-14 rounded-[20px] transition-all font-medium backdrop-blur-md">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/20 z-[9999]">
                    <SelectItem value="patient" className="text-muted-foreground focus:text-foreground cursor-pointer">O Próprio Paciente (Usa CPF acima)</SelectItem>
                    <SelectItem value="other" className="text-muted-foreground focus:text-foreground cursor-pointer">Terceiro (Responsável)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {payerType === 'other' && (
            <div className="grid grid-cols-2 gap-4 animate-fade-in">
              <FormField
                control={form.control}
                name="payer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider ml-1">Nome Responsável</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} className="bg-secondary/20 border-border/20 hover:bg-secondary/30 focus:bg-secondary/40 focus:border-border/40 h-14 rounded-[20px] transition-all placeholder:text-muted-foreground/50 text-foreground font-medium shadow-sm backdrop-blur-md" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="payer_cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider ml-1">CPF Responsável</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} className="bg-secondary/20 border-border/20 hover:bg-secondary/30 focus:bg-secondary/40 focus:border-border/40 h-14 rounded-[20px] transition-all placeholder:text-muted-foreground/50 text-foreground font-medium shadow-sm backdrop-blur-md" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        {/* Medicação */}
        <div className="p-6 rounded-[24px] bg-secondary/10 border border-border/20 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary/30 flex items-center justify-center border border-border/20">
                <Pill className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Uso Medicamentoso</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendMed({ name: "", dosage: "" })}
              className="h-8 text-[10px] uppercase font-bold bg-transparent border-border/20 hover:bg-secondary/30 text-muted-foreground px-3 rounded-full"
            >
              <Plus className="h-3 w-3 mr-1" /> Adicionar
            </Button>
          </div>

          {medFields.length === 0 && (
            <p className="text-[11px] text-muted-foreground/50 italic text-center py-4 border border-dashed border-border/20 rounded-2xl">Nenhuma medicação registrada.</p>
          )}

          <div className="space-y-3">
            {medFields.map((field, index) => (
              <div key={field.id} className="flex gap-3 items-start animate-in slide-in-from-left-2 duration-300">
                <FormField
                  control={form.control}
                  name={`medications.${index}.name`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="Nome do remédio" {...field} className="bg-secondary/20 border-border/20 hover:bg-secondary/30 focus:bg-secondary/40 focus:border-border/40 h-12 rounded-[20px] transition-all placeholder:text-muted-foreground/50 text-foreground font-medium shadow-sm backdrop-blur-md" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`medications.${index}.dosage`}
                  render={({ field }) => (
                    <FormItem className="w-28">
                      <FormControl>
                        <Input placeholder="Dosagem" {...field} className="bg-secondary/20 border-border/20 hover:bg-secondary/30 focus:bg-secondary/40 focus:border-border/40 h-12 rounded-[20px] transition-all placeholder:text-muted-foreground/50 text-foreground font-medium shadow-sm backdrop-blur-md text-center" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMed(index)}
                  className="h-12 w-12 text-muted-foreground/50 hover:text-foreground hover:bg-secondary/30 rounded-[18px] transition-colors flex-shrink-0 border border-transparent hover:border-border/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  <AlertCircle className="h-3.5 w-3.5" /> Status
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.05] focus:bg-white/[0.08] focus:border-white/[0.1] h-14 rounded-[20px] transition-all font-medium backdrop-blur-md">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/20 z-[9999]">
                    <SelectItem value="pending" className="text-muted-foreground focus:text-foreground cursor-pointer">Pendente</SelectItem>
                    <SelectItem value="active" className="text-emerald-400 focus:text-emerald-300 cursor-pointer">Em Tratamento</SelectItem>
                    <SelectItem value="inactive" className="text-muted-foreground focus:text-foreground cursor-pointer">Inativo / Alta</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="diagnosis"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  <Activity className="h-3.5 w-3.5" /> Diagnóstico
                </FormLabel>
                <FormControl>
                  <Input placeholder="Ex: TAG" {...field} className="bg-secondary/20 border-border/20 hover:bg-secondary/30 focus:bg-secondary/40 focus:border-border/40 h-14 rounded-[20px] transition-all placeholder:text-muted-foreground/50 text-foreground font-medium shadow-sm backdrop-blur-md" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <FileText className="h-3.5 w-3.5" /> Observações Gerais
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Anotações importantes sobre o paciente..."
                  {...field}
                  rows={3}
                  className="bg-secondary/20 border-border/20 focus:bg-secondary/40 resize-none rounded-[20px] custom-scrollbar focus:border-border/40 transition-all placeholder:text-muted-foreground/50 text-foreground shadow-inner p-4"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full gap-2 h-14 rounded-[20px] shadow-lg bg-foreground hover:bg-foreground/90 text-background transition-all active:scale-95 text-sm uppercase tracking-widest font-bold" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin text-background" /> : <Save className="h-4 w-4" />}
          {isPending ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </form>
    </Form>
  );
};