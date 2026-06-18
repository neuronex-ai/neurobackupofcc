"use client";

import { TotpMfaDialog } from "@/components/settings/TotpMfaDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  CreateAccountDraft,
  type EmailAvailability,
  type GenderIdentity,
  type PasswordStrength,
  ProfessionalContext,
  maskBrazilPhone,
  normalizeEmail,
  useCreateAccountFlow,
} from "@/hooks/use-create-account-flow";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  Fingerprint,
  Loader2,
  Mail,
  MailCheck,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const fadeSlide: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.99,
    transition: { duration: 0.18 },
  },
};

const contextOptions: Array<{ value: ProfessionalContext; label: string; description: string }> = [
  {
    value: "individual_professional",
    label: "Sou profissional individual",
    description: "Atendo com agenda e pacientes próprios.",
  },
  {
    value: "clinic_admin",
    label: "Sou administrador(a) de clínica",
    description: "Cuido da operação de uma equipe clínica.",
  },
  {
    value: "psychology_student",
    label: "Sou estudante de psicologia",
    description: "Quero organizar estudos, prática e evolução.",
  },
];

const genderOptions: Array<{ value: GenderIdentity; label: string }> = [
  {
    value: "female",
    label: "Feminino",
  },
  {
    value: "male",
    label: "Masculino",
  },
  {
    value: "non_binary",
    label: "Não binário",
    description: "O Synapse evita marcação de gênero e prioriza seu primeiro nome.",
  },
  {
    value: "prefer_not_to_say",
    label: "Prefiro não informar",
    description: "O Synapse usa linguagem neutra e seu primeiro nome.",
  },
];

const passwordRules = [
  { key: "minLength", label: "Mínimo de 8 caracteres" },
  { key: "lower", label: "1 letra minúscula" },
  { key: "upper", label: "1 letra maiúscula" },
  { key: "special", label: "1 caractere especial: @ # < ! $ % & * ; / ?" },
] as const;

export default function CreateAccount() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const flow = useCreateAccountFlow();
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const [totpOpen, setTotpOpen] = useState(false);
  const [successProgress, setSuccessProgress] = useState(12);

  const isDarkTheme = theme === "dark";
  const logoSrc = isDarkTheme ? "/favicon-light.png" : "/favicon-dark.png";
  const shellClass = isDarkTheme ? "bg-[#020202] text-white" : "bg-[#f8f8f6] text-[#171514]";
  const frameClass = isDarkTheme
    ? "border-black/80 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.13),transparent_30%),linear-gradient(145deg,#020202_0%,#141414_48%,#030303_100%)] shadow-[0_28px_82px_-48px_rgba(255,255,255,0.2)]"
    : "border-black/[0.055] bg-[#f8f8f6] shadow-[0_28px_82px_-50px_rgba(0,0,0,0.42)]";
  const panelClass = isDarkTheme
    ? "bg-[linear-gradient(160deg,#ffffff_0%,#f4f3ef_48%,#e7e6e0_100%)] text-[#171514]"
    : "bg-[linear-gradient(160deg,#292626_0%,#201e1e_48%,#171515_100%)] text-white";
  const inputClass = cn(
    "h-[3.25rem] rounded-[4px] border-x-0 border-t-0 bg-transparent px-3 text-sm font-semibold shadow-none transition-colors duration-200",
    "focus-visible:ring-0 focus-visible:ring-offset-0",
    isDarkTheme
      ? "border-black/10 text-[#171514] placeholder:text-[#98a0ad] hover:bg-zinc-100/70 focus-visible:border-black/20 focus-visible:bg-zinc-200/80 selection:bg-white selection:text-black"
      : "border-white/40 text-white placeholder:text-white/60 hover:bg-black/10 focus-visible:border-white/60 focus-visible:bg-black/25 selection:bg-white selection:text-[#171514]",
  );
  const primaryButtonClass = isDarkTheme
    ? "bg-[#201e1e] text-white hover:bg-black"
    : "bg-[#fff1f4] text-[#171514] hover:bg-white";
  const identityButtonClass = isDarkTheme
    ? "bg-[#201e1e] text-white hover:bg-black"
    : "bg-[#fff1f4] text-[#171514] hover:bg-white";
  const selectContentClass = isDarkTheme
    ? "border-black/10 bg-[#f7f6f1] text-[#171514]"
    : "border-white/10 bg-[#111010] text-white";
  const mutedPanelClass = isDarkTheme
    ? "border-black/10 bg-black/[0.035] text-[#171514]"
    : "border-white/15 bg-white/[0.035] text-white";
  const stepNumber = flow.step === "identity" ? 1 : flow.step === "password" ? 2 : 3;
  const progress = flow.step === "identity" ? 34 : flow.step === "password" ? 68 : 100;

  const firstName = useMemo(() => flow.draft.fullName.trim().split(/\s+/)[0] || "profissional", [flow.draft.fullName]);

  const updateDraft = <K extends keyof CreateAccountDraft>(key: K, value: CreateAccountDraft[K]) => {
    if (key === "email" || key === "recoveryEmail") {
      flow.setDraft({ [key]: normalizeEmail(String(value)) } as Partial<CreateAccountDraft>);
      return;
    }
    if (key === "phone") {
      flow.setDraft({ phone: maskBrazilPhone(String(value)) });
      return;
    }
    flow.setDraft({ [key]: value } as Partial<CreateAccountDraft>);
  };

  const submitIdentity = async () => {
    try {
      await flow.sendVerificationEmail();
      toast.success("Enviamos o código para o seu e-mail.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar o e-mail de confirmação.");
    }
  };

  const submitOtp = async () => {
    try {
      await flow.verifyEmailCode();
      toast.success("E-mail confirmado. Agora crie sua senha.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Código inválido ou expirado.");
    }
  };

  const resendOtp = async () => {
    try {
      await flow.resendVerification();
      toast.success("E-mail reenviado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível reenviar agora.");
    }
  };

  const submitPassword = async () => {
    try {
      await flow.createPassword();
      setTwoFactorOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar sua senha.");
    }
  };

  const finishSecurity = () => {
    setTwoFactorOpen(false);
    setTotpOpen(false);
    flow.completeSignup();
  };

  useEffect(() => {
    if (flow.step !== "success") return;
    setSuccessProgress(20);
    const marks = [36, 54, 72, 88, 100];
    const timers = marks.map((mark, index) =>
      window.setTimeout(() => setSuccessProgress(mark), 420 + index * 360),
    );
    const redirect = window.setTimeout(() => navigate("/initial-settings", { replace: true }), 2800);
    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(redirect);
    };
  }, [flow.step, navigate]);

  return (
    <main
      className={cn(
        "relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-[calc(1rem+env(safe-area-inset-top))]",
        shellClass,
      )}
    >
      <section
        className={cn(
          "relative grid w-full max-w-[68rem] overflow-hidden border",
          isMobile
            ? "min-h-[min(86dvh,45rem)] max-w-[24rem] rounded-[40px] pb-5 pt-8"
            : "min-h-[42rem] grid-cols-[0.9fr_1.1fr] rounded-[44px] p-0",
          frameClass,
        )}
      >
        {!isMobile ? (
          <CreateAccountSideRail
            logoSrc={logoSrc}
            isDarkTheme={isDarkTheme}
            stepNumber={stepNumber}
            progress={progress}
          />
        ) : (
          <div className="flex min-h-[7.2rem] items-start justify-center pt-1">
            <img src={logoSrc} alt="NeuroNex AI" className="h-14 w-14 object-contain" />
          </div>
        )}

        <div className={cn("flex min-h-full flex-col", isMobile ? "" : "justify-center p-8 lg:p-10")}>
          <div
            className={cn(
              "mx-0 shadow-[0_-20px_54px_-38px_rgba(0,0,0,0.72)]",
              isMobile
                ? "min-h-[min(58dvh,33rem)] rounded-b-[36px] rounded-t-[34px] px-7 pb-7 pt-9"
                : "rounded-[40px] px-10 py-10",
              panelClass,
            )}
          >
            <div className="mb-7">
              <div className="mb-4 flex items-center justify-between gap-4">
                <span
                  className={cn(
                    "inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[9px] font-black uppercase tracking-[0.16em]",
                    mutedPanelClass,
                  )}
                >
                  <Clock3 className="h-3.5 w-3.5" />
                  Cerca de 5 min
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-current/42">
                  {stepNumber}/3
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-current/10">
                <motion.div
                  className="h-full rounded-full bg-current"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {flow.step === "identity" ? (
                <IdentityStep
                  key="identity"
                  draft={flow.draft}
                  inputClass={inputClass}
                  mutedPanelClass={mutedPanelClass}
                  selectContentClass={selectContentClass}
                  actionButtonClass={identityButtonClass}
                  emailAvailability={flow.emailAvailability}
                  recoveryEmailAvailability={flow.recoveryEmailAvailability}
                  loading={flow.loading}
                  onChange={updateDraft}
                  onSubmit={submitIdentity}
                />
              ) : null}

              {flow.step === "password" ? (
                <PasswordStep
                  key="password"
                  firstName={firstName}
                  inputClass={inputClass}
                  mutedPanelClass={mutedPanelClass}
                  primaryButtonClass={primaryButtonClass}
                  loading={flow.loading}
                  password={flow.password}
                  confirmPassword={flow.confirmPassword}
                  showPassword={showPassword}
                  strength={flow.passwordStrength}
                  isMobile={isMobile}
                  biometricEnabled={flow.biometricEnabled}
                  biometricAvailable={flow.biometricAvailable}
                  biometricReason={flow.biometricStatus?.reason}
                  onPasswordChange={flow.setPassword}
                  onConfirmPasswordChange={flow.setConfirmPassword}
                  onTogglePassword={() => setShowPassword((value) => !value)}
                  onBiometricChange={flow.setBiometricEnabled}
                  onSubmit={submitPassword}
                />
              ) : null}

              {flow.step === "success" ? (
                <SuccessStep
                  key="success"
                  firstName={firstName}
                  progress={successProgress}
                  primaryButtonClass={primaryButtonClass}
                />
              ) : null}
            </AnimatePresence>
          </div>

          {flow.step === "identity" ? (
            <p className={cn("mt-5 text-center text-[11px] font-bold", isDarkTheme ? "text-white/45" : "text-black/45")}>
              Já possui uma conta?{" "}
              <Link to="/auth?role=pro" className="text-current underline-offset-4 hover:underline">
                Fazer login
              </Link>
            </p>
          ) : null}
        </div>
      </section>

      <EmailCodeConfirmSheet
        open={flow.emailDialogOpen}
        onOpenChange={flow.setEmailDialogOpen}
        email={flow.draft.email}
        otp={flow.otp}
        loading={flow.loading}
        cooldown={flow.resendCooldown}
        onOtpChange={flow.setOtp}
        onConfirm={submitOtp}
        onResend={resendOtp}
      />

      <TwoFactorIntroSheet
        open={twoFactorOpen}
        loading={flow.loading}
        onOpenChange={setTwoFactorOpen}
        onLater={finishSecurity}
        onEnable={() => {
          setTwoFactorOpen(false);
          setTotpOpen(true);
        }}
      />

      <TotpMfaDialog
        open={totpOpen}
        mode="enroll"
        onOpenChange={setTotpOpen}
        onSuccess={finishSecurity}
        onCancel={finishSecurity}
      />
    </main>
  );
}

function CreateAccountSideRail({
  logoSrc,
  isDarkTheme,
  stepNumber,
  progress,
}: {
  logoSrc: string;
  isDarkTheme: boolean;
  stepNumber: number;
  progress: number;
}) {
  const items = [
    { label: "Dados", icon: UserRound },
    { label: "Senha", icon: ShieldCheck },
    { label: "Pronto", icon: CheckCircle2 },
  ];

  return (
    <aside className={cn("flex flex-col justify-between border-r p-10", isDarkTheme ? "border-white/5" : "border-black/5")}>
      <Link to="/" className="inline-flex w-fit items-center gap-3">
        <img src={logoSrc} alt="NeuroNex AI" className="h-10 w-10 object-contain" />
        <span className="text-xs font-black uppercase tracking-[0.24em]">NeuroNex AI</span>
      </Link>

      <div className="max-w-[24rem]">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-current/35">Cadastro profissional</p>
        <h1 className="mt-6 text-6xl font-black leading-[0.9] tracking-[-0.065em]">
          Comece grátis. Sem cartão.
        </h1>
        <p className="mt-7 max-w-sm text-base font-semibold leading-relaxed text-current/50">
          Validamos seu e-mail primeiro, protegemos sua sessão e só então abrimos as configurações iniciais do seu espaço clínico.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {items.map((item, index) => {
          const active = index + 1 <= stepNumber;
          return (
            <div
              key={item.label}
              className={cn(
                "min-h-[6.6rem] rounded-[24px] border p-4 transition-colors",
                active && isDarkTheme && "border-white bg-white text-black shadow-[0_18px_46px_-32px_rgba(255,255,255,0.55)]",
                active && !isDarkTheme && "border-black bg-black text-white shadow-[0_18px_46px_-32px_rgba(0,0,0,0.55)]",
                !active && isDarkTheme && "border-white/18 bg-white/[0.035] text-white/72",
                !active && !isDarkTheme && "border-black/12 bg-white/55 text-black/62",
              )}
            >
              <item.icon className="h-5 w-5" />
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.12em]">{item.label}</p>
            </div>
          );
        })}
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-current/10">
        <motion.div className="h-full bg-current" animate={{ width: `${progress}%` }} />
      </div>
    </aside>
  );
}

function IdentityStep({
  draft,
  inputClass,
  mutedPanelClass,
  selectContentClass,
  actionButtonClass,
  emailAvailability,
  recoveryEmailAvailability,
  loading,
  onChange,
  onSubmit,
}: {
  draft: CreateAccountDraft;
  inputClass: string;
  mutedPanelClass: string;
  selectContentClass: string;
  actionButtonClass: string;
  emailAvailability: EmailAvailability;
  recoveryEmailAvailability: EmailAvailability;
  loading: boolean;
  onChange: <K extends keyof CreateAccountDraft>(key: K, value: CreateAccountDraft[K]) => void;
  onSubmit: () => void;
}) {
  return (
    <motion.div variants={fadeSlide} initial="hidden" animate="visible" exit="exit" className="space-y-7">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-current/42">Criar conta</p>
        <h2 className="mt-2 text-[2rem] font-black leading-[0.95] tracking-[-0.06em]">
          Teste o NeuroNex AI grátis.
        </h2>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-current/56">
          Não pedimos seu cartão de crédito. Primeiro, só precisamos confirmar quem está chegando.
        </p>
      </div>

      <div className="space-y-5">
        <AuthField label="Seu nome completo">
          <Input
            value={draft.fullName}
            onChange={(event) => onChange("fullName", event.target.value)}
            autoComplete="name"
            placeholder="Nome e sobrenome"
            className={inputClass}
          />
        </AuthField>

        <AuthField label="Gênero">
          <Select
            value={draft.genderIdentity}
            onValueChange={(value) => onChange("genderIdentity", value as GenderIdentity)}
          >
            <SelectTrigger className={cn("h-[3.25rem] rounded-[10px] border px-3 text-sm font-bold", mutedPanelClass)}>
              <SelectValue placeholder="Escolha uma opção" />
            </SelectTrigger>
            <SelectContent className={cn("rounded-[18px] shadow-2xl", selectContentClass)}>
              {genderOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="rounded-[12px] focus:bg-current/10 focus:text-current">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {draft.genderIdentity ? (
            <p className="mt-2 text-[11px] font-semibold leading-relaxed text-current/45">
              {genderOptions.find((item) => item.value === draft.genderIdentity)?.description}
            </p>
          ) : null}
        </AuthField>

        <AuthField label="E-mail">
          <Input
            value={draft.email}
            onChange={(event) => onChange("email", event.target.value)}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            className={inputClass}
          />
          <EmailAvailabilityHint availability={emailAvailability} kind="primary" />
        </AuthField>

        <AuthField label="E-mail de recuperação (opcional)">
          <Input
            value={draft.recoveryEmail}
            onChange={(event) => onChange("recoveryEmail", event.target.value)}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="email.alternativo@email.com"
            className={inputClass}
          />
          <EmailAvailabilityHint availability={recoveryEmailAvailability} kind="recovery" />
        </AuthField>

        <AuthField label="Celular / WhatsApp">
          <div className="grid grid-cols-[4.4rem_1fr] gap-2">
            <div className={cn("flex h-[3.25rem] items-center justify-center gap-2 rounded-[10px] border text-sm font-black", mutedPanelClass)}>
              <span aria-hidden="true">BR</span>
              <span>+55</span>
            </div>
            <Input
              value={draft.phone}
              onChange={(event) => onChange("phone", event.target.value)}
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="(11) 99999-0000"
              className={inputClass}
            />
          </div>
        </AuthField>

        <AuthField label="Conte um pouco sobre você">
          <Select
            value={draft.professionalContext}
            onValueChange={(value) => onChange("professionalContext", value as ProfessionalContext)}
          >
            <SelectTrigger className={cn("h-[3.25rem] rounded-[10px] border px-3 text-sm font-bold", mutedPanelClass)}>
              <SelectValue placeholder="Escolha uma opção" />
            </SelectTrigger>
            <SelectContent className={cn("rounded-[18px] shadow-2xl", selectContentClass)}>
              {contextOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="rounded-[12px] focus:bg-current/10 focus:text-current">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {draft.professionalContext ? (
            <p className="mt-2 text-[11px] font-semibold leading-relaxed text-current/45">
              {contextOptions.find((item) => item.value === draft.professionalContext)?.description}
            </p>
          ) : null}
        </AuthField>
      </div>

      <label className={cn("flex items-start gap-3 rounded-[18px] border p-4 text-[11px] font-semibold leading-relaxed", mutedPanelClass)}>
        <input
          type="checkbox"
          checked={draft.acceptedTerms}
          onChange={(event) => onChange("acceptedTerms", event.target.checked)}
          className="mt-0.5 h-4 w-4 accent-current"
        />
        <span>
          Ao informar meus dados, eu concordo com a{" "}
          <Link
            to="/help?view=privacy"
            className="font-black underline underline-offset-4 hover:opacity-75"
            onClick={(event) => event.stopPropagation()}
          >
            Política de Privacidade
          </Link>{" "}
          e os{" "}
          <Link
            to="/help?view=terms"
            className="font-black underline underline-offset-4 hover:opacity-75"
            onClick={(event) => event.stopPropagation()}
          >
            Termos de Uso
          </Link>{" "}
          da NeuroNex AI.
        </span>
      </label>

      <Button
        type="button"
        disabled={loading || emailAvailability.status === "checking" || emailAvailability.status === "exists"}
        onClick={() => void onSubmit()}
        className={cn("h-14 w-full rounded-[12px] text-[11px] font-black uppercase tracking-[0.2em]", actionButtonClass)}
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
        Próximo
      </Button>
    </motion.div>
  );
}

function PasswordStep({
  firstName,
  inputClass,
  mutedPanelClass,
  primaryButtonClass,
  loading,
  password,
  confirmPassword,
  showPassword,
  strength,
  isMobile,
  biometricEnabled,
  biometricAvailable,
  biometricReason,
  onPasswordChange,
  onConfirmPasswordChange,
  onTogglePassword,
  onBiometricChange,
  onSubmit,
}: {
  firstName: string;
  inputClass: string;
  mutedPanelClass: string;
  primaryButtonClass: string;
  loading: boolean;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  strength: PasswordStrength;
  isMobile: boolean;
  biometricEnabled: boolean;
  biometricAvailable: boolean;
  biometricReason?: string | null;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onBiometricChange: (value: boolean) => void;
  onSubmit: () => void;
}) {
  return (
    <motion.div variants={fadeSlide} initial="hidden" animate="visible" exit="exit" className="space-y-7">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-current/42">E-mail confirmado</p>
        <h2 className="mt-2 text-[2rem] font-black leading-[0.95] tracking-[-0.06em]">
          Perfeito, {firstName}. Agora vamos criar sua senha.
        </h2>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-current/56">
          Agora crie uma senha para acessar a NeuroNex com segurança.
        </p>
      </div>

      <div className="space-y-5">
        <PasswordInput
          label="Senha"
          value={password}
          show={showPassword}
          className={inputClass}
          onToggle={onTogglePassword}
          onChange={onPasswordChange}
        />
        <PasswordStrengthCard strength={strength} mutedPanelClass={mutedPanelClass} />
        <PasswordInput
          label="Confirme sua senha"
          value={confirmPassword}
          show={showPassword}
          className={inputClass}
          onToggle={onTogglePassword}
          onChange={onConfirmPasswordChange}
        />

        {isMobile ? (
          <div className={cn("rounded-[22px] border p-4", mutedPanelClass)}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-current/10">
                  <Fingerprint className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-black">Entrar usando biometria</p>
                  <p className="mt-1 text-[11px] font-semibold leading-relaxed text-current/48">
                    {biometricAvailable
                      ? "Vamos validar agora e usar também em transações."
                      : biometricReason || "Se não funcionar, você pode configurar depois em Ajustes > Login e Segurança."}
                  </p>
                </div>
              </div>
              <Switch
                checked={biometricEnabled}
                onCheckedChange={onBiometricChange}
                disabled={!biometricAvailable}
                aria-label="Entrar usando biometria"
              />
            </div>
            <p className="mt-3 text-[10px] font-semibold leading-relaxed text-current/42">
              Qualquer problema, seguimos com senha normal e você ajusta isso depois.
            </p>
          </div>
        ) : null}
      </div>

      <Button
        type="button"
        disabled={loading}
        onClick={() => void onSubmit()}
        className={cn("h-14 w-full rounded-[12px] text-[11px] font-black", primaryButtonClass)}
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
        Criar senha
      </Button>
    </motion.div>
  );
}

function SuccessStep({
  firstName,
  progress,
  primaryButtonClass,
}: {
  firstName: string;
  progress: number;
  primaryButtonClass: string;
}) {
  return (
    <motion.div variants={fadeSlide} initial="hidden" animate="visible" exit="exit" className="flex min-h-[28rem] flex-col items-center justify-center text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 18 }}
        className="relative mb-8"
      >
        <div className="absolute inset-0 rounded-full bg-current/10 blur-3xl" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-[32px] border border-current/10 bg-current/[0.04]">
          <CheckCircle2 className="h-11 w-11" />
        </div>
        <Sparkles className="absolute -right-2 -top-2 h-5 w-5" />
      </motion.div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-current/42">Tudo certo</p>
      <h2 className="mt-3 text-[2.35rem] font-black leading-[0.95] tracking-[-0.065em]">
        Conta criada com sucesso, {firstName}.
      </h2>
      <p className="mt-4 max-w-[18rem] text-sm font-semibold leading-relaxed text-current/55">
        Estamos preparando suas configurações iniciais e o tour de boas-vindas.
      </p>
      <div className="mt-9 w-full max-w-[18rem]">
        <div className="mb-3 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.16em] text-current/45">
          <span>Preparando</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-current/10">
          <motion.div
            className="h-full rounded-full bg-current"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35 }}
          />
        </div>
      </div>
      <Button disabled className={cn("mt-8 h-12 w-full max-w-[18rem] rounded-[12px] text-[11px] font-black", primaryButtonClass)}>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Abrindo configurações
      </Button>
    </motion.div>
  );
}

function EmailCodeConfirmSheet({
  open,
  onOpenChange,
  email,
  otp,
  loading,
  cooldown,
  onOtpChange,
  onConfirm,
  onResend,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  otp: string;
  loading: boolean;
  cooldown: number;
  onOtpChange: (value: string) => void;
  onConfirm: () => void;
  onResend: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[92vw] rounded-[32px] border border-black/10 bg-white p-0 text-black shadow-2xl dark:border-white/10 dark:bg-[#080808] dark:text-white sm:max-w-[430px]">
        <div className="p-6 text-center sm:p-8">
          <DialogHeader className="items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[20px] bg-black text-white dark:bg-white dark:text-black">
              <MailCheck className="h-6 w-6" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-[-0.04em]">
              Enviamos um código para o seu e-mail.
            </DialogTitle>
            <DialogDescription className="mx-auto max-w-[20rem] pt-2 text-center text-sm font-semibold leading-relaxed text-black/55 dark:text-white/55">
              Digite o código de 6 dígitos que enviamos para{" "}
              <span className="font-black text-black dark:text-white">{email}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-7 flex justify-center">
            <InputOTP maxLength={6} value={otp} onChange={onOtpChange} containerClassName="gap-2">
              <InputOTPGroup className="gap-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className="h-12 w-10 rounded-[14px] border border-black/10 bg-black/[0.035] text-lg font-black dark:border-white/10 dark:bg-white/[0.06]"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="mt-6 rounded-[22px] border border-black/8 bg-black/[0.025] p-4 text-xs font-semibold leading-relaxed text-black/55 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55">
            O e-mail de cadastro contém somente o código. Se não encontrar a mensagem, verifique Promoções ou Spam.
          </div>

          <div className="mt-6 grid grid-cols-[0.8fr_1.2fr] gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="h-12 rounded-[16px]">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button onClick={() => void onConfirm()} disabled={loading || otp.length < 6} className="h-12 rounded-[16px] bg-black text-white dark:bg-white dark:text-black">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Confirmar
            </Button>
          </div>

          <button
            type="button"
            disabled={loading || cooldown > 0}
            onClick={() => void onResend()}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 text-center text-xs font-black text-black/55 underline-offset-4 hover:text-black hover:underline disabled:opacity-45 dark:text-white/55 dark:hover:text-white"
          >
            <Mail className="h-3.5 w-3.5" />
            {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar código por e-mail"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TwoFactorIntroSheet({
  open,
  loading,
  onOpenChange,
  onLater,
  onEnable,
}: {
  open: boolean;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onLater: () => void;
  onEnable: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[92vw] rounded-[32px] border border-black/10 bg-white p-6 text-black shadow-2xl dark:border-white/10 dark:bg-[#080808] dark:text-white sm:max-w-[430px] sm:p-8">
        <DialogHeader className="text-left">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[20px] bg-black text-white dark:bg-white dark:text-black">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <DialogTitle className="text-2xl font-black tracking-[-0.04em]">
            Verificação em duas etapas
          </DialogTitle>
          <DialogDescription className="pt-2 text-sm font-semibold leading-relaxed text-black/55 dark:text-white/55">
            Segurança é pilar indispensável por aqui. Recomendamos vincular um autenticador agora. Leva cerca de 2 minutos.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 rounded-[24px] border border-black/8 bg-black/[0.025] p-4 text-xs font-semibold leading-relaxed text-black/55 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55">
          Você pode usar Google Authenticator, Microsoft Authenticator, 1Password ou outro app compatível com código TOTP.
        </div>

        <div className="mt-6 grid gap-3">
          <Button onClick={onEnable} disabled={loading} className="h-13 rounded-[16px] bg-black text-white dark:bg-white dark:text-black">
            Habilitar agora
          </Button>
          <Button variant="ghost" onClick={onLater} disabled={loading} className="h-12 rounded-[16px]">
            Agora não
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AuthField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-current/45">{label}</span>
      {children}
    </label>
  );
}

function EmailAvailabilityHint({
  availability,
  kind,
}: {
  availability: EmailAvailability;
  kind: "primary" | "recovery";
}) {
  if (availability.status === "idle") return null;

  if (availability.status === "checking") {
    return (
      <p className="mt-2 flex items-center gap-2 text-[11px] font-bold text-current/45">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Verificando e-mail...
      </p>
    );
  }

  if (availability.status === "invalid") {
    return <p className="mt-2 text-[11px] font-bold text-red-500">{availability.message || "Digite um e-mail válido."}</p>;
  }

  if (availability.status === "error") {
    return (
      <p className="mt-2 text-[11px] font-bold text-amber-500">
        {availability.message || "Não conseguimos verificar agora. Vamos validar ao avançar."}
      </p>
    );
  }

  if (kind === "primary" && availability.status === "exists") {
    return (
      <p className="mt-2 text-[11px] font-bold text-red-500">
        Já existe uma conta com este e-mail.{" "}
        <Link to="/auth?role=pro" className="underline underline-offset-4">
          Fazer login
        </Link>
      </p>
    );
  }

  if (kind === "recovery" && availability.status === "exists") {
    return (
      <p className="mt-2 text-[11px] font-bold text-current/45">
        {availability.message || "Pode usar como e-mail de recuperação."}
      </p>
    );
  }

  if (availability.status === "available") {
    return (
      <p className="mt-2 flex items-center gap-2 text-[11px] font-bold text-emerald-500">
        <Check className="h-3.5 w-3.5" />
        {kind === "primary" ? "E-mail disponível." : "E-mail de recuperação válido."}
      </p>
    );
  }

  return null;
}

function PasswordInput({
  label,
  value,
  show,
  className,
  onToggle,
  onChange,
}: {
  label: string;
  value: string;
  show: boolean;
  className: string;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <AuthField label={label}>
      <div className="relative">
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          className={cn(className, "pr-11")}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[12px] text-current/62 transition-colors hover:bg-current/10 hover:text-current"
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </AuthField>
  );
}

function PasswordStrengthCard({
  strength,
  mutedPanelClass,
}: {
  strength: PasswordStrength;
  mutedPanelClass: string;
}) {
  return (
    <div className={cn("rounded-[22px] border p-4", mutedPanelClass)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-current/45">Senha forte</p>
        <div className="flex gap-1">
          {Array.from({ length: 4 }).map((_, index) => (
            <motion.span
              key={index}
              className={cn("h-1.5 w-8 rounded-full", index < strength.score ? "bg-current" : "bg-current/12")}
              animate={{ opacity: index < strength.score ? 1 : 0.45 }}
            />
          ))}
        </div>
      </div>
      <div className="grid gap-2">
        {passwordRules.map((rule) => {
          const ok = Boolean(strength[rule.key]);
          return (
            <motion.div
              key={rule.key}
              layout
              className="flex items-center gap-2 text-[11px] font-semibold text-current/62"
            >
              <motion.span
                className={cn("flex h-5 w-5 items-center justify-center rounded-full border", ok ? "border-current bg-current text-background" : "border-current/18")}
                animate={{ scale: ok ? 1.04 : 1 }}
              >
                {ok ? <Check className="h-3 w-3" /> : null}
              </motion.span>
              {rule.label}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
