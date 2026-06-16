"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { useTour } from "@/components/onboarding/TourContext";
import { useGoogleAuth } from "@/hooks/use-google-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useProfile } from "@/hooks/use-profile";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronLeft,
  Gem,
  Loader2,
  Mail,
  Monitor,
  Moon,
  Palette,
  ShieldCheck,
  Sparkles,
  Sun,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export type InitialSettingsDraft = {
  theme: "light" | "dark" | "system";
  accent: string;
  clinicName: string;
  crp: string;
  address: string;
  bio: string;
  calendarSyncEnabled: boolean;
  gmailSendEnabled: boolean;
  neurofinanceIntroChoice: "create_now" | "later" | "";
};

type WizardStep = "style" | "profile" | "connections" | "neurofinance";

const fadeStep: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: { opacity: 0, y: -10, scale: 0.99, transition: { duration: 0.18 } },
};

const steps: Array<{ id: WizardStep; label: string; icon: typeof Sparkles }> = [
  { id: "style", label: "Estilo", icon: Palette },
  { id: "profile", label: "Perfil", icon: ShieldCheck },
  { id: "connections", label: "Conexões", icon: CalendarClock },
  { id: "neurofinance", label: "NeuroFinance", icon: Wallet },
];

const accents = [
  { id: "mono", label: "Mono", className: "bg-zinc-950 dark:bg-white" },
  { id: "graphite", label: "Grafite", className: "bg-zinc-600" },
  { id: "emerald", label: "Verde", className: "bg-emerald-500" },
  { id: "amber", label: "Dourado", className: "bg-amber-400" },
];

const storageKeyFor = (userId?: string | null) => `neuronex.initial-settings.v1:${userId || "anonymous"}`;

const emptyDraft: InitialSettingsDraft = {
  theme: "system",
  accent: "mono",
  clinicName: "",
  crp: "",
  address: "",
  bio: "",
  calendarSyncEnabled: false,
  gmailSendEnabled: false,
  neurofinanceIntroChoice: "",
};

function readStoredDraft(userId?: string | null) {
  if (typeof window === "undefined") return emptyDraft;
  const raw = window.localStorage.getItem(storageKeyFor(userId));
  if (!raw) return emptyDraft;
  try {
    return { ...emptyDraft, ...JSON.parse(raw) } as InitialSettingsDraft;
  } catch {
    return emptyDraft;
  }
}

function removeStoredDraft(userId?: string | null) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKeyFor(userId));
}

export default function InitialSettings() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { startTour } = useTour();
  const { theme, setTheme } = useTheme();
  const { isConnected: isGoogleConnected, isLoading: isGoogleLoading, connectGoogle, connectionEmail } = useGoogleAuth();
  const [step, setStep] = useState<WizardStep>("style");
  const [draft, setDraftState] = useState<InitialSettingsDraft>(() => readStoredDraft(user?.id));
  const [saving, setSaving] = useState(false);
  const [hydratedFromProfile, setHydratedFromProfile] = useState(false);

  const currentIndex = steps.findIndex((item) => item.id === step);
  const progress = ((currentIndex + 1) / steps.length) * 100;
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
    "rounded-[10px] border px-4 text-sm font-semibold shadow-none transition-colors duration-200",
    "focus-visible:ring-0 focus-visible:ring-offset-0",
    isDarkTheme
      ? "border-black/10 bg-black/[0.025] text-[#171514] placeholder:text-[#98a0ad] hover:bg-zinc-100/70 focus-visible:border-black/20 focus-visible:bg-zinc-200/80 selection:bg-white selection:text-black"
      : "border-white/15 bg-white/[0.035] text-white placeholder:text-white/48 hover:bg-black/10 focus-visible:border-white/45 focus-visible:bg-black/25 selection:bg-white selection:text-[#171514]",
  );
  const mutedPanelClass = isDarkTheme
    ? "border-black/10 bg-black/[0.035] text-[#171514]"
    : "border-white/15 bg-white/[0.035] text-white";

  const firstName = useMemo(() => {
    const name = profile?.first_name || profile?.full_name || user?.email || "profissional";
    return name.split(/\s+/)[0];
  }, [profile?.first_name, profile?.full_name, user?.email]);

  const setDraft = (updates: Partial<InitialSettingsDraft>) => {
    setDraftState((current) => {
      const next = { ...current, ...updates };
      if (user?.id) window.localStorage.setItem(storageKeyFor(user.id), JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    if (!profile || hydratedFromProfile) return;
    const stored = readStoredDraft(user?.id);
    const hasStored = Object.values(stored).some((value) => Boolean(value));
    setDraftState({
      ...emptyDraft,
      ...stored,
      clinicName: hasStored ? stored.clinicName : profile.clinic_name || "",
      crp: hasStored ? stored.crp : profile.crp || "",
      address: hasStored ? stored.address : profile.address || "",
      bio: hasStored ? stored.bio : profile.bio || "",
      calendarSyncEnabled: hasStored ? stored.calendarSyncEnabled : Boolean(profile.calendar_sync_enabled),
      gmailSendEnabled: hasStored ? stored.gmailSendEnabled : Boolean(profile.gmail_send_enabled),
      neurofinanceIntroChoice: hasStored ? stored.neurofinanceIntroChoice : profile.neurofinance_intro_choice || "",
    });
    setHydratedFromProfile(true);
  }, [hydratedFromProfile, profile, user?.id]);

  useEffect(() => {
    setDraft({ theme: draft.theme || "system" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goNext = () => {
    const next = steps[currentIndex + 1]?.id;
    if (next) setStep(next);
  };

  const goBack = () => {
    const previous = steps[currentIndex - 1]?.id;
    if (previous) setStep(previous);
  };

  const saveAndFinish = async () => {
    if (!user?.id) {
      toast.error("Sessão expirada. Entre novamente.");
      return;
    }
    if (!draft.neurofinanceIntroChoice) {
      toast.error("Escolha se quer criar a conta bancária agora ou deixar para depois.");
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const payload = {
        id: user.id,
        clinic_name: draft.clinicName.trim() || null,
        crp: draft.crp.trim() || null,
        address: draft.address.trim() || null,
        bio: draft.bio.trim() || null,
        setup_completed: true,
        calendar_sync_enabled: draft.calendarSyncEnabled && isGoogleConnected,
        gmail_send_enabled: draft.gmailSendEnabled && isGoogleConnected,
        neurofinance_intro_choice: draft.neurofinanceIntroChoice,
        initial_preferences: {
          theme: draft.theme,
          accent: draft.accent,
          calendar_sync_requested: draft.calendarSyncEnabled,
          gmail_send_requested: draft.gmailSendEnabled,
          google_connected: isGoogleConnected,
          google_email: connectionEmail,
          welcome_tour_requested: true,
        },
        updated_at: now,
      };

      const update = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", user.id)
        .select("id")
        .maybeSingle();

      if (update.error || !update.data?.id) {
        const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
        if (error) throw error;
      }

      removeStoredDraft(user.id);
      toast.success("Configurações iniciais salvas.");
      startTour();
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar suas configurações.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className={cn("relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-[calc(1rem+env(safe-area-inset-top))]", shellClass)}>
      <section
        className={cn(
          "relative grid w-full max-w-[68rem] overflow-hidden border",
          isMobile
            ? "min-h-[min(86dvh,45rem)] max-w-[24rem] rounded-[40px] pb-5 pt-8"
            : "min-h-[42rem] grid-cols-[0.88fr_1.12fr] rounded-[44px] p-0",
          frameClass,
        )}
      >
        {!isMobile ? (
          <InitialSettingsRail
            logoSrc={logoSrc}
            firstName={firstName}
            step={step}
            progress={progress}
          />
        ) : (
          <div className="flex min-h-[7.2rem] flex-col items-center justify-start gap-3 pt-1">
            <img src={logoSrc} alt="NeuroNex AI" className="h-14 w-14 object-contain" />
            <span className="text-[9px] font-black uppercase tracking-[0.24em] text-current/40">
              Configurações iniciais
            </span>
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
                <span className={cn("inline-flex h-8 items-center gap-2 rounded-full border px-3 text-[9px] font-black uppercase tracking-[0.16em]", mutedPanelClass)}>
                  <Sparkles className="h-3.5 w-3.5" />
                  Passo {currentIndex + 1} de {steps.length}
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-current/42">
                  {steps[currentIndex]?.label}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-current/10">
                <motion.div className="h-full rounded-full bg-current" animate={{ width: `${progress}%` }} />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {step === "style" ? (
                <StyleStep
                  key="style"
                  draft={draft}
                  mutedPanelClass={mutedPanelClass}
                  onTheme={(next) => {
                    setTheme(next);
                    setDraft({ theme: next });
                  }}
                  onAccent={(accent) => setDraft({ accent })}
                />
              ) : null}

              {step === "profile" ? (
                <ProfileStep
                  key="profile"
                  draft={draft}
                  inputClass={inputClass}
                  onChange={setDraft}
                />
              ) : null}

              {step === "connections" ? (
                <ConnectionsStep
                  key="connections"
                  draft={draft}
                  mutedPanelClass={mutedPanelClass}
                  isGoogleConnected={isGoogleConnected}
                  isGoogleLoading={isGoogleLoading}
                  connectionEmail={connectionEmail}
                  onChange={setDraft}
                  onConnectGoogle={() => void connectGoogle()}
                />
              ) : null}

              {step === "neurofinance" ? (
                <NeuroFinanceIntroStep
                  key="neurofinance"
                  draft={draft}
                  mutedPanelClass={mutedPanelClass}
                  onChange={setDraft}
                />
              ) : null}
            </AnimatePresence>

            <div className="mt-8 grid grid-cols-[0.78fr_1.22fr] gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={currentIndex === 0 || saving}
                onClick={goBack}
                className="h-12 rounded-[16px] border-current/15 bg-transparent text-[10px] font-black uppercase tracking-[0.12em] text-current hover:bg-current/10"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              {step === "neurofinance" ? (
                <Button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveAndFinish()}
                  className="h-12 rounded-[16px] bg-current text-[10px] font-black uppercase tracking-[0.12em] text-background hover:opacity-90"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                  Finalizar
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={goNext}
                  className="h-12 rounded-[16px] bg-current text-[10px] font-black uppercase tracking-[0.12em] text-background hover:opacity-90"
                >
                  Próximo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function InitialSettingsRail({
  logoSrc,
  firstName,
  step,
  progress,
}: {
  logoSrc: string;
  firstName: string;
  step: WizardStep;
  progress: number;
}) {
  return (
    <aside className="flex flex-col justify-between border-r border-current/5 p-10">
      <div className="inline-flex w-fit items-center gap-3">
        <img src={logoSrc} alt="NeuroNex AI" className="h-10 w-10 object-contain" />
        <span className="text-xs font-black uppercase tracking-[0.24em]">NeuroNex AI</span>
      </div>

      <div className="max-w-[24rem]">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-current/35">Boas-vindas</p>
        <h1 className="mt-6 text-6xl font-black leading-[0.9] tracking-[-0.065em]">
          Vamos deixar tudo pronto, {firstName}.
        </h1>
        <p className="mt-7 max-w-sm text-base font-semibold leading-relaxed text-current/50">
          São poucos ajustes para personalizar sua rotina, conectar agenda e preparar o tour inicial.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {steps.map((item) => {
          const active = item.id === step;
          return (
            <div
              key={item.id}
              className={cn(
                "rounded-[24px] border p-4 transition-colors",
                active ? "border-current bg-current text-background" : "border-current/10 bg-current/[0.035] text-current/45",
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

function StyleStep({
  draft,
  mutedPanelClass,
  onTheme,
  onAccent,
}: {
  draft: InitialSettingsDraft;
  mutedPanelClass: string;
  onTheme: (theme: InitialSettingsDraft["theme"]) => void;
  onAccent: (accent: string) => void;
}) {
  const themes = [
    { id: "light" as const, label: "Claro", icon: Sun },
    { id: "dark" as const, label: "Escuro", icon: Moon },
    { id: "system" as const, label: "Sistema", icon: Monitor },
  ];

  return (
    <motion.div variants={fadeStep} initial="hidden" animate="visible" exit="exit" className="space-y-7">
      <StepHeading
        eyebrow="Preferências"
        title="Escolha como o NeuroNex deve se sentir."
        description="Você pode mudar tema e estilo visual depois em Ajustes."
      />
      <div className="grid gap-3">
        {themes.map((item) => {
          const active = draft.theme === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTheme(item.id)}
              className={cn(
                "flex min-h-[4.25rem] items-center justify-between rounded-[22px] border p-4 text-left transition-all active:scale-[0.99]",
                active ? "border-current bg-current text-background" : mutedPanelClass,
              )}
            >
              <span className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-current/10">
                  <item.icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-black">{item.label}</span>
              </span>
              {active ? <Check className="h-5 w-5" /> : null}
            </button>
          );
        })}
      </div>
      <div>
        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-current/45">Acento visual</p>
        <div className="grid grid-cols-4 gap-2">
          {accents.map((accent) => {
            const active = draft.accent === accent.id;
            return (
              <button
                key={accent.id}
                type="button"
                onClick={() => onAccent(accent.id)}
                className={cn("rounded-[20px] border p-3 text-center transition-all", active ? "border-current bg-current/[0.08]" : "border-current/10")}
              >
                <span className={cn("mx-auto block h-8 w-8 rounded-full", accent.className)} />
                <span className="mt-2 block text-[9px] font-black uppercase tracking-[0.12em] text-current/52">
                  {accent.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function ProfileStep({
  draft,
  inputClass,
  onChange,
}: {
  draft: InitialSettingsDraft;
  inputClass: string;
  onChange: (updates: Partial<InitialSettingsDraft>) => void;
}) {
  return (
    <motion.div variants={fadeStep} initial="hidden" animate="visible" exit="exit" className="space-y-7">
      <StepHeading
        eyebrow="Perfil profissional"
        title="Complete o básico da sua operação."
        description="Essas informações ajudam recibos, documentos e automações a saírem prontos."
      />
      <div className="space-y-4">
        <WizardField label="Clínica ou nome profissional">
          <Input
            value={draft.clinicName}
            onChange={(event) => onChange({ clinicName: event.target.value })}
            placeholder="Ex.: Clínica NeuroNex"
            className={cn("h-12", inputClass)}
          />
        </WizardField>
        <WizardField label="CRP">
          <Input
            value={draft.crp}
            onChange={(event) => onChange({ crp: event.target.value })}
            placeholder="CRP 00/000000"
            className={cn("h-12", inputClass)}
          />
        </WizardField>
        <WizardField label="Endereço profissional">
          <Input
            value={draft.address}
            onChange={(event) => onChange({ address: event.target.value })}
            placeholder="Rua, número, cidade e UF"
            className={cn("h-12", inputClass)}
          />
        </WizardField>
        <WizardField label="Como você quer se apresentar">
          <Textarea
            value={draft.bio}
            onChange={(event) => onChange({ bio: event.target.value })}
            placeholder="Uma descrição curta para documentos e perfil."
            className={cn("min-h-[6.5rem]", inputClass)}
          />
        </WizardField>
      </div>
    </motion.div>
  );
}

function ConnectionsStep({
  draft,
  mutedPanelClass,
  isGoogleConnected,
  isGoogleLoading,
  connectionEmail,
  onChange,
  onConnectGoogle,
}: {
  draft: InitialSettingsDraft;
  mutedPanelClass: string;
  isGoogleConnected: boolean;
  isGoogleLoading: boolean;
  connectionEmail: string | null;
  onChange: (updates: Partial<InitialSettingsDraft>) => void;
  onConnectGoogle: () => void;
}) {
  return (
    <motion.div variants={fadeStep} initial="hidden" animate="visible" exit="exit" className="space-y-7">
      <StepHeading
        eyebrow="Agenda e Gmail"
        title="Conecte só o que fizer sentido agora."
        description="A integração Google pode sincronizar agenda e permitir envio de e-mails em seu nome quando você autorizar."
      />
      <div className="space-y-3">
        <ToggleCard
          icon={CalendarClock}
          title="Sincronizar agenda"
          description="Trazer compromissos do Google Calendar e reduzir retrabalho."
          checked={draft.calendarSyncEnabled}
          onCheckedChange={(checked) => onChange({ calendarSyncEnabled: checked })}
          mutedPanelClass={mutedPanelClass}
        />
        <ToggleCard
          icon={Mail}
          title="Permitir envio pelo Gmail"
          description="Usar seu Gmail para mensagens e convites quando você solicitar."
          checked={draft.gmailSendEnabled}
          onCheckedChange={(checked) => onChange({ gmailSendEnabled: checked })}
          mutedPanelClass={mutedPanelClass}
        />
      </div>
      <div className={cn("rounded-[24px] border p-4", mutedPanelClass)}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black">Google Workspace</p>
            <p className="mt-1 text-[11px] font-semibold leading-relaxed text-current/50">
              {isGoogleConnected ? `Conectado${connectionEmail ? `: ${connectionEmail}` : ""}` : "Conecte agora ou deixe para depois em Ajustes."}
            </p>
          </div>
          <Button
            type="button"
            disabled={isGoogleLoading || isGoogleConnected}
            onClick={onConnectGoogle}
            className="h-11 rounded-[14px] bg-current px-4 text-[10px] font-black uppercase tracking-[0.12em] text-background"
          >
            {isGoogleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isGoogleConnected ? "Conectado" : "Conectar"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function NeuroFinanceIntroStep({
  draft,
  mutedPanelClass,
  onChange,
}: {
  draft: InitialSettingsDraft;
  mutedPanelClass: string;
  onChange: (updates: Partial<InitialSettingsDraft>) => void;
}) {
  return (
    <motion.div variants={fadeStep} initial="hidden" animate="visible" exit="exit" className="space-y-7">
      <StepHeading
        eyebrow="NeuroFinance"
        title="Quer preparar sua conta bancária agora?"
        description="A Gestão Financeira já funciona sem isso. A conta NeuroFinance libera operações bancárias depois da aprovação."
      />
      <div className="grid gap-3">
        <ChoiceCard
          active={draft.neurofinanceIntroChoice === "create_now"}
          icon={Wallet}
          title="Criar conta bancária"
          description="Você vai para o onboarding bancário após conhecer o app."
          onClick={() => onChange({ neurofinanceIntroChoice: "create_now" })}
        />
        <ChoiceCard
          active={draft.neurofinanceIntroChoice === "later"}
          icon={Gem}
          title="Agora não"
          description="Deixe isso salvo e configure quando fizer sentido."
          onClick={() => onChange({ neurofinanceIntroChoice: "later" })}
        />
      </div>
      <div className={cn("rounded-[24px] border p-4 text-xs font-semibold leading-relaxed text-current/55", mutedPanelClass)}>
        Depois deste passo, abrimos um tour rápido para você encontrar agenda, pacientes, notas e financeiro sem precisar adivinhar onde fica cada coisa.
      </div>
    </motion.div>
  );
}

function StepHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-current/42">{eyebrow}</p>
      <h2 className="mt-2 text-[2rem] font-black leading-[0.95] tracking-[-0.06em]">{title}</h2>
      <p className="mt-3 text-sm font-semibold leading-relaxed text-current/56">{description}</p>
    </div>
  );
}

function WizardField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-current/45">{label}</span>
      {children}
    </label>
  );
}

function ToggleCard({
  icon: Icon,
  title,
  description,
  checked,
  onCheckedChange,
  mutedPanelClass,
}: {
  icon: typeof Sparkles;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  mutedPanelClass: string;
}) {
  return (
    <div className={cn("rounded-[24px] border p-4", mutedPanelClass)}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-current/10">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-black">{title}</p>
            <p className="mt-1 text-[11px] font-semibold leading-relaxed text-current/50">{description}</p>
          </div>
        </div>
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </div>
    </div>
  );
}

function ChoiceCard({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: typeof Sparkles;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[5rem] items-center justify-between gap-4 rounded-[24px] border p-4 text-left transition-all active:scale-[0.99]",
        active ? "border-current bg-current text-background" : "border-current/12 bg-current/[0.035] text-current",
      )}
    >
      <span className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-current/10">
          <Icon className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-sm font-black">{title}</span>
          <span className="mt-1 block text-[11px] font-semibold leading-relaxed opacity-55">{description}</span>
        </span>
      </span>
      {active ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : null}
    </button>
  );
}
