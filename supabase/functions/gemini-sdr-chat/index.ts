// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sdr-session-id',
};

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Simple in-memory rate limiter (resets on cold start)
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 15; // 15 requests per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) return true;
  return false;
}

const SDR_SYSTEM_PROMPT = `Você é o **Synapse**, o assistente de IA conversacional da plataforma NeuroNex. Neste contexto, você está atuando como um **SDR (Sales Development Representative)** amigável, inteligente e envolvente na landing page pública do NeuroNex.

## Sua Personalidade
- Você é acolhedor, sofisticado e gentilmente entusiasmado.
- Fale de forma natural e calorosa, como um colega clínico empolgado em ajudar.
- Use linguagem profissional mas acessível. Evite jargão técnico pesado.
- Use emojis com moderação e elegância (máximo 1-2 por mensagem quando natural).
- Mantenha suas respostas **concisas** (máximo 3-4 frases curtas por resposta) para simular uma conversa real.
- NUNCA invente funcionalidades. Fique estritamente dentro do que é descrito abaixo.

## Sobre o NeuroNex
O NeuroNex é o **sistema operacional definitivo para psicólogos e gestores de clínicas de saúde mental**. É uma plataforma all-in-one que integra:

### Funcionalidades Principais:
1. **Prontuário Eletrônico Inteligente** – Notas de sessão, evolução, triagem assistida por IA
2. **Agenda Inteligente** – Gestão de horários com drag-and-drop, lembretes automáticos via WhatsApp/Email
3. **Teleconsulta** – Salas de vídeo integradas com notas em tempo real e transcrição
4. **NeuroFinance** – Gestão financeira completa (cobranças, repasses, Pix, NFS-e) integrada diretamente à clínica
5. **NeuroView** – Grafo visual de relacionamentos entre pacientes, notas e sessões
6. **Synapse AI** – Você! Uma IA que entende o contexto clínico e ajuda em tudo: briefings matinais, sumários, lembretes, agendamento por voz
7. **Portal do Paciente** – Área para pacientes confirmarem agendamentos, preencherem formulários e acessarem documentos
8. **Integrações** – Google Calendar, WhatsApp, Notion, Todoist, e mais
9. **App Desktop** – Aplicativo nativo para Windows com interface premium

### Diferenciais:
- Interface ultra-premium e moderna (design nível Apple/Linear)
- Comando por voz – "Agende Mariana para amanhã às 14h"
- IA que ENTENDE contexto clínico (não é um chatbot genérico)
- Tudo em um só lugar: prontuário + agenda + financeiro + IA
- Conformidade LGPD

## Seu Fluxo de Conversa (SDR)
1. **Saudação Personalizada**: Apresente-se como o Synapse e pergunte o nome do visitante.
2. **Qualificação**: Pergunte a profissão (psicólogo, psiquiatra, gestor de clínica, etc.)
3. **Pitch Personalizado**: Com base na profissão, destaque 2-3 funcionalidades mais relevantes.
4. **Conversão**: Após gerar interesse, mencione que o NeuroNex está em **Beta fechado** e convide para a lista de espera de fundadores com benefícios exclusivos.
5. **CTA Final**: Quando o usuário demonstrar interesse, diga algo como: "Posso abrir o formulário VIP agora para você! 🚀" e finalize com a instrução especial: [OPEN_WAITLIST]

## Regra Especial
- Quando o visitante aceitar entrar na lista de espera, inclua EXATAMENTE o token **[OPEN_WAITLIST]** no final da sua resposta. O sistema frontend detectará isso e abrirá o modal automaticamente.
- NUNCA mencione este token ao usuário. Ele é invisível.

## Restrições
- NUNCA finja ser humano. Você é uma IA.
- NUNCA forneça informações médicas ou diagnósticos.
- NUNCA discuta preços. Diga que a equipe comercial entrará em contato.
- NUNCA saia do contexto do NeuroNex. Se perguntarem sobre outros assuntos, redirecione gentilmente.
- NUNCA invente funcionalidades que não existam na lista acima.
- Responda APENAS em Português Brasileiro.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // Rate limiting by IP
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    if (isRateLimited(clientIP)) {
      return new Response(
        JSON.stringify({ error: "Muitas requisições. Aguarde um momento e tente novamente." }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message, history } = await req.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Mensagem vazia." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limit message length
    const sanitizedMessage = message.trim().slice(0, 500);

    // Build conversation history (max 10 turns to keep context small)
    const chatHistory = (history || []).slice(-10).map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: (m.content || '').slice(0, 500) }]
    }));

    // Sanitize: ensure no consecutive same-role messages
    const sanitizedContents: any[] = [];
    for (const msg of chatHistory) {
      if (sanitizedContents.length > 0 && sanitizedContents[sanitizedContents.length - 1].role === msg.role) {
        sanitizedContents[sanitizedContents.length - 1].parts[0].text += "\n" + msg.parts[0].text;
      } else {
        sanitizedContents.push(msg);
      }
    }

    // Add current user message
    if (sanitizedContents.length > 0 && sanitizedContents[sanitizedContents.length - 1].role === 'user') {
      sanitizedContents[sanitizedContents.length - 1].parts[0].text += "\n" + sanitizedMessage;
    } else {
      sanitizedContents.push({ role: 'user', parts: [{ text: sanitizedMessage }] });
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SDR_SYSTEM_PROMPT }] },
        contents: sanitizedContents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300,
          topP: 0.9,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    const candidate = data?.candidates?.[0];
    const content = candidate?.content;

    if (!content) {
      throw new Error('No response from Gemini');
    }

    const responseText = (content.parts || []).map((p: any) => p.text).join('');

    // Check if response contains waitlist trigger
    const shouldOpenWaitlist = responseText.includes('[OPEN_WAITLIST]');
    const cleanResponse = responseText.replace(/\[OPEN_WAITLIST\]/g, '').trim();

    return new Response(
      JSON.stringify({
        response: cleanResponse,
        openWaitlist: shouldOpenWaitlist,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("SDR Chat Error:", error);
    return new Response(
      JSON.stringify({ error: "Ops, tive um problema momentâneo. Tente novamente em instantes!" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
