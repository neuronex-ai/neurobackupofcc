/**
 * use-NeuroFinance-pix.ts
 *
 * Provides PIX-specific payment operations via NeuroFinance API.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { toast } from "sonner";
import type { NeuroFinancePayment, CreatePaymentResult } from "./use-neurofinance-payments";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

export interface CreatePixChargeParams {
    valor: number;
    expiracao?: number;
    descricao?: string;
    devedor?: {
        cpf?: string;
        cnpj?: string;
        nome: string;
    };
    infoAdicionais?: Array<{ nome: string; valor: string }>;
    patientId?: string;
    appointmentId?: string;
}

export interface CreatePixStaticQrCodeParams {
    valor: number;
    expiracao?: number;
    descricao?: string;
    addressKey?: string;
    allowsMultiplePayments?: boolean;
    externalReference?: string;
}

export interface CreatePixCobVencimentoParams {
    valor: number;
    dataDeVencimento: string;
    validadeAposVencimento?: number;
    descricao?: string;
    devedor: {
        cpf?: string;
        cnpj?: string;
        nome: string;
    };
    patientId?: string;
}

export type PixCharge = NeuroFinancePayment;
export type PixRecebido = NeuroFinancePayment;

export function useNeuroFinancePix() {
    const queryClient = useQueryClient();

    const createCharge = useMutation<CreatePaymentResult, Error, CreatePixChargeParams>({
        mutationFn: async (params) => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Não autenticado');

            const amountCentavos = Math.round(params.valor * 100);

            const response = await supabase.functions.invoke('asaas-create-payment', {
                body: {
                    amount: amountCentavos,
                    description: params.descricao || 'Cobrança PIX NeuroFinance',
                    patient_id: params.patientId || null,
                    appointment_id: params.appointmentId || null,
                    payment_methods: ['pix'],
                    patient_name: params.devedor?.nome || undefined,
                    patient_cpf: params.devedor?.cpf || params.devedor?.cnpj || undefined,
                    expires_in_minutes: params.expiracao || 60,
                },
            });

            if (response.error) throw new Error(response.error.message);
            if (response.data?.error) throw new Error(response.data.error);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['NeuroFinance-payments'] });
            queryClient.invalidateQueries({ queryKey: ['neurofinance-overview'] });
            queryClient.invalidateQueries({ queryKey: ['NeuroFinance-pix-charges'] });
            toast.success('Cobrança PIX criada com sucesso!');
        },
        onError: (error) => {
            toast.error(getUserFacingErrorMessage(error, "payment"));
        },
    });

    const createStaticQrCode = useMutation<any, Error, CreatePixStaticQrCodeParams>({
        mutationFn: async (params) => {
            const response = await supabase.functions.invoke('asaas-pix-static-qrcode', {
                body: {
                    value: params.valor,
                    description: params.descricao || 'Recebimento Pix NeuroFinance',
                    expirationSeconds: (params.expiracao || 60) * 60,
                    format: 'ALL',
                    allowsMultiplePayments: params.allowsMultiplePayments ?? false,
                    addressKey: params.addressKey || undefined,
                    externalReference: params.externalReference || undefined,
                },
            });

            if (response.error) throw new Error(response.error.message);
            if (response.data?.error) throw new Error(response.data.error);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['NeuroFinance-pix-keys'] });
            toast.success('QR Code Pix gerado com sucesso!');
        },
        onError: (error) => {
            toast.error(getUserFacingErrorMessage(error, "payment"));
        },
    });

    const createCobVencimento = useMutation<CreatePaymentResult, Error, CreatePixCobVencimentoParams>({
        mutationFn: async (params) => {
            const amountCentavos = Math.round(params.valor * 100);

            const response = await supabase.functions.invoke('asaas-create-payment', {
                body: {
                    amount: amountCentavos,
                    description: params.descricao || 'Cobrança PIX com vencimento',
                    patient_id: params.patientId || null,
                    payment_methods: ['pix', 'boleto'],
                    customer_name: params.devedor?.nome || undefined,
                    expires_in_minutes: Math.max(
                        60,
                        Math.floor((new Date(params.dataDeVencimento).getTime() - Date.now()) / 60000)
                    ),
                },
            });

            if (response.error) throw new Error(response.error.message);
            if (response.data?.error) throw new Error(response.data.error);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['NeuroFinance-payments'] });
            queryClient.invalidateQueries({ queryKey: ['neurofinance-overview'] });
            toast.success('Cobrança com vencimento criada!');
        },
        onError: (error) => {
            toast.error(getUserFacingErrorMessage(error, "payment"));
        },
    });

    const listCharges = async (): Promise<{ charges: NeuroFinancePayment[] }> => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Não autenticado');

        const { data, error } = await supabase
            .from('nb_payments')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('payment_method_type', 'pix')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        return { charges: (data || []) as NeuroFinancePayment[] };
    };

    const queryCharge = async (paymentId: string): Promise<NeuroFinancePayment | null> => {
        const { data, error } = await supabase
            .from('nb_payments')
            .select('*')
            .eq('id', paymentId)
            .single();

        if (error) throw error;
        return data as NeuroFinancePayment;
    };

    return {
        createCharge,
        createStaticQrCode,
        queryCharge,
        listCharges,
        createCobVencimento,
    };
}

export function usePixKeys() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['NeuroFinance-pix-keys'],
        queryFn: async () => {
            const response = await supabase.functions.invoke('asaas-pix', {
                body: { action: 'list_keys' },
            });
            if (response.error) throw new Error(response.error.message);
            if (response.data?.error) throw new Error(response.data.error);
            return response.data?.keys || response.data?.data || [];
        },
        staleTime: 30_000,
    });

    const createKey = useMutation({
        mutationFn: async () => {
            const response = await supabase.functions.invoke('asaas-pix', {
                body: { action: 'create_key', consent: true },
            });
            if (response.error) throw new Error(response.error.message);
            if (response.data?.error) throw new Error(response.data.error);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['NeuroFinance-pix-keys'] });
            toast.success('Chave Pix aleatória criada.');
        },
        onError: (error: Error) => toast.error(getUserFacingErrorMessage(error, "save")),
    });

    const deleteKey = useMutation({
        mutationFn: async (id: string) => {
            const response = await supabase.functions.invoke('asaas-pix', {
                body: { action: 'delete_key', id },
            });
            if (response.error) throw new Error(response.error.message);
            if (response.data?.error) throw new Error(response.data.error);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['NeuroFinance-pix-keys'] });
            toast.success('Chave Pix removida.');
        },
        onError: (error: Error) => toast.error(getUserFacingErrorMessage(error, "delete")),
    });

    return { ...query, createKey, deleteKey };
}

export function usePixCobList() {
    const { user } = useAuth();

    return useQuery<{ charges: NeuroFinancePayment[] }, Error>({
        queryKey: ['NeuroFinance-pix-charges', user?.id],
        queryFn: async () => {
            if (!user?.id) throw new Error('Não autenticado');

            const { data, error } = await supabase
                .from('nb_payments')
                .select('*')
                .eq('user_id', user.id)
                .eq('payment_method_type', 'pix')
                .in('status', ['pending', 'processing', 'paid'])
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            return { charges: (data || []) as NeuroFinancePayment[] };
        },
        enabled: !!user?.id,
        staleTime: 30_000,
    });
}

export function usePixRecebidos() {
    const { user } = useAuth();

    return useQuery<{ payments: NeuroFinancePayment[] }, Error>({
        queryKey: ['NeuroFinance-pix-received', user?.id],
        queryFn: async () => {
            if (!user?.id) throw new Error('Não autenticado');

            const { data, error } = await supabase
                .from('nb_payments')
                .select('*')
                .eq('user_id', user.id)
                .eq('payment_method_type', 'pix')
                .eq('status', 'paid')
                .order('paid_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            return { payments: (data || []) as NeuroFinancePayment[] };
        },
        enabled: !!user?.id,
        staleTime: 30_000,
    });
}
