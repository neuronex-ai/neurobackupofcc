import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { token, action, newStartTime, newEndTime, cancellation_reason } = await req.json()
    if (!token) throw new Error('Token obrigatório');

    // 1. Validar Token e Buscar Agendamento
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);

    let appointment: any = null;

    // Try finding in appointments table first
    let query = supabaseClient.from('appointments').select('*');
    if (isUUID) {
      query = query.or(`token.eq.${token},id.eq.${token}`);
    } else {
      query = query.eq('token', token);
    }
    const { data: directApp } = await query.maybeSingle();
    appointment = directApp;

    // Try finding in dedicated tokens table if not found
    if (!appointment && isUUID) {
      const { data: tokenData } = await supabaseClient
        .from('appointment_confirmation_tokens')
        .select('appointment_id, expires_at')
        .eq('token', token)
        .maybeSingle();

      if (tokenData) {
        // Expiration check
        if (new Date() > new Date(tokenData.expires_at)) {
          throw new Error('O link de confirmação expirou.');
        }

        const { data: relApp } = await supabaseClient
          .from('appointments')
          .select('*')
          .eq('id', tokenData.appointment_id)
          .maybeSingle();
        appointment = relApp;
      }
    }

    if (!appointment) {
      throw new Error('Token inválido ou agendamento não encontrado.');
    }

    // 2. Executar Ação
    // Check for conflicts ONLY if rescheduling (confirm doesn't change time)
    if (action === 'reschedule') {
      if (!newStartTime || !newEndTime) throw new Error('Novos horários são obrigatórios para reagendamento.');

      const checkStart = new Date(newStartTime);
      const checkEnd = new Date(newEndTime);

      const { data: conflicts } = await supabaseClient
        .from('appointments')
        .select('id')
        .eq('user_id', appointment.user_id)
        .neq('id', appointment.id)
        .neq('status', 'cancelled')
        .lt('start_time', checkEnd.toISOString())
        .gt('end_time', checkStart.toISOString());

      if (conflicts && conflicts.length > 0) {
        console.log('Conflict detected with IDs:', conflicts.map(c => c.id));
        throw new Error("O horário selecionado conflita com outro agendamento. Escolha outro horário.");
      }
    }

    let updates: any = {};
    let notificationTitle = '';
    let notificationMsg = '';

    // Fetch patient name separately to be safe
    const { data: patient } = await supabaseClient
      .from('patients')
      .select('name')
      .eq('id', appointment.patient_id)
      .maybeSingle();
    const patientName = patient?.name || 'Um paciente';

    if (action === 'confirm') {
      updates = { status: 'confirmed' };
      notificationTitle = '✅ Consulta Confirmada';
      notificationMsg = `${patientName} confirmou a presença para ${new Date(appointment.start_time).toLocaleDateString('pt-BR')}.`;
    } else if (action === 'cancel') {
      updates = { status: 'cancelled' };
      notificationTitle = '❌ Consulta Cancelada';
      notificationMsg = `${patientName} cancelou o agendamento.${cancellation_reason ? ` Motivo: ${cancellation_reason}` : ''}`;
    } else if (action === 'reschedule') {
      // newStartTime/newEndTime already validated above
      updates = {
        status: 'pending', // Set to pending so psychologist can confirm the new time
        start_time: newStartTime,
        end_time: newEndTime
      };
      const dateStr = new Date(newStartTime).toLocaleDateString('pt-BR');
      const timeStr = new Date(newStartTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      notificationTitle = '🗓️ Consulta Reagendada pelo Paciente';
      notificationMsg = `${patientName} reagendou para ${dateStr} às ${timeStr}. Confirme a alteração na agenda.`;
    }

    // 3. Update Appointment
    const { error: updateError } = await supabaseClient
      .from('appointments')
      .update(updates)
      .eq('id', appointment.id);

    if (updateError) throw updateError;

    // 4. Create Notification
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: appointment.user_id,
        type: 'appointment_update',
        title: notificationTitle,
        message: notificationMsg,
        read: false,
      });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})