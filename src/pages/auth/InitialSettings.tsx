"use client";

import { useAuth } from "@/components/auth/SessionContextProvider";
import { useTour } from "@/components/onboarding/TourContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSubscription } from "@/context/SubscriptionContext";
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
  Crown,
  Gem,
  Loader2,
  Mail,
  MapPin,
  Monitor,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

type WizardStep = "style" | "profile" | "connections" | "neurofinance";
type ThemeChoice = "light" | "dark" | "system";
type GoogleChoice = "connect" | "skip" | "";
type NeuroFinanceChoice = "create_now" | "later" | "";

type InitialSettingsSavePayload = {
  theme: ThemeChoice;
  clinicName: string;
  crp: string;
  address: string;
  professionalAddress: ProfessionalAddress | Record<string, never>;
  bio: string;
  googleChoice: "connect" | "skip";
  googleConnected: boolean;
  neurofinanceIntroChoice: "create_now" | "later";
};

type AddressSuggestion = {
  id: string;
  label: string;
  source: "google" | "viacep" | "manual";
  metadata?: Record<string, unknown>;
};

type ProfessionalAddress = {
  label?: string;
  placeId?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  source?: string;
  [key: string]: unknown;
};

export type InitialSettingsDraft = {
  theme: ThemeChoice;
  clinicName: string;
  crp: string;
  address: string;
  professionalAddress: ProfessionalAddress | null;
  bio: string;
  googleWorkspaceChoice: GoogleChoice;
  neurofinanceIntroChoice: NeuroFinanceChoice;
};

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

const steps: Array<{ id: WizardStep; label: string; icon: LucideIcon }> = [
  { id: "style", label: "Estilo", icon: Sparkles },
  { id: "profile", label: "Perfil", icon: ShieldCheck },
  { id: "connections", label: "Conexões", icon: CalendarClock },
  { id: "neurofinance", label: "NeuroFinance", icon: Wallet },
];

const emptyDraft: InitialSettingsDraft = {
  theme: "system",
  clinicName: "",
  crp: "",
  address: "",
  professionalAddress: null,
  bio: "",
  googleWorkspaceChoice: "",
  neurofinanceIntroChoice: "",
};

function storageKeyFor(userId?: string | null) {
  return `neuronex.initial-settings.v2:${userId || "anonymous"}`;
}

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

function maskCrp(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function isValidCrp(value: string) {
  if (!value.trim()) return true;
  return /^\d{2}\/\d{4,6}$/.test(value.trim());
}

function isValidWizardStep(value: string | null): value is WizardStep {
  return Boolean(value && steps.some((item) => item.id === value));
}

function canUseManualAddress(value: string) {
  const trimmed = value.trim();
  return trimmed.length >= 8 && /\d/.test(trimmed);
}

function manualAddressSuggestion(value: string): AddressSuggestion | null {
  const trimmed = value.trim();
  if (!canUseManualAddress(trimmed)) return null;
  return {
    id: `manual:${trimmed}`,
    label: trimmed,
    source: "manual",
  };
}

async function invokeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (!error) return data as T;

  let message = error.message || "Não foi possível concluir esta ação.";
  const context = (error as { context?: Response }).context;
  if (context) {
    try {
      const payload = await context.clone().json();
      if (typeof payload?.error === "string") message = payload.error;
    } catch {
      // Keep default message.
    }
  }
  throw new Error(message);
}

async function saveInitialSettingsWithFallback(userId: string, payload: InitialSettingsSavePayload) {
  try {
    return await invokeFunction<{ success: boolean; error?: string }>("initial-settings-save", payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/failed to send|edge function|fetch|network/i.test(message)) {
      throw error;
    }

    const googleEnabled = payload.googleChoice === "connect" && payload.googleConnected;
    const now = new Date().toISOString();
    const updatePayload = {
      id: userId,
      clinic_name: payload.clinicName.trim() || null,
      crp: payload.crp.trim() || null,
      address: payload.address.trim() || null,
      bio: payload.bio.trim() || null,
      setup_completed: true,
      calendar_sync_enabled: googleEnabled,
      gmail_send_enabled: googleEnabled,
      neurofinance_intro_choice: payload.neurofinanceIntroChoice,
      professional_address: payload.professionalAddress || {},
      initial_preferences: {
        theme: payload.theme,
        google_choice: payload.googleChoice,
        google_connected: payload.googleConnected,
        professional_address: payload.professionalAddress || {},
        initial_settings_completed_at: now,
        save_fallback: "client",
      },
      updated_at: now,
    };

    const persistProfile = async (payload: Record<string, unknown>) => {
      const update = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", userId)
        .select("id")
        .maybeSingle();

      if (!update.error && update.data?.id) {
        return { success: true };
      }

      const { error: upsertError } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
      if (upsertError) throw upsertError;

      return { success: true };
    };

    try {
      return await persistProfile(updatePayload);
    } catch (persistError) {
      const persistMessage = persistError instanceof Error ? persistError.message : "";
      if (!/professional_address/i.test(persistMessage)) throw persistError;

      const { professional_address: _professionalAddress, ...compatiblePayload } = updatePayload;
      return await persistProfile(compatiblePayload);
    }
  }
}

export default function InitialSettings() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { startTour } = useTour();
  const { theme, setTheme } = useTheme();
  const { plan, isDevAccount } = useSubscription();
  const {
    isConnected: isGoogleConnected,
    isLoading: isGoogleLoading,
    connectGoogle,
    connectionEmail,
  } = useGoogleAuth();

  const [step, setStep] = useState<WizardStep>("style");
  const [draft, setDraftState] = useState<InitialSettingsDraft>(() => readStoredDraft(user?.id));
  const [saving, setSaving] = useState(false);
  const [hydratedFromProfile, setHydratedFromProfile] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [validatingAddressId, setValidatingAddressId] = useState<string | null>(null);

  const currentIndex = steps.findIndex((item) => item.id === step);
  const progress = ((currentIndex + 1) / steps.length) * 100;
  const isDarkTheme = theme === "dark";
  const logoSrc = isDarkTheme ? "/favicon-light.png" : "/favicon-dark.png";
  const canCreateNeuroFinance = isDevAccount || plan === "Professional" || plan === "Enterprise";

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
  const activePanelClass = isDarkTheme
    ? "border-black bg-black text-white shadow-[0_18px_46px_-34px_rgba(0,0,0,0.65)]"
    : "border-white bg-white text-black shadow-[0_18px_46px_-34px_rgba(255,255,255,0.35)]";
  const primaryActionClass = isDarkTheme
    ? "bg-black text-white hover:bg-zinc-950"
    : "bg-white text-black hover:bg-zinc-100";

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
    const params = new URLSearchParams(location.search);
    const stepParam = params.get("step");
    if (isValidWizardStep(stepParam)) setStep(stepParam);
    if (params.get("google") === "success" || params.get("status") === "success") {
      setDraft({ googleWorkspaceChoice: "connect" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  useEffect(() => {
    if (!profile || hydratedFromProfile) return;
    const stored = readStoredDraft(user?.id);
    const hasStored = JSON.stringify(stored) !== JSON.stringify(emptyDraft);
    const savedAddress = (profile.professional_address || {}) as ProfessionalAddress;

    setDraftState({
      ...emptyDraft,
      ...stored,
      theme: hasStored ? stored.theme : "system",
      clinicName: hasStored ? stored.clinicName : profile.clinic_name || "",
      crp: hasStored ? stored.crp : profile.crp || "",
      address: hasStored ? stored.address : profile.address || savedAddress.label || "",
      professionalAddress: hasStored ? stored.professionalAddress : savedAddress.label ? savedAddress : null,
      bio: hasStored ? stored.bio : profile.bio || "",
      googleWorkspaceChoice: hasStored
        ? stored.googleWorkspaceChoice
        : profile.calendar_sync_enabled && profile.gmail_send_enabled
          ? "connect"
          : "",
      neurofinanceIntroChoice: hasStored ? stored.neurofinanceIntroChoice : profile.neurofinance_intro_choice || "",
    });
    setHydratedFromProfile(true);
  }, [hydratedFromProfile, profile, user?.id]);

  useEffect(() => {
    if (!draft.address || draft.professionalAddress?.label === draft.address) {
      setAddressSuggestions([]);
      setAddressError(null);
      return;
    }

    if (draft.address.trim().length < 3) {
      setAddressSuggestions([]);
      setAddressError(null);
      return;
    }

    setAddressLoading(true);
    setAddressError(null);
    const timer = window.setTimeout(() => {
      void invokeFunction<{ suggestions: AddressSuggestion[]; message?: string }>("address-autocomplete", {
        query: draft.address,
      })
        .then((result) => {
          const remoteSuggestions = result.suggestions || [];
          const manualSuggestion = manualAddressSuggestion(draft.address);
          setAddressSuggestions(remoteSuggestions.length > 0 ? remoteSuggestions : manualSuggestion ? [manualSuggestion] : []);
          setAddressError(remoteSuggestions.length > 0 ? null : result.message || null);
        })
        .catch((error) => {
          const manualSuggestion = manualAddressSuggestion(draft.address);
          setAddressSuggestions(manualSuggestion ? [manualSuggestion] : []);
          setAddressError(
            manualSuggestion
              ? "Validação automática indisponível. Você pode usar o endereço digitado."
              : error instanceof Error
                ? error.message
                : "Não conseguimos buscar endereços agora.",
          );
        })
        .finally(() => setAddressLoading(false));
    }, 450);

    return () => {
      window.clearTimeout(timer);
      setAddressLoading(false);
    };
  }, [draft.address, draft.professionalAddress?.label]);

  const selectAddress = async (suggestion: AddressSuggestion) => {
    if (suggestion.source === "manual") {
      const address = {
        label: suggestion.label,
        source: "manual",
        validatedAt: new Date().toISOString(),
      };
      setDraft({ address: suggestion.label, professionalAddress: address });
      setAddressSuggestions([]);
      setAddressError(null);
      return;
    }

    setValidatingAddressId(suggestion.id);
    try {
      const result = await invokeFunction<{ valid: boolean; address: ProfessionalAddress; error?: string }>(
        "address-validate",
        {
          suggestion,
        },
      );
      if (!result.valid || !result.address?.label) {
        throw new Error(result.error || "Selecione um endereço válido.");
      }
      setDraft({ address: result.address.label, professionalAddress: result.address });
      setAddressSuggestions([]);
      setAddressError(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não conseguimos validar este endereço.");
    } finally {
      setValidatingAddressId(null);
    }
  };

  const goNext = () => {
    if (step === "profile") {
      if (!isValidCrp(draft.crp)) {
        toast.error("Use o formato CRP 00/000000 ou deixe o campo em branco.");
        return;
      }
      if (draft.address.trim() && draft.professionalAddress?.label !== draft.address.trim()) {
        toast.error("Selecione um endereço profissional válido da lista.");
        return;
      }
    }

    if (step === "connections") {
      if (isGoogleConnected) {
        setDraft({ googleWorkspaceChoice: "connect" });
      } else if (!draft.googleWorkspaceChoice) {
        toast.error("Escolha conectar Google Agenda e Gmail ou deixar para depois.");
        return;
      }
    }

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

    const neurofinanceChoice =
      draft.neurofinanceIntroChoice || (canCreateNeuroFinance ? "" : "later");

    if (!neurofinanceChoice) {
      toast.error("Escolha se quer criar a conta bancária agora ou deixar para depois.");
      return;
    }

    setSaving(true);
    try {
      const googleChoice = isGoogleConnected ? "connect" : draft.googleWorkspaceChoice || "skip";
      const result = await saveInitialSettingsWithFallback(user.id, {
        theme: draft.theme,
        clinicName: draft.clinicName,
        crp: draft.crp,
        address: draft.address,
        professionalAddress: draft.professionalAddress || {},
        bio: draft.bio,
        googleChoice,
        googleConnected: isGoogleConnected,
        neurofinanceIntroChoice: neurofinanceChoice,
      });

      if (!result.success) throw new Error(result.error || "Não foi possível salvar suas configurações.");

      removeStoredDraft(user.id);
      toast.success("Configurações iniciais salvas.");
      localStorage.removeItem("neuro_nex_tour_completed");
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
            isDarkTheme={isDarkTheme}
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
                  activePanelClass={activePanelClass}
                  onTheme={(next) => {
                    setTheme(next);
                    setDraft({ theme: next });
                  }}
                />
              ) : null}

              {step === "profile" ? (
                <ProfileStep
                  key="profile"
                  draft={draft}
                  inputClass={inputClass}
                  addressSuggestions={addressSuggestions}
                  addressLoading={addressLoading}
                  addressError={addressError}
                  validatingAddressId={validatingAddressId}
                  onSelectAddress={(suggestion) => void selectAddress(suggestion)}
                  onChange={setDraft}
                />
              ) : null}

              {step === "connections" ? (
                <ConnectionsStep
                  key="connections"
                  draft={draft}
                  mutedPanelClass={mutedPanelClass}
                  activePanelClass={activePanelClass}
                  isGoogleConnected={isGoogleConnected}
                  isGoogleLoading={isGoogleLoading}
                  connectionEmail={connectionEmail}
                  onChange={setDraft}
                  onConnectGoogle={() => {
                    setDraft({ googleWorkspaceChoice: "connect" });
                    void connectGoogle({ returnTo: "/initial-settings?step=neurofinance&google=success" });
                  }}
                />
              ) : null}

              {step === "neurofinance" ? (
                <NeuroFinanceIntroStep
                  key="neurofinance"
                  draft={draft}
                  mutedPanelClass={mutedPanelClass}
                  activePanelClass={activePanelClass}
                  canCreateNeuroFinance={canCreateNeuroFinance}
                  plan={plan}
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
                  className={cn("h-12 rounded-[16px] text-[10px] font-black uppercase tracking-[0.12em]", primaryActionClass)}
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                  Finalizar
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={goNext}
                  className={cn("h-12 rounded-[16px] text-[10px] font-black uppercase tracking-[0.12em]", primaryActionClass)}
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
  isDarkTheme,
}: {
  logoSrc: string;
  firstName: string;
  step: WizardStep;
  progress: number;
  isDarkTheme: boolean;
}) {
  const railCards = steps.filter((item) => item.id === "profile" || item.id === "connections");

  return (
    <aside className={cn("flex flex-col justify-between p-10", isDarkTheme ? "border-r-0" : "border-r border-current/5")}>
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
        {railCards.map((item) => {
          const active = item.id === step;
          return (
            <div
              key={item.id}
              className={cn(
                "rounded-[24px] p-4 transition-colors",
                active ? "bg-current text-background" : "bg-current/[0.045] text-current/55",
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
  activePanelClass,
  onTheme,
}: {
  draft: InitialSettingsDraft;
  mutedPanelClass: string;
  activePanelClass: string;
  onTheme: (theme: ThemeChoice) => void;
}) {
  const themes = [
    { id: "light" as const, label: "Claro", icon: Sun, description: "Interface clara e limpa." },
    { id: "dark" as const, label: "Escuro", icon: Moon, description: "Contraste premium para ambientes escuros." },
    { id: "system" as const, label: "Sistema", icon: Monitor, description: "Segue o tema do aparelho." },
  ];

  return (
    <motion.div variants={fadeStep} initial="hidden" animate="visible" exit="exit" className="space-y-7">
      <StepHeading
        eyebrow="Preferências"
        title="Escolha como o NeuroNex deve se sentir."
        description="Você pode mudar o tema depois em Ajustes. Mantemos a identidade visual da NeuroNex em todos os modos."
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
                active ? activePanelClass : mutedPanelClass,
              )}
            >
              <span className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-current/10">
                  <item.icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-black">{item.label}</span>
                  <span className="mt-1 block text-[11px] font-semibold opacity-55">{item.description}</span>
                </span>
              </span>
              {active ? <Check className="h-5 w-5" /> : null}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

function ProfileStep({
  draft,
  inputClass,
  addressSuggestions,
  addressLoading,
  addressError,
  validatingAddressId,
  onSelectAddress,
  onChange,
}: {
  draft: InitialSettingsDraft;
  inputClass: string;
  addressSuggestions: AddressSuggestion[];
  addressLoading: boolean;
  addressError: string | null;
  validatingAddressId: string | null;
  onSelectAddress: (suggestion: AddressSuggestion) => void;
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

        <WizardField label="CRP (opcional)">
          <Input
            value={draft.crp}
            onChange={(event) => onChange({ crp: maskCrp(event.target.value) })}
            placeholder="00/000000"
            inputMode="numeric"
            className={cn("h-12", inputClass)}
          />
          {draft.crp && !isValidCrp(draft.crp) ? (
            <p className="mt-2 text-[11px] font-bold text-red-500">Use o formato 00/000000.</p>
          ) : null}
        </WizardField>

        <WizardField label="Endereço profissional">
          <div className="relative">
            <Input
              value={draft.address}
              onChange={(event) => onChange({ address: event.target.value, professionalAddress: null })}
              placeholder="Busque pelo endereço ou CEP"
              className={cn("h-12 pr-11", inputClass)}
            />
            <span className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[10px] text-current/50">
              {addressLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </span>
          </div>
          {draft.professionalAddress?.label === draft.address ? (
            <p className="mt-2 flex items-center gap-2 text-[11px] font-bold text-emerald-500">
              <Check className="h-3.5 w-3.5" />
              Endereço validado.
            </p>
          ) : null}
          {addressError ? <p className="mt-2 text-[11px] font-bold text-current/45">{addressError}</p> : null}
          {addressSuggestions.length > 0 ? (
            <div className="mt-2 overflow-hidden rounded-[18px] border border-current/10 bg-current/[0.04]">
              {addressSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => onSelectAddress(suggestion)}
                  className="flex w-full items-center gap-3 border-b border-current/8 px-3 py-3 text-left text-xs font-bold last:border-b-0 hover:bg-current/10"
                >
                  {validatingAddressId === suggestion.id ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4 shrink-0" />
                  )}
                  <span>{suggestion.label}</span>
                </button>
              ))}
            </div>
          ) : null}
          <p className="mt-2 text-[10px] font-semibold leading-relaxed text-current/40">
            Se não quiser informar agora, deixe em branco. Se digitar, selecione um endereço validado.
          </p>
        </WizardField>

        <WizardField label="Como você quer se apresentar (opcional)">
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
  activePanelClass,
  isGoogleConnected,
  isGoogleLoading,
  connectionEmail,
  onChange,
  onConnectGoogle,
}: {
  draft: InitialSettingsDraft;
  mutedPanelClass: string;
  activePanelClass: string;
  isGoogleConnected: boolean;
  isGoogleLoading: boolean;
  connectionEmail: string | null;
  onChange: (updates: Partial<InitialSettingsDraft>) => void;
  onConnectGoogle: () => void;
}) {
  const connectActive = isGoogleConnected || draft.googleWorkspaceChoice === "connect";
  return (
    <motion.div variants={fadeStep} initial="hidden" animate="visible" exit="exit" className="space-y-7">
      <StepHeading
        eyebrow="Agenda e Gmail"
        title="Conecte os dois juntos ou deixe para depois."
        description="Hoje a NeuroNex usa Google Agenda e Gmail como um pacote único de permissão."
      />
      <div className="grid gap-3">
        <ChoiceCard
          active={connectActive}
          icon={CalendarClock}
          title={isGoogleConnected ? "Google conectado" : "Conectar Google Agenda e Gmail"}
          description={
            isGoogleConnected
              ? `Pronto${connectionEmail ? `: ${connectionEmail}` : ""}.`
              : "Sincroniza agenda e permite envio de e-mails quando você pedir."
          }
          loading={isGoogleLoading && draft.googleWorkspaceChoice === "connect"}
          activeClassName={activePanelClass}
          onClick={isGoogleConnected ? () => onChange({ googleWorkspaceChoice: "connect" }) : onConnectGoogle}
        />
        <ChoiceCard
          active={!isGoogleConnected && draft.googleWorkspaceChoice === "skip"}
          icon={Mail}
          title="Agora não"
          description="Sem problemas. Você pode conectar depois em Ajustes."
          activeClassName={activePanelClass}
          onClick={() => onChange({ googleWorkspaceChoice: "skip" })}
        />
      </div>
      <div className={cn("rounded-[24px] border p-4 text-xs font-semibold leading-relaxed text-current/55", mutedPanelClass)}>
        Ao conectar, pediremos os dois escopos necessários de uma vez. Não existe seleção separada nesta versão.
      </div>
    </motion.div>
  );
}

function NeuroFinanceIntroStep({
  draft,
  mutedPanelClass,
  activePanelClass,
  canCreateNeuroFinance,
  plan,
  onChange,
}: {
  draft: InitialSettingsDraft;
  mutedPanelClass: string;
  activePanelClass: string;
  canCreateNeuroFinance: boolean;
  plan: string;
  onChange: (updates: Partial<InitialSettingsDraft>) => void;
}) {
  return (
    <motion.div variants={fadeStep} initial="hidden" animate="visible" exit="exit" className="space-y-7">
      <StepHeading
        eyebrow="NeuroFinance"
        title="Quer preparar sua conta bancária agora?"
        description="A gestão financeira já funciona sem isso. A conta NeuroFinance libera operações bancárias depois da aprovação."
      />
      {!canCreateNeuroFinance ? (
        <div className={cn("rounded-[24px] border p-4", mutedPanelClass)}>
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-current/10">
              <Crown className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-black">Disponível nos planos Profissional e Enterprise</p>
              <p className="mt-1 text-[11px] font-semibold leading-relaxed text-current/55">
                Seu plano atual é {plan}. Vamos deixar salvo para depois e você pode fazer upgrade quando quiser.
              </p>
            </div>
          </div>
        </div>
      ) : null}
      <div className="grid gap-3">
        {canCreateNeuroFinance ? (
          <ChoiceCard
            active={draft.neurofinanceIntroChoice === "create_now"}
            icon={Wallet}
            title="Criar conta bancária"
            description="Salvamos sua intenção e abrimos o onboarding bancário depois do tour."
            activeClassName={activePanelClass}
            onClick={() => onChange({ neurofinanceIntroChoice: "create_now" })}
          />
        ) : null}
        <ChoiceCard
          active={draft.neurofinanceIntroChoice === "later" || !canCreateNeuroFinance}
          icon={Gem}
          title="Agora não"
          description="Deixe isso salvo e configure quando fizer sentido."
          activeClassName={activePanelClass}
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

function ChoiceCard({
  active,
  icon: Icon,
  title,
  description,
  loading = false,
  activeClassName,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  title: string;
  description: string;
  loading?: boolean;
  activeClassName: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[5rem] items-center justify-between gap-4 rounded-[24px] border p-4 text-left transition-all active:scale-[0.99]",
        active ? activeClassName : "border-current/12 bg-current/[0.035] text-current",
      )}
    >
      <span className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-current/10">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
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
