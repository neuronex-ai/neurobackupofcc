"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { motion, type Variants } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

type Step = "identity" | "clinic" | "security";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  crp: string;
  clinicName: string;
  clinicSize: string;
  planIntent: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
};

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const } },
};

const steps: Array<{ id: Step; label: string; icon: typeof UserRound }> = [
  { id: "identity", label: "Profissional", icon: UserRound },
  { id: "clinic", label: "Clinica", icon: ShieldCheck },
  { id: "security", label: "Seguranca", icon: LockKeyhole },
];

const initialForm: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  crp: "",
  clinicName: "",
  clinicSize: "solo",
  planIntent: "professional",
  password: "",
  confirmPassword: "",
  acceptedTerms: false,
};

const onlyDigits = (value: string) => value.replace(/\D/g, "");
const maskPhone = (value: string) =>
  onlyDigits(value)
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .slice(0, 15);

export default function CreateAccount() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("identity");
  const [form, setForm] = useState<FormState>(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const stepIndex = steps.findIndex((item) => item.id === step);
  const progress = ((stepIndex + 1) / steps.length) * 100;
  const logoSrc = "/favicon-S-FUNDO-PRETA.ico";

  const fullName = useMemo(() => [form.firstName, form.lastName].filter(Boolean).join(" "), [form.firstName, form.lastName]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({
      ...current,
      [key]: key === "phone" && typeof value === "string" ? maskPhone(value) : value,
    }));
  };

  const validateStep = () => {
    if (step === "identity") {
      if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
        toast.error("Preencha nome, sobrenome e e-mail.");
        return false;
      }
      if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
        toast.error("Informe um e-mail valido.");
        return false;
      }
    }
    if (step === "clinic") {
      if (!form.crp.trim() || !form.clinicName.trim()) {
        toast.error("Informe CRP e nome da clinica.");
        return false;
      }
    }
    if (step === "security") {
      if (form.password.length < 8) {
        toast.error("A senha precisa ter pelo menos 8 caracteres.");
        return false;
      }
      if (form.password !== form.confirmPassword) {
        toast.error("As senhas nao conferem.");
        return false;
      }
      if (!form.acceptedTerms) {
        toast.error("Aceite os termos para criar a conta.");
        return false;
      }
    }
    return true;
  };

  const next = () => {
    if (!validateStep()) return;
    const nextStep = steps[stepIndex + 1]?.id;
    if (nextStep) {
      setStep(nextStep);
      return;
    }
    void submit();
  };

  const back = () => {
    const previousStep = steps[stepIndex - 1]?.id;
    if (previousStep) setStep(previousStep);
  };

  const submit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      const email = form.email.trim().toLowerCase();
      const { error } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth?verified=true`,
          data: {
            first_name: form.firstName.trim(),
            last_name: form.lastName.trim(),
            full_name: fullName,
            phone: form.phone,
            crp: form.crp.trim(),
            clinic_name: form.clinicName.trim(),
            clinic_size: form.clinicSize,
            plan_intent: form.planIntent,
            role: "professional",
            onboarding_source: "create-account",
          },
        },
      });

      if (error) throw error;

      toast.success("Conta criada. Verifique seu e-mail.");
      navigate("/account-created", { state: { email, firstName: form.firstName.trim() || "Profissional" } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nao foi possivel criar a conta.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-white text-black selection:bg-black/10 dark:bg-black dark:text-white">
      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="hidden border-r border-black/5 bg-[#f6f6f4] p-12 dark:border-white/10 dark:bg-[#050505] lg:flex lg:flex-col lg:justify-between">
          <Link to="/" className="inline-flex w-fit items-center gap-3">
            <img src={logoSrc} alt="NeuroNex" className="h-9 w-9 dark:invert" />
            <span className="text-sm font-black uppercase tracking-[0.22em]">NeuroNex</span>
          </Link>

          <div className="max-w-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-black/35 dark:text-white/35">Acesso profissional</p>
            <h1 className="mt-6 text-7xl font-black tracking-[-0.07em] leading-[0.88]">
              Crie sua conta clinica.
            </h1>
            <p className="mt-8 max-w-md text-lg font-semibold leading-relaxed text-black/48 dark:text-white/52">
              Um cadastro direto para liberar a experiencia NeuroNex, com seguranca, notificacoes e configuracao financeira preparadas para a proxima etapa.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {steps.map((item, index) => {
              const active = index <= stepIndex;
              return (
                <div key={item.id} className={cn("rounded-[24px] border p-4", active ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black" : "border-black/10 bg-white/55 text-black/45 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/45")}>
                  <item.icon className="h-5 w-5" />
                  <p className="mt-4 text-[10px] font-black uppercase tracking-[0.12em]">{item.label}</p>
                </div>
              );
            })}
          </div>
        </aside>

        <section className="flex min-h-screen items-center justify-center px-5 py-[calc(1rem+env(safe-area-inset-top))] sm:px-8 lg:p-12">
          <motion.div initial="hidden" animate="visible" variants={fadeIn} className="w-full max-w-[520px]">
            <div className="mb-7 flex items-center justify-between lg:hidden">
              <Link to="/" className="inline-flex items-center gap-3">
                <img src={logoSrc} alt="NeuroNex" className="h-10 w-10 dark:invert" />
                <span className="text-sm font-black uppercase tracking-[0.18em]">NeuroNex</span>
              </Link>
              <Button asChild variant="ghost" className="h-11 rounded-full px-4 text-xs font-black">
                <Link to="/auth">Entrar</Link>
              </Button>
            </div>

            <div className="overflow-hidden rounded-[40px] border border-black/8 bg-white shadow-[0_28px_80px_-48px_rgba(0,0,0,0.55)] dark:border-white/10 dark:bg-[#060606]">
              <header className="p-6 pb-5 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/35 dark:text-white/35">Criar conta</p>
                    <h2 className="mt-2 text-3xl font-black tracking-[-0.06em] sm:text-4xl">Comece pelo essencial.</h2>
                  </div>
                  <span className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-black text-white dark:bg-white dark:text-black">
                    {step === "security" ? <LockKeyhole className="h-5 w-5" /> : step === "clinic" ? <ShieldCheck className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
                  </span>
                </div>
                <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-black/6 dark:bg-white/10">
                  <div className="h-full rounded-full bg-black transition-all duration-300 dark:bg-white" style={{ width: `${progress}%` }} />
                </div>
              </header>

              <div className="min-h-[430px] px-6 pb-6 sm:px-8 sm:pb-8">
                {step === "identity" ? (
                  <FormSection>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Nome"><Input value={form.firstName} onChange={(event) => setField("firstName", event.target.value)} autoComplete="given-name" className="h-[52px] rounded-[18px]" /></Field>
                      <Field label="Sobrenome"><Input value={form.lastName} onChange={(event) => setField("lastName", event.target.value)} autoComplete="family-name" className="h-[52px] rounded-[18px]" /></Field>
                    </div>
                    <Field label="E-mail"><Input value={form.email} onChange={(event) => setField("email", event.target.value)} type="email" autoComplete="email" inputMode="email" className="h-[52px] rounded-[18px]" /></Field>
                    <Field label="Telefone"><Input value={form.phone} onChange={(event) => setField("phone", event.target.value)} type="tel" inputMode="tel" autoComplete="tel" className="h-[52px] rounded-[18px]" /></Field>
                  </FormSection>
                ) : null}

                {step === "clinic" ? (
                  <FormSection>
                    <Field label="CRP"><Input value={form.crp} onChange={(event) => setField("crp", event.target.value)} placeholder="CRP 00/000000" className="h-[52px] rounded-[18px]" /></Field>
                    <Field label="Nome da clinica"><Input value={form.clinicName} onChange={(event) => setField("clinicName", event.target.value)} className="h-[52px] rounded-[18px]" /></Field>
                    <ChoiceGroup
                      label="Tamanho da operacao"
                      value={form.clinicSize}
                      onChange={(value) => setField("clinicSize", value)}
                      options={[
                        { value: "solo", label: "Solo" },
                        { value: "team", label: "Equipe" },
                      ]}
                    />
                    <ChoiceGroup
                      label="Plano inicial"
                      value={form.planIntent}
                      onChange={(value) => setField("planIntent", value)}
                      options={[
                        { value: "professional", label: "Profissional" },
                        { value: "clinic", label: "Clinica" },
                      ]}
                    />
                  </FormSection>
                ) : null}

                {step === "security" ? (
                  <FormSection>
                    <PasswordField label="Senha" value={form.password} show={showPassword} onToggle={() => setShowPassword((value) => !value)} onChange={(value) => setField("password", value)} />
                    <PasswordField label="Confirmar senha" value={form.confirmPassword} show={showPassword} onToggle={() => setShowPassword((value) => !value)} onChange={(value) => setField("confirmPassword", value)} />
                    <label className="flex items-start gap-3 rounded-[22px] border border-black/8 bg-black/[0.025] p-4 text-xs font-bold leading-relaxed text-black/62 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/62">
                      <input
                        type="checkbox"
                        checked={form.acceptedTerms}
                        onChange={(event) => setField("acceptedTerms", event.target.checked)}
                        className="mt-0.5 h-5 w-5 rounded border-black/20 accent-black dark:accent-white"
                      />
                      Li e aceito os termos de uso e a politica de privacidade da NeuroNex.
                    </label>
                  </FormSection>
                ) : null}
              </div>

              <footer className="grid grid-cols-[0.78fr_1.22fr] gap-3 border-t border-black/6 bg-black/[0.018] p-5 dark:border-white/10 dark:bg-white/[0.035]">
                <Button variant="outline" onClick={back} disabled={stepIndex === 0 || submitting} className="h-[52px] rounded-[18px] text-[10px] font-black uppercase tracking-[0.12em]">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button onClick={next} disabled={submitting} className="h-[52px] rounded-[18px] text-[10px] font-black uppercase tracking-[0.12em]">
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : step === "security" ? <Check className="mr-2 h-4 w-4" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                  {step === "security" ? "Criar conta" : "Continuar"}
                </Button>
              </footer>
            </div>

            <p className="mt-6 text-center text-[11px] font-bold text-black/45 dark:text-white/45">
              Ja tem uma conta? <Link to="/auth?role=pro" className="text-black underline-offset-4 hover:underline dark:text-white">Entrar no NeuroNex</Link>
            </p>
          </motion.div>
        </section>
      </div>
    </main>
  );
}

function FormSection({ children }: { children: ReactNode }) {
  return <motion.div initial="hidden" animate="visible" variants={fadeIn} className="grid gap-4">{children}</motion.div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-black/40 dark:text-white/40">{label}</span>
      {children}
    </label>
  );
}

function PasswordField({ label, value, show, onToggle, onChange }: { label: string; value: string; show: boolean; onToggle: () => void; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <div className="relative">
        <Input value={value} onChange={(event) => onChange(event.target.value)} type={show ? "text" : "password"} autoComplete="new-password" className="h-[52px] rounded-[18px] pr-12" />
        <button type="button" onClick={onToggle} className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-[14px] text-black/55 active:bg-black/5 dark:text-white/55 dark:active:bg-white/10" aria-label={show ? "Ocultar senha" : "Mostrar senha"}>
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </Field>
  );
}

function ChoiceGroup({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return (
    <div className="grid gap-2">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-black/40 dark:text-white/40">{label}</p>
      <div className="grid grid-cols-2 gap-2 rounded-[22px] border border-black/8 bg-black/[0.025] p-1.5 dark:border-white/10 dark:bg-white/[0.035]">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn("h-12 rounded-[17px] text-xs font-black transition-all active:scale-[0.98]", active ? "bg-black text-white dark:bg-white dark:text-black" : "text-black/45 dark:text-white/45")}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
