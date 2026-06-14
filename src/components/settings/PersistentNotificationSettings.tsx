import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettings,
  useNotificationSettings,
} from '@/hooks/use-notification-settings';
import { cn } from '@/lib/utils';
import { BellRing, Loader2, Mail, Monitor, Smartphone } from 'lucide-react';
import { useEffect, useState, type ComponentType } from 'react';

type BooleanKey = {
  [Key in keyof NotificationSettings]: NotificationSettings[Key] extends boolean ? Key : never;
}[keyof NotificationSettings];

type Row = { key: BooleanKey; label: string; description: string };
type Group = {
  key: BooleanKey;
  title: string;
  icon: ComponentType<{ className?: string }>;
  rows: Row[];
  available: boolean;
};

const groups: Group[] = [
  {
    key: 'sms_enabled',
    title: 'SMS',
    icon: Smartphone,
    available: false,
    rows: [
      { key: 'sms_security_alerts', label: 'Segurança', description: 'Login, senha e autenticação em duas etapas.' },
      { key: 'sms_appointments', label: 'Agenda', description: 'Lembretes e mudanças nos atendimentos.' },
    ],
  },
  {
    key: 'email_enabled',
    title: 'E-mail',
    icon: Mail,
    available: true,
    rows: [
      { key: 'email_appointment_reminders', label: 'Lembretes de consulta', description: 'Avisos sobre agendamentos próximos.' },
      { key: 'email_payment_confirmations', label: 'Fluxo financeiro', description: 'Pagamentos, faturas e repasses.' },
      { key: 'email_monthly_reports', label: 'Relatórios mensais', description: 'Resumo periódico da clínica.' },
      { key: 'email_security_alerts', label: 'Segurança', description: 'Mudanças relevantes na proteção da conta.' },
    ],
  },
  {
    key: 'in_app_enabled',
    title: 'Painel',
    icon: Monitor,
    available: true,
    rows: [
      { key: 'in_app_new_patients', label: 'Novos pacientes', description: 'Cadastros aguardando revisão.' },
      { key: 'in_app_overdue_invoices', label: 'Financeiro', description: 'Inadimplência, vencimentos e bloqueios.' },
      { key: 'in_app_system_updates', label: 'Sistema', description: 'Reagendamentos e eventos operacionais.' },
    ],
  },
];

const sanitize = (value: Partial<NotificationSettings>) => ({
  ...value,
  sms_enabled: false,
  sms_security_alerts: false,
  sms_appointments: false,
  push_enabled: false,
});

export const PersistentNotificationSettings = () => {
  const { settings, isLoading, isSaving, saveSettings } = useNotificationSettings();
  const [state, setState] = useState<Partial<NotificationSettings>>(DEFAULT_NOTIFICATION_SETTINGS);

  useEffect(() => {
    if (settings) setState(sanitize({ ...DEFAULT_NOTIFICATION_SETTINGS, ...settings }));
  }, [settings]);

  const change = (key: BooleanKey, value: boolean) => {
    setState((current) => ({ ...current, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-10">
      <header className="flex items-center justify-between gap-6 border-b border-border/10 pb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Preferências de alerta</h2>
          <p className="mt-2 text-sm text-muted-foreground">Configurações sincronizadas entre desktop e mobile.</p>
        </div>
        <Button onClick={() => saveSettings(sanitize(state))} disabled={isSaving} className="rounded-full px-8">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
        </Button>
      </header>

      {groups.map((group) => {
        const enabled = group.available && Boolean(state[group.key]);
        const Icon = group.icon;
        return (
          <section key={group.key} className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="rounded-full border border-border/10 bg-secondary/50 p-3 text-muted-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest">{group.title}</h3>
              {!group.available && (
                <span className="rounded-full bg-muted px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Indisponível</span>
              )}
              <Switch
                className="ml-auto"
                checked={enabled}
                disabled={!group.available}
                onCheckedChange={(value) => change(group.key, value)}
              />
            </div>

            {!group.available && (
              <p className="rounded-xl border border-border/10 bg-secondary/20 p-4 text-xs text-muted-foreground">
                Este canal não está disponível no momento e permanece desativado.
              </p>
            )}

            <div className={cn('border-l-2 border-border/10 pl-4', !enabled && 'pointer-events-none opacity-35 grayscale')}>
              {group.rows.map((row) => (
                <div key={row.key} className="flex items-center justify-between gap-4 border-b border-border/10 px-2 py-5 last:border-0">
                  <div className="flex-1">
                    <Label htmlFor={row.key} className="text-sm font-bold">{row.label}</Label>
                    <p className="mt-1 text-xs text-muted-foreground">{row.description}</p>
                  </div>
                  <Switch
                    id={row.key}
                    checked={group.available && Boolean(state[row.key])}
                    disabled={!enabled}
                    onCheckedChange={(value) => change(row.key, value)}
                  />
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <div className="flex items-center justify-between rounded-[24px] border border-border/10 bg-secondary/15 p-5 opacity-70">
        <div className="flex items-center gap-4">
          <BellRing className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="flex items-center gap-2">
              <Label>Push no navegador</Label>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Em breve</span>
            </div>
            <p className="text-xs text-muted-foreground">Será habilitado após o suporte a notificações PWA.</p>
          </div>
        </div>
        <Switch checked={false} disabled />
      </div>
    </div>
  );
};
