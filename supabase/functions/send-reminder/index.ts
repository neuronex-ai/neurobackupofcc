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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing auth header')
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { appointmentId, method } = await req.json();
    if (!appointmentId || !method || !['email', 'whatsapp'].includes(method)) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from('appointments')
      .select(`
        *,
        patients (
          name,
          email,
          phone
        )
      `)
      .eq('id', appointmentId)
      .eq('user_id', user.id)
      .single();

    if (appointmentError || !appointment) {
      return new Response(JSON.stringify({ error: 'Appointment not found or access denied' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'http://localhost:8080';
    const meetLink = appointment.google_meet_link || `${FRONTEND_URL}/join/${appointment.id}`;

    const event_type = `reminder.${method}`;
    const payload = {
      appointment_id: appointment.id,
      patient_name: appointment.patients.name,
      patient_email: appointment.patients.email,
      patient_phone: appointment.patients.phone,
      start_time: appointment.start_time,
      meet_link: meetLink,
      psychologist_id: user.id,
    };

    const { error: rpcError } = await supabaseAdmin.rpc('trigger_webhook', {
      event_type_param: event_type,
      payload_param: payload,
    });

    if (rpcError) {
      throw rpcError;
    }

    return new Response(JSON.stringify({ message: `Webhook for ${event_type} triggered successfully.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})