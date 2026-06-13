import { useAuth } from '@/components/auth/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';

export type NotificationCategory = 'agenda' | 'financeiro' | 'pacientes' | 'clinica' | 'seguranca' | 'sistema';
export type NotificationSeverity = 'success' | 'info' | 'warning' | 'destructive';

export interface AppNotification {
  id: string;
  userId: string;
  eventId: string | null;
  type: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;
  message: string;
  actionUrl: string | null;
  metadata: Record<string, unknown>;
  priority: string;
  createdAt: string;
  updatedAt: string | null;
  readAt: string | null;
  dismissedAt: string | null;
  isRead: boolean;
}

interface NotificationRow {
  id: string;
  user_id: string;
  event_id: string | null;
  type: string;
  category: string | null;
  severity: string | null;
  title: string;
  message: string;
  action_url: string | null;
  data: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  priority: string | null;
  created_at: string | null;
  updated_at: string | null;
  read: boolean | null;
  read_at: string | null;
  dismissed_at: string | null;
}

const mapCategory = (value?: string | null): NotificationCategory => {
  const normalized = value?.toLowerCase();
  if (normalized === 'agenda') return 'agenda';
  if (normalized === 'financeiro') return 'financeiro';
  if (normalized === 'pacientes') return 'pacientes';
  if (normalized === 'clinica' || normalized === 'clínica') return 'clinica';
  if (normalized === 'seguranca' || normalized === 'segurança') return 'seguranca';
  return 'sistema';
};

const mapSeverity = (value?: string | null): NotificationSeverity => {
  if (value === 'success' || value === 'warning' || value === 'destructive') return value;
  return 'info';
};

const mapNotification = (row: NotificationRow): AppNotification => ({
  id: row.id,
  userId: row.user_id,
  eventId: row.event_id,
  type: row.type,
  category: mapCategory(row.category || (row.data?.category as string | undefined)),
  severity: mapSeverity(row.severity || (row.data?.severity as string | undefined) || row.priority),
  title: row.title,
  message: row.message,
  actionUrl: row.action_url,
  metadata: row.data || row.payload || {},
  priority: row.priority || 'normal',
  createdAt: row.created_at || new Date().toISOString(),
  updatedAt: row.updated_at,
  readAt: row.read_at,
  dismissedAt: row.dismissed_at,
  isRead: Boolean(row.read || row.read_at),
});

const fetchNotifications = async (userId: string): Promise<AppNotification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, event_id, type, category, severity, title, message, action_url, data, payload, priority, created_at, updated_at, read, read_at, dismissed_at')
    .eq('user_id', userId)
    .is('dismissed_at', null)
    .order('created_at', { ascending: false })
    .limit(150);

  if (error) throw error;
  return (data || []).map((row) => mapNotification(row as NotificationRow));
};

export const useNotifications = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ['notifications', userId] as const, [userId]);

  const query = useQuery({
    queryKey,
    queryFn: () => fetchNotifications(userId!),
    enabled: Boolean(userId),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}:${Date.now()}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, invalidate)
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [invalidate, userId]);

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!userId) return;
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData<AppNotification[]>(queryKey, (current = []) =>
        current.map((item) => item.id === notificationId
          ? { ...item, isRead: true, readAt: new Date().toISOString() }
          : item),
      );
    },
    onSettled: invalidate,
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('mark_all_notifications_read');
      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const readAt = new Date().toISOString();
      queryClient.setQueryData<AppNotification[]>(queryKey, (current = []) =>
        current.map((item) => ({ ...item, isRead: true, readAt })),
      );
    },
    onSettled: invalidate,
  });

  const dismissMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!userId) return;
      const { error } = await supabase
        .from('notifications')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<AppNotification[]>(queryKey) || [];
      queryClient.setQueryData<AppNotification[]>(queryKey, previous.filter((item) => item.id !== notificationId));
      return { previous };
    },
    onError: (_error, _notificationId, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: invalidate,
  });

  const restoreMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase.rpc('restore_notification', { p_notification_id: notificationId });
      if (error) throw error;
    },
    onSettled: invalidate,
  });

  const notifications = query.data || [];
  const unreadCount = useMemo(
    () => notifications.reduce((total, notification) => total + (notification.isRead ? 0 : 1), 0),
    [notifications],
  );

  return {
    ...query,
    notifications,
    unreadCount,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    dismiss: dismissMutation.mutateAsync,
    restore: restoreMutation.mutateAsync,
    isMutating: markAsReadMutation.isPending || markAllAsReadMutation.isPending || dismissMutation.isPending || restoreMutation.isPending,
    refresh: query.refetch,
  };
};

export const useUnreadNotificationCount = () => {
  const { unreadCount, isLoading } = useNotifications();
  return { unreadCount, isLoading };
};
