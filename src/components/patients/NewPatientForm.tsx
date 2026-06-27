"use client";

import { type ComponentProps, type ReactNode, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { differenceInYears, format, isValid } from "date-fns";
import {
  Check,
  ChevronDown,
  CircleHelp,
  Loader2,
  Plus,
  Save,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAddPatient } from "@/hooks/use-add-patient";
import { usePatientLookupOptions, type PatientLookupOption } from "@/hooks/use-patient-lookup-options";
import { usePatientTags, type PatientTag } from "@/hooks/use-patient-tags";
import { useProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";
import { NewPatientFormValues, NewPatientSchema } from "@/lib/validation";

interface NewPatientFormProps {
  onSuccess: (patient?: any) => void;
  onCancel?: () => void;
}

const GROUP_OPTIONS = [
  { value: "adult", label: "Adulto" },
  { value: "child", label: "Crianças" },
  { value: "adolescent", label: "Adolescentes" },
  { value: "elderly", label: "Idosos" },
];

const GENDER_OPTIONS = [
  { value: "male", label: "Masculino" },
  { value: "female", label: "Feminino" },
  { value: "agender", label: "Agênero" },
  { value: "gender_fluid", label: "Gênero Fluido" },
  { value: "non_binary", label: "Não Binário" },
  { value: "transgender", label: "Transgênero" },
  { value: "prefer_not_to_say", label: "Prefere não informar" },
  { value: "other", label: "Outro" },
];

const FINANCIAL_PLAN_OPTIONS = [
  { value: "per_session", label: "Por sessão" },
  { value: "monthly", label: "Por mês (mensalista)" },
  { value: "insurance", label: "Convênio" },
  { value: "exempt", label: "Isento" },
];

const STATE_OPTIONS = [
  "AC",
  "AL",
  "AM",
  "AP",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MG",
  "MS",
  "MT",
  "PA",
  "PB",
  "PE",
  "PI",
  "PR",
  "RJ",
  "RN",
  "RO",
  "RR",
  "RS",
  "SC",
  "SE",
  "SP",
  "TO",
];

const EDUCATION_OPTIONS = [
  "Fundamental Incompleto",
  "Fundamental Completo",
  "Médio Incompleto",
  "Médio Completo",
  "Superior Incompleto",
  "Superior Completo",
  "Mestre",
  "Doutor",
  "Pós Doutor",
  "Pós Graduação",
  "Infantil ou Jardim",
];

const RACE_OPTIONS = [
  "Branco(a)",
  "Preto(a)",
  "Amarelo(a)",
  "Pardo(a)",
  "Indígena",
  "Prefere não informar",
];

const inputClassName =
  "h-10 rounded-md border-border/60 bg-background text-sm font-medium shadow-none placeholder:text-muted-foreground/55 focus-visible:ring-2 focus-visible:ring-ring/25";

const labelClassName = "text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground";

const selectTriggerClassName = cn(inputClassName, "justify-between");

const asDateInputValue = (date?: Date) => {
  if (!date || !isValid(date)) return "";
  return format(date, "yyyy-MM-dd");
};

const fromDateInputValue = (value: string) => {
  if (!value) return undefined;
  const date = new Date(`${value}T12:00:00`);
  return isValid(date) ? date : undefined;
};

const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) => (
  <section className="border-t border-border/55 py-6 first:border-t-0 first:pt-0">
    <div className="grid gap-5 lg:grid-cols-[15rem_1fr]">
      <div className="space-y-1">
        <h3 className="text-sm font-black uppercase tracking-[0.14em] text-foreground">{title}</h3>
        {description ? <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
    </div>
  </section>
);

const FieldShell = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={cn("min-w-0", className)}>{children}</div>
);

const LookupSelect = ({
  label,
  value,
  placeholder,
  options,
  isAdding,
  onChange,
  onAdd,
}: {
  label: string;
  value?: string;
  placeholder: string;
  options: PatientLookupOption[];
  isAdding: boolean;
  onChange: (value: string) => void;
  onAdd: (label: string) => Promise<unknown>;
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newLabel, setNewLabel] = useState("");

  const handleCreate = async () => {
    const labelValue = newLabel.trim();
    if (!labelValue) return;
    const created = (await onAdd(labelValue)) as PatientLookupOption;
    onChange(created.id);
    setNewLabel("");
    setIsCreating(false);
  };

  return (
    <FieldShell>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={labelClassName}>{label}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7 rounded-md"
          onClick={() => setIsCreating((current) => !current)}
          aria-label={`Adicionar ${label.toLowerCase()}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <Select value={value || "__none"} onValueChange={onChange}>
        <SelectTrigger className={selectTriggerClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none">--Selecione--</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isCreating ? (
        <div className="mt-2 flex gap-2">
          <Input
            value={newLabel}
            onChange={(event) => setNewLabel(event.target.value)}
            placeholder="Nova opção"
            className={inputClassName}
          />
          <Button type="button" disabled={isAdding} className="h-10 rounded-md px-3" onClick={handleCreate}>
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </Button>
        </div>
      ) : null}
    </FieldShell>
  );
};

const TagSelector = ({
  selectedIds,
  tags,
  isAdding,
  onChange,
  onAdd,
}: {
  selectedIds: string[];
  tags: PatientTag[];
  isAdding: boolean;
  onChange: (ids: string[]) => void;
  onAdd: (payload: { name: string; color?: string }) => Promise<PatientTag>;
}) => {
  const [newTagName, setNewTagName] = useState("");

  const toggleTag = (tagId: string) => {
    const next = selectedIds.includes(tagId)
      ? selectedIds.filter((id) => id !== tagId)
      : [...selectedIds, tagId];
    onChange(next);
  };

  const handleAddTag = async () => {
    const name = newTagName.trim();
    if (!name) return;
    const tag = await onAdd({ name });
    onChange([...selectedIds, tag.id]);
    setNewTagName("");
  };

  return (
    <FieldShell className="sm:col-span-2 xl:col-span-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={labelClassName}>Tags</span>
        <div className="flex min-w-0 gap-2">
          <Input
            value={newTagName}
            onChange={(event) => setNewTagName(event.target.value)}
            placeholder="Nova tag"
            className={cn(inputClassName, "h-8 w-32 sm:w-44")}
          />
          <Button type="button" variant="outline" disabled={isAdding} className="h-8 rounded-md px-2.5" onClick={handleAddTag}>
            {isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
      <div className="rounded-md border border-border/55 bg-background">
        {tags.length ? (
          <ScrollArea className="max-h-32">
            <div className="grid gap-1 p-2 sm:grid-cols-2 lg:grid-cols-3">
              {tags.map((tag) => (
                <label
                  key={tag.id}
                  className="flex min-h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-sm font-medium hover:bg-muted/70"
                >
                  <Checkbox checked={selectedIds.includes(tag.id)} onCheckedChange={() => toggleTag(tag.id)} />
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />
                  <span className="truncate">{tag.name}</span>
                </label>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="px-3 py-2 text-sm text-muted-foreground">-- Clique para escolher --</p>
        )}
      </div>
    </FieldShell>
  );
};

export const NewPatientForm = ({ onSuccess, onCancel }: NewPatientFormProps) => {
  const { mutate, isPending } = useAddPatient();
  const { data: profile } = useProfile();
  const howMetOptions = usePatientLookupOptions("how_met");
  const referrerOptions = usePatientLookupOptions("referrer");
  const tags = usePatientTags();
  const [showFinancialConfig, setShowFinancialConfig] = useState(false);

  const professionalName = useMemo(() => {
    const parts = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");
    return profile?.full_name || profile?.name || parts || "João Vitor";
  }, [profile]);

  const form = useForm<NewPatientFormValues>({
    resolver: zodResolver(NewPatientSchema),
    defaultValues: {
      quick_registration: true,
      name: "",
      group_type: "adult",
      email: "",
      phone_country_code: "+55",
      mobile_phone: "",
      phone: "",
      landline_phone: "",
      cpf: "",
      rg: "",
      birth_date: undefined,
      gender_identity: "male",
      has_social_name: false,
      social_name: "",
      notes: "",
      professional_name: professionalName,
      financial_plan: "per_session",
      session_value: "0,00",
      monthly_value: "",
      convenio_name: "",
      billing_day: "",
      country: "Brasil",
      postal_code: "",
      city: "",
      state: "",
      street: "",
      street_number: "",
      neighborhood: "",
      complement: "",
      address: "",
      naturality: "",
      education_level: "",
      race: "",
      profession: "",
      relative_name: "",
      relative_relationship: "",
      relative_phone: "",
      source_option_id: "__none",
      referrer_option_id: "__none",
      tag_ids: [],
      identification_color: "#685094",
      responsible_name: "",
      responsible_email: "",
      responsible_phone_country_code: "+55",
      responsible_mobile_phone: "",
      responsible_cpf: "",
      responsible_rg: "",
      responsible_birth_date: undefined,
      responsible_use_for_billing_documents: false,
      diagnosis: "",
      emergency_name: "",
      emergency_phone: "",
      payer_type: "patient",
      payer_name: "",
      payer_cpf: "",
      medications: [],
    },
  });

  useEffect(() => {
    form.setValue("professional_name", professionalName, { shouldDirty: false });
  }, [form, professionalName]);

  const quickRegistration = form.watch("quick_registration");
  const hasSocialName = form.watch("has_social_name");
  const birthDate = form.watch("birth_date");
  const notes = form.watch("notes") || "";
  const financialPlan = form.watch("financial_plan");
  const selectedTagIds = form.watch("tag_ids") || [];

  const ageLabel = birthDate && isValid(birthDate)
    ? `${differenceInYears(new Date(), birthDate)} anos`
    : "Digite a Data de nascimento";

  const renderTextField = (
    name: keyof NewPatientFormValues,
    label: string,
    props?: ComponentProps<typeof Input> & { className?: string },
    className?: string,
  ) => (
    <FormField
      control={form.control}
      name={name as any}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel className={labelClassName}>{label}</FormLabel>
          <FormControl>
            <Input {...field} {...props} value={(field.value as string) || ""} className={cn(inputClassName, props?.className)} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const renderPhoneField = (
    codeName: keyof NewPatientFormValues,
    phoneName: keyof NewPatientFormValues,
    label: string,
    placeholder = "+55 (__) _****-****",
  ) => (
    <div className="space-y-2">
      <span className={labelClassName}>{label}</span>
      <div className="grid grid-cols-[4.5rem_1fr] gap-2">
        {renderTextField(codeName, "", { placeholder: "+55", "aria-label": `${label} DDI` })}
        {renderTextField(phoneName, "", { placeholder, "aria-label": label })}
      </div>
    </div>
  );

  const renderSelectField = (
    name: keyof NewPatientFormValues,
    label: React.ReactNode,
    options: Array<{ value: string; label: string }>,
    placeholder = "Selecione",
    className?: string,
    description?: string,
  ) => (
    <FormField
      control={form.control}
      name={name as any}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel className={cn(labelClassName, "flex items-center gap-1.5")}>{label}</FormLabel>
          <Select value={(field.value as string) || ""} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger className={selectTriggerClassName}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description ? <FormDescription className="text-[11px]">{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const renderDateField = (name: keyof NewPatientFormValues, label: string, className?: string) => (
    <FormField
      control={form.control}
      name={name as any}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel className={labelClassName}>{label}</FormLabel>
          <FormControl>
            <Input
              type="date"
              value={asDateInputValue(field.value as Date | undefined)}
              onChange={(event) => field.onChange(fromDateInputValue(event.target.value))}
              className={inputClassName}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const groupLabel = (
    <>
      Grupo
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground">
            <CircleHelp className="h-3.5 w-3.5" />
            <span className="sr-only">Ajuda sobre grupo</span>
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-80">
          Selecione um grupo abaixo ou acesse: Configurações -&gt; Modelos -&gt; Anamnese para adicionar um novo
        </TooltipContent>
      </Tooltip>
    </>
  );

  const onSubmit = (values: NewPatientFormValues) => {
    mutate(values, {
      onSuccess: (patient) => {
        toast.success("Prontuário criado com sucesso!");
        form.reset();
        onSuccess(patient);
      },
      onError: (error) => {
        toast.error(`Erro ao adicionar paciente: ${error.message}`);
      },
    });
  };

  return (
    <TooltipProvider delayDuration={150}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
              <div className="mb-5 flex flex-col gap-3 rounded-lg border border-border/55 bg-card/45 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-black text-foreground">Cadastro rápido</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Ative para mostrar só os campos essenciais. Desative para abrir o cadastro completo.
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="quick_registration"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3">
                      <FormLabel className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                        {field.value ? "Ativo" : "Completo"}
                      </FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <Section
                title={quickRegistration ? "Informações pessoais / cadastro rápido" : "Informações pessoais"}
                description={quickRegistration ? "Campos essenciais para criar o prontuário sem atrito." : "Dados pessoais e clínicos usados no prontuário e anamnese."}
              >
                {renderTextField("name", "Nome completo", { placeholder: "Digite aqui", maxLength: 100 })}
                {renderSelectField("group_type", groupLabel, GROUP_OPTIONS, "Adulto", undefined, "Utilizado para importar o formulário de anamnese")}
                {renderTextField("email", "E-mail", { placeholder: "Digite aqui", maxLength: 100, type: "email" })}
                {renderPhoneField("phone_country_code", "mobile_phone", "Celular")}
                {renderTextField("cpf", "CPF", { placeholder: "***.***._**-**", maxLength: 100 })}
                {renderTextField("rg", "RG", { placeholder: "Digite aqui", maxLength: 100 })}
                {!quickRegistration ? (
                  <>
                    {renderTextField("landline_phone", "Telefone", { placeholder: "(__) ****-****" })}
                    {renderDateField("birth_date", "Data de nascimento")}
                    <FormItem>
                      <FormLabel className={labelClassName}>Idade</FormLabel>
                      <Input disabled value={ageLabel} className={cn(inputClassName, "disabled:opacity-100")} />
                    </FormItem>
                  </>
                ) : null}
                {renderSelectField("gender_identity", "Gênero", GENDER_OPTIONS, "Masculino")}
                <FormField
                  control={form.control}
                  name="has_social_name"
                  render={({ field }) => (
                    <FormItem className="flex min-h-10 items-center justify-between gap-3 rounded-md border border-border/55 px-3 py-2">
                      <FormLabel className={cn(labelClassName, "flex items-center gap-1.5")}>
                        Cliente possui nome social?
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground">
                              <CircleHelp className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Quando habilitado, o campo de nome social aparece abaixo.</TooltipContent>
                        </Tooltip>
                      </FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {hasSocialName ? renderTextField("social_name", "Nome social", { placeholder: "Digite aqui", maxLength: 100 }) : null}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2 xl:col-span-3">
                      <div className="flex items-center justify-between gap-2">
                        <FormLabel className={labelClassName}>Observações</FormLabel>
                        <span className="text-[11px] text-muted-foreground">
                          {quickRegistration ? `${notes.length} de 400 caracteres` : "Limite de 10.000 caracteres"}
                        </span>
                      </div>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Digite aqui"
                          maxLength={quickRegistration ? 400 : 10000}
                          className="min-h-24 resize-y rounded-md border-border/60 bg-background text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Section>

              {!quickRegistration ? (
                <>
                  <Section title="Informações financeiras" description="Configuração inicial de cobrança e relacionamento financeiro do paciente.">
                    <div className="rounded-md border border-border/55 px-3 py-2">
                      <p className={labelClassName}>Profissional</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">{professionalName}</p>
                    </div>
                    {renderSelectField("financial_plan", "Plano financeiro", FINANCIAL_PLAN_OPTIONS, "Por sessão")}
                    {renderTextField("session_value", "Valor da sessão", { placeholder: "0,00", inputMode: "decimal" })}
                    <FieldShell>
                      <span className={labelClassName}>Configurar Plano Financeiro</span>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-2 h-10 w-full justify-between rounded-md"
                        onClick={() => setShowFinancialConfig((current) => !current)}
                      >
                        Configurar
                        <ChevronDown className={cn("h-4 w-4 transition-transform", showFinancialConfig && "rotate-180")} />
                      </Button>
                    </FieldShell>
                    {showFinancialConfig || financialPlan !== "per_session" ? (
                      <div className="grid gap-4 rounded-md border border-border/55 p-3 sm:col-span-2 xl:col-span-3 sm:grid-cols-3">
                        {renderTextField("monthly_value", "Valor mensal", { placeholder: "0,00", inputMode: "decimal" })}
                        {renderTextField("billing_day", "Dia de vencimento", { placeholder: "10", inputMode: "numeric", maxLength: 2 })}
                        {renderTextField("convenio_name", "Convênio", { placeholder: "Nome do convênio" })}
                      </div>
                    ) : null}
                  </Section>

                  <Section title="Endereço" description="Endereço estruturado para documentos, cobranças e cadastro clínico.">
                    {renderSelectField("country", "País", [{ value: "Brasil", label: "Brasil" }], "Brasil")}
                    {renderTextField("postal_code", "CEP", { placeholder: "__***-***" })}
                    {renderTextField("city", "Cidade", { placeholder: "Digite aqui" })}
                    {renderSelectField("state", "Estado", STATE_OPTIONS.map((state) => ({ value: state, label: state })), "UF")}
                    {renderTextField("street", "Endereço", { placeholder: "Rua, avenida..." }, "sm:col-span-2")}
                    {renderTextField("street_number", "Número", { placeholder: "Número" })}
                    {renderTextField("neighborhood", "Bairro", { placeholder: "Bairro" })}
                    {renderTextField("complement", "Complemento", { placeholder: "Apartamento, sala..." }, "sm:col-span-2")}
                  </Section>

                  <Section title="Dados adicionais" description="Informações complementares para segmentação, contato e identificação visual.">
                    {renderTextField("naturality", "Naturalidade", { placeholder: "Digite aqui" })}
                    {renderSelectField("education_level", "Escolaridade", EDUCATION_OPTIONS.map((item) => ({ value: item, label: item })), "--Selecione--")}
                    {renderSelectField("race", "Raça", RACE_OPTIONS.map((item) => ({ value: item, label: item })), "--Selecione--")}
                    {renderTextField("profession", "Profissão", { placeholder: "Digite aqui" })}
                    {renderTextField("relative_name", "Nome de um parente", { placeholder: "Digite aqui" })}
                    {renderTextField("relative_relationship", "Parentesco", { placeholder: "Digite aqui", maxLength: 50 })}
                    {renderTextField("relative_phone", "Telefone", { placeholder: "(__) ****-****" })}
                    <FormField
                      control={form.control}
                      name="source_option_id"
                      render={({ field }) => (
                        <LookupSelect
                          label="Onde nos conheceu?"
                          value={(field.value as string) || "__none"}
                          placeholder="--Selecione--"
                          options={howMetOptions.data || []}
                          isAdding={howMetOptions.addOption.isPending}
                          onChange={field.onChange}
                          onAdd={(label) => howMetOptions.addOption.mutateAsync(label)}
                        />
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="referrer_option_id"
                      render={({ field }) => (
                        <LookupSelect
                          label="Encaminhado por"
                          value={(field.value as string) || "__none"}
                          placeholder="--Selecione--"
                          options={referrerOptions.data || []}
                          isAdding={referrerOptions.addOption.isPending}
                          onChange={field.onChange}
                          onAdd={(label) => referrerOptions.addOption.mutateAsync(label)}
                        />
                      )}
                    />
                    <TagSelector
                      selectedIds={selectedTagIds}
                      tags={tags.data || []}
                      isAdding={tags.addTag.isPending}
                      onChange={(ids) => form.setValue("tag_ids", ids, { shouldDirty: true })}
                      onAdd={(payload) => tags.addTag.mutateAsync(payload)}
                    />
                    <FormField
                      control={form.control}
                      name="identification_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelClassName}>Cor de Identificação</FormLabel>
                          <div className="grid grid-cols-[3rem_1fr] gap-2">
                            <Input type="color" {...field} className="h-10 rounded-md p-1" />
                            <Input value={field.value || "#685094"} onChange={field.onChange} className={inputClassName} />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Section>

                  <Section title="Responsável" description="Dados usados quando o responsável deve receber cobranças, documentos ou notas.">
                    {renderTextField("responsible_name", "Nome do responsável", { placeholder: "Digite aqui" })}
                    {renderTextField("responsible_email", "E-mail do responsável", { placeholder: "email@exemplo.com", type: "email" })}
                    {renderPhoneField("responsible_phone_country_code", "responsible_mobile_phone", "Celular")}
                    {renderTextField("responsible_cpf", "CPF", { placeholder: "***.***._**-**" })}
                    {renderTextField("responsible_rg", "RG", { placeholder: "Digite aqui" })}
                    {renderDateField("responsible_birth_date", "Data de nascimento")}
                    <FormField
                      control={form.control}
                      name="responsible_use_for_billing_documents"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2 xl:col-span-3">
                          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border/55 p-3">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <span className="text-sm leading-relaxed text-foreground">
                              Permitir o envio de cobranças e documentos por e-mail e WhatsApp do responsável, além da emissão de notas fiscais e cobranças utilizando o nome e CPF cadastrados?
                            </span>
                          </label>
                        </FormItem>
                      )}
                    />
                  </Section>
                </>
              ) : null}
            </div>
          </div>

          <footer className="shrink-0 border-t border-border/55 bg-background/94 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" className="h-11 rounded-md px-5" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} className="h-11 rounded-md px-5">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar prontuário
              </Button>
            </div>
          </footer>
        </form>
      </Form>
    </TooltipProvider>
  );
};
