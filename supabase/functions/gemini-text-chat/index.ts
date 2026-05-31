// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

import { corsHeaders, GEMINI_API_URL } from "./config.ts";
import { tools } from "./tools-def.ts";
import { generateSystemPrompt } from "./prompt-gen.ts";
import { executeTool } from "./tools-exec.ts";
import { generateEmbedding } from "./embeddings.ts";

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
        } catch (e) {
            payload = {};
        }

        let { message, sessionId: _sessionId, session_id, context, professional_id, channel, source, remote_jid, attachments } = payload;

        let sessionId = session_id || _sessionId;

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
            // Internal call from Gateway (bypasses JWT)
            const { data: adminUser, error } = await supabaseAdmin.auth.admin.getUserById(professional_id);
            if (error || !adminUser.user) throw new Error('Profissional não encontrado');
            user = adminUser.user;
            // Use admin client but tools will scope by explicit user.id
            supabaseUser = supabaseAdmin;
        } else {
            // Standard JWT auth
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
            } else {
                // Auto-create chat_session and binding for whatsapp
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

        // 1. Gerar Embedding da mensagem do usuário (Memória de Longo Prazo)
        const userEmbedding = await generateEmbedding(message, geminiKey);

        // 2. Buscar Memórias Relevantes (RAG Global)
        let relevantMemoriesText = "";
        if (userEmbedding && userEmbedding.length > 0) {
            const { data: memories } = await supabaseAdmin.rpc('match_messages_gemini', {
                query_embedding: userEmbedding,
                match_threshold: 0.60, // Limite de similaridade
                match_count: 5
            });

            if (memories && memories.length > 0) {
                const memoryList = memories.map((m: any) => {
                    const date = new Date(m.created_at).toLocaleDateString('pt-BR');
                    return `- [${date}] (${m.role}): ${m.content}`;
                }).join('\n');
                relevantMemoriesText = `\n\n=== MEMÓRIAS GLOBAIS RELEVANTES ===\nUse estas informações de conversas passadas para manter o contexto, mas priorize o contexto atual se houver conflito.\n${memoryList}\n==============================\n`;
            }
        }

        // 3. Salvar msg usuário com Embedding e UserID
        // Nota: O embedding pode ser null se falhar, o DB aceita (se não definimos not null, a migration default é nullable)
        const { error: userMsgError } = await supabaseAdmin.from('messages').insert([{
            user_id: user.id,
            content: message,
            role: 'user',
            session_id: sessionId,
            embedding: userEmbedding && userEmbedding.length > 0 ? userEmbedding : null,
            attachments: attachments && attachments.length > 0 ? attachments : null
        }]);

        if (userMsgError) {
            console.error("Erro Crítico ao salvar mensagem do usuário:", userMsgError);
        }

        // 4. Gerar System Prompt Base
        let systemPromptText = await generateSystemPrompt(supabaseAdmin, user, context);

        // Injetar Memórias no System Prompt
        if (relevantMemoriesText) {
            systemPromptText += relevantMemoriesText;
        }

        // 5. Recuperar Histórico Recente da Sessão Atual (Short-term memory)
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

        // 6. Loop Gemini (ReAct)
        let contents = [...chatHistory, { role: 'user', parts: [{ text: message }] }];

        // Sanitize
        const sanitizedContents: any[] = [];
        for (const msg of contents) {
            if (sanitizedContents.length > 0 && sanitizedContents[sanitizedContents.length - 1].role === msg.role) {
                const lastMsg = sanitizedContents[sanitizedContents.length - 1];
                lastMsg.parts[0].text += "\n\n" + msg.parts[0].text;
            } else {
                sanitizedContents.push(msg);
            }
        }
        contents = sanitizedContents;

        let finalResponseText = "";
        let finalClientAction = null;

        for (let i = 0; i < 5; i++) {
            const response = await fetch(`${GEMINI_API_URL}?key=${geminiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: systemPromptText }] },
                    contents: contents,
                    tools: tools,
                    generationConfig: { temperature: 0.4 }
                }),
            });

            const data = await response.json();
            
            if (data.error) {
                console.error("Gemini API Error in ReAct loop:", data.error);
                throw new Error(`Erro na API da IA: ${data.error.message || JSON.stringify(data.error)}`);
            }

            const candidate = data?.candidates?.[0];
            const content = candidate?.content;

            if (!content) break;

            const parts = content.parts || [];
            const functionCall = parts.find((p: any) => p.functionCall);

            if (functionCall) {
                const { name, args } = functionCall.functionCall;
                console.log(`[AI] Calling tool: ${name}`, args);

                const { result, structuredData } = await executeTool(name, args, { supabaseUser, supabaseAdmin, user });

                if (structuredData) finalClientAction = structuredData;

                contents.push(content);
                contents.push({
                    role: 'function',
                    parts: [{ functionResponse: { name: name, response: { name: name, content: result } } }]
                });
            } else {
                finalResponseText = parts.map((p: any) => p.text).join('');
                break;
            }
        }

        if (!finalResponseText && finalClientAction) {
            finalResponseText = "Ação preparada. Confira o widget abaixo.";
        }
        
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

        // 7. Salvar resposta (com embedding para memória futura)
        if (finalResponseText) {
            const responseEmbedding = await generateEmbedding(finalResponseText, geminiKey);
            const { error: assistantMsgError } = await supabaseAdmin.from('messages').insert([{
                user_id: user.id,
                content: finalResponseText,
                role: 'assistant',
                session_id: sessionId,
                embedding: responseEmbedding && responseEmbedding.length > 0 ? responseEmbedding : null
            }]);

            if (assistantMsgError) {
                console.error("Erro Crítico ao salvar mensagem do Synapse:", assistantMsgError);
            }
        }

        // 8. Retorno
        return new Response(JSON.stringify({ response: finalResponseText, clientAction: finalClientAction }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error("Gemini Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});