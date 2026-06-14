import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useGoogleAuth } from '@/hooks/use-google-auth';
import {
  DEFAULT_MONTHLY_REPORT_SETTINGS,
  type MonthlyReportSettingsModel,
  useMonthlyReportSettings,
} from '@/hooks/use-monthly-report-settings';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, BarChart3, FileText, Loader2, Mail, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type BooleanKey = 'include_sessions' | 'include_payments' | 'include_notes_summary';

const contentOptions: Array<{
  key: BooleanKey;
  label: string;
  description: string;
  available: boolean;
}> = [
  {
    key: 'include_sessions',
    label: 'Resumo de sessões',
    description: 'Sessões realizadas, faltas e frequência do período.',
    available: true,
  },
  {
    key: 'include_payments',
    label: 'Resumo financeiro',
    description: 'Valores recebidos e pendentes vinculados ao paciente.',
    available: true,
  },
  {
    key: 'include_notes_summary',
    label: 'Síntese evolutiva',
    description: 'Será liberada depois do fluxo de revisão e aprovação para o paciente.',
    available: false,
  },
];

const getPreviousMonthDate = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString();
};

export const PersistentMonthlyReportSettings = () => {
  const { isConnected } = useGoogleAuth();
  const { settings, isLoading, isSaving, saveSettings } = useMonthlyReportSettings();
  const [isTesting, setIsTesting] = useState(false);
  const [form, setForm] = useState<Omit<MonthlyReportSettingsModel, 'user_id'>>(
    DEFAULT_MONTHLY_REPORT_SETTINGS,
  );

  useEffect(() => {
    if (!settings) return;
    const { user_id: _userId, created_at: _createdAt, updated_at: _updatedAt, ...editable } = settings;
    setForm({ ...editable, enabled: false, include_notes_summary: false });
  }, [settings]);

  const handleSave = async () => {
    await saveSettings({ ...form, enabled: false, include_notes_summary: false });
  };

  const handleTest = async () => {
    if (!isConnected) {
      toast.error('Conecte sua conta Google antes de enviar um teste.');
      return;
    }

    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-monthly-report', {
        body: {
          testMode: true,
          monthDate: getPreviousMonthDate(),
          settingsOverride: { ...form, enabled: false, include_notes_summary: false },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.sent) throw new Error(data?.message || 'O teste não foi enviado.');

      toast.success(`Teste enviado para ${data.recipient}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível enviar o teste.';
      toast.error(message);
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="max-w-3xl space-y-8">
      <header className="flex flex-col gap-5 border-b border-border/10 pb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Relatórios mensais</h2>
            <p className="mt-1 text-sm text-muted-foreground">Configure o conteúdo e valide a mensagem com um envio de teste.</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleTest()}
            disabled={!isConnected || isTesting || isSaving}
            className="rounded-full px-6"
          >
            {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
            Enviar teste
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving || isTesting}
            className="rounded-full px-7"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar
          </Button>
        </div>
      </header>

      {!isConnected ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-300">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-bold">Conexão Google necessária</p>
            <p className="mt-1 text-xs">Conecte a conta Google para enviar o teste pelo Gmail.</p>
          </div>
        </div>
      ) : null}

      <section className="flex flex-col gap-5 rounded-[26px] border border-border/10 bg-secondary/15 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-muted p-3 text-muted-foreground"><Send className="h-5 w-5" /></div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor="monthly_enabled" className="text-base font-bold">Agendamento automático</Label>
              <span className="rounded-full border border-border/10 bg-muted px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Em configuração</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">A ativação será liberada após a rotina segura de processamento e deduplicação.</p>
          </div>
        </div>
        <Switch id="monthly_enabled" checked={false} disabled />
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="space-y-4 rounded-[26px] border border-border/10 bg-secondary/10 p-6">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Dia planejado</Label>
          <Select value={String(form.send_day)} onValueChange={(value) => setForm((current) => ({ ...current, send_day: Number(value) }))}>
            <SelectTrigger className="h-12 rounded-2xl"><SelectValue /></SelectTrigger>
            <SelectContent>{[1, 5, 10, 15, 20, 25, 28].map((day) => <SelectItem key={day} value={String(day)}>Dia {day}</SelectItem>)}</SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">A preferência fica preparada para a futura ativação. O relatório considera o mês anterior.</p>
        </section>

        <section className="space-y-3 rounded-[26px] border border-border/10 bg-secondary/10 p-6">
          <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /><Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Conteúdo</Label></div>
          {contentOptions.map((option) => (
            <div key={option.key} className="flex items-center justify-between gap-4 rounded-xl py-2">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{option.label}</p>
                  {!option.available ? (
                    <span className="rounded-full border border-border/20 bg-muted px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Em breve</span>
                  ) : null}
                </div>
                <p className="text-[11px] text-muted-foreground">{option.description}</p>
              </div>
              <Switch
                checked={option.available ? form[option.key] : false}
                disabled={!option.available}
                onCheckedChange={(checked) => setForm((current) => ({ ...current, [option.key]: checked }))}
              />
            </div>
          ))}
        </section>
      </div>

      <section className="space-y-5 rounded-[28px] border border-border/10 bg-secondary/10 p-6">
        <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><h3 className="text-sm font-bold uppercase tracking-widest">Mensagem</h3></div>
        <div className="space-y-2">
          <Label htmlFor="monthly_subject">Assunto</Label>
          <Input id="monthly_subject" value={form.email_subject} onChange={(event) => setForm((current) => ({ ...current, email_subject: event.target.value }))} className="h-12 rounded-2xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="monthly_intro">Introdução</Label>
          <textarea id="monthly_intro" value={form.email_intro} onChange={(event) => setForm((current) => ({ ...current, email_intro: event.target.value }))} rows={4} className="w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm" />
        </div>
        <p className="text-[11px] text-muted-foreground">Variáveis disponíveis: <code>{'{{patientName}}'}</code> e <code>{'{{month}}'}</code>.</p>
      </section>

      <p className="rounded-2xl border border-border/10 bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground">
        O teste é enviado somente para o e-mail da sua própria conta, usando dados demonstrativos. Nenhum paciente recebe a mensagem durante a validação.
      </p>
    </div>
  );
};
