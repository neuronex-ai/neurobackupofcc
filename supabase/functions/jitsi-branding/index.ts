import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Configurações visuais para combinar com o tema Dark/NeuroNex
    // Você pode adicionar URLs de logo aqui se tiver links públicos
    const brandingConfig = {
      backgroundColor: '#050505',
      backgroundImageUrl: '', // Opcional: URL de imagem de fundo
      logoImageUrl: '', // Opcional: URL do logo
      
      // Cores da interface
      interfaceConfigOverwrite: {
        DEFAULT_BACKGROUND: '#050505',
        DEFAULT_LOCAL_DISPLAY_NAME: 'Eu',
        DEFAULT_REMOTE_DISPLAY_NAME: 'Participante',
        // Tenta forçar configurações visuais para esconder elementos
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        SHOW_POWERED_BY: false,
      }
    };

    return new Response(JSON.stringify(brandingConfig), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})