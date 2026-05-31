import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { NotificationSettings as TNotificationSettings, useNotificationSettings } from "@/hooks/use-notification-settings";
import { useProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { AppWindow, Loader2, Mail, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

const SettingRow = ({ id, label, description, checked, onCheckedChange, disabled }: any) => (
  <div className="flex items-center justify-between py-5 border-b border-border/10 last:border-0 hover:bg-secondary/5 px-2 rounded-xl transition-colors gap-4">
    <div className="space-y-1 flex-1">
      <Label htmlFor={id} className={cn("text-sm font-bold tracking-tight text-foreground transition-all", disabled && "opacity-40")}>{label}</Label>
      <p className={cn("text-xs text-muted-foreground font-medium transition-all", disabled && "opacity-40")}>{description}</p>
    </div>
    <Switch
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-secondary shrink-0"
    />
  </div>
);

export const NotificationSettings = () => {
  const { settings, isLoading, saveSettings, isSaving } = useNotificationSettings();
  const { profile, isLoading: isLoadingProfile, updateProfile } = useProfile();

  const [formState, setFormState] = useState<Partial<TNotificationSettings>>({
    email_enabled: true,
    email_appointment_reminders: true,
    email_payment_confirmations: true,
    email_monthly_reports: true,
    email_security_alerts: true,
    in_app_enabled: true,
    in_app_new_patients: true,
    in_app_overdue_invoices: true,
    in_app_system_updates: true,
  });

  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsSecurityAlerts, setSmsSecurityAlerts] = useState(true);
  const [smsAppointments, setSmsAppointments] = useState(true);

  useEffect(() => {
    if (settings) {
      setFormState(prev => ({ ...prev, ...settings }));
    }
  }, [settings]);

  useEffect(() => {
    if (profile) {
      setSmsEnabled(!!profile.sms_notifications_enabled);
    }
  }, [profile]);

  const handleToggle = (key: keyof TNotificationSettings, value: boolean) => {
    setFormState(prev => ({ ...prev, [key]: value }));
  };

  const handleSmsToggle = async (checked: boolean) => {
    setSmsEnabled(checked);
    // Atualiza imediatamente o profile
    updateProfile({ sms_notifications_enabled: checked });
  };

  const handleSave = () => {
    saveSettings(formState);
  };

  if (isLoading || isLoadingProfile) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 bg-secondary/20" />
          <Skeleton className="h-4 w-full max-w-sm bg-secondary/10" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-16 w-full bg-secondary/10 rounded-2xl" />
          <Skeleton className="h-16 w-full bg-secondary/10 rounded-2xl" />
          <Skeleton className="h-16 w-full bg-secondary/10 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-10 max-w-3xl"
    >
      <div className="flex items-center justify-between border-b border-border/10 pb-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">Preferências de Alerta</h2>
          <p className="text-sm text-muted-foreground font-medium">Configure como deseja ser notificado sobre as atividades da sua clínica.</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95 active:shadow-none hover:-translate-y-0.5"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
        </Button>
      </div>

      <div className="space-y-12">
        {/* SMS Section */}
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4 mb-6 text-center md:flex-row md:items-center md:text-left">
            <div className="p-3 bg-secondary/50 dark:bg-card rounded-full text-muted-foreground border border-border/10 shadow-sm transition-all group-hover:bg-secondary shrink-0">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest leading-none">Notificações SMS</h3>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1.5 grayscale opacity-60">Alertas Móveis (Beta)</p>
            </div>
            <div className="mt-2 md:mt-0 md:ml-auto">
              <Switch
                checked={smsEnabled}
                onCheckedChange={handleSmsToggle}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>
          </div>

          <div className={cn("space-y-1 pl-4 border-l-2 border-border/5 transition-all duration-500", !smsEnabled && "opacity-30 grayscale pointer-events-none")}>
            <div className="p-4 rounded-xl bg-secondary/20 border border-border/10 mb-4">
              <p className="text-xs text-muted-foreground">
                Ao ativar as notificações por SMS, você receberá alertas críticos de segurança, lembretes de agenda e confirmações de transações financeiras diretamente no seu celular cadastrado.
                <br /><br />
                <strong>Telefone cadastrado:</strong> {profile?.phone || "Nenhum (Configure em Segurança)"}
              </p>
            </div>

            <SettingRow id="sms_security" label="Alertas de Segurança" description="Tentativas de login, alteração de senha e ativação de 2FA." checked={smsSecurityAlerts} onCheckedChange={setSmsSecurityAlerts} disabled={!smsEnabled} />
            <SettingRow id="sms_appointments" label="Agenda do Dia" description="Resumo diário dos seus atendimentos." checked={smsAppointments} onCheckedChange={setSmsAppointments} disabled={!smsEnabled} />
          </div>
        </div>

        {/* Email Section */}
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4 mb-6 text-center md:flex-row md:items-center md:text-left">
            <div className="p-3 bg-secondary/50 dark:bg-card rounded-full text-muted-foreground border border-border/10 shadow-sm transition-all group-hover:bg-secondary shrink-0">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest leading-none">Canais de E-mail</h3>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1.5 grayscale opacity-60">Notificações Externas</p>
            </div>
            <div className="mt-2 md:mt-0 md:ml-auto">
              <Switch
                checked={formState.email_enabled}
                onCheckedChange={(v) => handleToggle('email_enabled', v)}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>

          <div className={cn("space-y-1 pl-4 border-l-2 border-border/5 transition-all duration-500", !formState.email_enabled && "opacity-30 grayscale pointer-events-none")}>
            <SettingRow id="email_reminders" label="Lembretes de Consulta" description="Avisos sobre agendamentos próximos para você e seus pacientes." checked={formState.email_appointment_reminders} onCheckedChange={(v: boolean) => handleToggle('email_appointment_reminders', v)} disabled={!formState.email_enabled} />
            <SettingRow id="email_payments" label="Fluxo Financeiro" description="Confirmações de transações, faturas emitidas e avisos de repasse." checked={formState.email_payment_confirmations} onCheckedChange={(v: boolean) => handleToggle('email_payment_confirmations', v)} disabled={!formState.email_enabled} />
            <SettingRow id="email_reports" label="Inteligência Mensal" description="Resumo detalhado do desempenho da sua clínica no período." checked={formState.email_monthly_reports} onCheckedChange={(v: boolean) => handleToggle('email_monthly_reports', v)} disabled={!formState.email_enabled} />
          </div>
        </div>

        {/* In-App Section */}
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4 mb-6 text-center md:flex-row md:items-center md:text-left">
            <div className="p-3 bg-secondary/50 dark:bg-card rounded-full text-muted-foreground border border-border/10 shadow-sm transition-all group-hover:bg-secondary shrink-0">
              <AppWindow className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest leading-none">Notificações do Painel</h3>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1.5 grayscale opacity-60">Alertas em Tempo Real</p>
            </div>
            <div className="mt-2 md:mt-0 md:ml-auto">
              <Switch
                checked={formState.in_app_enabled}
                onCheckedChange={(v) => handleToggle('in_app_enabled', v)}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>

          <div className={cn("space-y-1 pl-4 border-l-2 border-border/5 transition-all duration-500", !formState.in_app_enabled && "opacity-30 grayscale pointer-events-none")}>
            <SettingRow id="in_app_patients" label="Novos Pacientes" description="Alertas imediatos quando um novo paciente se cadastra pelo link." checked={formState.in_app_new_patients} onCheckedChange={(v: boolean) => handleToggle('in_app_new_patients', v)} disabled={!formState.in_app_enabled} />
            <SettingRow id="in_app_invoices" label="Monitoramento Financeiro" description="Alertas críticos de inadimplência, vencimentos e bloqueios." checked={formState.in_app_overdue_invoices} onCheckedChange={(v: boolean) => handleToggle('in_app_overdue_invoices', v)} disabled={!formState.in_app_enabled} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};