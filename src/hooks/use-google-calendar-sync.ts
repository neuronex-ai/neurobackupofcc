import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/SessionContextProvider';
import { toast } from 'sonner';
import { edgeFunctionUrl } from '@/lib/supabase-config';

const POLL_URL = edgeFunctionUrl("google-calendar-poll");

export const useGoogleCalendarSync = () => {
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const queryClient = useQueryClient();

  useQuery({
    queryKey: ['googleCalendarSync'],
    queryFn: async () => {
      if (!accessToken) return null;

      try {
          const response = await fetch(POLL_URL, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });

          if (response.ok) {
              const data = await response.json();
              if (data.imported > 0) {
                  // CRÍTICO: Invalida o cache de agendamentos para mostrar os novos bloqueios na UI imediatamente
                  queryClient.invalidateQueries({ queryKey: ['appointments'] });
                  queryClient.invalidateQueries({ queryKey: ['appointmentsByDateRange'] });
                  
                  toast.success(`Agenda atualizada: ${data.imported} eventos do Google importados.`);
              }
              return data;
          }
      } catch (e) {
          console.error("Background Sync Error:", e);
      }
      return null;
    },
    enabled: !!accessToken,
    refetchInterval: 1000 * 60 * 2, // Poll a cada 2 minutos
    refetchOnWindowFocus: true, // Sincroniza ao voltar para a aba
    staleTime: 0 // Sempre tenta buscar dados frescos
  });
};
