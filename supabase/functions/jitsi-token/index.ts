import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import * as jose from 'https://deno.land/x/jose@v5.2.4/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const JITSI_APP_ID = Deno.env.get('JITSI_APP_ID');
    const JITSI_PRIVATE_KEY = Deno.env.get('JITSI_PRIVATE_KEY');
    const JITSI_KEY_ID = Deno.env.get('JITSI_KEY_ID');

    if (!JITSI_APP_ID || !JITSI_PRIVATE_KEY || !JITSI_KEY_ID) {
      throw new Error("Credenciais Jitsi (JITSI_APP_ID, JITSI_PRIVATE_KEY, JITSI_KEY_ID) não configuradas no servidor.");
    }

    const { roomName, userName, userEmail, avatarUrl } = await req.json();
    if (!roomName || !userName || !userEmail) {
      throw new Error("Dados do usuário e da sala são obrigatórios.");
    }

    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 60 * 60 * 3; // 3 horas de validade

    const privateKey = await jose.importPKCS8(JITSI_PRIVATE_KEY, 'RS256');

    // Corrected 'kid' format for 8x8 Jitsi VpaaS
    const kid = `${JITSI_APP_ID}/${JITSI_KEY_ID}`;

    const token = await new jose.SignJWT({
      context: {
        user: {
          id: userEmail,
          name: userName,
          avatar: avatarUrl || '',
          email: userEmail,
        },
        features: {
          livestreaming: false,
          recording: true,
          transcription: true,
          "outbound-call": false,
        },
      },
      aud: "jitsi",
      iss: "chat",
      sub: JITSI_APP_ID,
      room: roomName,
      exp: exp,
      nbf: iat,
    })
    .setProtectedHeader({ alg: 'RS256', kid: kid }) // Use the corrected kid
    .sign(privateKey);

    return new Response(JSON.stringify({ token }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (e: any) {
    console.error("Erro ao gerar token Jitsi:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});