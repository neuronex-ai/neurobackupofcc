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
import { AlertCircle, BarChart3, FileText, Loader2, Mail, Send } from 'lucide-react';
import { useEffect, useState } from 'react';

type BooleanKey = 'include_sessions' | 'include_payments' | 'include_notes_summary';

const contentOptions: Array<{ key: BooleanKey; label: string; description: string }> = [
  { key: 'include_sessions', label: 'Resumo de sessões', description: 'Frequência, datas e presença.' },
  { key: 'include_payments', label: 'Resumo financeiro', description: 'Pagamentos e pendências do período.' },
  { key: 'include_notes_summary', label: 'Síntese evolutiva', description: 'Somente conteúdo revisado pelo profissional.' },
];

export const PersistentMonthlyReportSettings = () => {
  const { isConnected } = useGoogleAuth();
  const { settings, isLoading, isSaving, saveSettings } = useMonthlyReportSettings();
  const [form, setForm] = useState<Omit<MonthlyReportSettingsModel, 'user_id'>>(
    DEFAULT_MONTHLY_REPORT_SETTINGS,
  );

  useEffect(() => {
    if (!settings) return;
    const { user_id: _userId, created_at: _createdAt, updated_at: _updatedAt, ...editable } = settings;
    setForm(editable);
  }, [settings]);

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
            <p className="mt-1 text-sm text-muted-foreground">Configuração persistente e separada dos templates de comunicação.</p>
          </div>
        </div>
        <Button onClick={() => void saveSettings(form)} disabled={isSaving} className="rounded-full px-7">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
        </Button>
      </header>

      {!isConnected ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-300">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div><p className="text-sm font-bold">Conexão Google necessária</p><p className="mt-1 text-xs">Conecte a conta Google para utilizar o envio pelo Gmail.</p></div>
        </div>
      ) : null}

      <section className="flex flex-col gap-5 rounded-[26px] border border-border/10 bg-secondary/15 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600"><Send className="h-5 w-5" /></div>
          <div><Label htmlFor="monthly_enabled" className="text-base font-bold">Envio automático</Label><p className="mt-1 text-xs text-muted-foreground">Ativa o relatório para a rotina mensal de processamento.</p></div>
        </div>
        <Switch id="monthly_enabled" checked={form.enabled} onCheckedChange={(enabled) => setForm((current) => ({ ...current, enabled }))} disabled={!isConnected} />
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="space-y-4 rounded-[26px] border border-border/10 bg-secondary/10 p-6">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Dia de envio</Label>
          <Select value={String(form.send_day)} onValueChange={(value) => setForm((current) => ({ ...current, send_day: Number(value) }))}>
            <SelectTrigger className="h-12 rounded-2xl"><SelectValue /></SelectTrigger>
            <SelectContent>{[1, 5, 10, 15, 20, 25, 28].map((day) => <SelectItem key={day} value={String(day)}>Dia {day}</SelectItem>)}</SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">O relatório considera o mês anterior.</p>
        </section>

        <section className="space-y-3 rounded-[26px] border border-border/10 bg-secondary/10 p-6">
          <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /><Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Conteúdo</Label></div>
          {contentOptions.map((option) => (
            <div key={option.key} className="flex items-center justify-between gap-4 rounded-xl py-2">
              <div><p className="text-sm font-semibold">{option.label}</p><p className="text-[11px] text-muted-foreground">{option.description}</p></div>
              <Switch checked={form[option.key]} onCheckedChange={(checked) => setForm((current) => ({ ...current, [option.key]: checked }))} />
            </div>
          ))}
        </section>
      </div>

      <section className="space-y-5 rounded-[28px] border border-border/10 bg-secondary/10 p-6">
        <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><h3 className="text-sm font-bold uppercase tracking-widest">Mensagem</h3></div>
        <div className="space-y-2"><Label htmlFor="monthly_subject">Assunto</Label><Input id="monthly_subject" value={form.email_subject} onChange={(event) => setForm((current) => ({ ...current, email_subject: event.target.value }))} className="h-12 rounded-2xl" /></div>
        <div className="space-y-2"><Label htmlFor="monthly_intro">Introdução</Label><textarea id="monthly_intro" value={form.email_intro} onChange={(event) => setForm((current) => ({ ...current, email_intro: event.target.value }))} rows={4} className="w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm" /></div>
        <p className="text-[11px] text-muted-foreground">Variáveis disponíveis: <code>{'{{patientName}}'}</code> e <code>{'{{month}}'}</code>.</p>
      </section>

      <p className="rounded-2xl border border-border/10 bg-muted/30 p-4 text-xs text-muted-foreground">
        O envio de teste ficará disponível depois da atualização do worker de relatórios. A configuração já é persistida e pode ser revisada sem perda de dados.
      </p>
    </div>
  );
};
