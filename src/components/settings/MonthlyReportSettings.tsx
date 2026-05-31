import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { useGoogleAuth } from "@/hooks/use-google-auth";
import {
    CalendarClock, Mail, FileText,
    AlertCircle, Send, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MonthlyReportConfig {
    enabled: boolean;
    send_day: number;
    include_sessions: boolean;
    include_payments: boolean;
    include_notes_summary: boolean;
    email_subject: string;
    email_intro: string;
}

const DEFAULT_CONFIG: MonthlyReportConfig = {
    enabled: false,
    send_day: 1,
    include_sessions: true,
    include_payments: true,
    include_notes_summary: false,
    email_subject: "Relatório Mensal - Seu Acompanhamento Terapêutico",
    email_intro: "Olá {{patientName}}, segue um resumo do nosso trabalho no último mês."
};

export const MonthlyReportSettings = () => {
    const { user } = useAuth();
    const { isConnected: isGoogleConnected } = useGoogleAuth();
    const [config, setConfig] = useState<MonthlyReportConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user) return;

        const loadConfig = async () => {
            setLoading(true);
            const { data } = await supabase
                .from('communication_templates')
                .select('body_html')
                .eq('user_id', user.id)
                .eq('template_key', 'monthly_report_config')
                .single();

            if (data?.body_html) {
                try {
                    setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(data.body_html) });
                } catch (e) {
                    console.error("Error parsing report config:", e);
                }
            }
            setLoading(false);
        };

        loadConfig();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);

        try {
            const { error } = await supabase
                .from('communication_templates')
                .upsert({
                    user_id: user.id,
                    template_key: 'monthly_report_config',
                    subject: 'Monthly Report Config',
                    body_html: JSON.stringify(config)
                }, { onConflict: 'user_id, template_key' });

            if (error) throw error;
            toast.success("Configurações salvas com sucesso!");
        } catch (e) {
            toast.error("Erro ao salvar configurações.");
        } finally {
            setSaving(false);
        }
    };

    const handleTestSend = async () => {
        if (!user) return;

        toast.loading("Enviando relatório de teste...", { id: "test-report" });

        try {
            const { error } = await supabase.functions.invoke('send-monthly-report', {
                body: { userId: user.id, isTest: true }
            });

            if (error) throw error;
            toast.success("Relatório de teste enviado! Verifique seu email.", { id: "test-report" });
        } catch (e) {
            toast.error("Erro ao enviar relatório de teste.", { id: "test-report" });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin h-8 w-8 text-primary/40" />
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
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
                        <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground tracking-tight">Relatórios Mensais</h2>
                        <p className="text-sm text-muted-foreground font-medium">Envie resumos automáticos de evolução aos seus pacientes.</p>
                    </div>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95 active:shadow-none hover:-translate-y-0.5"
                >
                    {saving ? "Salvando..." : "Salvar Configurações"}
                </Button>
            </div>

            <div className="space-y-8">
                {/* Google Connection Warning */}
                {!isGoogleConnected && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 flex items-start gap-4"
                    >
                        <div className="p-2 rounded-xl bg-amber-500/10">
                            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-amber-700 dark:text-amber-200">Conexão Google Necessária</p>
                            <p className="text-xs text-amber-600 dark:text-amber-200/60 mt-1 font-medium">
                                Para enviar relatórios via Gmail, conecte sua conta Google na aba ao lado.
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Main Toggle */}
                <div className="p-6 rounded-[24px] bg-secondary/20 dark:bg-card border border-border/10 shadow-sm">
                    <div className="flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
                        <div className="flex flex-col items-center gap-5 md:flex-row">
                            <div className={cn(
                                "h-12 w-12 rounded-full flex items-center justify-center transition-all shadow-inner shrink-0",
                                config.enabled ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground/40"
                            )}>
                                <Send className="h-6 w-6" />
                            </div>
                            <div>
                                <Label className="text-base font-bold text-foreground">Envio Automático</Label>
                                <p className="text-xs text-muted-foreground mt-1 font-medium">
                                    {config.enabled ? "Ativo - Relatórios mensais operando normalmente." : "Desativado - Os relatórios não serão enviados."}
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={config.enabled}
                            onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
                            disabled={!isGoogleConnected}
                            className="scale-110 mt-2 md:mt-0"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Schedule */}
                    <div className="p-8 rounded-[24px] bg-secondary/10 dark:bg-zinc-900/30 border border-border/10 space-y-6">
                        <div className="flex flex-col items-center gap-3 text-center md:flex-row md:text-left">
                            <div className="p-2 bg-secondary/50 rounded-full shrink-0">
                                <CalendarClock className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Agendamento</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-col items-center gap-4 md:flex-row">
                                <Label className="text-xs text-muted-foreground font-bold uppercase tracking-widest shrink-0">Enviar no dia:</Label>
                                <Select
                                    value={config.send_day.toString()}
                                    onValueChange={(v) => setConfig(prev => ({ ...prev, send_day: parseInt(v) }))}
                                >
                                    <SelectTrigger className="w-full h-11 bg-secondary/40 border-border/10 rounded-xl focus:ring-0 focus:border-primary/40">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border/10 rounded-xl">
                                        {[1, 5, 10, 15, 20, 25, 28].map(day => (
                                            <SelectItem key={day} value={day.toString()} className="text-xs font-medium">
                                                Dia {day}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-[0.1em] text-center">Referente ao mês anterior</p>
                        </div>
                    </div>

                    {/* Content Options */}
                    <div className="p-8 rounded-[24px] bg-secondary/10 dark:bg-zinc-900/30 border border-border/10 space-y-6">
                        <div className="flex flex-col items-center gap-3 text-center md:flex-row md:text-left">
                            <div className="p-2 bg-secondary/50 rounded-full shrink-0">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Conteúdo</h3>
                        </div>

                        <div className="space-y-2">
                            {[
                                { key: 'include_sessions', label: 'Resumo de Sessões', desc: 'Frequência e datas' },
                                { key: 'include_payments', label: 'Resumo Financeiro', desc: 'Saldos e faturas' },
                                { key: 'include_notes_summary', label: 'Síntese Evolutiva', desc: 'Gerada por IA' },
                            ].map(item => (
                                <div key={item.key} className="flex items-center justify-between py-2 border-b border-border/5 last:border-0 hover:bg-white/5 px-2 rounded-lg transition-colors scale-95 origin-left">
                                    <div>
                                        <Label className="text-xs font-bold text-foreground">{item.label}</Label>
                                        <p className="text-[10px] text-muted-foreground font-medium">{item.desc}</p>
                                    </div>
                                    <Switch
                                        checked={(config as any)[item.key]}
                                        onCheckedChange={(checked) => setConfig(prev => ({ ...prev, [item.key]: checked }))}
                                        className="scale-90"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Email Template */}
                <div className="p-8 rounded-[32px] bg-secondary/10 dark:bg-zinc-900/30 border border-border/10 space-y-8">
                    <div className="flex flex-col items-center gap-3 text-center md:flex-row md:text-left">
                        <div className="p-2 bg-secondary/50 rounded-full shrink-0">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Template do E-mail</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2.5">
                            <Label className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest ml-1">Assunto do E-mail</Label>
                            <input
                                type="text"
                                value={config.email_subject}
                                onChange={(e) => setConfig(prev => ({ ...prev, email_subject: e.target.value }))}
                                className="w-full h-12 px-5 rounded-2xl bg-secondary/40 dark:bg-zinc-900 border border-border/10 text-sm text-foreground focus:border-primary/40 focus:outline-none transition-all shadow-inner font-medium"
                            />
                        </div>
                        <div className="space-y-2.5">
                            <Label className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest ml-1">Mensagem de Introdução</Label>
                            <textarea
                                value={config.email_intro}
                                onChange={(e) => setConfig(prev => ({ ...prev, email_intro: e.target.value }))}
                                rows={4}
                                className="w-full px-5 py-4 rounded-2xl bg-secondary/40 dark:bg-zinc-900 border border-border/10 text-sm text-foreground focus:border-primary/40 focus:outline-none resize-none transition-all shadow-inner font-medium leading-relaxed"
                                placeholder="Use {{patientName}} para inserir o nome do paciente"
                            />
                            <div className="flex items-center gap-4 mt-3">
                                <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">Variáveis:</span>
                                <div className="flex gap-2">
                                    <code className="text-[9px] px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">{"{{patientName}}"}</code>
                                    <code className="text-[9px] px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">{"{{month}}"}</code>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Test Button */}
                <div className="p-8 rounded-[32px] border border-dashed border-border/20 bg-secondary/5 flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
                    <div>
                        <h4 className="text-sm font-bold text-foreground">Simular Envio</h4>
                        <p className="text-xs text-muted-foreground font-medium mt-1">Receba uma cópia do relatório agora mesmo.</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleTestSend}
                        disabled={!isGoogleConnected}
                        className="h-11 px-6 border-border/20 bg-transparent hover:bg-secondary/40 text-xs font-bold uppercase tracking-widest rounded-xl transition-all w-full md:w-auto"
                    >
                        <Send className="h-4 w-4 mr-3" />
                        Enviar Teste
                    </Button>
                </div>
            </div>
        </motion.div>
    );
};

const Loader2 = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);
