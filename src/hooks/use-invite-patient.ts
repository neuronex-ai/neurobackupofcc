import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/SessionContextProvider';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getUserFacingErrorMessage } from '@/lib/user-facing-error';

export interface InviteOptions {
  paymentType: string;
  price?: number;
  channel?: 'whatsapp' | 'email';
}

export const useInvitePatient = () => {
  const { session } = useAuth();

  return useMutation({
    mutationFn: async ({ patientId, options }: { patientId: string, options: InviteOptions }) => {
      const { data: patient, error: pError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (pError || !patient) throw new Error('Paciente não encontrado.');

      const authCode = Math.random().toString(36).substring(2, 7).toUpperCase();
      const token = crypto.randomUUID();

      const { data: appointment, error: dbError } = await supabase
        .from('appointments')
        .insert({
          patient_id: patient.id,
          user_id: session?.user?.id,
          status: 'pending',
          type: 'online',
          token,
          auth_code: authCode,
          price: options.paymentType === 'charge' ? options.price : null,
          payment_config: { type: options.paymentType },
          notes: `Convite enviado via ${options.channel === 'whatsapp' ? 'WhatsApp' : 'E-mail'}.`,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      if (options.channel === 'email') {
        if (!patient.email) throw new Error('E-mail do paciente não cadastrado.');

        const { error: fnError } = await supabase.functions.invoke('send-patient-invite-safe', {
          body: {
            appointmentId: appointment.id,
            patientEmail: patient.email,
            patientName: patient.name,
            psychologistName: session?.user?.user_metadata?.full_name || 'Seu Psicólogo',
            authCode,
            token,
            frontendUrl: window.location.origin,
            channel: 'email',
          },
        });

        if (fnError) {
          console.error('Erro detalhado da Edge Function:', fnError);
          const details = (fnError as any).context?.message || fnError.message;
          throw new Error('Falha ao enviar e-mail: ' + details);
        }
      }

      return { ...appointment, authCode, token, patientPhone: patient.phone, patientName: patient.name };
    },
    onSuccess: () => undefined,
    onError: (error) => {
      console.error(error);
      toast.error(getUserFacingErrorMessage(error, 'generic'));
    },
  });
};
