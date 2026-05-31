import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SignJWT, importPKCS8 } from "https://deno.land/x/jose@v4.14.4/index.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const JITSI_APP_ID = Deno.env.get("JITSI_APP_ID");
    const JITSI_PRIVATE_KEY = Deno.env.get("JITSI_PRIVATE_KEY");
    const JITSI_KEY_ID = Deno.env.get("JITSI_KEY_ID");

    if (!JITSI_APP_ID || !JITSI_PRIVATE_KEY || !JITSI_KEY_ID) {
      throw new Error("Configuração do servidor incompleta (Missing Env Vars).");
    }

    const { user } = await req.json();

    // Importa a chave privada usando 'jose', que lida bem com PKCS#8
    const privateKey = await importPKCS8(JITSI_PRIVATE_KEY, 'RS256');

    // Configuração de Kid e Tempos
    const now = Math.floor(Date.now() / 1000);
    
    // Garante o formato correto do kid: AppID/KeyID
    let kid = JITSI_KEY_ID;
    if (!kid.includes("/")) {
      kid = `${JITSI_APP_ID}/${JITSI_KEY_ID}`;
    }

    const payload = {
      context: {
        user: {
          id: user?.id || 'guest',
          name: user?.name || 'NeuroNex User',
          email: user?.email || '',
          avatar: user?.avatar || '',
          moderator: true
        },
        features: {
          "recording": true,
          "transcription": true,
          "livestreaming": true,
          "screen-sharing": true,
          "outbound-call": true,
          "sip-outbound-call": true
        }
      },
      room: "*"
    };

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid })
      .setIssuedAt()
      .setIssuer('chat')
      .setAudience('jitsi')
      .setSubject(JITSI_APP_ID)
      .setExpirationTime('2h')
      .setNotBefore(now - 10)
      .sign(privateKey);

    return new Response(JSON.stringify({ token }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Erro ao gerar token Jitsi:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});