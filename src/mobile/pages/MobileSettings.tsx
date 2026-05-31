"use client";

import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { Button } from "@/components/ui/button";
import { useGoogleAuth } from "@/hooks/use-google-auth";
import { useTheme } from "@/hooks/use-theme";
import { useFinancialAccount } from "@/hooks/use-financial-account";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowLeft, Banknote, Bell, Building, Calendar, CheckCircle2, ChevronRight, CreditCard, ExternalLink, FileBarChart, Loader2, LogOut, Mail, MessageSquare, Monitor, Moon, Shield, ShieldCheck,
    Smartphone, Sun, User, Wallet, ArrowRight, Sparkles
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MobileLayout } from "../components/MobileLayout";

// Components for Views
import { useAuth } from "@/components/auth/SessionContextProvider";
import { OrganizationSettings } from "@/components/clinic/OrganizationSettings";
import { useTour } from "@/components/onboarding/TourContext";
import { FiscalConfigPanel } from "@/components/settings/FiscalConfigPanel";
import { MonthlyReportSettings } from "@/components/settings/MonthlyReportSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { ProfessionalProfileForm } from "@/components/settings/ProfessionalProfileForm";
import { SecuritySettingsPanel } from "@/components/settings/SecuritySettingsPanel";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useSubscription } from "@/context/SubscriptionContext";
import { useOrganizations } from "@/hooks/use-organization";
import { useProfile } from "@/hooks/use-profile";

type SettingsView =
    | 'main'
    | 'profile'
    | 'security'
    | 'subscription'
    | 'prefs'
    | 'payments'
    | 'notifications'
    | 'reports'
    | 'google'
    | 'communication'
    | 'fiscal'
    | 'organization';

const MinimalHeader = ({ title, onBack }: { title: string, onBack: () => void }) => (
    <div className="flex items-center gap-5 mb-10 mt-2">
        <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={onBack}
            className="h-12 w-12 rounded-2xl bg-foreground/[0.03] dark:bg-white/[0.05] border border-border/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
        >
            <ArrowLeft className="w-6 h-6" />
        </motion.button>
        <div className="space-y-0.5">
            <h2 className="text-2xl font-black tracking-tighter text-foreground">{title}</h2>
            <div className="h-1 w-8 bg-primary rounded-full opacity-60" />
        </div>
    </div>
);

const VARIABLE_MAP = {
    "{{patientName}}": "[Nome]",
    "{{date}}": "[Data]",
    "{{time}}": "[Hora]",
    "{{confirmationLink}}": "[Link]",
    "{{amount}}": "[Valor]",
    "{{therapistName}}": "[Terapeuta]"
};

const VARIABLES = [
    { label: "Nome", code: "[Nome]", icon: User },
    { label: "Data", code: "[Data]", icon: null },
    { label: "Hora", code: "[Hora]", icon: null },
    { label: "Link", code: "[Link]", icon: ExternalLink },
    { label: "Valor", code: "[Valor]", icon: null },
    { label: "Terapeuta", code: "[Terapeuta]", icon: null }
];

const PRESETS: any = {
    whatsapp: {
        appointment_reminder: "Olá [Nome]! 👋\n\nLembrete da sua consulta:\n📅 [Data] às [Hora]\n\nConfirme aqui: [Link]\n\nAté breve!",
        payment_reminder: "Olá [Nome]! 💳\n\nIdentificamos uma sessão pendente de pagamento.\n\nValor: R$ [Valor]\nData da sessão: [Data]\n\nQualquer dúvida, estou à disposição!"
    },
    email: {
        appointment_reminder: "Prezado(a) [Nome],\n\nEste é um lembrete automático do seu agendamento.\n\nData: [Data]\nHorário: [Hora]\nLink da Sala: [Link]\n\nPor favor, confirme sua presença clicando no link acima.\n\nAtenciosamente,\n[Terapeuta]",
        payment_reminder: "Prezado(a) [Nome],\n\nIdentificamos uma sessão com pagamento pendente em sua conta.\n\nData da sessão: [Data]\nValor: R$ [Valor]\n\nPor favor, regularize o pagamento para manter seu acompanhamento em dia.\n\nAtenciosamente,\n[Terapeuta]"
    },
    marketing: {
        appointment_reminder: "Ei [Nome]! 🧠\n\nNão esqueça: sua consulta é amanhã!\n📅 [Data] às [Hora]\n\nTe vejo lá!",
        payment_reminder: "Olá [Nome]!\n\nVimos que há um pagamento pendente. Regularize para continuar seu acompanhamento!\n\nValor: R$ [Valor]"
    }
};

const REVERSE_VARIABLE_MAP = Object.fromEntries(
    Object.entries(VARIABLE_MAP).map(([k, v]) => [v, k])
);

export const MobileSettings = () => {
    const [view, setView] = useState<SettingsView>('main');
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const { startTour } = useTour();
    const { user } = useAuth(); 

    const handleReplayTour = () => {
        toast.info("Reiniciando tour...");
        setTimeout(() => { startTour(); }, 300);
    };

    const { canAccess } = useSubscription();
    const { data: organizations } = useOrganizations();
    const currentOrganization = organizations?.[0];
    const { isConnected: isGoogleConnected, isLoading: isLoadingGoogleAuth, connectGoogle, disconnectGoogle } = useGoogleAuth();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/auth');
    };

    const SettingsItem = ({ icon: Icon, label, onClick, isDestructive = false, customIcon = null }: any) => (
        <motion.button
            whileTap={{ scale: 0.98, backgroundColor: "rgba(0,0,0,0.02)" }}
            onClick={onClick}
            className={cn(
                "w-full p-4.5 rounded-[28px] border flex items-center justify-between group active:scale-[0.97] transition-all duration-300 relative overflow-hidden",
                isDestructive 
                    ? "bg-red-500/[0.03] border-red-500/10 dark:border-red-500/20" 
                    : "bg-white/40 dark:bg-white/[0.02] border-white/60 dark:border-white/5 backdrop-blur-md shadow-sm"
            )}
        >
            <div className="flex items-center gap-4 relative z-10">
                <div className={cn(
                    "w-12 h-12 rounded-[18px] flex items-center justify-center transition-all duration-300 shadow-sm",
                    isDestructive
                        ? "bg-red-500/10 text-red-500"
                        : "bg-foreground/[0.03] text-foreground/60 dark:bg-white/[0.05] dark:text-white/40 group-hover:scale-110"
                )}>
                    {customIcon ? customIcon : <Icon className="w-[22px] h-[22px]" strokeWidth={1.8} />}
                </div>
                <div className="flex flex-col items-start">
                    <span className={cn("font-bold text-[15px] tracking-tight", isDestructive ? "text-red-500" : "text-foreground")}>
                        {label}
                    </span>
                </div>
            </div>
            {!isDestructive && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-foreground/[0.02] dark:bg-white/[0.02]">
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5" />
                </div>
            )}
        </motion.button>
    );

    const [commsChannel, setCommsChannel] = useState("whatsapp");
    const [commsTemplateType, setCommsTemplateType] = useState("appointment_reminder");
    const [commsTemplate, setCommsTemplate] = useState("");
    const [commsLoading, setCommsLoading] = useState(false);

    const handleSaveComms = async () => {
        if (!user) return;
        setCommsLoading(true);
        let dbBody = commsTemplate;
        Object.entries(REVERSE_VARIABLE_MAP).forEach(([short, code]) => {
            dbBody = dbBody.split(short).join(code);
        });
        try {
            await supabase.from('communication_templates').upsert({
                user_id: user.id,
                template_key: `${commsChannel}_${commsTemplateType}`,
                subject: 'Mensagem',
                body_html: dbBody
            }, { onConflict: 'user_id, template_key' });
            toast.success("Modelo salvo!");
        } catch (e) {
            toast.error("Erro ao salvar.");
        } finally {
            setCommsLoading(false);
        }
    };

    const insertVariable = (code: string) => {
        setCommsTemplate(prev => prev + " " + code);
    };

    const { isConnected: isPaymentConnected } = useFinancialAccount();
    const disconnectBank = { mutate: () => toast.info('Para desconectar sua conta, entre em contato com o suporte.'), isPending: false };
    const { data: profile } = useProfile();

    const menuItems = [
        { val: "profile", label: "Perfil Profissional", icon: User },
        { val: "security", label: "Segurança & Privacidade", icon: Shield },
        { val: "subscription", label: "Plano & Assinatura", icon: CreditCard },
        { val: "prefs", label: "Aparência & Interface", icon: Monitor },
        { val: "payments", label: "NeuroFinance", icon: Wallet },
        { val: "notifications", label: "Alertas & Notificações", icon: Bell },
        { val: "reports", label: "Relatórios Clínicos", icon: FileBarChart },
        { val: "google", label: "Google Sync", icon: GoogleIcon, custom: true },
        { val: "communication", label: "Modelos de Mensagem", icon: MessageSquare },
        { val: "fiscal", label: "Configuração Fiscal", icon: Building },
    ];

    if (canAccess('multiple_professionals')) {
        menuItems.push({ val: "organization", label: "Clínica & Equipe", icon: Building });
    }

    const wrapperClass = "min-h-screen bg-background px-6 pt-4 pb-32 animate-in slide-in-from-right-8 duration-700";

    return (
        <MobileLayout className="px-0 min-h-screen bg-background">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
            </div>

            <AnimatePresence mode="wait">
                {view === 'main' && (
                    <motion.div
                        key="main"
                        initial={{ opacity: 0, x: -30, filter: "blur(10px)" }}
                        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, x: -30, filter: "blur(10px)" }}
                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                        className="px-6 pt-8 pb-32 space-y-12 relative z-10"
                    >
                        <div className="space-y-2">
                            <span className="text-[10px] font-black tracking-[0.4em] uppercase text-primary opacity-60">Centro de Controle</span>
                            <h1 className="text-4xl font-black text-foreground tracking-tighter leading-none">Ajustes</h1>
                            <p className="text-[13px] text-muted-foreground font-medium opacity-60">Personalize sua experiência NeuroNex.</p>
                        </div>

                        <div className="space-y-3.5">
                            {menuItems.map((item) => (
                                <SettingsItem
                                    key={item.val}
                                    icon={item.icon}
                                    label={item.label}
                                    onClick={() => setView(item.val as SettingsView)}
                                    customIcon={item.custom ? <GoogleIcon className="w-6 h-6" /> : null}
                                />
                            ))}
                            <div className="pt-6">
                                <SettingsItem icon={LogOut} label="Encerrar Sessão" onClick={handleLogout} isDestructive />
                            </div>
                        </div>

                        <div className="text-center pb-8 pt-4">
                            <p className="text-[10px] text-muted-foreground/30 font-black uppercase tracking-[0.3em]">NeuroNex • Professional Edition 2024</p>
                        </div>
                    </motion.div>
                )}

                {view !== 'main' && (
                    <motion.div
                        key={view}
                        initial={{ opacity: 0, x: 30, filter: "blur(10px)" }}
                        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, x: 30, filter: "blur(10px)" }}
                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                        className={cn(wrapperClass, "relative z-10")}
                    >
                        {view === 'profile' && (
                            <>
                                <MinimalHeader title="Meu Perfil" onBack={() => setView('main')} />
                                <div className="bg-white/40 dark:bg-white/[0.02] backdrop-blur-3xl border border-white/60 dark:border-white/5 p-2 rounded-[36px] shadow-2xl">
                                    <ProfessionalProfileForm />
                                </div>
                            </>
                        )}

                        {view === 'security' && (
                            <>
                                <MinimalHeader title="Segurança" onBack={() => setView('main')} />
                                <div className="bg-white/40 dark:bg-white/[0.02] backdrop-blur-3xl border border-white/60 dark:border-white/5 p-2 rounded-[36px] shadow-2xl">
                                    <SecuritySettingsPanel />
                                </div>
                            </>
                        )}

                        {view === 'communication' && (
                            <>
                                <MinimalHeader title="Mensagens" onBack={() => setView('main')} />
                                <div className="space-y-8">
                                    <div className="p-1.5 bg-foreground/[0.03] dark:bg-white/[0.03] rounded-2xl border border-border/5">
                                        <Tabs value={commsChannel} onValueChange={(v) => {
                                            setCommsChannel(v);
                                            if (PRESETS[v]) setCommsTemplate(PRESETS[v][commsTemplateType] || "");
                                        }} className="w-full">
                                            <TabsList className="bg-transparent h-11 p-0 w-full grid grid-cols-3 gap-1">
                                                {[
                                                    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
                                                    { id: 'email', label: 'E-mail', icon: Mail },
                                                    { id: 'marketing', label: 'SMS', icon: Smartphone }
                                                ].map(tab => (
                                                    <TabsTrigger
                                                        key={tab.id}
                                                        value={tab.id}
                                                        className="h-full rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-background dark:data-[state=active]:bg-white/10 data-[state=active]:text-foreground data-[state=active]:shadow-xl text-muted-foreground/60 transition-all duration-500 gap-2"
                                                    >
                                                        <tab.icon className="w-3.5 h-3.5" />
                                                        {tab.label}
                                                    </TabsTrigger>
                                                ))}
                                            </TabsList>
                                        </Tabs>
                                    </div>

                                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                        {[
                                            { id: 'appointment_reminder', label: 'Lembrete' },
                                            { id: 'payment_reminder', label: 'Cobrança' },
                                        ].map(type => (
                                            <button
                                                key={type.id}
                                                onClick={() => {
                                                    setCommsTemplateType(type.id);
                                                    if (PRESETS[commsChannel]) setCommsTemplate(PRESETS[commsChannel][type.id] || "");
                                                }}
                                                className={cn(
                                                    "px-5 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap",
                                                    commsTemplateType === type.id
                                                        ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20 scale-105"
                                                        : "bg-white/40 dark:bg-white/[0.02] border-white/60 dark:border-white/5 text-muted-foreground/80 hover:bg-secondary/50"
                                                )}
                                            >
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <label className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Editor de Modelo</label>
                                            <Sparkles className="w-3.5 h-3.5 text-primary opacity-40" />
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute -inset-1 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-focus-within:opacity-100 rounded-[32px] blur-xl transition-all duration-700" />
                                            <Textarea
                                                value={commsTemplate}
                                                onChange={(e) => setCommsTemplate(e.target.value)}
                                                className="relative min-h-[260px] bg-white/60 dark:bg-black/20 backdrop-blur-xl border-white/60 dark:border-white/10 rounded-[32px] p-6 text-[15px] font-medium leading-relaxed resize-none focus-visible:ring-2 focus-visible:ring-primary/10 shadow-inner"
                                                placeholder="Sua mensagem começa aqui..."
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] px-1">Tags Dinâmicas</label>
                                        <div className="flex flex-wrap gap-2.5">
                                            {VARIABLES.map(v => (
                                                <motion.button
                                                    key={v.code}
                                                    whileTap={{ scale: 0.92 }}
                                                    onClick={() => insertVariable(v.code)}
                                                    className="px-4 py-2.5 rounded-2xl bg-white/40 dark:bg-white/[0.02] border border-white/60 dark:border-white/5 hover:border-primary/30 hover:text-primary text-[11px] font-bold text-muted-foreground/80 transition-all uppercase tracking-wider flex items-center gap-2"
                                                >
                                                    {v.icon && <v.icon className="w-3.5 h-3.5 opacity-40" />}
                                                    {v.label}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleSaveComms}
                                        disabled={commsLoading}
                                        className="w-full h-16 rounded-[24px] font-black uppercase tracking-[0.2em] text-[12px] mt-6 shadow-2xl shadow-primary/20 active:scale-[0.98] transition-all bg-primary text-primary-foreground"
                                    >
                                        {commsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar Alterações"}
                                    </Button>
                                </div>
                            </>
                        )}

                        {view === 'fiscal' && (
                            <>
                                <MinimalHeader title="Fiscal" onBack={() => setView('main')} />
                                <div className="bg-white/40 dark:bg-white/[0.02] backdrop-blur-3xl border border-white/60 dark:border-white/5 p-2 rounded-[36px] shadow-2xl">
                                    <FiscalConfigPanel />
                                </div>
                            </>
                        )}

                        {view === 'notifications' && (
                            <>
                                <MinimalHeader title="Alertas" onBack={() => setView('main')} />
                                <div className="bg-white/40 dark:bg-white/[0.02] backdrop-blur-3xl border border-white/60 dark:border-white/5 p-2 rounded-[36px] shadow-2xl">
                                    <NotificationSettings />
                                </div>
                            </>
                        )}

                        {view === 'reports' && (
                            <>
                                <MinimalHeader title="Relatórios" onBack={() => setView('main')} />
                                <div className="bg-white/40 dark:bg-white/[0.02] backdrop-blur-3xl border border-white/60 dark:border-white/5 p-2 rounded-[36px] shadow-2xl">
                                    <MonthlyReportSettings />
                                </div>
                            </>
                        )}

                        {view === 'payments' && (
                            <>
                                <MinimalHeader title="NeuroFinance" onBack={() => setView('main')} />
                                <div className="space-y-10">
                                    <div className="relative overflow-hidden rounded-[48px] bg-[#0c0d0e] border border-white/10 p-12 text-center shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-blue-500/10 opacity-40" />
                                        <div className="relative z-10 flex flex-col items-center">
                                            <div className={cn(
                                                "w-24 h-24 rounded-[32px] flex items-center justify-center mb-8 shadow-2xl border-2 transition-all duration-700",
                                                isPaymentConnected ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-primary/10 border-primary/20 text-primary"
                                            )}>
                                                {isPaymentConnected ? <ShieldCheck className="w-12 h-12" /> : <Wallet className="w-12 h-12" />}
                                            </div>

                                            <h3 className="text-3xl font-black text-white mb-3 tracking-tighter">
                                                {isPaymentConnected ? "Operacional" : "Ativar Banco"}
                                            </h3>
                                            <p className="text-[13px] text-white/40 max-w-[240px] mx-auto leading-relaxed font-bold uppercase tracking-widest opacity-60">
                                                {isPaymentConnected
                                                    ? "Sua conta NeuroFinance está pronta para recebimentos PIX."
                                                    : "Acesse via computador para concluir sua verificação bancária."
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4">
                                        {isPaymentConnected ? (
                                            <Button
                                                onClick={() => disconnectBank.mutate()}
                                                disabled={disconnectBank.isPending}
                                                variant="outline"
                                                className="h-16 rounded-[24px] border-destructive/20 text-destructive font-black uppercase tracking-widest text-[11px] hover:bg-destructive/5"
                                            >
                                                {disconnectBank.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Desvincular Conta Profissional</>}
                                            </Button>
                                        ) : (
                                            <Button
                                                disabled={true}
                                                className="h-16 rounded-[24px] bg-foreground/5 border border-white/5 text-muted-foreground font-black uppercase tracking-[0.2em] text-[11px] opacity-40 cursor-not-allowed"
                                            >
                                                Utilize a Versão Desktop
                                            </Button>
                                        )}
                                    </div>

                                    <div className="p-6 bg-white/40 dark:bg-white/[0.02] backdrop-blur-xl rounded-[32px] border border-white/60 dark:border-white/5 flex items-center gap-5 shadow-sm">
                                        <div className="w-14 h-14 rounded-2xl bg-foreground/[0.03] dark:bg-white/[0.05] flex items-center justify-center shrink-0">
                                            <User className="w-6 h-6 text-muted-foreground/40" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Titular Responsável</p>
                                            <p className="text-lg font-bold text-foreground tracking-tight leading-none">{profile?.first_name} {profile?.last_name}</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {view === 'prefs' && (
                            <>
                                <MinimalHeader title="Aparência" onBack={() => setView('main')} />
                                <div className="space-y-12">
                                    <div className="space-y-6">
                                        <div className="px-1">
                                            <h3 className="text-2xl font-black text-foreground tracking-tighter">Tema Visual</h3>
                                            <p className="text-[13px] text-muted-foreground font-medium opacity-60">Escolha como o NeuroNex se apresenta.</p>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <motion.button
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => theme !== 'dark' && toggleTheme()}
                                                className={cn(
                                                    "w-full p-6 rounded-[36px] border transition-all duration-700 flex items-center justify-between group shadow-sm",
                                                    theme === 'dark' 
                                                        ? "bg-foreground text-background shadow-2xl scale-[1.02]" 
                                                        : "bg-white/40 dark:bg-white/[0.02] border-white/60 dark:border-white/5"
                                                )}
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className={cn(
                                                        "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-700 shadow-xl", 
                                                        theme === 'dark' ? "bg-background text-foreground" : "bg-foreground/[0.03] text-muted-foreground"
                                                    )}>
                                                        <Moon className="w-7 h-7" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-lg font-black tracking-tighter uppercase">Deep Dark</p>
                                                        <p className={cn("text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60", theme === 'dark' ? "text-background" : "text-muted-foreground")}>Premium Night</p>
                                                    </div>
                                                </div>
                                                {theme === 'dark' && (
                                                    <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-foreground" />
                                                    </div>
                                                )}
                                            </motion.button>

                                            <motion.button
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => theme !== 'light' && toggleTheme()}
                                                className={cn(
                                                    "w-full p-6 rounded-[36px] border transition-all duration-700 flex items-center justify-between group shadow-sm",
                                                    theme === 'light' 
                                                        ? "bg-foreground text-background shadow-2xl scale-[1.02]" 
                                                        : "bg-white/40 dark:bg-white/[0.02] border-white/60 dark:border-white/5"
                                                )}
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className={cn(
                                                        "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-700 shadow-xl", 
                                                        theme === 'light' ? "bg-background text-foreground" : "bg-foreground/[0.03] text-muted-foreground"
                                                    )}>
                                                        <Sun className="w-7 h-7" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-lg font-black tracking-tighter uppercase">Ceramic White</p>
                                                        <p className={cn("text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60", theme === 'light' ? "text-background" : "text-muted-foreground")}>Studio Light</p>
                                                    </div>
                                                </div>
                                                {theme === 'light' && (
                                                    <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-foreground" />
                                                    </div>
                                                )}
                                            </motion.button>
                                        </div>
                                    </div>

                                    <div className="h-px bg-gradient-to-r from-transparent via-border/10 to-transparent" />

                                    <div className="space-y-6">
                                        <div className="px-1">
                                            <h3 className="text-2xl font-black text-foreground tracking-tighter">Guia & Onboarding</h3>
                                            <p className="text-[13px] text-muted-foreground font-medium opacity-60">Revise as funcionalidades principais.</p>
                                        </div>
                                        <Button 
                                            onClick={handleReplayTour} 
                                            variant="outline" 
                                            className="w-full h-16 bg-white/40 dark:bg-white/[0.02] backdrop-blur-md border-white/60 dark:border-white/5 text-foreground hover:bg-foreground/[0.02] rounded-[24px] font-black uppercase tracking-[0.2em] text-[11px] shadow-sm active:scale-[0.98] transition-all"
                                        >
                                            Reiniciar Tour do Sistema
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}

                        {view === 'subscription' && (
                            <>
                                <MinimalHeader title="Assinatura" onBack={() => setView('main')} />
                                <div className="bg-[#0c0d0e] rounded-[52px] border border-white/10 p-12 text-center space-y-10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] group-hover:bg-primary/30 transition-colors duration-1000" />
                                    <div className="w-28 h-28 bg-white/5 rounded-[40px] flex items-center justify-center mx-auto mb-8 relative z-10 shadow-2xl border border-white/10">
                                        <CreditCard className="w-14 h-14 text-white" />
                                    </div>
                                    <div className="relative z-10">
                                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-3 block">Plano Atual</span>
                                        <h3 className="text-5xl font-black text-white tracking-tighter mb-2">Essential</h3>
                                        <p className="text-[12px] text-white/40 font-bold uppercase tracking-[0.2em] opacity-80">Assinatura Ativa • Renovação em 22/10</p>
                                    </div>
                                    <Button className="w-full rounded-[28px] bg-white text-black hover:bg-white/90 font-black uppercase tracking-[0.2em] h-16 shadow-2xl active:scale-[0.98] transition-all">Gerenciar Pagamento</Button>
                                    
                                    <div className="flex items-center justify-center gap-3 pt-4 relative z-10 opacity-40">
                                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                        <p className="text-[10px] font-black text-white uppercase tracking-[0.1em]">Encriptação Bancária Asaas</p>
                                    </div>
                                </div>
                            </>
                        )}

                        {view === 'google' && (
                            <>
                                <MinimalHeader title="Sincronização" onBack={() => setView('main')} />
                                <div className="rounded-[52px] bg-white/40 dark:bg-[#0c0d0e]/40 backdrop-blur-3xl border border-white/60 dark:border-white/5 p-10 overflow-hidden relative shadow-2xl group">
                                    <div className={cn("absolute -top-32 -right-32 w-80 h-80 rounded-full blur-[120px] transition-all duration-1000", isGoogleConnected ? "bg-blue-500/10" : "bg-primary/5")} />
                                    <div className="relative z-10 flex flex-col items-center text-center">
                                        <div className={cn("w-28 h-28 rounded-[40px] flex items-center justify-center border-2 mb-10 shadow-2xl transition-all duration-700 relative", isGoogleConnected ? "bg-white border-white/10 shadow-blue-500/10" : "bg-foreground/[0.03] dark:bg-white/[0.05] border-border/10 grayscale opacity-40")}>
                                            <GoogleIcon className="h-12 w-12" />
                                            {isGoogleConnected && <div className="absolute -bottom-3 -right-3 bg-emerald-500 text-white p-2.5 rounded-full border-[6px] border-[#0c0d0e] shadow-xl"><CheckCircle2 className="w-4 h-4" /></div>}
                                        </div>
                                        <h2 className="text-3xl font-black text-foreground mb-3 tracking-tighter">Google Workspace</h2>
                                        <p className="text-[14px] text-muted-foreground font-medium max-w-[260px] mb-12 leading-relaxed opacity-60">
                                            {isGoogleConnected ? "Conexão estabelecida. Seus agendamentos estão sendo sincronizados." : "Vincule sua conta para automatizar sua agenda e contatos profissionais."}
                                        </p>

                                        {isGoogleConnected && (
                                            <div className="grid grid-cols-2 gap-4 w-full mb-12">
                                                <div className="p-5 rounded-[28px] bg-foreground/[0.02] dark:bg-white/[0.03] border border-border/5 flex flex-col items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center"><Calendar className="w-5 h-5 text-blue-500" /></div>
                                                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Calendar</p>
                                                </div>
                                                <div className="p-5 rounded-[28px] bg-foreground/[0.02] dark:bg-white/[0.03] border border-border/5 flex flex-col items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center"><Mail className="w-5 h-5 text-red-500" /></div>
                                                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Gmail API</p>
                                                </div>
                                            </div>
                                        )}

                                        {isGoogleConnected ? (
                                            <Button variant="ghost" onClick={() => disconnectGoogle()} disabled={isLoadingGoogleAuth} className="w-full h-16 rounded-[24px] text-rose-500 hover:bg-rose-500/10 font-black text-[11px] uppercase tracking-[0.2em] border border-rose-500/10 active:scale-[0.98] transition-all">
                                                {isLoadingGoogleAuth ? <Loader2 className="w-4 h-4 animate-spin" /> : "Encerrar Integração"}
                                            </Button>
                                        ) : (
                                            <Button onClick={connectGoogle} disabled={isLoadingGoogleAuth} className="w-full h-16 rounded-[28px] bg-foreground text-background font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl active:scale-[0.98] transition-all">
                                                {isLoadingGoogleAuth ? <Loader2 className="w-4 h-4 animate-spin" /> : "Vincular Google Profissional"}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {view === 'organization' && (
                            <>
                                <MinimalHeader title="Clínica" onBack={() => setView('main')} />
                                <div className="bg-white/40 dark:bg-white/[0.02] backdrop-blur-3xl border border-white/60 dark:border-white/5 p-2 rounded-[36px] shadow-2xl">
                                    <OrganizationSettings organizationId={currentOrganization?.id} />
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </MobileLayout>
    );
};