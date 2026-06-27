import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/SessionContextProvider";

export type PatientPortalStatus = "needs_activation" | "active" | "suspended" | "revoked";

export interface PatientPortalContext {
  status: PatientPortalStatus;
  linkId?: string;
  patient: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  professional: {
    id: string;
    name: string;
    clinicName: string | null;
    avatarUrl: string | null;
  } | null;
  features: Record<string, boolean>;
  linkedProfiles: Array<{
    linkId: string;
    patientId: string;
    status: string;
    professional: {
      id: string;
      name: string;
      clinicName: string | null;
      avatarUrl: string | null;
    };
  }>;
  message: string;
}

export interface PatientPortalInvitePreview {
  status: "ready" | "activated";
  inviteId: string;
  expiresAt: string;
  attemptsRemaining: number;
  patient: {
    name: string;
    emailMasked: string;
  };
  professional: {
    name: string;
    clinicName: string | null;
    avatarUrl: string | null;
  };
}

export interface PatientPortalAppointment {
  id: string;
  start_time: string;
  end_time: string;
  type: string;
  status: string;
  location: string | null;
  google_meet_link: string | null;
}

export interface PatientPortalDocument {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  sharedAt: string | null;
  signedUrl: string | null;
}

export interface PatientPortalBillingEntry {
  id: string;
  title?: string;
  description?: string | null;
  amount: number;
  due_date: string | null;
  paid_at?: string | null;
  status: string;
  payment_method?: string | null;
  neurofinance_charge_id?: string | null;
  created_at: string;
  metadata?: Record<string, unknown> | null;
}

export interface PatientPortalInvoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  due_date: string | null;
  receipt_url?: string | null;
  invoice_url?: string | null;
  bank_slip_url?: string | null;
  created_at: string;
}

export interface PatientPortalMoodLog {
  id: string;
  mood_score: number;
  notes: string | null;
  source: string;
  created_at: string;
}

export interface PatientPortalGoal {
  id: string;
  description: string;
  is_completed: boolean;
  due_date: string | null;
  created_at: string;
}

const readFunctionError = async (error: unknown, fallback: string) => {
  const context = (error as { context?: Response })?.context;
  if (context) {
    try {
      const payload = await context.clone().json();
      if (typeof payload?.error === "string") return payload.error;
    } catch {
      try {
        const text = await context.clone().text();
        if (text) return text;
      } catch {
        return fallback;
      }
    }
  }
  return error instanceof Error && error.message ? error.message : fallback;
};

const invokePortalFunction = async <T>(name: string, body?: Record<string, unknown>, fallback = "Nao foi possivel carregar o portal.") => {
  const { data, error } = await supabase.functions.invoke(name, { body: body || {} });
  if (error) throw new Error(await readFunctionError(error, fallback));
  return data as T;
};

export const useCreatePatientPortalInvite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patientId: string) =>
      invokePortalFunction<{
        status: "sent" | "linked";
        inviteId?: string;
        expiresAt?: string;
        patientEmail?: string;
        portalUrl?: string;
        message: string;
      }>("create-patient-portal-invite", { patientId }, "Nao foi possivel enviar o convite."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-portal-invite-status"] });
    },
  });
};

export const usePatientPortalInvitePreview = (token?: string) =>
  useQuery({
    queryKey: ["patient-portal-invite-preview", token],
    queryFn: () =>
      invokePortalFunction<PatientPortalInvitePreview>(
        "patient-portal-invite-preview",
        { token },
        "Convite invalido ou expirado.",
      ),
    enabled: Boolean(token),
    retry: false,
  });

export const useActivatePatientPortal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ token, code }: { token?: string; code: string }) =>
      invokePortalFunction<PatientPortalContext>(
        "patient-portal-activate",
        { token, code },
        "Nao foi possivel ativar o portal.",
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-portal-current"] });
    },
  });
};

export const usePatientPortalCurrent = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["patient-portal-current", user?.id],
    queryFn: () => invokePortalFunction<PatientPortalContext>("patient-portal-current"),
    enabled: Boolean(user?.id),
    retry: false,
  });
};

export const usePatientPortalAppointments = (enabled = true) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["patient-portal-appointments", user?.id],
    queryFn: () =>
      invokePortalFunction<{ appointments: PatientPortalAppointment[] }>("patient-portal-current", { action: "appointments" }),
    enabled: Boolean(user?.id) && enabled,
  });
};

export const usePatientPortalDocuments = (enabled = true) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["patient-portal-documents", user?.id],
    queryFn: () =>
      invokePortalFunction<{ documents: PatientPortalDocument[] }>("patient-portal-current", { action: "documents" }),
    enabled: Boolean(user?.id) && enabled,
  });
};

export const usePatientPortalBilling = (enabled = true) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["patient-portal-billing", user?.id],
    queryFn: () =>
      invokePortalFunction<{ entries: PatientPortalBillingEntry[]; invoices: PatientPortalInvoice[] }>("patient-portal-current", { action: "billing" }),
    enabled: Boolean(user?.id) && enabled,
  });
};

export const usePatientPortalMood = (enabled = true) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["patient-portal-mood", user?.id],
    queryFn: () =>
      invokePortalFunction<{ logs: PatientPortalMoodLog[]; today: PatientPortalMoodLog | null }>("patient-portal-current", { action: "mood" }),
    enabled: Boolean(user?.id) && enabled,
  });

  const saveMood = useMutation({
    mutationFn: ({ moodScore, notes }: { moodScore: number; notes?: string }) =>
      invokePortalFunction<{ logs: PatientPortalMoodLog[]; today: PatientPortalMoodLog | null }>(
        "patient-portal-current",
        { action: "mood", moodScore, notes },
        "Nao foi possivel salvar o diario.",
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-portal-mood", user?.id] });
    },
  });

  return { ...query, saveMood };
};

export const usePatientPortalGoals = (enabled = true) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["patient-portal-goals", user?.id],
    queryFn: () =>
      invokePortalFunction<{ goals: PatientPortalGoal[] }>("patient-portal-current", { action: "goals" }),
    enabled: Boolean(user?.id) && enabled,
  });
};
