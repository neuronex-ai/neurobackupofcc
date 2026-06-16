import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import {
  enableBiometricSignIn,
  getBiometricStatus,
  isBiometricStatusUsable,
  type BiometricStatus,
} from "@/lib/native-mobile-security";
import type { Session, User } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export type ProfessionalContext =
  | "individual_professional"
  | "clinic_admin"
  | "psychology_student";

export type CreateAccountStep = "identity" | "password" | "success";

export type CreateAccountDraft = {
  fullName: string;
  email: string;
  recoveryEmail: string;
  phone: string;
  professionalContext: ProfessionalContext | "";
  acceptedTerms: boolean;
};

export type PasswordStrength = {
  minLength: boolean;
  lower: boolean;
  upper: boolean;
  special: boolean;
  score: number;
};

type PersistProfileParams = {
  user: User;
  draft: CreateAccountDraft;
};

const STORAGE_KEY = "neuronex.create-account.draft.v1";
const SPECIAL_CHARS = /[@#<!$%&*;/?:]/;

export const emptyCreateAccountDraft: CreateAccountDraft = {
  fullName: "",
  email: "",
  recoveryEmail: "",
  phone: "",
  professionalContext: "",
  acceptedTerms: false,
};

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function maskBrazilPhone(value: string) {
  const digits = onlyDigits(value).replace(/^55/, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function getPasswordStrength(password: string): PasswordStrength {
  const checks = {
    minLength: password.length >= 8,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    special: SPECIAL_CHARS.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  return { ...checks, score };
}

function getOrigin() {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

function readDraftFromStorage() {
  if (typeof window === "undefined") return emptyCreateAccountDraft;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyCreateAccountDraft;
  try {
    return { ...emptyCreateAccountDraft, ...JSON.parse(raw) } as CreateAccountDraft;
  } catch {
    return emptyCreateAccountDraft;
  }
}

function writeDraftToStorage(draft: CreateAccountDraft) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

function clearDraftStorage() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
  const firstName = parts.shift() || "";
  return {
    firstName,
    lastName: parts.join(" "),
  };
}

function toE164Phone(phone: string) {
  const digits = onlyDigits(phone).replace(/^55/, "").slice(0, 11);
  return digits ? `+55${digits}` : null;
}

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function persistDraftToProfile({ user, draft }: PersistProfileParams) {
  const { firstName, lastName } = splitFullName(draft.fullName);
  const now = new Date().toISOString();
  const payload = {
    id: user.id,
    first_name: firstName || null,
    last_name: lastName || null,
    full_name: draft.fullName.trim() || null,
    name: draft.fullName.trim() || null,
    recovery_email: normalizeEmail(draft.recoveryEmail) || null,
    phone: toE164Phone(draft.phone),
    professional_context: draft.professionalContext || null,
    signup_completed_at: now,
    setup_completed: false,
    updated_at: now,
  };

  const update = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (!update.error && update.data?.id) return;

  const { error } = await supabase.from("profiles").upsert(payload, {
    onConflict: "id",
  });

  if (error) throw error;
}

export function useCreateAccountFlow() {
  const isMobile = useIsMobile();
  const [step, setStep] = useState<CreateAccountStep>("identity");
  const [draft, setDraftState] = useState<CreateAccountDraft>(() => readDraftFromStorage());
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const setDraft = useCallback((updates: Partial<CreateAccountDraft>) => {
    setDraftState((current) => {
      const next = { ...current, ...updates };
      writeDraftToStorage(next);
      return next;
    });
  }, []);

  const validateIdentity = useCallback(() => {
    const email = normalizeEmail(draft.email);
    const recoveryEmail = normalizeEmail(draft.recoveryEmail);
    const digits = onlyDigits(draft.phone).replace(/^55/, "");

    if (draft.fullName.trim().split(/\s+/).length < 2) {
      throw new Error("Informe seu nome completo.");
    }
    if (!validateEmail(email)) {
      throw new Error("Informe um e-mail válido.");
    }
    if (!validateEmail(recoveryEmail)) {
      throw new Error("Informe um e-mail de recuperação válido.");
    }
    if (email === recoveryEmail) {
      throw new Error("Use um e-mail de recuperação diferente do e-mail principal.");
    }
    if (digits.length < 10) {
      throw new Error("Informe um celular ou WhatsApp válido.");
    }
    if (!draft.professionalContext) {
      throw new Error("Selecione a opção que melhor descreve você.");
    }
    if (!draft.acceptedTerms) {
      throw new Error("Aceite a Política de Privacidade e os Termos de Uso para continuar.");
    }
  }, [draft]);

  const sendVerificationEmail = useCallback(async () => {
    validateIdentity();
    setLoading(true);
    try {
      const email = normalizeEmail(draft.email);
      const normalizedDraft = {
        ...draft,
        email,
        recoveryEmail: normalizeEmail(draft.recoveryEmail),
        phone: maskBrazilPhone(draft.phone),
      };
      const { firstName, lastName } = splitFullName(normalizedDraft.fullName);
      writeDraftToStorage(normalizedDraft);
      setDraftState(normalizedDraft);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${getOrigin()}/create-account?verified=1`,
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: normalizedDraft.fullName.trim(),
            name: normalizedDraft.fullName.trim(),
            recovery_email: normalizedDraft.recoveryEmail,
            phone: toE164Phone(normalizedDraft.phone),
            professional_context: normalizedDraft.professionalContext,
            role: "professional",
            onboarding_source: "create-account",
          },
        },
      });
      if (error) throw error;
      setEmailDialogOpen(true);
      setResendCooldown(45);
    } finally {
      setLoading(false);
    }
  }, [draft, validateIdentity]);

  const verifyEmailCode = useCallback(async () => {
    const email = normalizeEmail(draft.email);
    if (!email || otp.length < 6) {
      throw new Error("Digite o código de confirmação recebido por e-mail.");
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });
      if (error) throw error;
      const verifiedSession = data.session || (await supabase.auth.getSession()).data.session;
      if (!verifiedSession?.user) throw new Error("Não conseguimos abrir sua sessão. Reenvie o e-mail e tente de novo.");

      await persistDraftToProfile({ user: verifiedSession.user, draft });
      setSession(verifiedSession);
      setEmailDialogOpen(false);
      setStep("password");
    } finally {
      setLoading(false);
    }
  }, [draft, otp]);

  const resendVerification = useCallback(async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      const email = normalizeEmail(draft.email);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${getOrigin()}/create-account?verified=1`,
        },
      });
      if (error) throw error;
      setResendCooldown(45);
    } finally {
      setLoading(false);
    }
  }, [draft.email, resendCooldown]);

  const createPassword = useCallback(async () => {
    if (passwordStrength.score < 4) {
      throw new Error("Crie uma senha que cumpra todos os requisitos.");
    }
    if (password !== confirmPassword) {
      throw new Error("As senhas não conferem.");
    }

    setLoading(true);
    try {
      const currentSession = session || (await supabase.auth.getSession()).data.session;
      if (!currentSession?.user) {
        throw new Error("Sua confirmação expirou. Confirme o e-mail novamente.");
      }

      const { error } = await supabase.auth.updateUser({
        password,
        data: {
          full_name: draft.fullName.trim(),
          recovery_email: normalizeEmail(draft.recoveryEmail),
          professional_context: draft.professionalContext,
        },
      });
      if (error) throw error;

      const refreshedSession = (await supabase.auth.getSession()).data.session || currentSession;
      await persistDraftToProfile({ user: refreshedSession.user, draft });

      if (isMobile && biometricEnabled) {
        try {
          await enableBiometricSignIn({
            userId: refreshedSession.user.id,
            email: refreshedSession.user.email,
            session: refreshedSession,
          });
        } catch (error) {
          setBiometricEnabled(false);
          toast.error(
            error instanceof Error
              ? `${error.message} Você pode configurar depois em Ajustes > Login e Segurança.`
              : "Não foi possível ativar a biometria agora. Você pode configurar depois em Ajustes > Login e Segurança.",
          );
        }
      }

      setSession(refreshedSession);
    } finally {
      setLoading(false);
    }
  }, [biometricEnabled, confirmPassword, draft, isMobile, password, passwordStrength.score, session]);

  const completeSignup = useCallback(() => {
    clearDraftStorage();
    setStep("success");
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    void getBiometricStatus()
      .then(setBiometricStatus)
      .catch(() => setBiometricStatus(null));
  }, [isMobile]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => setResendCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    let active = true;
    const resumeFromEmailLink = async () => {
      const params = new URLSearchParams(window.location.search);
      const shouldResume = params.get("verified") === "1" || window.location.hash.includes("access_token");
      if (!shouldResume) return;
      const current = await supabase.auth.getSession();
      const currentSession = current.data.session;
      if (!active || !currentSession?.user) return;
      const storedDraft = readDraftFromStorage();
      if (!storedDraft.email && currentSession.user.email) {
        storedDraft.email = currentSession.user.email;
      }
      if (storedDraft.email) {
        setDraftState(storedDraft);
        await persistDraftToProfile({ user: currentSession.user, draft: storedDraft }).catch(() => undefined);
      }
      setSession(currentSession);
      setEmailDialogOpen(false);
      setStep("password");
      window.history.replaceState({}, "", "/create-account");
    };

    void resumeFromEmailLink();
    return () => {
      active = false;
    };
  }, []);

  return {
    step,
    setStep,
    draft,
    setDraft,
    emailDialogOpen,
    setEmailDialogOpen,
    otp,
    setOtp,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    passwordStrength,
    biometricEnabled,
    setBiometricEnabled,
    biometricStatus,
    biometricAvailable: isBiometricStatusUsable(biometricStatus),
    loading,
    resendCooldown,
    sendVerificationEmail,
    verifyEmailCode,
    resendVerification,
    createPassword,
    completeSignup,
  };
}
