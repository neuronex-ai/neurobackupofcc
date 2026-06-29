const GEMINI_CHAT_URL = "https://krewdaklcyzqfxkkgvqr.supabase.co/functions/v1/gemini-text-chat";

export async function executeVoiceTool(
    toolName: string,
    params: Record<string, any>,
    accessToken: string,
    navigate: (path: string) => void,
): Promise<string> {
    console.log(`[Synapse Voice] Tool chamada: ${toolName}`, params);

    // Handle navigation locally (no backend needed)
    if (toolName === 'navigate_system') {
        const path = params.path?.startsWith('/') ? params.path : `/${params.path || 'dashboard'}`;
        navigate(path);
        return JSON.stringify({ success: true, message: `Navegação para ${path} realizada com sucesso.` });
    }

    try {
        // Route every other tool to the same Supabase Edge Function (gemini-text-chat)
        // We send a synthetic message that the Gemini backend interprets as a direct tool call
        const response = await fetch(GEMINI_CHAT_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `[VOICE_TOOL_CALL] ${toolName}: ${JSON.stringify(params)}`,
                sessionId: null, // Stateless for voice tools
                attachments: [],
                context: {
                    route: 'voice',
                    source: 'synapse-voice',
                    voiceToolCall: {
                        name: toolName,
                        parameters: params,
                    },
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Synapse Voice] Erro HTTP ${response.status}:`, errorText);
            return JSON.stringify({ success: false, error: `Erro ao executar ${toolName}` });
        }

        const data = await response.json();
        console.log(`[Synapse Voice] Resultado ${toolName}:`, data);

        // Return the response text for the agent to speak
        return JSON.stringify({
            success: true,
            response: data.response || 'Ação concluída com sucesso.',
            data: data.clientAction?.data || null,
        });
    } catch (err: any) {
        console.error(`[Synapse Voice] Erro na tool ${toolName}:`, err);
        return JSON.stringify({ success: false, error: err.message || 'Erro interno' });
    }
}

export const ALL_VOICE_TOOLS = [
    'navigate_system', 'search_patients', 'list_patients', 'get_patient_details',
    'report_all_patients', 'search_clinical_history', 'generate_patient_insights',
    'suggest_treatment_approach', 'detect_risk_patterns', 'get_calendar',
    'create_appointment', 'reschedule_appointment', 'cancel_appointment',
    'find_available_slots', 'create_patient', 'update_patient_info',
    'add_patient_medication', 'create_session_note', 'send_whatsapp_message',
    'read_whatsapp_conversations', 'send_email', 'draft_email',
    'get_financial_metrics', 'list_transactions', 'create_transaction',
    'generate_financial_report', 'send_payment_reminder', 'draft_invoice',
    'generate_document', 'draft_official_document', 'search_medical_articles',
    'search_cid10', 'get_medication_info', 'get_latest_scientific_updates',
    'search_normative_docs',
] as const;
