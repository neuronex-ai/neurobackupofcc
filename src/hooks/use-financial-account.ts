"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useFinancialAccount = () => {
    const queryClient = useQueryClient();
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUserId(session?.user?.id || null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUserId(session?.user?.id || null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const { data: account, isLoading, refetch } = useQuery({
        queryKey: ["financial-account", userId],
        queryFn: async () => {
            if (!userId) return null;

            const { data: localData, error } = await supabase
                .from("financial_accounts")
                .select("*")
                .eq("user_id", userId)
                .maybeSingle();

            if (error) throw error;

            if (localData?.asaas_account_id) {
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    const response = await fetch(`${window.location.origin}/functions/v1/asaas-proxy`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${session?.access_token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            action: 'get-account-status',
                            asaas_account_id: localData.asaas_account_id
                        })
                    });

                    if (response.ok) {
                        const remoteData = await response.json();
                        return { ...localData, ...remoteData };
                    }
                } catch (e) {
                    console.error("[useFinancialAccount] Erro ao sincronizar com Asaas", e);
                }
            }

            return localData;
        },
        enabled: !!userId,
    });

    const syncAccount = useMutation({
        mutationFn: async () => {
            await refetch();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["financial-account"] });
        }
    });

    const isAccountCreated = !!account?.asaas_account_id;
    const isApproved = account?.status === 'approved' || account?.status === 'ACTIVE';
    const needsOnboarding = !isAccountCreated || (account?.status === 'pending' && !account?.details_submitted);

    return {
        account,
        isLoading: isLoading || (userId === undefined),
        refetch,
        syncAccount,
        isConnected: isAccountCreated,
        hasAccount: isAccountCreated,
        isApproved,
        isAccountCreated,
        needsInitialOnboarding: needsOnboarding,
        status: account?.status || 'none'
    };
};