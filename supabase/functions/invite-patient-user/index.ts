import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing auth header');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) throw new Error('Invalid token');

    const { patientId } = await req.json();
    if (!patientId) throw new Error('Patient ID required');

    // 1. Buscar dados do paciente para confirmar que pertence ao psicólogo logado
    const { data: patient, error: patientError } = await supabaseAdmin
        .from('patients')
        .select('email, name, user_id')
        .eq('id', patientId)
        .eq('user_id', user.id) // Security check
        .single();

    if (patientError || !patient) throw new Error('Paciente não encontrado ou acesso negado.');
    if (!patient.email) throw new Error('Paciente não possui e-mail cadastrado.');

    // 2. Verificar se o usuário Auth já existe
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === patient.email);

    if (existingUser) {
        // Se já existe, enviamos um email de recuperação de senha (Magic Link)
        // Isso serve como um "re-convite" sem erro
        const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: patient.email,
        });
        
        // Nota: generateLink retorna o link, mas não envia o email automaticamente em algumas configs.
        // O método resetPasswordForEmail envia.
        await supabaseAdmin.auth.resetPasswordForEmail(patient.email, {
            redirectTo: `${Deno.env.get('FRONTEND_URL')}/portal?action=recovery`
        });
        
        return new Response(JSON.stringify({ message: 'Usuário já existia. E-mail de acesso reenviado.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // 3. Criar e Convidar Usuário
    const { data: authData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(patient.email, {
        data: { 
            name: patient.name,
            role: 'patient' 
        },
        redirectTo: `${Deno.env.get('FRONTEND_URL')}/portal?action=setup`
    });

    if (inviteError) throw inviteError;

    return new Response(JSON.stringify({ success: true, message: 'Convite enviado com sucesso!' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});