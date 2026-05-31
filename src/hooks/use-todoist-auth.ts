import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface TodoistToken {
    access_token: string;
}

export const useTodoistAuth = () => {
    const [isLoading, setIsLoading] = useState(false);
    const queryClient = useQueryClient();

    const { data: token, isLoading: isChecking } = useQuery({
        queryKey: ['todoist-token'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from('user_todoist_tokens')
                .select('access_token')
                .eq('user_id', user.id)
                .single();

            if (error) return null;
            return data as TodoistToken;
        }
    });

    const isConnected = !!token;

    const connectTodoist = async () => {
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error("Você precisa estar logado.");
                return;
            }

            const { data, error } = await supabase.functions.invoke('todoist-auth-init', {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            });

            if (error) throw error;
            if (data?.authUrl) {
                window.location.href = data.authUrl;
            } else {
                throw new Error("URL de autenticação não retornada");
            }

        } catch (error: any) {
            console.error("Erro ao iniciar autenticação Todoist:", error);
            toast.error("Erro ao conectar com Todoist.");
        } finally {
            setIsLoading(false);
        }
    };

    const disconnectTodoist = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('user_todoist_tokens')
                .delete()
                .eq('user_id', user.id);

            if (error) throw error;

            queryClient.invalidateQueries({ queryKey: ['todoist-token'] });
            toast.success("Todoist desconectado.");

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
        connectTodoist,
        disconnectTodoist
    };
};
