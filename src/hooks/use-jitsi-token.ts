import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/SessionContextProvider';

interface UseJitsiTokenOptions {
  enabled?: boolean;
  retry?: number;
}

export const useJitsiToken = (roomName: string, options?: UseJitsiTokenOptions & { guestName?: string }) => {
  const { user } = useAuth();
  const guestName = options?.guestName;

  return useQuery({
    queryKey: ['jitsiToken', roomName, user?.id, guestName],
    queryFn: async () => {
      // Allow if user is logged in OR if guestName is provided
      if (!user && !guestName) throw new Error("Usuário não autenticado e nome de convidado não fornecido");

      const body = {
        roomName,
        user: user ? {
          id: user.id,
          name: user.user_metadata?.first_name || user.email?.split('@')[0] || 'Terapeuta',
          email: user.email,
          avatar: user.user_metadata?.avatar_url,
        } : {
          id: 'guest-' + Math.random().toString(36).substr(2, 9),
          name: guestName,
          email: '',
          avatar: '',
          isGuest: true
        }
      };

      const { data, error } = await supabase.functions.invoke('generate-jitsi-token', {
        body
      });

      if (error) {
        console.error("Erro ao invocar a função de token Jitsi:", error);
        throw new Error(`Falha ao gerar token Jitsi: ${error.message}`);
      }

      if (!data.token) {
        console.error("Função de token Jitsi não retornou um token:", data);
        throw new Error("A resposta da função de token estava malformada.");
      }

      return data.token;
    },
    enabled: (options?.enabled ?? true) && (!!user || !!guestName) && !!roomName,
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
    retry: options?.retry ?? 1,
  });
};