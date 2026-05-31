import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface MicrosoftToken {
    access_token: string;
}

export const useMicrosoftAuth = () => {
    const [isLoading, setIsLoading] = useState(false);
    const queryClient = useQueryClient();

    const { data: token, isLoading: isChecking } = useQuery({
        queryKey: ['microsoft-token'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from('user_microsoft_tokens')
                .select('access_token')
                .eq('user_id', user.id)
                .single();

            if (error) return null; // No token found
            return data as MicrosoftToken;
        }
    });

    const isConnected = !!token;

    const connectMicrosoft = async () => {
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error("Você precisa estar logado.");
                return;
            }

            const { data, error } = await supabase.functions.invoke('microsoft-auth-init', {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            });

            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error("URL de autenticação não retornada");
            }

        } catch (error: any) {
            console.error("Erro ao iniciar autenticação Microsoft:", error);
            toast.error("Erro ao conectar com Microsoft To Do.");
        } finally {
            setIsLoading(false);
        }
    };

    const disconnectMicrosoft = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('user_microsoft_tokens')
                .delete()
                .eq('user_id', user.id);

            if (error) throw error;

            queryClient.invalidateQueries({ queryKey: ['microsoft-token'] });
            toast.success("Microsoft To Do desconectado.");

        } catch (error) {
            console.error(error);
            toast.error("Erro ao desconectar.");
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isConnected,
        isLoading: isLoading || isChecking,
        connectMicrosoft,
        disconnectMicrosoft
    };
};
