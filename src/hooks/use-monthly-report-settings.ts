import { useAuth } from '@/components/auth/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';

export interface MonthlyReportSettingsModel {
  user_id: string;
  enabled: boolean;
  send_day: number;
  include_sessions: boolean;
  include_payments: boolean;
  include_notes_summary: boolean;
  email_subject: string;
  email_intro: string;
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_MONTHLY_REPORT_SETTINGS: Omit<MonthlyReportSettingsModel, 'user_id'> = {
  enabled: false,
  send_day: 1,
  include_sessions: true,
  include_payments: true,
  include_notes_summary: false,
  email_subject: 'Relatório Mensal - Seu Acompanhamento Terapêutico',
  email_intro: 'Olá {{patientName}}, segue um resumo do nosso trabalho no último mês.',
};

const normalizeSettings = (
  userId: string,
  value?: Partial<MonthlyReportSettingsModel> | null,
): MonthlyReportSettingsModel => ({
  user_id: userId,
  ...DEFAULT_MONTHLY_REPORT_SETTINGS,
  ...(value || {}),
  send_day: Math.max(1, Math.min(28, Number(value?.send_day || 1))),
});

const loadLegacySettings = async (userId: string) => {
  const { data, error } = await supabase
    .from('communication_templates')
    .select('body_html')
    .eq('user_id', userId)
    .eq('template_key', 'monthly_report_config')
    .maybeSingle();

  if (error || !data?.body_html) return null;

  try {
    return normalizeSettings(userId, JSON.parse(data.body_html));
  } catch {
    return null;
  }
};

const fetchSettings = async (userId: string): Promise<MonthlyReportSettingsModel> => {
  const { data, error } = await supabase
    .from('monthly_report_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (data) return normalizeSettings(userId, data);

  const legacy = await loadLegacySettings(userId);
  if (!legacy) return normalizeSettings(userId);

  const { data: migrated, error: migrationError } = await supabase
    .from('monthly_report_settings')
    .upsert(legacy, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (migrationError) throw migrationError;
  return normalizeSettings(userId, migrated);
};

export const useMonthlyReportSettings = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ['monthlyReportSettings', userId] as const, [userId]);

  const query = useQuery({
    queryKey,
    queryFn: () => fetchSettings(userId!),
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
  });

  const mutation = useMutation({
    mutationFn: async (updates: Partial<Omit<MonthlyReportSettingsModel, 'user_id'>>) => {
      if (!userId) throw new Error('Usuário não autenticado.');

      const current = queryClient.getQueryData<MonthlyReportSettingsModel>(queryKey) || normalizeSettings(userId);
      const payload = normalizeSettings(userId, { ...current, ...updates });

      const { data, error } = await supabase
        .from('monthly_report_settings')
        .upsert(payload, { onConflict: 'user_id' })
        .select('*')
        .single();

      if (error) throw error;
      return normalizeSettings(userId, data);
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<MonthlyReportSettingsModel>(queryKey);
      queryClient.setQueryData(queryKey, normalizeSettings(userId || '', { ...previous, ...updates }));
      return { previous };
    },
    onError: (_error, _updates, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error('Não foi possível salvar as configurações do relatório.');
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
      toast.success('Configurações do relatório salvas.');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`monthly-report-settings:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'monthly_report_settings',
        filter: `user_id=eq.${userId}`,
      }, () => {
        void queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, queryKey, userId]);

  return {
    settings: query.data,
    isLoading: query.isLoading,
    isSaving: mutation.isPending,
    saveSettings: mutation.mutateAsync,
    refresh: query.refetch,
  };
};
