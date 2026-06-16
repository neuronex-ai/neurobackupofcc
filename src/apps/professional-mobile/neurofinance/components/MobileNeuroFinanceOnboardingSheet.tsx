import { useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, FileUp, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useFinancialAccount } from "@/hooks/use-financial-account";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
import { cn } from "@/lib/utils";
import { formatMoney, mobileFinanceSurface } from "../../shared/MobileFinancePrimitives";

type Step = "personal" | "business" | "bank" | "documents" | "review";

type FormState = {
  firstName: string;
  lastName: string;
  cpf: string;
  birthDate: string;
  phone: string;
  pep: "none" | "existing";
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  companyType: string;
  incomeValue: string;
  businessUrl: string;
  businessDescription: string;
  bankCode: string;
  agency: string;
  accountNumber: string;
  tosAccepted: boolean;
};

const steps: Array<{ id: Step; label: string }> = [
  { id: "personal", label: "Dados" },
  { id: "business", label: "Clinica" },
  { id: "bank", label: "Banco" },
  { id: "documents", label: "Docs" },
  { id: "review", label: "Revisao" },
];

const initialForm: FormState = {
  firstName: "",
  lastName: "",
  cpf: "",
  birthDate: "",
  phone: "",
  pep: "none",
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  companyType: "INDIVIDUAL",
  incomeValue: "",
  businessUrl: "",
  businessDescription: "Servicos de psicologia e saude mental",
  bankCode: "",
  agency: "",
  accountNumber: "",
  tosAccepted: false,
};

const onlyDigits = (value: string) => value.replace(/\D/g, "");
const maskCpf = (value: string) =>
  onlyDigits(value)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    .slice(0, 14);
const maskPhone = (value: string) =>
  onlyDigits(value)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .slice(0, 15);
const maskCep = (value: string) => onlyDigits(value).replace(/(\d{5})(\d)/, "$1-$2").slice(0, 9);
const parseIncome = (value: string) => Number(value.replace(/\./g, "").replace(",", ".")) || 0;
const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

function buildPayload(form: FormState, docs: { front?: string; back?: string }) {
  const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();

  return {
    name: fullName,
    email: "",
    cpfCnpj: onlyDigits(form.cpf),
    birthDate: form.birthDate,
    mobilePhone: onlyDigits(form.phone),
    companyType: form.companyType || undefined,
    incomeValue: parseIncome(form.incomeValue) || undefined,
    address: form.street.trim(),
    addressNumber: form.number.trim(),
    complement: form.complement.trim() || undefined,
    province: form.neighborhood.trim(),
    postalCode: onlyDigits(form.cep),
    site: normalizeUrl(form.businessUrl) || undefined,
    profile: {
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      political_exposure: form.pep,
      city: form.city.trim(),
      state: form.state.trim().toUpperCase(),
    },
    business_profile: {
      mcc: "8099",
      product_description: form.businessDescription.trim(),
    },
    bank_account: {
      country: "BR",
      currency: "brl",
      account_holder_type: "individual",
      account_holder_name: fullName,
      cpfCnpj: onlyDigits(form.cpf),
      bank_code: onlyDigits(form.bankCode),
      agency: onlyDigits(form.agency),
      account_number: onlyDigits(form.accountNumber),
      account_type: "CONTA_CORRENTE",
    },
    documents: {
      front_file_id: docs.front || null,
      back_file_id: docs.back || null,
    },
    tos: {
      accepted: form.tosAccepted,
    },
  };
}

export function MobileNeuroFinanceOnboardingSheet({
  open,
  onOpenChange,
  onComplete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}) {
  const account = useFinancialAccount();
  const [step, setStep] = useState<Step>("personal");
  const [form, setForm] = useState<FormState>(initialForm);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  const stepIndex = steps.findIndex((item) => item.id === step);
  const progress = useMemo(() => ((stepIndex + 1) / steps.length) * 100, [stepIndex]);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    let nextValue = value;
    if (field === "cpf") nextValue = maskCpf(String(value)) as FormState[K];
    if (field === "phone") nextValue = maskPhone(String(value)) as FormState[K];
    if (field === "cep") nextValue = maskCep(String(value)) as FormState[K];
    if (field === "state") nextValue = String(value).toUpperCase().slice(0, 2) as FormState[K];
    if (field === "bankCode") nextValue = onlyDigits(String(value)).slice(0, 3) as FormState[K];
    if (field === "agency") nextValue = onlyDigits(String(value)).slice(0, 10) as FormState[K];
    setForm((current) => ({ ...current, [field]: nextValue }));
  };

  const currentError = () => {
    if (step === "personal") {
      if (!form.firstName.trim() || !form.lastName.trim()) return "Informe nome e sobrenome.";
      if (onlyDigits(form.cpf).length !== 11) return "Informe um CPF valido.";
      if (!form.birthDate || !form.phone.trim()) return "Complete nascimento e telefone.";
    }
    if (step === "business") {
      if (!form.cep || !form.street || !form.number || !form.neighborhood || !form.city || form.state.length !== 2) return "Complete o endereco.";
      if (!form.companyType || parseIncome(form.incomeValue) <= 0) return "Informe tipo e faturamento.";
      if (form.businessDescription.trim().length < 20) return "Descreva sua atividade clinica.";
    }
    if (step === "bank") {
      if (onlyDigits(form.bankCode).length !== 3 || !form.agency || !form.accountNumber) return "Complete os dados bancarios.";
    }
    if (step === "documents" && !frontFile && !account.account?.document_front_id) return "Envie ao menos a frente do documento.";
    if (step === "review" && !form.tosAccepted) return "Aceite os termos para enviar.";
    return null;
  };

  const uploadDocument = async (file: File | null) => {
    if (!file) return null;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", "IDENTIFICATION");
    const result = await account.uploadFile.mutateAsync(formData);
    return String((result as any)?.id || "");
  };

  const submit = async () => {
    const validation = currentError();
    if (validation) {
      toast.error(validation);
      return;
    }

    setSaving(true);
    try {
      const front = await uploadDocument(frontFile);
      const back = await uploadDocument(backFile);
      await account.startOnboarding.mutateAsync(buildPayload(form, {
        front: front || account.account?.document_front_id || undefined,
        back: back || account.account?.document_back_id || undefined,
      }));
      toast.success("Conta NeuroFinance enviada para analise.");
      await account.refetch();
      onComplete();
      onOpenChange(false);
    } catch (error) {
      toast.error(getUserFacingErrorMessage(error, "save"));
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    const validation = currentError();
    if (validation) {
      toast.error(validation);
      return;
    }
    if (step === "review") void submit();
    else setStep(steps[Math.min(stepIndex + 1, steps.length - 1)].id);
  };

  const back = () => {
    if (step === "personal") onOpenChange(false);
    else setStep(steps[Math.max(stepIndex - 1, 0)].id);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="z-[130] h-[min(94dvh,52rem)] overflow-hidden rounded-t-[32px] border-x-0 border-b-0 border-t border-border/50 bg-background p-0 dark:border-white/10">
        <div className="flex h-full flex-col">
          <header className="shrink-0 px-5 pb-4 pt-5">
            <div className="mx-auto mb-4 h-1 w-11 rounded-full bg-foreground/14" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.22em] text-muted-foreground">NeuroFinance</p>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.055em]">Ativar conta</h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-foreground text-background">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-foreground/8">
              <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-3 flex justify-between">
              {steps.map((item) => (
                <span key={item.id} className={cn("text-[7px] font-black uppercase tracking-[0.08em]", item.id === step ? "text-foreground" : "text-muted-foreground/45")}>{item.label}</span>
              ))}
            </div>
          </header>

          <div className="mobile-scroll-owner min-h-0 flex-1 overflow-y-auto px-5 pb-4">
            <div className={cn(mobileFinanceSurface, "space-y-4 p-4")}>
              {step === "personal" ? (
                <>
                  <Field label="Nome"><Input value={form.firstName} onChange={(event) => setField("firstName", event.target.value)} className="h-12 rounded-[16px]" /></Field>
                  <Field label="Sobrenome"><Input value={form.lastName} onChange={(event) => setField("lastName", event.target.value)} className="h-12 rounded-[16px]" /></Field>
                  <Field label="CPF"><Input value={form.cpf} inputMode="numeric" onChange={(event) => setField("cpf", event.target.value)} className="h-12 rounded-[16px]" /></Field>
                  <Field label="Nascimento"><Input type="date" value={form.birthDate} onChange={(event) => setField("birthDate", event.target.value)} className="h-12 rounded-[16px]" /></Field>
                  <Field label="Telefone"><Input value={form.phone} inputMode="tel" onChange={(event) => setField("phone", event.target.value)} className="h-12 rounded-[16px]" /></Field>
                </>
              ) : null}

              {step === "business" ? (
                <>
                  <div className="grid grid-cols-[1fr_.45fr] gap-3">
                    <Field label="CEP"><Input value={form.cep} inputMode="numeric" onChange={(event) => setField("cep", event.target.value)} className="h-12 rounded-[16px]" /></Field>
                    <Field label="UF"><Input value={form.state} onChange={(event) => setField("state", event.target.value)} className="h-12 rounded-[16px] uppercase" /></Field>
                  </div>
                  <Field label="Rua"><Input value={form.street} onChange={(event) => setField("street", event.target.value)} className="h-12 rounded-[16px]" /></Field>
                  <div className="grid grid-cols-[.45fr_1fr] gap-3">
                    <Field label="Numero"><Input value={form.number} onChange={(event) => setField("number", event.target.value)} className="h-12 rounded-[16px]" /></Field>
                    <Field label="Bairro"><Input value={form.neighborhood} onChange={(event) => setField("neighborhood", event.target.value)} className="h-12 rounded-[16px]" /></Field>
                  </div>
                  <Field label="Cidade"><Input value={form.city} onChange={(event) => setField("city", event.target.value)} className="h-12 rounded-[16px]" /></Field>
                  <Field label="Faturamento mensal"><Input value={form.incomeValue} inputMode="decimal" placeholder="5.000,00" onChange={(event) => setField("incomeValue", event.target.value)} className="h-12 rounded-[16px]" /></Field>
                  <Field label="Descricao clinica"><textarea value={form.businessDescription} onChange={(event) => setField("businessDescription", event.target.value)} className="min-h-28 w-full resize-none rounded-[18px] border border-input bg-background px-4 py-3 text-sm outline-none" /></Field>
                  <Field label="Site ou perfil profissional"><Input value={form.businessUrl} onChange={(event) => setField("businessUrl", event.target.value)} className="h-12 rounded-[16px]" /></Field>
                </>
              ) : null}

              {step === "bank" ? (
                <>
                  <Field label="Codigo do banco"><Input value={form.bankCode} inputMode="numeric" placeholder="001" onChange={(event) => setField("bankCode", event.target.value)} className="h-12 rounded-[16px]" /></Field>
                  <Field label="Agencia"><Input value={form.agency} inputMode="numeric" placeholder="0001" onChange={(event) => setField("agency", event.target.value)} className="h-12 rounded-[16px]" /></Field>
                  <Field label="Conta com digito"><Input value={form.accountNumber} placeholder="123456-7" onChange={(event) => setField("accountNumber", event.target.value)} className="h-12 rounded-[16px]" /></Field>
                  <p className="rounded-[18px] border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] font-semibold leading-relaxed text-amber-700 dark:text-amber-300">A conta bancária precisa ter a mesma titularidade do CPF informado.</p>
                </>
              ) : null}

              {step === "documents" ? (
                <div className="grid gap-3">
                  <DocumentButton label="Frente do documento" file={frontFile} onClick={() => frontRef.current?.click()} />
                  <DocumentButton label="Verso do documento" file={backFile} onClick={() => backRef.current?.click()} optional />
                  <input ref={frontRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(event) => setFrontFile(event.target.files?.[0] || null)} />
                  <input ref={backRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(event) => setBackFile(event.target.files?.[0] || null)} />
                </div>
              ) : null}

              {step === "review" ? (
                <div className="space-y-3">
                  <ReviewRow label="Titular" value={`${form.firstName} ${form.lastName}`} />
                  <ReviewRow label="CPF" value={form.cpf} />
                  <ReviewRow label="Cidade" value={`${form.city}/${form.state}`} />
                  <ReviewRow label="Faturamento" value={formatMoney(parseIncome(form.incomeValue))} />
                  <ReviewRow label="Banco" value={`${form.bankCode} · ${form.agency} · ${form.accountNumber}`} />
                  <label className="flex items-start gap-3 rounded-[18px] border border-border/45 bg-background/65 p-3 text-[11px] font-semibold leading-relaxed">
                    <input type="checkbox" checked={form.tosAccepted} onChange={(event) => setField("tosAccepted", event.target.checked)} className="mt-1" />
                    Autorizo o envio dos dados para validação KYC e abertura da conta conectada NeuroFinance.
                  </label>
                </div>
              ) : null}
            </div>
          </div>

          <footer className="grid shrink-0 grid-cols-[.8fr_1.2fr] gap-3 border-t border-border/45 bg-background/90 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl dark:border-white/10">
            <Button variant="outline" onClick={back} disabled={saving} className="h-[52px] rounded-[18px] text-[10px] font-black uppercase tracking-[0.12em]">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button onClick={next} disabled={saving} className="h-[52px] rounded-[18px] text-[10px] font-black uppercase tracking-[0.12em]">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : step === "review" ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              {step === "review" ? "Enviar" : "Continuar"}
            </Button>
          </footer>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function DocumentButton({ label, file, optional, onClick }: { label: string; file: File | null; optional?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-[22px] border border-dashed border-border/70 bg-background/65 p-5 text-left dark:border-white/10">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-foreground/[0.06]">
          {file ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <FileUp className="h-5 w-5 text-muted-foreground" />}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-black">{label}</p>
          <p className="mt-1 truncate text-[10px] font-semibold text-muted-foreground">{file?.name || (optional ? "Opcional quando aplicável" : "PNG, JPG ou PDF")}</p>
        </div>
      </div>
    </button>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[16px] border border-border/35 bg-background/65 p-3 dark:border-white/10">
      <span className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      <span className="max-w-[58%] text-right text-xs font-black">{value || "-"}</span>
    </div>
  );
}
