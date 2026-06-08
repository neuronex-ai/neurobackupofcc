import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/SessionContextProvider';
import { Transaction, PaymentMethod, TransactionOrigin } from '@/types';

export type FinancialEntryType = 'income' | 'expense';
export type FinancialEntryStatus = 'planned' | 'pending' | 'paid' | 'overdue' | 'cancelled';
export type FinancialEntryPaymentMethod =
  | 'manual'
  | 'pix'
  | 'boleto'
  | 'card'
  | 'cash'
  | 'external_transfer'
  | 'convenio'
  | 'other';

export interface FinancialEntry {
  id: string;
  clinic_id: string | null;
  professional_id: string;
  patient_id: string | null;
  appointment_id: string | null;
  type: FinancialEntryType;
  title: string;
  description: string | null;
  category_id: string | null;
  amount: number;
  due_date: string | null;
  competence_date: string | null;
  paid_at: string | null;
  status: FinancialEntryStatus;
  payment_method: FinancialEntryPaymentMethod;
  origin: string;
  neurofinance_transaction_id: string | null;
  neurofinance_charge_id: string | null;
  legacy_transaction_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  patients?: {
    name: string;
    email: string | null;
  } | null;
}

export interface FinancialEntryFilters {
  startDate?: Date;
  endDate?: Date;
  type?: FinancialEntryType;
  status?: FinancialEntryStatus | FinancialEntryStatus[];
  patientId?: string;
  limit?: number;
}

export interface NewFinancialEntryInput {
  type: FinancialEntryType;
  title?: string;
  description: string;
  amount: number;
  dueDate: Date;
  competenceDate?: Date;
  paidAt?: Date | null;
  status?: FinancialEntryStatus;
  paymentMethod?: FinancialEntryPaymentMethod;
  origin?: string;
  categoryId?: string | null;
  patientId?: string | null;
  appointmentId?: string | null;
  metadata?: Record<string, unknown>;
}

export function toFinancialPaymentMethod(method?: string | null): FinancialEntryPaymentMethod {
  switch (method) {
    case 'pix':
    case 'boleto':
      return method;
    case 'money':
    case 'cash':
      return 'cash';
    case 'credit_card':
    case 'debit_card':
    case 'card':
      return 'card';
    case 'external_transfer':
      return 'external_transfer';
    case 'convenio':
      return 'convenio';
    case 'manual':
      return 'manual';
    default:
      return 'other';
  }
}

export function fromFinancialPaymentMethod(method?: string | null): PaymentMethod {
  switch (method) {
    case 'pix':
    case 'boleto':
      return method;
    case 'cash':
      return 'money';
    case 'card':
      return 'credit_card';
    default:
      return 'mixed';
  }
}

export function toLegacyTransactionStatus(status?: string | null) {
  if (status === 'paid') return 'completed';
  if (status === 'cancelled') return 'cancelled';
  return 'pending';
}

export function fromLegacyTransactionStatus(status?: string | null): FinancialEntryStatus {
  if (['paid', 'completed', 'received'].includes(String(status || '').toLowerCase())) return 'paid';
  if (['cancelled', 'canceled'].includes(String(status || '').toLowerCase())) return 'cancelled';
  if (String(status || '').toLowerCase() === 'planned') return 'planned';
  if (String(status || '').toLowerCase() === 'overdue') return 'overdue';
  return 'pending';
}

export function mapFinancialEntryToTransaction(entry: FinancialEntry): Transaction {
  const metadata = entry.metadata || {};
  const date =
    entry.paid_at?.slice(0, 10) ||
    entry.competence_date ||
    entry.due_date ||
    entry.created_at.slice(0, 10);

  return {
    id: entry.id,
    user_id: entry.professional_id,
    description: entry.description || entry.title,
    amount: Number(entry.amount || 0),
    type: entry.type,
    category: typeof metadata.category === 'string' ? metadata.category : null,
    date,
    appointment_id: entry.appointment_id,
    created_at: entry.created_at,
    payment_method: fromFinancialPaymentMethod(entry.payment_method),
    installments: typeof metadata.installments === 'number' ? metadata.installments : undefined,
    package_id: typeof metadata.package_id === 'string' ? metadata.package_id : undefined,
    external_reference: typeof metadata.external_reference === 'string' ? metadata.external_reference : entry.neurofinance_charge_id || undefined,
    attachment_url: typeof metadata.attachment_url === 'string' ? metadata.attachment_url : undefined,
    origin: (entry.origin === 'neurofinance' ? 'gateway_auto' : 'manual') as TransactionOrigin,
    patient_id: entry.patient_id || undefined,
    status: toLegacyTransactionStatus(entry.status),
    patients: entry.patients || null,
  };
}

export async function fetchFinancialEntries(userId: string, filters: FinancialEntryFilters = {}) {
  let query = supabase
    .from('financial_entries')
    .select('*, patients(name, email)')
    .eq('professional_id', userId)
    .order('due_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(filters.limit || 500);

  if (filters.startDate) {
    query = query.gte('due_date', format(filters.startDate, 'yyyy-MM-dd'));
  }

  if (filters.endDate) {
    query = query.lte('due_date', format(filters.endDate, 'yyyy-MM-dd'));
  }

  if (filters.type) {
    query = query.eq('type', filters.type);
  }

  if (filters.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status);
    } else {
      query = query.eq('status', filters.status);
    }
  }

  if (filters.patientId) {
    query = query.eq('patient_id', filters.patientId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as FinancialEntry[];
}

export function useFinancialEntries(filters: FinancialEntryFilters = {}) {
  const { user } = useAuth();
  const userId = user?.id;
  const startStr = filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : 'all';
  const endStr = filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : 'all';

  return useQuery<FinancialEntry[], Error>({
    queryKey: ['financialEntries', userId, startStr, endStr, filters.type || 'all', filters.status || 'all', filters.patientId || 'all', filters.limit || 500],
    queryFn: () => {
      if (!userId) throw new Error('Usuario nao autenticado');
      return fetchFinancialEntries(userId, filters);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
    retry: false,
  });
}

export function useCreateFinancialEntry() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: NewFinancialEntryInput) => {
      if (!user?.id) throw new Error('Usuario nao autenticado');

      const status = input.status || (input.paidAt ? 'paid' : 'pending');
      const paidAt = input.paidAt ? input.paidAt.toISOString() : null;

      const { data, error } = await supabase
        .from('financial_entries')
        .insert({
          professional_id: user.id,
          type: input.type,
          title: input.title || input.description,
          description: input.description,
          category_id: input.categoryId || null,
          amount: Math.abs(Number(input.amount || 0)),
          due_date: format(input.dueDate, 'yyyy-MM-dd'),
          competence_date: format(input.competenceDate || input.dueDate, 'yyyy-MM-dd'),
          paid_at: paidAt,
          status,
          payment_method: input.paymentMethod || 'manual',
          origin: input.origin || 'manual',
          patient_id: input.patientId || null,
          appointment_id: input.appointmentId || null,
          metadata: input.metadata || {},
        })
        .select()
        .single();

      if (error) throw error;
      return data as FinancialEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialEntries'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['advancedCashFlow'] });
    },
  });
}
