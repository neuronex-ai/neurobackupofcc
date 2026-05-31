import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/SessionContextProvider';

export interface NotificationSettings {
  id: string;
  user_id: string;
  email_enabled: boolean;
  email_appointment_reminders: boolean;
  email_payment_confirmations: boolean;
  email_monthly_reports: boolean;
  email_security_alerts: boolean;
  in_app_enabled: boolean;
  in_app_new_patients: boolean;
  in_app_overdue_invoices: boolean;
  in_app_system_updates: boolean;
}

const fetchNotificationSettings = async (userId: string): Promise<Partial<NotificationSettings> | null> => {
  const { data, error } = await supabase
    .from('user_notification_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
};

const upsertNotificationSettings = async (settings: Partial<NotificationSettings>, userId: string) => {
  const { data, error } = await supabase
    .from('user_notification_settings')
    .upsert({ ...settings, user_id: userId }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const useNotificationSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const query = useQuery({
    queryKey: ['notificationSettings', userId],
    queryFn: () => fetchNotificationSettings(userId!),
    enabled: !!userId,
  });

  const mutation = useMutation({
    mutationFn: (settings: Partial<NotificationSettings>) => {
      if (!userId) throw new Error("Usuário não autenticado");
      return upsertNotificationSettings(settings, userId);
    },
    onSuccess: () => {
      toast.success("Preferências de notificação salvas!");
      queryClient.invalidateQueries({ queryKey: ['notificationSettings', userId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAlerts', userId] }); // Invalida os alertas para refletir as mudanças
    },
    onError: (error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    }
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    saveSettings: mutation.mutate,
    isSaving: mutation.isPending,
  };
};