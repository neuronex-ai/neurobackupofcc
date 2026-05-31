import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type SmsTemplateKey =
    | 'verification'
    | 'passwordReset'
    | 'newAppointment'
    | 'appointmentReminder'
    | 'newTransaction'
    | 'passwordChanged'
    | 'twoFactorEnabled'
    | 'loginAlert';

interface UseTwilioSmsReturn {
    isLoading: boolean;
    sendVerificationCode: (phone: string) => Promise<boolean>;
    verifyCode: (phone: string, code: string) => Promise<boolean>;
    sendNotification: (phone: string, templateKey: SmsTemplateKey, templateData?: Record<string, string>) => Promise<boolean>;
    sendCustomSms: (phone: string, message: string) => Promise<boolean>;
}

export const useTwilioSms = (): UseTwilioSmsReturn => {
    const [isLoading, setIsLoading] = useState(false);

    const callTwilioFunction = useCallback(async (body: Record<string, any>): Promise<any> => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('twilio-sms', {
                body,
            });

            if (error) {
                console.error('Twilio SMS Error:', error);
                throw new Error(error.message || 'Erro ao enviar SMS');
            }

            return data;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const sendVerificationCode = useCallback(async (phone: string): Promise<boolean> => {
        try {
            const result = await callTwilioFunction({
                action: 'send-verification',
                phone,
            });

            if (result.success) {
                toast.success('Código de verificação enviado!');
                return true;
            }

            toast.error(result.error || 'Erro ao enviar código');
            return false;
        } catch (error: any) {
            toast.error(error.message || 'Erro ao enviar código de verificação');
            return false;
        }
    }, [callTwilioFunction]);

    const verifyCode = useCallback(async (phone: string, code: string): Promise<boolean> => {
        try {
            const result = await callTwilioFunction({
                action: 'verify-code',
                phone,
                code,
            });

            if (result.success && result.valid) {
                toast.success('Código verificado com sucesso!');
                return true;
            }

            toast.error('Código inválido ou expirado');
            return false;
        } catch (error: any) {
            toast.error(error.message || 'Erro ao verificar código');
            return false;
        }
    }, [callTwilioFunction]);

    const sendNotification = useCallback(async (
        phone: string,
        templateKey: SmsTemplateKey,
        templateData?: Record<string, string>
    ): Promise<boolean> => {
        try {
            const result = await callTwilioFunction({
                action: 'send-notification',
                phone,
                templateKey,
                templateData,
            });

            return result.success || false;
        } catch (error: any) {
            console.error('Failed to send notification SMS:', error);
            return false;
        }
    }, [callTwilioFunction]);

    const sendCustomSms = useCallback(async (phone: string, message: string): Promise<boolean> => {
        try {
            const result = await callTwilioFunction({
                action: 'send-notification',
                phone,
                customMessage: message,
            });

            if (result.success) {
                toast.success('SMS enviado com sucesso!');
                return true;
            }

            toast.error(result.error || 'Erro ao enviar SMS');
            return false;
        } catch (error: any) {
            toast.error(error.message || 'Erro ao enviar SMS');
            return false;
        }
    }, [callTwilioFunction]);

    return {
        isLoading,
        sendVerificationCode,
        verifyCode,
        sendNotification,
        sendCustomSms,
    };
};
