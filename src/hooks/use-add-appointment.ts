import { useAuth } from '@/components/auth/SessionContextProvider';
import { buildEventMetadata, getAppointmentMetadata, type AppointmentMetadata } from '@/lib/appointment-metadata';
import { supabase } from '@/integrations/supabase/client';
import { Appointment, Patient } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getUserFacingErrorMessage } from '@/lib/user-facing-error';
import { createAppointmentFinancialEntryIfEnabled } from '@/lib/financial-appointment-automation';
import { edgeFunctionUrl } from '@/lib/supabase-config';

interface NewAppointmentData {
  id?: string;
  patient_id: string | null;
  start_time: Date;
  end_time: Date;
  type: 'presencial' | 'online' | 'block';
  notes: string;
  location: string | null;
  metadata?: AppointmentMetadata;
}

const GOOGLE_CALENDAR_SYNC_URL = edgeFunctionUrl("google-calendar-sync");

const toLogMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return 'Erro sem detalhes serializaveis.';
  }
};

const syncAppointmentToGoogle = async (
  appointment: Partial<Appointment>,
  patient: Partial<Patient>,
  accessToken: string
) => {
  const response = await fetch(GOOGLE_CALENDAR_SYNC_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ appointment, patient }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.details || "Falha ao sincronizar com o Google Calendar.");
  }

  return response.json();
};

const resolveMetadata = (appointmentData: NewAppointmentData): AppointmentMetadata => {
  if (appointmentData.metadata) return appointmentData.metadata;

  if (appointmentData.type === 'block' && !appointmentData.patient_id) {
    return buildEventMetadata({
      title: appointmentData.notes || 'Compromisso',
      location: appointmentData.location,
      notes: appointmentData.notes,
      syncStatus: 'pending',
    });
  }

  return getAppointmentMetadata({
    ...appointmentData,
    patient_id: appointmentData.patient_id,
    start_time: appointmentData.start_time.toISOString(),
    end_time: appointmentData.end_time.toISOString(),
  } as Appointment);
};

const addAppointment = async (appointmentData: NewAppointmentData, userId: string, accessToken: string) => {
  const appointmentId = appointmentData.id || crypto.randomUUID();
  const frontendOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://neuronexai.com.br';
  const teleconsultationLink = appointmentData.type === 'online'
    ? `${frontendOrigin}/join/${appointmentId}`
    : null;

  const { data: hasConflict, error: conflictError } = await supabase.rpc('check_appointment_overlap', {
    p_user_id: userId,
    p_start_time: appointmentData.start_time.toISOString(),
    p_end_time: appointmentData.end_time.toISOString(),
  });

  if (conflictError) throw new Error(conflictError.message);
  if (hasConflict) {
    throw new Error("Conflito de horario detectado. Ja existe um agendamento neste periodo.");
  }

  const metadata = resolveMetadata(appointmentData);
  const shouldSyncToGoogle = metadata.kind !== 'block';
  let patientData: Partial<Patient> = {
    name: metadata.kind === 'event' ? metadata.eventTitle || "Compromisso" : "Bloqueio de Agenda",
  };
  let googleEventId: string | null = null;
  let googleMeetLink: string | null = null;

  if (appointmentData.patient_id) {
    const { data: fetchedPatient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', appointmentData.patient_id)
      .single();

    if (patientError || !fetchedPatient) {
      throw new Error("Paciente nao encontrado.");
    }

    patientData = fetchedPatient;
  }

  if (shouldSyncToGoogle) {
    try {
      toast.info("Sincronizando com o Google Calendar...");
      const syncResult = await syncAppointmentToGoogle(
        {
          ...appointmentData,
          metadata,
          id: appointmentId,
          user_id: userId,
          created_at: new Date().toISOString(),
          status: 'unscored',
          patient_name: patientData.name,
        } as unknown as Appointment,
        patientData,
        accessToken
      );

      googleEventId = syncResult.googleEventId || null;
      googleMeetLink = syncResult.googleMeetLink || null;
      toast.success("Agendamento sincronizado com Google Calendar!");
    } catch (e: unknown) {
      console.warn("Google Sync Failed:", toLogMessage(e));
      metadata.syncStatus = 'failed';
      toast.warning(`Agendamento criado, mas falha na sincronizacao com Google: ${toLogMessage(e)}`);
    }
  }

  const { data: newAppointment, error: appointmentError } = await supabase
    .from('appointments')
    .insert({
      id: appointmentId,
      user_id: userId,
      patient_id: appointmentData.patient_id,
      start_time: appointmentData.start_time.toISOString(),
      end_time: appointmentData.end_time.toISOString(),
      type: appointmentData.type,
      notes: appointmentData.notes || null,
      location: appointmentData.location || null,
      status: 'unscored',
      metadata: {
        ...metadata,
        origin: metadata.origin || 'neuronex',
        syncStatus: googleEventId ? 'synced' : metadata.syncStatus || 'pending',
        lastSyncedAt: googleEventId ? new Date().toISOString() : metadata.lastSyncedAt,
        ...(appointmentData.type === 'online'
          ? { teleconsultationRoom: { status: 'waiting' } }
          : {}),
      },
      google_event_id: googleEventId,
      google_meet_link: teleconsultationLink || googleMeetLink,
    })
    .select()
    .single();

  if (appointmentError) {
    console.error(`Erro ao adicionar agendamento: ${toLogMessage(appointmentError)}`);
    throw new Error(appointmentError.message);
  }

  try {
    await createAppointmentFinancialEntryIfEnabled(
      newAppointment as Appointment,
      userId,
      patientData.name
    );
  } catch (financialError) {
    console.warn(`[useAddAppointment] Agendamento criado, mas a automacao financeira nao foi aplicada: ${toLogMessage(financialError)}`);
  }

  return { newAppointment, patientData };
};

export const useAddAppointment = () => {
  const queryClient = useQueryClient();
  const { session, user } = useAuth();
  const userId = user?.id;
  const accessToken = session?.access_token;

  return useMutation({
    mutationFn: (data: NewAppointmentData) => {
      if (!userId || !accessToken) throw new Error("Usuario nao autenticado ou sessao invalida.");
      return addAppointment(data, userId, accessToken);
    },
    onSuccess: ({ newAppointment, patientData }) => {
      if (newAppointment.metadata?.kind === 'event') {
        toast.success("Compromisso registrado com sucesso!");
      } else if (patientData.name !== "Bloqueio de Agenda") {
        toast.success(`Consulta para ${patientData.name} agendada com sucesso!`);
      } else {
        toast.success("Bloqueio de horario criado.");
      }
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointmentsByDateRange'] });
      queryClient.invalidateQueries({ queryKey: ['financialEntries'] });
      queryClient.invalidateQueries({ queryKey: ['patientTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['financialMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['advancedCashFlow'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-session-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-activities'] });
    },
    onError: (error) => {
      console.error(`[useAddAppointment] Falha ao criar agendamento: ${toLogMessage(error)}`);
      toast.error(getUserFacingErrorMessage(error, 'save'));
    }
  });
};
