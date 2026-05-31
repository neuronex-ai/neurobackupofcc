import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Default working hours if not set by psychologist
const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 20;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, date, excludeAppointmentId } = await req.json()

    if (!userId || !date) {
      throw new Error("userId and date are required.");
    }

    // Parse date string
    const dateObj = new Date(date);
    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Fetch busy slots (existing appointments that are not cancelled)
    let query = supabaseClient
      .from('appointments')
      .select('start_time, end_time, id')
      .eq('user_id', userId)
      .neq('status', 'cancelled')
      .gte('start_time', startOfDay.toISOString())
      .lt('start_time', endOfDay.toISOString());

    if (excludeAppointmentId) {
      query = query.neq('id', excludeAppointmentId);
    }

    const { data: busySlots, error: busyError } = await query;

    if (busyError) throw busyError;

    // 2. Try to fetch working hours from the profile (if available)
    // Fields: working_start_hour, working_end_hour, working_days (array of 0-6)
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('working_start_hour, working_end_hour, working_days')
      .eq('id', userId)
      .maybeSingle();

    const workingHours = {
      startHour: profile?.working_start_hour ?? DEFAULT_START_HOUR,
      endHour: profile?.working_end_hour ?? DEFAULT_END_HOUR,
      // Default: Mon-Fri (1-5), Sat (6), Sun (0) are excluded by default
      workingDays: profile?.working_days ?? [1, 2, 3, 4, 5]
    };

    return new Response(
      JSON.stringify({ busySlots: busySlots || [], workingHours }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error in get-public-availability:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})