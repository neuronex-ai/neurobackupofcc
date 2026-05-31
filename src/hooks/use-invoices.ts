import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Invoice } from '@/types';
import { useAuth } from '@/components/auth/SessionContextProvider';

const fetchInvoices = async (userId: string): Promise<Invoice[]> => {
  // 1. Fetch from legacy invoices table
  const { data: legacyData, error: legacyError } = await supabase
    .from('invoices')
    .select(`
      id,
      user_id,
      patient_id,
      payment_url,
      pdf_url,
      focus_nfe_ref,
      focus_nfe_status,
      nfse_status,
      invoice_number,
      amount,
      status,
      due_date,
      created_at,
      description
    `)
    .eq('user_id', userId);

  if (legacyError) {
    console.error('Erro ao buscar faturas legadas:', legacyError);
  }

  // 2. Fetch from new nb_payments table
  const { data: nbData, error: nbError } = await supabase
    .from('nb_payments')
    .select(`
      id,
      user_id,
      patient_id,
      checkout_url,
      gross_amount,
      status,
      expires_at,
      created_at,
      description,
      provider_payment_id
    `)
    .eq('user_id', userId);

  if (nbError) {
    console.error('Erro ao buscar pagamentos NeuroBank:', nbError);
  }

  // 3. Map nb_payments to Invoice type
  const mappedNbData: Invoice[] = (nbData || []).map(payment => {
    // Normalize status: Asaas status to Invoice status
    // PENDING, RECEIVED, CONFIRMED, OVERDUE, DELETED
    let normalizedStatus: 'pending' | 'paid' | 'cancelled' | 'overdue' = 'pending';
    const status = payment.status?.toLowerCase();
    
    if (status === 'received' || status === 'confirmed') {
      normalizedStatus = 'paid';
    } else if (status === 'overdue') {
      normalizedStatus = 'overdue';
    } else if (status === 'deleted' || status === 'cancelled') {
      normalizedStatus = 'cancelled';
    }

    return {
      id: payment.id,
      user_id: payment.user_id,
      patient_id: payment.patient_id,
      invoice_number: (payment.provider_payment_id?.split('_') || []).pop() || payment.id.slice(0, 8),
      amount: payment.gross_amount / 100, // Convert centavos to reais
      status: normalizedStatus,
      due_date: payment.expires_at,
      created_at: payment.created_at,
      description: payment.description,
      payment_url: payment.checkout_url,
      gateway_payment_id: payment.provider_payment_id,
    };

  });

  // 4. Merge and sort by date
  const allInvoices = [...(legacyData || []), ...mappedNbData];
  
  return allInvoices.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

export const useInvoices = () => {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<Invoice[], Error>({
    queryKey: ['invoices', userId],
    queryFn: () => fetchInvoices(userId!),
    enabled: !!userId,
  });
};