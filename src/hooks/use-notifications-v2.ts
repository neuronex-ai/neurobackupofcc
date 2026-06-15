import { useAuth } from '@/components/auth/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { listenForForegroundPush } from '@/lib/push-notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

export type NotificationCategory = 'agenda' | 'financeiro' | 'pacientes' | 'clinica' | 'seguranca' | 'sistema';
export type NotificationSeverity = 'success' | 'info' | 'warning' | 'destructive';
export type AppNotification = { id: string; userId: string; eventId: string | null; type: string; category: NotificationCategory; severity: NotificationSeverity; title: string; message: string; actionUrl: string | null; metadata: Record<string, unknown>; priority: string; createdAt: string; updatedAt: string | null; readAt: string | null; dismissedAt: string | null; isRead: boolean };
type Row = { id: string; user_id: string; event_id: string | null; type: string; category: string | null; severity: string | null; title: string; message: string; action_url: string | null; data: Record<string, unknown> | null; payload: Record<string, unknown> | null; priority: string | null; created_at: string | null; updated_at: string | null; read: boolean | null; read_at: string | null; dismissed_at: string | null };

const category = (value?: string | null): NotificationCategory => {
  const item = value?.toLowerCase();
  if (item === 'agenda' || item === 'financeiro' || item === 'pacientes') return item;
  if (item === 'clinica' || item === 'clínica') return 'clinica';
  if (item === 'seguranca' || item === 'segurança') return 'seguranca';
  return 'sistema';
};
const severity = (value?: string | null): NotificationSeverity => value === 'success' || value === 'warning' || value === 'destructive' ? value : 'info';
const map = (row: Row): AppNotification => ({ id: row.id, userId: row.user_id, eventId: row.event_id, type: row.type, category: category(row.category || String(row.data?.category || '')), severity: severity(row.severity || String(row.data?.severity || row.priority || '')), title: row.title, message: row.message, actionUrl: row.action_url, metadata: row.data || row.payload || {}, priority: row.priority || 'normal', createdAt: row.created_at || new Date().toISOString(), updatedAt: row.updated_at, readAt: row.read_at, dismissedAt: row.dismissed_at, isRead: Boolean(row.read || row.read_at) });

export const useNotifications = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const client = useQueryClient();
  const key = useMemo(() => ['notifications', userId] as const, [userId]);
  const query = useQuery({ queryKey: key, enabled: Boolean(userId), staleTime: 30_000, queryFn: async () => {
    const result = await supabase.from('notifications').select('id,user_id,event_id,type,category,severity,title,message,action_url,data,payload,priority,created_at,updated_at,read,read_at,dismissed_at').eq('user_id', userId!).is('dismissed_at', null).order('created_at', { ascending: false }).limit(150);
    if (result.error) throw result.error;
    return (result.data || []).map((row) => map(row as Row));
  }});
  const invalidate = useCallback(() => { void client.invalidateQueries({ queryKey: key }); }, [client, key]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel(`notifications:${userId}:${Date.now()}`).on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload) => {
      invalidate();
      if (payload.eventType === 'INSERT') {
        const item = map(payload.new as Row);
        toast(item.title, { description: item.message, action: item.actionUrl ? { label: 'Abrir', onClick: () => { window.location.href = item.actionUrl!; } } : undefined });
      }
    }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [invalidate, userId]);

  useEffect(() => {
    if (!userId || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    let stop: (() => void) | undefined;
    void listenForForegroundPush((title, body, actionUrl) => toast(title, { description: body, action: actionUrl ? { label: 'Abrir', onClick: () => { window.location.href = actionUrl; } } : undefined })).then((unsubscribe) => { stop = unsubscribe; }).catch(() => undefined);
    return () => stop?.();
  }, [userId]);

  const update = (values: Record<string, unknown>) => async (id?: string) => {
    if (!userId) return;
    let request = supabase.from('notifications').update(values).eq('user_id', userId);
    if (id) request = request.eq('id', id);
    const result = await request;
    if (result.error) throw result.error;
  };
  const markRead = useMutation({ mutationFn: (id: string) => update({ read: true, read_at: new Date().toISOString() })(id), onSettled: invalidate });
  const markAll = useMutation({ mutationFn: update({ read: true, read_at: new Date().toISOString() }), onSettled: invalidate });
  const dismiss = useMutation({ mutationFn: (id: string) => update({ dismissed_at: new Date().toISOString() })(id), onSettled: invalidate });
  const restore = useMutation({ mutationFn: (id: string) => update({ dismissed_at: null })(id), onSettled: invalidate });
  const notifications = query.data || [];
  const unreadCount = notifications.filter((item) => !item.isRead).length;
  return { ...query, notifications, unreadCount, markAsRead: markRead.mutateAsync, markAllAsRead: markAll.mutateAsync, dismiss: dismiss.mutateAsync, restore: restore.mutateAsync, isMutating: markRead.isPending || markAll.isPending || dismiss.isPending || restore.isPending, refresh: query.refetch };
};

export const useUnreadNotificationCount = () => {
  const { unreadCount, isLoading } = useNotifications();
  return { unreadCount, isLoading };
};
