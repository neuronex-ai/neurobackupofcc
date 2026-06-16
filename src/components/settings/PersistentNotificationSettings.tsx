import { useAuth } from '@/components/auth/SessionContextProvider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { DEFAULT_NOTIFICATION_SETTINGS, type NotificationSettings, useNotificationSettings } from '@/hooks/use-notification-settings';
import { disablePushNotifications, enablePushNotifications, logPushStep } from '@/lib/push-notifications';
import { BellRing, Loader2, Mail, Monitor, Smartphone } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type Key = keyof Pick<NotificationSettings, 'email_enabled' | 'email_appointment_reminders' | 'email_payment_confirmations' | 'email_monthly_reports' | 'email_security_alerts' | 'in_app_enabled' | 'in_app_new_patients' | 'in_app_overdue_invoices' | 'in_app_system_updates'>;

const rows: Array<{ key: Key; label: string; description: string; channel: 'email' | 'panel' }> = [
  { key: 'email_appointment_reminders', label: 'Lembretes de consulta', description: 'Avisos sobre agendamentos próximos.', channel: 'email' },
  { key: 'email_payment_confirmations', label: 'Fluxo financeiro', description: 'Pagamentos, faturas e repasses.', channel: 'email' },
  { key: 'email_monthly_reports', label: 'Relatórios mensais', description: 'Resumo periódico da clínica.', channel: 'email' },
  { key: 'email_security_alerts', label: 'Segurança', description: 'Mudanças importantes na conta.', channel: 'email' },
  { key: 'in_app_new_patients', label: 'Novos pacientes', description: 'Cadastros e atividades do portal.', channel: 'panel' },
  { key: 'in_app_overdue_invoices', label: 'Financeiro', description: 'Pagamentos, vencimentos e inadimplência.', channel: 'panel' },
  { key: 'in_app_system_updates', label: 'Agenda e sistema', description: 'Reagendamentos, cancelamentos e eventos operacionais.', channel: 'panel' },
];

export const PersistentNotificationSettings = () => {
  const { user } = useAuth();
  const { settings, isLoading, isSaving, saveSettingsAsync } = useNotificationSettings();
  const [state, setState] = useState<Partial<NotificationSettings>>(DEFAULT_NOTIFICATION_SETTINGS);
  const [pushBusy, setPushBusy] = useState(false);
  const pushBusyRef = useRef(false);
  const pushSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    typeof Notification !== 'undefined';
  const pushPermission = pushSupported ? Notification.permission : 'default';

  useEffect(() => { if (settings) setState({ ...DEFAULT_NOTIFICATION_SETTINGS, ...settings, sms_enabled: false, sms_security_alerts: false, sms_appointments: false }); }, [settings]);

  const togglePush = async (enabled: boolean) => {
    if (!user || pushBusyRef.current) return;
    pushBusyRef.current = true;
    setPushBusy(true);
    try {
      if (enabled) await enablePushNotifications(user.id);
      else await disablePushNotifications(user.id);
      const next = { ...state, push_enabled: enabled, sms_enabled: false, sms_security_alerts: false, sms_appointments: false };
      logPushStep('push:settings-save', { enabled });
      setState(next); await saveSettingsAsync(next);
      toast.success(enabled ? 'Notificações nativas ativadas neste dispositivo.' : 'Notificações nativas desativadas neste dispositivo.');
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Não foi possível alterar as notificações nativas.');
    } finally {
      pushBusyRef.current = false;
      setPushBusy(false);
    }
  };

  const save = async () => {
    await saveSettingsAsync({ ...state, sms_enabled: false, sms_security_alerts: false, sms_appointments: false });
  };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-52" /><Skeleton className="h-32 w-full rounded-2xl" /></div>;

  return <div className="max-w-3xl space-y-9">
    <header className="flex items-center justify-between gap-6 border-b border-border/10 pb-8"><div><h2 className="text-2xl font-bold">Preferências de alerta</h2><p className="mt-2 text-sm text-muted-foreground">E-mail institucional, alertas internos e push por dispositivo.</p></div><Button onClick={() => void save()} disabled={isSaving} className="rounded-full px-8">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}</Button></header>

    <section className="space-y-4"><div className="flex items-center gap-4"><Mail className="h-5 w-5" /><h3 className="text-sm font-bold uppercase tracking-widest">E-mail</h3><Switch className="ml-auto" checked={Boolean(state.email_enabled)} onCheckedChange={(value) => setState((current) => ({ ...current, email_enabled: value }))} /></div>{rows.filter((row) => row.channel === 'email').map((row) => <div key={row.key} className="flex items-center justify-between border-b border-border/10 py-4 pl-9"><div><Label>{row.label}</Label><p className="text-xs text-muted-foreground">{row.description}</p></div><Switch checked={Boolean(state[row.key])} disabled={!state.email_enabled} onCheckedChange={(value) => setState((current) => ({ ...current, [row.key]: value }))} /></div>)}</section>

    <section className="space-y-4"><div className="flex items-center gap-4"><Monitor className="h-5 w-5" /><h3 className="text-sm font-bold uppercase tracking-widest">Dentro da NeuroNex</h3><Switch className="ml-auto" checked={Boolean(state.in_app_enabled)} onCheckedChange={(value) => setState((current) => ({ ...current, in_app_enabled: value }))} /></div>{rows.filter((row) => row.channel === 'panel').map((row) => <div key={row.key} className="flex items-center justify-between border-b border-border/10 py-4 pl-9"><div><Label>{row.label}</Label><p className="text-xs text-muted-foreground">{row.description}</p></div><Switch checked={Boolean(state[row.key])} disabled={!state.in_app_enabled} onCheckedChange={(value) => setState((current) => ({ ...current, [row.key]: value }))} /></div>)}</section>

    <section className="flex items-center gap-4 rounded-[24px] border border-primary/20 bg-primary/5 p-5"><BellRing className="h-5 w-5 text-primary" /><div className="flex-1"><div className="flex items-center gap-2"><Label>Notificações nativas do navegador/PWA</Label><span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-500">{pushSupported ? 'DISPONÍVEL' : 'INDISPONÍVEL'}</span></div><p className="text-xs text-muted-foreground">{pushSupported ? 'Aparecem no Windows, Android e PWA mesmo com a aba fechada.' : 'Este navegador nao oferece Service Worker/Notification para push nativo.'}</p></div>{pushBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Switch disabled={!pushSupported} checked={Boolean(state.push_enabled) && pushPermission === 'granted'} onCheckedChange={(value) => void togglePush(value)} />}</section>

    <section className="flex items-center gap-4 rounded-[24px] border border-border/10 bg-secondary/15 p-5 opacity-65"><Smartphone className="h-5 w-5" /><div className="flex-1"><Label>SMS</Label><p className="text-xs text-muted-foreground">Indisponível até a contratação e validação de um provedor.</p></div><Switch checked={false} disabled /></section>
  </div>;
};
