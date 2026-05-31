import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SendDocumentEmailParams {
    to: string;
    subject: string;
    htmlBody: string;
    documentType: string;
    pdfAttachment: {
        filename: string;
        content: string; // base64
        contentType: string;
    };
}

interface SendReminderEmailParams {
    appointmentId?: string;
    patientEmail: string;
    patientName: string;
    startTime: string;
    location?: string;
    type?: string;
    action?: 'reminder' | 'cancel' | 'reschedule';
    cancellationReason?: string;
}

type SendEmailParams =
    | { type: 'document'; params: SendDocumentEmailParams }
    | { type: 'reminder'; params: SendReminderEmailParams };

export const useSendEmail = () => {
    return useMutation({
        mutationFn: async ({ type, params }: SendEmailParams) => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Não autenticado");

            const functionName = type === 'document' ? 'send-document-email' : 'send-appointment-reminder';

            const { data, error } = await supabase.functions.invoke(functionName, {
                body: params,
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            return data;
        },
        onSuccess: (_, variables) => {
            const emailType = variables.type === 'document' ? 'Documento' : 'Lembrete';
            toast.success(`${emailType} enviado com sucesso!`, {
                description: variables.type === 'document'
                    ? `Email enviado para ${variables.params.to}`
                    : `Email enviado para ${(variables.params as SendReminderEmailParams).patientEmail}`
            });
        },
        onError: (error: Error) => {
            console.error("Erro ao enviar email:", error);

            if (error.message.includes("Gmail not connected") || error.message.includes("Google account not connected")) {
                toast.error("Conta Gmail não conectada", {
                    description: "Conecte sua conta Google nas Configurações para enviar emails."
                });
            } else {
                toast.error("Erro ao enviar email", {
                    description: error.message || "Tente novamente mais tarde."
                });
            }
        }
    });
};
