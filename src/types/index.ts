import type { AppointmentMetadata } from "@/lib/appointment-metadata";
import type { AppointmentStatus, LegacyAppointmentStatus } from "@/lib/appointment-status";

export interface Patient {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cpf?: string | null;
  status: string | null;
  last_session: string | null;
  next_session: string | null;
  diagnosis: string | null;
  notes: string | null;
  created_at: string;
  birth_date?: string | null;
  address?: string | null;
  emergency_contact?: string | null;
  payer_type?: 'patient' | 'other' | null;
  payer_name?: string | null;
  payer_cpf?: string | null;
  risk_score?: number;
  avatar_url?: string | null;
  medications?: Medication[] | null;
}

export interface Medication {
  name: string;
  dosage?: string;
  frequency?: string;
}

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name?: string | null;
  name?: string | null;
  clinic_name: string | null;
  crp: string | null;
  address: string | null;
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
  subscription_plan?: string | null;
  updated_at: string;
  two_factor_enabled?: boolean;
  sms_notifications_enabled?: boolean;
  setup_completed?: boolean;
  working_hours?: any;
}

/**
 * Representa um agendamento ou compromisso no calendário.
 */
export interface Appointment {
  id: string;
  /** ID do profissional proprietário do registro (UUID) */
  user_id: string;
  /** ID do paciente vinculado ou null para bloqueios de horário */
  patient_id: string | null;
  /** Data e hora de início em formato ISO 8601 */
  start_time: string;
  /** Data e hora de término em formato ISO 8601 */
  end_time: string;
  /** Modalidade do atendimento ou tipo de bloqueio administrativo */
  type: 'presencial' | 'online' | 'block';
  /** Estado atual do agendamento no workflow clínico */
  status: AppointmentStatus | LegacyAppointmentStatus;
  /** Observações privadas do profissional sobre o agendamento */
  notes: string | null;
  /** Endereço físico ou link da videochamada */
  location: string | null;
  created_at: string;
  updated_at?: string;
  metadata?: AppointmentMetadata | null;
  /** Preço da sessão individual se não for pacote */
  price?: number | null;
  /** Nome do paciente persistido para performance em listagens */
  patient_name?: string;
  patient_email?: string;
  patient_phone?: string;
  patient_initials?: string;
  /** Identificador único do evento no Google Calendar sincronizado */
  google_event_id?: string | null;
  /** URL da sala de conferência (Google Meet) para consultas online */
  google_meet_link?: string | null;
}

/** Métodos de pagamento suportados nativamente pela infraestrutura NeuroNex */
export type PaymentMethod = 'pix' | 'money' | 'credit_card' | 'debit_card' | 'boleto' | 'mixed';
export type TransactionOrigin = 'manual' | 'gateway_auto';

export interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string | null;
  date: string;
  appointment_id: string | null;
  created_at: string;

  // Novos Campos
  payment_method?: PaymentMethod;
  installments?: number; // 1 = à vista
  package_id?: string; // Vínculo com pacote
  external_reference?: string; // ID da nota, comprovante, recibo
  attachment_url?: string; // URL do comprovante (PDF/IMG)
  origin?: TransactionOrigin;
  patient_id?: string;
  status?: string;
  patients?: {
    name: string;
    email: string | null;
  } | null;
}

export interface RecurringExpense {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  category: string | null;
  day_of_month: number;
  active: boolean;
  last_generated_date: string | null;
  created_at: string;
}

export interface AISummary {
  sentiment: 'Positivo' | 'Neutro' | 'Negativo' | string;
  summary: string;
  topics: string[];
  next_steps: string[];
}

export interface SessionNote {
  id: string;
  user_id: string;
  patient_id: string;
  appointment_id: string | null;
  notes: string;
  ai_summary: AISummary | null;
  transcription: string | null;
  created_at: string;
}

export interface PatientPackage {
  id: string;
  user_id: string;
  patient_id: string;
  description: string;
  name?: string; // Alias for description
  active?: boolean;
  total_sessions: number;
  sessions_used: number;
  price: number | null;
  start_date: string;
  end_date: string | null;
  due_day?: number | null;
  created_at: string;
}

export interface PatientGoal {
  id: string;
  user_id: string;
  patient_id: string;
  description: string;
  is_completed: boolean;
  due_date: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  patient_id: string;
  invoice_number: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled' | 'overdue';
  due_date: string | null;
  created_at: string;
  description?: string;

  // Payment gateway integration
  gateway_payment_id?: string | null;
  pdf_url?: string | null;
  payment_url?: string | null; // Payment links / checkout URL

  // Focus NFe Integration
  focus_nfe_ref?: string | null;
  focus_nfe_status?: string | null;

  // NFSe Data (from webhook)
  nfse_status?: string | null;
  nfse_number?: string | null;
  nfse_verification_code?: string | null;
  nfse_pdf_url?: string | null;
  nfse_xml_url?: string | null;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  user_id: string;
  session_id?: string;
  attachments?: any[];
}

export interface Reminder {
  id: string;
  user_id: string;
  note_id: string | null;
  title: string;
  due_date: string; // ISO String
  category: 'Geral' | 'Urgente' | 'Pessoal' | 'Clínico' | 'Financeiro';
  is_completed: boolean;
  created_at: string;
}

export interface PersonalNote {
  id: string;
  user_id: string;
  module_id: string | null;
  patient_id: string | null;
  title: string;
  content: string;
  tags: string[];
  reference_date: string;
  updated_at: string;
  created_at: string;
  patient_name?: string;
}

export interface MoodLog {
  id: string;
  patient_id: string;
  mood_score: number;
  notes?: string | null;
  created_at: string;
}
