// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

import { corsHeaders, GEMINI_API_URL } from "./config.ts";
import { tools } from "./tools-def.ts";
import { generateSystemPrompt } from "./prompt-gen.ts";
import { executeTool } from "./tools-exec.ts";
import { generateEmbedding } from "./embeddings.ts";
import { generateGroqFallback } from "./provider-fallback.ts";

const buildWhatsAppContext = (context: any, channel?: string, source?: any, remoteJid?: string) => {
    if (channel !== 'whatsapp') return context || {};

    return {
        ...(context || {}),
        currentContext: context?.currentContext || 'synapse',
        route: context?.route || 'whatsapp',
        source: context?.source || 'whatsapp',
        channel: 'whatsapp',
        remoteJid: remoteJid || source?.remote_jid || null,
        instanceName: source?.instance_name || context?.instanceName || null,
        pushName: source?.push_name || context?.pushName || null,
    };
};

const compactMemoryContent = (content: string, maxLength = 700) => {
    const clean = String(content || "")
        .replace(/```json\s+synapse_widget[\s\S]*?```/gi, "[widget Synapse]")
        .replace(/\s+/g, " ")
        .trim();
    return clean.length > maxLength ? `${clean.slice(0, maxLength)}...` : clean;
};

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const geminiKey = Deno.env.get('GEMINI_API_KEY')!;

        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

        const internalSecret = req.headers.get('x-internal-synapse-secret');
        const envInternalSecret = Deno.env.get('SYNAPSE_INTERNAL_SECRET');

        let payload;
        try {
            payload = await req.json();
        } catch (_e) {
            payload = {};
        }

        let { message, sessionId: _sessionId, session_id, context, professional_id, channel, source, remote_jid, attachments } = payload;

        let sessionId = session_id || _sessionId;
        context = buildWhatsAppContext(context, channel, source, remote_jid);

        let user;
        let supabaseUser;

        const authHeader = req.headers.get('Authorization');

        if (internalSecret) {
            if (internalSecret !== envInternalSecret) {
                return new Response(JSON.stringify({ error: "Unauthorized Internal Gateway" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
            if (!professional_id) {
                return new Response(JSON.stringify({ error: "professional_id is required for internal calls" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
            const { data: adminUser, error } = await supabaseAdmin.auth.admin.getUserById(professional_id);
            if (error || !adminUser.user) throw new Error('Profissional não encontrado');
            user = adminUser.user;
            supabaseUser = supabaseAdmin;
        } else {
            if (!authHeader) {
                return new Response(JSON.stringify({ error: "Token ausente e header interno nao fornecido" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
            const jwt = authHeader.replace('Bearer ', '');
            supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
                global: { headers: { Authorization: `Bearer ${jwt}` } }
            });

            const { data: authData } = await supabaseUser.auth.getUser();
            if (!authData?.user) throw new Error('Token inválido');
            user = authData.user;
        }

        if (channel === 'whatsapp') {
            const actualRemoteJid = remote_jid || (source && source.remote_jid);

            if (!professional_id || !actualRemoteJid) {
                return new Response(JSON.stringify({ error: "Dados insuficientes para criar sessão do WhatsApp (professional_id ou remote_jid ausente)." }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            const channelSessionId = `whatsapp:${professional_id}:${actualRemoteJid}`;

            const { data: binding } = await supabaseAdmin
                .from('synapse_channel_bindings')
                .select('id')
                .eq('session_id', channelSessionId)
                .single();

            if (binding) {
                const synapseConversationId = binding.id;
                sessionId = synapseConversationId;

                await supabaseAdmin
                    .from('synapse_channel_bindings')
                    .update({
                        push_name: source?.push_name || null,
                        instance_name: source?.instance_name || null,
                        last_seen_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', synapseConversationId);
            } else {
                const synapseConversationId = crypto.randomUUID();
                const displayName = (source && source.push_name) ? source.push_name : actualRemoteJid;
                const title = `WhatsApp: ${displayName}`;

                const { error: chatSessionError } = await supabaseAdmin
                    .from("chat_sessions")
                    .insert({
                        id: synapseConversationId,
                        user_id: professional_id,
                        title: title
                    });

                if (chatSessionError) {
                    console.error("Erro ao criar chat_session:", chatSessionError);
                    throw new Error(`Erro ao criar chat_session: ${chatSessionError.message}`);
                }

                const { error: bindingError } = await supabaseAdmin
                    .from("synapse_channel_bindings")
                    .insert({
                        id: synapseConversationId,
                        professional_id: professional_id,
                        channel: channel,
                        external_user_id: actualRemoteJid,
                        session_id: channelSessionId,
                        instance_name: source?.instance_name || null,
                        push_name: source?.push_name || null
                    });

                if (bindingError) {
                    console.error("Erro ao criar synapse_channel_bindings:", bindingError);
                    throw new Error(`Erro ao criar binding: ${bindingError.message}`);
                }

                sessionId = synapseConversationId;
            }
        }

        const userEmbedding = await generateEmbedding(message, geminiKey);

        let relevantMemoriesText = "";
        if (userEmbedding && userEmbedding.length > 0) {
            const { data: memories, error: memoryError } = await supabaseAdmin.rpc('match_messages_gemini_for_user', {
                target_user_id: user.id,
                query_embedding: userEmbedding,
                match_threshold: 0.60,
                match_count: 5
            });

            if (memoryError) console.error("Erro ao buscar memorias Synapse:", memoryError);

            if (memories && memories.length > 0) {
                const memoryList = memories.map((m: any) => {
                    const date = new Date(m.created_at).toLocaleDateString('pt-BR');
                    return `- [${date}] (${m.role}): ${m.content}`;
                }).join('\n');
                relevantMemoriesText = `\n\n=== MEMÓRIAS GLOBAIS RELEVANTES ===\nUse estas informações de conversas passadas para manter o contexto, mas priorize o contexto atual se houver conflito.\n${memoryList}\n==============================\n`;
            }
        }

        let recentMemoriesText = "";
        let recentQuery = supabaseAdmin
            .from('messages')
            .select('content, role, created_at, session_id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(12);

        if (sessionId) recentQuery = recentQuery.neq('session_id', sessionId);

        const { data: recentMemories, error: recentMemoryError } = await recentQuery;
        if (recentMemoryError) console.error("Erro ao buscar memorias recentes Synapse:", recentMemoryError);

        if (recentMemories && recentMemories.length > 0) {
            const recentList = recentMemories
                .reverse()
                .map((m: any) => {
                    const date = new Date(m.created_at).toLocaleString('pt-BR');
                    return `- [${date}] (${m.role}): ${compactMemoryContent(m.content)}`;
                })
                .join('\n');
            recentMemoriesText = `\n\n=== MEMORIA RECENTE ENTRE CANAIS ===\nUse estas mensagens recentes do mesmo profissional como memoria operacional, especialmente quando a pergunta for generica, como "lembra?", "reenvie", "o que falamos?" ou "continue". Nao afirme que nao lembra antes de verificar esta secao.\n${recentList}\n==============================\n`;
        }

        const { error: userMsgError } = await supabaseAdmin.from('messages').insert([{
            user_id: user.id,
            content: message,
            role: 'user',
            session_id: sessionId,
            embedding: userEmbedding && userEmbedding.length > 0 ? userEmbedding : null,
            attachments: attachments && attachments.length > 0 ? attachments : null
        }]);

        if (userMsgError) console.error("Erro Crítico ao salvar mensagem do usuário:", userMsgError);

        let systemPromptText = await generateSystemPrompt(supabaseAdmin, user, context);
        if (relevantMemoriesText) systemPromptText += relevantMemoriesText;
        if (recentMemoriesText) systemPromptText += recentMemoriesText;
        systemPromptText += `\n\n=== AÇÕES DE INTERFACE ===\nO aplicativo controla a navegação. Nunca escreva rotas, URLs, seletores, UUIDs ou caminhos internos na resposta ao usuário. Quando uma ferramenta preparar navegação, descreva apenas o resultado de forma humana.\n==============================\n`;

        const { data: history } = await supabaseAdmin
            .from('messages')
            .select('content, role')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: false })
            .limit(8);

        const chatHistory = (history || []).reverse().map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content || "" }]
        }));

        let contents = [...chatHistory, { role: 'user', parts: [{ text: message }] }];
        const sanitizedContents: any[] = [];
        for (const msg of contents) {
            if (sanitizedContents.length > 0 && sanitizedContents[sanitizedContents.length - 1].role === msg.role) {
                sanitizedContents[sanitizedContents.length - 1].parts[0].text += "\n\n" + msg.parts[0].text;
            } else {
                sanitizedContents.push(msg);
            }
        }
        contents = sanitizedContents;

        let finalResponseText = "";
        let finalClientAction = null;
        let responseProvider = "gemini";
        let responseModel = "gemini-2.5-flash-lite";

        for (let i = 0; i < 5; i++) {
            let response: Response | null = null;
            let data: any = null;

            try {
                response = await fetch(`${GEMINI_API_URL}?key=${geminiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        system_instruction: { parts: [{ text: systemPromptText }] },
                        contents,
                        tools,
                        generationConfig: { temperature: 0.4 }
                    }),
                });
                data = await response.json();
            } catch (providerError) {
                console.warn("Gemini transport failure, using fallback:", providerError);
            }

            if (!response?.ok || data?.error) {
                console.warn("Gemini unavailable, activating Groq fallback", data?.error || response?.status);
                const fallback = await generateGroqFallback({
                    systemPrompt: systemPromptText,
                    history: chatHistory,
                    message,
                });
                finalResponseText = fallback.text;
                responseProvider = fallback.provider;
                responseModel = fallback.model;
                break;
            }

            const candidate = data?.candidates?.[0];
            const content = candidate?.content;
            if (!content) break;

            const parts = content.parts || [];
            const functionCalls = parts.filter((part: any) => part.functionCall);

            if (functionCalls.length > 0) {
                contents.push(content);
                const responseParts: any[] = [];

                for (const functionPart of functionCalls) {
                    const { name, args, id } = functionPart.functionCall;
                    console.log(`[AI] Calling tool: ${name}`, args);

                    const { result, structuredData } = await executeTool(name, args, {
                        supabaseUser,
                        supabaseAdmin,
                        user,
                        sessionId,
                        channel,
                        source,
                        context,
                    });

                    if (structuredData) finalClientAction = structuredData;

                    const functionResponse: any = {
                        name,
                        response: { name, content: result },
                    };
                    const callId = id || functionPart.id;
                    if (callId) functionResponse.id = callId;
                    responseParts.push({ functionResponse });
                }

                contents.push({ role: 'function', parts: responseParts });
            } else {
                finalResponseText = parts.map((part: any) => part.text).join('');
                break;
            }
        }

        if (!finalResponseText && finalClientAction) finalResponseText = "Ação preparada. Confira o resultado na tela.";
        if (!finalResponseText && !finalClientAction) {
            finalResponseText = "Desculpe, tive um problema ao processar sua solicitação. Por favor, tente novamente de outra forma.";
        }

        if (finalClientAction) {
            const widgetPayload = {
                __actionType: finalClientAction.type,
                data: finalClientAction.data || finalClientAction.payload || null,
            };
            finalResponseText += `\n\n\`\`\`json synapse_widget\n${JSON.stringify(widgetPayload, null, 2)}\n\`\`\``;
        }

        if (finalResponseText) {
            const responseEmbedding = await generateEmbedding(finalResponseText, geminiKey);
            const { error: assistantMsgError } = await supabaseAdmin.from('messages').insert([{
                user_id: user.id,
                content: finalResponseText,
                role: 'assistant',
                session_id: sessionId,
                embedding: responseEmbedding && responseEmbedding.length > 0 ? responseEmbedding : null
            }]);

            if (assistantMsgError) console.error("Erro Crítico ao salvar mensagem do Synapse:", assistantMsgError);
        }

        return new Response(JSON.stringify({
            response: finalResponseText,
            clientAction: finalClientAction,
            session_id: sessionId,
            provider: responseProvider,
            model: responseModel,
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error("Synapse text error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});
