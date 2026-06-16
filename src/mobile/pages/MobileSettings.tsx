"use client";

import { useAuth } from "@/components/auth/SessionContextProvider";
import { OrganizationSettings } from "@/components/clinic/OrganizationSettings";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { useTour } from "@/components/onboarding/TourContext";
import { FiscalConfigPanel } from "@/components/settings/FiscalConfigPanel";
import { MonthlyReportSettings } from "@/components/settings/MonthlyReportSettings";
import { NeuroNexPayWizard } from "@/components/settings/NeuroNexPayWizard";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { ProfessionalProfileForm } from "@/components/settings/ProfessionalProfileForm";
import { SecuritySettingsPanel } from "@/components/settings/SecuritySettingsPanel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSubscription } from "@/context/SubscriptionContext";
import { useFinancialAccount } from "@/hooks/use-financial-account";
import { useGoogleAuth } from "@/hooks/use-google-auth";
import { useOrganizations } from "@/hooks/use-organization";
import { useProfile } from "@/hooks/use-profile";
import { useTheme } from "@/hooks/use-theme";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
    ArrowLeft,
    Bell,
    Building,
    CheckCircle2,
    ChevronRight,
    CreditCard,
    FileBarChart,
    Loader2,
    LogOut,
    Mail,
    MessageSquare,
    Monitor,
    Moon,
    Shield,
    Smartphone,
    Sparkles,
    Sun,
    User,
    Wallet,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
    MobileActionListItem,
    MobilePageHeader,
    MobilePageScaffold,
    MobileSectionHeader,
    MobileStatusBanner,
} from "../components/MobilePagePrimitives";

type SettingsView =
    | "main"
    | "profile"
    | "security"
    | "subscription"
    | "prefs"
    | "payments"
    | "notifications"
    | "reports"
    | "google"
    | "communication"
    | "fiscal"
    | "organization";

type MenuItem = {
    value: SettingsView;
    label: string;
    description: string;
    icon?: LucideIcon;
    customIcon?: ReactNode;
};

const VARIABLE_MAP = {
    "{{patientName}}": "[Nome]",
    "{{date}}": "[Data]",
    "{{time}}": "[Hora]",
    "{{confirmationLink}}": "[Link]",
    "{{amount}}": "[Valor]",
    "{{therapistName}}": "[Terapeuta]",
};

const REVERSE_VARIABLE_MAP = Object.fromEntries(
    Object.entries(VARIABLE_MAP).map(([full, short]) => [short, full]),
);

const VARIABLES = ["[Nome]", "[Data]", "[Hora]", "[Link]", "[Valor]", "[Terapeuta]"];

const PRESETS: Record<string, Record<string, string>> = {
    whatsapp: {
        appointment_reminder: "Olá [Nome]!\n\nLembrete da sua consulta em [Data], às [Hora].\n\nConfirme aqui: [Link]",
        payment_reminder: "Olá [Nome]!\n\nExiste uma sessão pendente de pagamento.\nValor: R$ [Valor]\nData: [Data]",
    },
    email: {
        appointment_reminder: "Olá [Nome],\n\nEste é um lembrete do seu agendamento em [Data], às [Hora].\nLink: [Link]\n\nAtenciosamente,\n[Terapeuta]",
        payment_reminder: "Olá [Nome],\n\nIdentificamos uma sessão pendente.\nData: [Data]\nValor: R$ [Valor]\n\nAtenciosamente,\n[Terapeuta]",
    },
    marketing: {
        appointment_reminder: "Olá [Nome]! Sua consulta será em [Data], às [Hora].",
        payment_reminder: "Olá [Nome]! Há um pagamento pendente no valor de R$ [Valor].",
    },
};

const toEditorTemplate = (body: string) => {
    let result = body;
    Object.entries(VARIABLE_MAP).forEach(([full, short]) => {
        result = result.split(full).join(short);
    });
    return result;
};

const SettingsPanel = ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={cn("mobile-settings-embedded min-w-0 overflow-hidden rounded-[20px] border border-border/40 bg-card/65 p-2 dark:border-white/10 dark:bg-white/[0.025]", className)}>
        {children}
    </div>
);

const SubviewHeader = ({ title, description, onBack }: { title: string; description?: string; onBack: () => void }) => (
    <MobilePageHeader
        eyebrow="Ajustes"
        title={title}
        description={description}
        leading={(
            <Button type="button" variant="outline" size="icon" onClick={onBack} className="h-10 w-10 rounded-[14px]">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Voltar</span>
            </Button>
        )}
    />
);

const CustomMenuItem = ({ item, onClick }: { item: MenuItem; onClick: () => void }) => {
    if (item.icon) {
        return (
            <MobileActionListItem
                icon={item.icon}
                title={item.label}
                description={item.description}
                onClick={onClick}
            />
        );
    }

    return (
        <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-[20px] border border-border/40 bg-card/72 p-3.5 text-left active:bg-foreground/[0.045] dark:border-white/10 dark:bg-white/[0.028]">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-white shadow-sm">
                {item.customIcon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-black text-foreground">{item.label}</p>
                <p className="mt-0.5 line-clamp-2 text-[10px] font-medium leading-relaxed text-muted-foreground/68">{item.description}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
        </button>
    );
};

export const MobileSettings = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { startTour } = useTour();
    const { canAccess } = useSubscription();
    const { data: organizations } = useOrganizations();
    const { data: profile } = useProfile();
    const financialAccount = useFinancialAccount();
    const { isConnected: isGoogleConnected, isLoading: googleLoading, connectGoogle, disconnectGoogle } = useGoogleAuth();
    const { preferences, updatePreferences, isSaving: preferencesSaving } = useUserPreferences();

    const [view, setView] = useState<SettingsView>("main");
    const [communicationChannel, setCommunicationChannel] = useState("whatsapp");
    const [communicationType, setCommunicationType] = useState("appointment_reminder");
    const [communicationTemplate, setCommunicationTemplate] = useState("");
    const [communicationLoading, setCommunicationLoading] = useState(false);

    const currentOrganization = organizations?.[0];
    const professionalPlan = canAccess("advanced_finance");

    useEffect(() => {
        if (!user || view !== "communication") return;
        let cancelled = false;

        const loadTemplate = async () => {
            setCommunicationLoading(true);
            const fallback = PRESETS[communicationChannel]?.[communicationType] || "";
            const { data, error } = await supabase
                .from("communication_templates")
                .select("body_html")
                .eq("user_id", user.id)
                .eq("template_key", `${communicationChannel}_${communicationType}`)
                .maybeSingle();

            if (cancelled) return;
            setCommunicationTemplate(error || !data?.body_html ? fallback : toEditorTemplate(data.body_html));
            setCommunicationLoading(false);
        };

        void loadTemplate();
        return () => {
            cancelled = true;
        };
    }, [communicationChannel, communicationType, user, view]);

    const savePreferences = async (updates: Parameters<typeof updatePreferences>[0]) => {
        try {
            await updatePreferences(updates);
            toast.success("Preferência salva.");
        } catch {
            toast.error("Não foi possível salvar a preferência.");
        }
    };

    const saveCommunication = async () => {
        if (!user) return;
        setCommunicationLoading(true);
        let databaseBody = communicationTemplate;
        Object.entries(REVERSE_VARIABLE_MAP).forEach(([short, full]) => {
            databaseBody = databaseBody.split(short).join(full);
        });

        try {
            const { error } = await supabase.from("communication_templates").upsert({
                user_id: user.id,
                template_key: `${communicationChannel}_${communicationType}`,
                subject: "Mensagem",
                body_html: databaseBody,
            }, { onConflict: "user_id, template_key" });
            if (error) throw error;
            toast.success("Modelo salvo.");
        } catch {
            toast.error("Não foi possível salvar o modelo.");
        } finally {
            setCommunicationLoading(false);
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        navigate("/auth");
    };

    const menuGroups: Array<{ title: string; items: MenuItem[] }> = [
        {
            title: "Conta",
            items: [
                { value: "profile", label: "Perfil profissional", description: "Dados pessoais, registro e apresentação.", icon: User },
                { value: "security", label: "Segurança e privacidade", description: "Senha, sessões e controles de acesso.", icon: Shield },
                { value: "subscription", label: "Plano e assinatura", description: "Recursos disponíveis no plano atual.", icon: CreditCard },
            ],
        },
        {
            title: "Sistema",
            items: [
                { value: "prefs", label: "Aparência e interface", description: "Tema, densidade, idioma e movimento.", icon: Monitor },
                { value: "notifications", label: "Alertas e notificações", description: "Escolha quais avisos deseja receber.", icon: Bell },
                { value: "google", label: "Google Sync", description: "Sincronização de agenda e serviços Google.", customIcon: <GoogleIcon className="h-5 w-5" /> },
                { value: "communication", label: "Modelos de mensagem", description: "Lembretes e cobranças reutilizáveis.", icon: MessageSquare },
            ],
        },
        {
            title: "Clínica e financeiro",
            items: [
                { value: "payments", label: "NeuroFinance", description: "Status da conta e acesso às operações.", icon: Wallet },
                { value: "reports", label: "Relatórios clínicos", description: "Configuração dos relatórios mensais.", icon: FileBarChart },
                { value: "fiscal", label: "Configuração fiscal", description: "Dados utilizados na emissão fiscal.", icon: Building },
                ...(canAccess("multiple_professionals") ? [{ value: "organization" as SettingsView, label: "Clínica e equipe", description: "Profissionais, organização e permissões.", icon: Building }] : []),
            ],
        },
    ];

    return (
        <MobilePageScaffold showBottomNavigation={view === "main"}>
            <AnimatePresence mode="wait" initial={false}>
                {view === "main" ? (
                    <motion.div key="settings-main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
                        <MobilePageHeader
                            eyebrow="Centro de controle"
                            title="Ajustes"
                            description="Preferências da conta, da clínica e das integrações."
                        />

                        <div className="space-y-5 pb-2">
                            {menuGroups.map((group) => (
                                <section key={group.title} className="space-y-2.5">
                                    <MobileSectionHeader title={group.title} />
                                    <div className="grid gap-2">
                                        {group.items.map((item) => (
                                            <CustomMenuItem key={item.value} item={item} onClick={() => setView(item.value)} />
                                        ))}
                                    </div>
                                </section>
                            ))}

                            <section className="space-y-2.5">
                                <MobileSectionHeader title="Sessão" />
                                <MobileActionListItem
                                    icon={LogOut}
                                    title="Encerrar sessão"
                                    description="Sair desta conta neste dispositivo."
                                    onClick={logout}
                                    destructive
                                />
                            </section>

                            <p className="pb-2 text-center text-[7px] font-black uppercase tracking-[0.18em] text-muted-foreground/35">NeuroNex Professional</p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key={view} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }} transition={{ duration: 0.16 }} className="pb-2">
                        {view === "profile" ? (
                            <>
                                <SubviewHeader title="Perfil profissional" description="Dados usados na sua conta e documentos." onBack={() => setView("main")} />
                                <SettingsPanel><ProfessionalProfileForm /></SettingsPanel>
                            </>
                        ) : null}

                        {view === "security" ? (
                            <>
                                <SubviewHeader title="Segurança" description="Proteção da conta e sessões conectadas." onBack={() => setView("main")} />
                                <SettingsPanel><SecuritySettingsPanel /></SettingsPanel>
                            </>
                        ) : null}

                        {view === "notifications" ? (
                            <>
                                <SubviewHeader title="Notificações" description="Configure os alertas que fazem sentido para sua rotina." onBack={() => setView("main")} />
                                <SettingsPanel><NotificationSettings /></SettingsPanel>
                            </>
                        ) : null}

                        {view === "reports" ? (
                            <>
                                <SubviewHeader title="Relatórios" description="Preferências dos relatórios clínicos mensais." onBack={() => setView("main")} />
                                <SettingsPanel><MonthlyReportSettings /></SettingsPanel>
                            </>
                        ) : null}

                        {view === "fiscal" ? (
                            <>
                                <SubviewHeader title="Fiscal" description="Dados usados em documentos e emissões fiscais." onBack={() => setView("main")} />
                                <SettingsPanel><FiscalConfigPanel /></SettingsPanel>
                            </>
                        ) : null}

                        {view === "organization" ? (
                            <>
                                <SubviewHeader title="Clínica e equipe" description="Organização, profissionais e permissões." onBack={() => setView("main")} />
                                <SettingsPanel><OrganizationSettings organizationId={currentOrganization?.id} /></SettingsPanel>
                            </>
                        ) : null}

                        {view === "subscription" ? (
                            <>
                                <SubviewHeader title="Plano e assinatura" description="Resumo dos recursos disponíveis para esta conta." onBack={() => setView("main")} />
                                <div className="space-y-3">
                                    <section className="rounded-[22px] border border-foreground bg-foreground p-5 text-background">
                                        <p className="text-[8px] font-black uppercase tracking-[0.16em] opacity-50">Plano atual</p>
                                        <h2 className="mt-2 text-2xl font-black tracking-[-0.045em]">{professionalPlan ? "Profissional" : "Essencial"}</h2>
                                        <p className="mt-3 text-xs font-medium leading-relaxed opacity-65">
                                            {professionalPlan ? "Recursos financeiros e avançados estão habilitados para esta conta." : "Os recursos essenciais de gestão clínica permanecem disponíveis."}
                                        </p>
                                    </section>
                                    <MobileStatusBanner variant="info" title="Cobrança protegida" description="Alterações de pagamento não são simuladas no aplicativo. Consulte o suporte ou o portal de cobrança quando precisar mudar o plano." />
                                </div>
                            </>
                        ) : null}

                        {view === "payments" ? (
                            <>
                                <SubviewHeader title="NeuroFinance" description="Status da conta financeira e acesso às operações." onBack={() => setView("main")} />
                                <div className="space-y-3">
                                    <section className="rounded-[24px] border border-border/40 bg-card/68 p-3 dark:border-white/10 dark:bg-white/[0.025]">
                                        <NeuroNexPayWizard isMobile onSuccess={() => void financialAccount.refetch()} />
                                    </section>
                                    <section className="rounded-[22px] border border-border/40 bg-card/68 p-5 dark:border-white/10 dark:bg-white/[0.025]">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("flex h-11 w-11 items-center justify-center rounded-[15px]", financialAccount.isConnected ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500")}>
                                                {financialAccount.isConnected ? <CheckCircle2 className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black uppercase tracking-[0.14em] text-muted-foreground/55">Situação</p>
                                                <p className="mt-1 text-[14px] font-black text-foreground">{financialAccount.isConnected ? "Conta conectada" : "Ativação pendente"}</p>
                                            </div>
                                        </div>
                                        <p className="mt-4 text-[10px] font-medium leading-relaxed text-muted-foreground/68">
                                            Titular: {[profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Não informado"}
                                        </p>
                                    </section>
                                    <Button onClick={() => navigate("/financeiro/neurofinance")} className="h-12 w-full rounded-[15px] text-[8px] font-black uppercase tracking-[0.12em]">
                                        Abrir NeuroFinance
                                    </Button>
                                </div>
                            </>
                        ) : null}

                        {view === "prefs" ? (
                            <>
                                <SubviewHeader title="Aparência" description="Tema, densidade e preferências de navegação." onBack={() => setView("main")} />
                                <div className="space-y-4">
                                    <section className="space-y-2">
                                        <MobileSectionHeader title="Tema" />
                                        <div className="grid grid-cols-2 gap-2.5">
                                            {[
                                                { value: "dark", label: "Escuro", icon: Moon },
                                                { value: "light", label: "Claro", icon: Sun },
                                            ].map((option) => (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => theme !== option.value && toggleTheme()}
                                                    className={cn(
                                                        "rounded-[18px] border p-4 text-left transition-colors",
                                                        theme === option.value
                                                            ? "border-foreground bg-foreground text-background"
                                                            : "border-border/40 bg-card/65 text-foreground dark:border-white/10 dark:bg-white/[0.025]",
                                                    )}
                                                >
                                                    <option.icon className="h-5 w-5" />
                                                    <p className="mt-4 text-[12px] font-black">{option.label}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="space-y-3 rounded-[20px] border border-border/40 bg-card/65 p-4 dark:border-white/10 dark:bg-white/[0.025]">
                                        <MobileSectionHeader title="Interface" />
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { value: "comfortable", label: "Normal" },
                                                { value: "compact", label: "Compacta" },
                                            ].map((option) => (
                                                <Button
                                                    key={option.value}
                                                    type="button"
                                                    variant={preferences?.density === option.value ? "default" : "outline"}
                                                    disabled={preferencesSaving || !preferences}
                                                    onClick={() => void savePreferences({ density: option.value as "comfortable" | "compact" })}
                                                    className="h-10 rounded-xl text-[8px] font-black uppercase tracking-[0.11em]"
                                                >
                                                    {option.label}
                                                </Button>
                                            ))}
                                        </div>

                                        <select
                                            value={preferences?.language || "pt-BR"}
                                            disabled={preferencesSaving || !preferences}
                                            onChange={(event) => void savePreferences({ language: event.target.value })}
                                            className="h-11 w-full rounded-xl border border-border/40 bg-background px-3 text-sm font-bold text-foreground outline-none"
                                        >
                                            <option value="pt-BR">Português (Brasil)</option>
                                            <option value="en-US">English (US)</option>
                                            <option value="es-ES">Español</option>
                                        </select>

                                        <select
                                            value={preferences?.timezone || "America/Sao_Paulo"}
                                            disabled={preferencesSaving || !preferences}
                                            onChange={(event) => void savePreferences({ timezone: event.target.value })}
                                            className="h-11 w-full rounded-xl border border-border/40 bg-background px-3 text-sm font-bold text-foreground outline-none"
                                        >
                                            <option value="America/Sao_Paulo">Fuso: São Paulo</option>
                                            <option value="America/Fortaleza">Fuso: Fortaleza</option>
                                            <option value="America/Manaus">Fuso: Manaus</option>
                                            <option value="America/Rio_Branco">Fuso: Rio Branco</option>
                                        </select>

                                        <div className="grid grid-cols-3 gap-2">
                                            <Button type="button" variant={preferences?.week_starts_on === 1 ? "default" : "outline"} disabled={preferencesSaving || !preferences} onClick={() => void savePreferences({ week_starts_on: 1 })} className="h-10 rounded-xl text-[7px] font-black uppercase">Segunda</Button>
                                            <Button type="button" variant={preferences?.week_starts_on === 0 ? "default" : "outline"} disabled={preferencesSaving || !preferences} onClick={() => void savePreferences({ week_starts_on: 0 })} className="h-10 rounded-xl text-[7px] font-black uppercase">Domingo</Button>
                                            <Button type="button" variant={preferences?.reduced_motion ? "default" : "outline"} disabled={preferencesSaving || !preferences} onClick={() => void savePreferences({ reduced_motion: !preferences?.reduced_motion })} className="h-10 rounded-xl text-[7px] font-black uppercase">Reduzir motion</Button>
                                        </div>
                                    </section>

                                    <Button type="button" variant="outline" onClick={() => { toast.info("Reiniciando tour..."); window.setTimeout(startTour, 250); }} className="h-11 w-full rounded-xl text-[8px] font-black uppercase tracking-[0.11em]">
                                        <Sparkles className="mr-2 h-4 w-4" /> Reiniciar tour
                                    </Button>
                                </div>
                            </>
                        ) : null}

                        {view === "communication" ? (
                            <>
                                <SubviewHeader title="Modelos de mensagem" description="Edite textos reutilizáveis sem enviar nada automaticamente." onBack={() => setView("main")} />
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-1 rounded-[16px] border border-border/40 bg-foreground/[0.025] p-1 dark:border-white/10">
                                        {[
                                            { value: "whatsapp", label: "WhatsApp", icon: MessageSquare },
                                            { value: "email", label: "E-mail", icon: Mail },
                                            { value: "marketing", label: "SMS", icon: Smartphone },
                                        ].map((option) => (
                                            <button key={option.value} type="button" onClick={() => setCommunicationChannel(option.value)} className={cn("flex min-h-10 items-center justify-center gap-1 rounded-[12px] text-[7px] font-black uppercase tracking-[0.08em]", communicationChannel === option.value ? "bg-foreground text-background" : "text-muted-foreground")}>
                                                <option.icon className="h-3.5 w-3.5" /> {option.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { value: "appointment_reminder", label: "Lembrete" },
                                            { value: "payment_reminder", label: "Cobrança" },
                                        ].map((option) => (
                                            <Button key={option.value} type="button" variant={communicationType === option.value ? "default" : "outline"} onClick={() => setCommunicationType(option.value)} className="h-10 rounded-xl text-[8px] font-black uppercase tracking-[0.1em]">
                                                {option.label}
                                            </Button>
                                        ))}
                                    </div>

                                    <Textarea
                                        value={communicationTemplate}
                                        onChange={(event) => setCommunicationTemplate(event.target.value)}
                                        disabled={communicationLoading}
                                        className="min-h-[210px] resize-none rounded-[18px] border-border/40 bg-card/65 p-4 text-sm leading-relaxed dark:border-white/10 dark:bg-white/[0.025]"
                                        placeholder="Escreva o modelo de mensagem..."
                                    />

                                    <div className="flex flex-wrap gap-1.5">
                                        {VARIABLES.map((variable) => (
                                            <button key={variable} type="button" onClick={() => setCommunicationTemplate((current) => `${current}${current ? " " : ""}${variable}`)} className="rounded-full border border-border/40 bg-card/65 px-3 py-2 text-[8px] font-black text-muted-foreground dark:border-white/10 dark:bg-white/[0.025]">
                                                {variable}
                                            </button>
                                        ))}
                                    </div>

                                    <Button type="button" onClick={saveCommunication} disabled={communicationLoading} className="h-12 w-full rounded-[15px] text-[8px] font-black uppercase tracking-[0.12em]">
                                        {communicationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar modelo"}
                                    </Button>
                                </div>
                            </>
                        ) : null}

                        {view === "google" ? (
                            <>
                                <SubviewHeader title="Google Sync" description="Sincronização da agenda com sua conta Google." onBack={() => setView("main")} />
                                <div className="space-y-3">
                                    <section className="rounded-[22px] border border-border/40 bg-card/68 p-5 text-center dark:border-white/10 dark:bg-white/[0.025]">
                                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-white shadow-sm">
                                            <GoogleIcon className="h-6 w-6" />
                                        </div>
                                        <h2 className="mt-4 text-lg font-black text-foreground">{isGoogleConnected ? "Google conectado" : "Conectar Google"}</h2>
                                        <p className="mt-2 text-[10px] font-medium leading-relaxed text-muted-foreground/68">
                                            {isGoogleConnected ? "A agenda pode ser sincronizada com os serviços autorizados." : "Autorize a integração para sincronizar sua agenda profissional."}
                                        </p>
                                    </section>
                                    {isGoogleConnected ? (
                                        <Button type="button" variant="outline" onClick={() => disconnectGoogle()} disabled={googleLoading} className="h-12 w-full rounded-[15px] text-[8px] font-black uppercase tracking-[0.12em] text-rose-500">
                                            {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Desconectar Google"}
                                        </Button>
                                    ) : (
                                        <Button type="button" onClick={connectGoogle} disabled={googleLoading} className="h-12 w-full rounded-[15px] text-[8px] font-black uppercase tracking-[0.12em]">
                                            {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Conectar Google"}
                                        </Button>
                                    )}
                                </div>
                            </>
                        ) : null}
                    </motion.div>
                )}
            </AnimatePresence>
        </MobilePageScaffold>
    );
};
