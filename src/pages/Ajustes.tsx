import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { User, MessageSquare, Building, CreditCard, LogOut, Bell, CheckCircle2, ChevronRight, FileBarChart, Monitor, Moon, Sun, Shield, Wallet, Settings, ArrowLeft, Sparkles, Link2 } from "lucide-react";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { TodoistIcon } from "@/components/icons/TodoistIcon";
import { NotionIcon } from "@/components/icons/NotionIcon";
import { MicrosoftTodoIcon } from "@/components/icons/MicrosoftTodoIcon";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";

// Hooks
import { useGoogleAuth } from "@/hooks/use-google-auth";
import { useTodoistAuth } from "@/hooks/use-todoist-auth";
import { useNotionAuth } from "@/hooks/use-notion-auth";
import { useMicrosoftAuth } from "@/hooks/use-microsoft-auth";
import { useTheme } from "@/hooks/use-theme";
import { useProfile } from "@/hooks/use-profile";
import { useTour } from "@/components/onboarding/TourContext";

// Components
import { ProfessionalProfileForm } from "@/components/settings/ProfessionalProfileForm";
import { CommunicationSettings } from "@/components/settings/CommunicationSettings";
import { FiscalConfigPanel } from "@/components/settings/FiscalConfigPanel";
import { NeuroNexPayWizard } from "@/components/settings/NeuroNexPayWizard";
import { NeuroNexIDCard } from "@/components/settings/NeuroNexIDCard";

import { CallbackStatus } from "@/components/integrations/CallbackStatus";
import { supabase } from "@/integrations/supabase/client";

import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { MonthlyReportSettings } from "@/components/settings/MonthlyReportSettings";
import { SecuritySettingsPanel } from "@/components/settings/SecuritySettingsPanel";

import { useIsMobile } from "@/hooks/use-mobile";
import { MobileSettings } from "@/mobile/pages/MobileSettings";
import { OrganizationSettings } from "@/components/clinic/OrganizationSettings";
import { useOrganizations } from "@/hooks/use-organization";
import { useSubscription } from "@/context/SubscriptionContext";
import { UpgradePlanModal } from "@/components/dashboard/UpgradePlanModal";

const Ajustes = () => {
    const isMobile = useIsMobile();
    const { startTour } = useTour();
    const { isConnected: isGoogleConnected, isLoading: isLoadingGoogleAuth, connectGoogle, disconnectGoogle } = useGoogleAuth();
    const { isConnected: isTodoistConnected, isLoading: isLoadingTodoistAuth, connectTodoist, disconnectTodoist } = useTodoistAuth();
    const { isConnected: isNotionConnected, isLoading: isLoadingNotionAuth, connectNotion, disconnectNotion } = useNotionAuth();
    const { isConnected: isMicrosoftConnected, isLoading: isLoadingMicrosoftAuth, connectMicrosoft, disconnectMicrosoft } = useMicrosoftAuth();
    const { theme, toggleTheme } = useTheme();
    const { data: profile } = useProfile();
    const { canAccess, plan, status } = useSubscription();
    const { data: organizations } = useOrganizations();
    const currentOrganization = organizations?.[0];

    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [callbackStatus, setCallbackStatus] = useState<'success' | 'failure' | null>(null);
    const [callbackMessage, setCallbackMessage] = useState<string | undefined>(undefined);

    const params = new URLSearchParams(location.search);
    const getTabFromParams = () => {
        const requestedTab = params.get('tab') || 'profile';
        if (requestedTab === 'google') return 'integrations';
        return requestedTab;
    };
    const [activeTab, setActiveTab] = useState(getTabFromParams);

    useEffect(() => {
        const status = params.get('status') as 'success' | 'failure' | null;

        if (status) {
            setCallbackStatus(status);
            setCallbackMessage(params.get('message') || undefined);
            window.history.replaceState({}, document.title, location.pathname);
        }
    }, [location, navigate, queryClient]);

    useEffect(() => {
        setActiveTab(getTabFromParams());
    }, [location.search]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/auth');
    };

    const handleReplayTour = () => {
        toast.info("Reiniciando tour...");
        setTimeout(() => {
            startTour();
        }, 300);
    };

    const menuItems = [
        { val: "profile", label: "Meu Perfil", icon: User },
        { val: "security", label: "Segurança", icon: Shield },
        { val: "subscription", label: "Assinatura", icon: CreditCard },
        { val: "prefs", label: "Interface & Tour", icon: Monitor },
        // Only show Pagamentos for Professional/Enterprise
        ...(canAccess('advanced_finance') ? [
            { val: "payments", label: "Pagamentos", icon: Wallet },
        ] : []),
        { val: "notifications", label: "Notificações", icon: Bell },
        { val: "reports", label: "Relatórios", icon: FileBarChart },
        { val: "integrations", label: "Integrações", icon: Link2 },
        { val: "communication", label: "Comunicação", icon: MessageSquare },
        { val: "fiscal", label: "Dados Fiscais", icon: Building },
        // Enterprise plan only
        ...(canAccess('multiple_professionals') ? [
            { val: "organization", label: "Equipe/Clínica", icon: Building },
        ] : []),
    ];

    if (isMobile) return <MobileSettings />;
    if (callbackStatus) return <CallbackStatus status={callbackStatus} message={callbackMessage} onClose={() => setCallbackStatus(null)} />;

    return (
        <div className="w-full min-h-screen bg-background font-sans selection:bg-primary/20 flex">
            <div className="flex-1 pb-24 relative space-y-10">
                <div className="max-w-[1600px] mx-auto px-6 lg:px-8 xl:px-10 pt-16 relative z-10 space-y-12">
                    {/* Header - Floating Bar Style Polished */}
                    <div className="mb-12 relative z-40 w-full animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="w-full flex items-center justify-between p-1.5 pl-3 bg-white/80 dark:bg-zinc-950/60 backdrop-blur-3xl border border-zinc-200 dark:border-white/10 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.05)] ring-1 ring-black/5 dark:ring-white/5 relative overflow-hidden group">

                            {/* Subtle Inner Glow */}
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

                            {/* Left Side: Back & Title */}
                            <div className="flex items-center gap-5 relative z-10">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigate('/dashboard')}
                                    className="h-11 w-11 rounded-full bg-zinc-100 dark:bg-white/[0.03] hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all duration-300 border border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/20 active:scale-95 shadow-sm dark:shadow-inner"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>

                                <div className="flex flex-col justify-center h-full -space-y-1">
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                                        <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] leading-none">Configurações</span>
                                    </div>
                                    <h1 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none pt-1">Ajustes & Integrações</h1>
                                </div>
                            </div>

                            {/* Right Side: Quick Actions/Indicators */}
                            <div className="flex items-center gap-3 pr-2 relative z-10">
                                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-white/5 rounded-full border border-zinc-200 dark:border-white/5">
                                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Plano {plan}</span>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-white to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200 dark:border-white/10 flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                                    <Settings className="h-4 w-4 text-zinc-500 dark:text-zinc-300" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="animate-fade-up">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col md:flex-row gap-12">

                            {/* Sidebar Menu */}
                            <div className="w-full md:w-64 shrink-0 space-y-8">
                                <TabsList className="flex flex-col h-auto bg-transparent gap-1 w-full items-stretch p-0">
                                    {menuItems.map(item => (
                                        <TabsTrigger
                                            key={item.val}
                                            value={item.val}
                                            className={cn(
                                                "group relative justify-between px-4 py-3.5 rounded-2xl text-xs font-semibold transition-all duration-300 border border-transparent",
                                                "data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-foreground data-[state=active]:border-zinc-200 dark:data-[state=active]:border-white/10 data-[state=active]:shadow-lg dark:data-[state=active]:shadow-[0_4px_12px_rgba(0,0,0,0.2)]",
                                                "text-zinc-600 dark:text-muted-foreground hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/40"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 flex items-center justify-center group-data-[state=active]:bg-primary/10 group-data-[state=active]:border-primary/20 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none">
                                                    <item.icon className="h-3.5 w-3.5 text-zinc-400 dark:text-white/70 group-data-[state=active]:text-primary group-data-[state=active]:opacity-100" />
                                                </div>
                                                {item.label}
                                            </div>
                                            <ChevronRight className="h-3 w-3 opacity-0 group-data-[state=active]:opacity-100 -translate-x-2 group-data-[state=active]:translate-x-0 transition-all text-zinc-400 dark:text-muted-foreground" />
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                                <div className="pt-6 border-t border-zinc-200/60 dark:border-white/5 px-2">
                                    <Button onClick={handleLogout} variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-11 rounded-2xl px-3 text-xs font-bold transition-all">
                                        <LogOut className="h-4 w-4" /> Sair da Conta
                                    </Button>
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <AnimatePresence mode="wait">
                                    <div className="min-h-[700px] w-full bg-white/60 dark:bg-zinc-950/15 backdrop-blur-[40px] backdrop-saturate-[1.8] border border-zinc-200 dark:border-white/15 rounded-[48px] p-8 md:p-12 relative overflow-hidden shadow-[0_12px_48px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_128px_-16px_rgba(0,0,0,0.7)] ring-1 ring-black/5 dark:ring-white/10">

                                        {/* Texture Overlay (4K Fidelity) */}
                                        <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3column%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

                                        {/* Background Orbs - Monochromatic & High Fidelity */}
                                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 dark:bg-primary/10 blur-[150px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2 opacity-60" />
                                        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-zinc-200/40 dark:bg-zinc-100/5 blur-[150px] rounded-full pointer-events-none translate-y-1/2 -translate-x-1/2 opacity-40" />

                                        <TabsContent value="profile" className="mt-0 animate-in fade-in zoom-in-95 duration-500 relative z-10">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                                <div className="order-2 lg:order-1">
                                                    <ProfessionalProfileForm />
                                                </div>
                                                <div className="order-1 lg:order-2 bg-zinc-50/50 dark:bg-zinc-900/40 rounded-[40px] border border-zinc-200 dark:border-white/10 flex items-center justify-center p-8 backdrop-blur-md shadow-[inset_0_2px_12px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_12px_rgba(0,0,0,0.5)]">
                                                    <NeuroNexIDCard profile={profile} />
                                                </div>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="security" className="mt-0 animate-in fade-in zoom-in-95 duration-500 relative z-10"><SecuritySettingsPanel /></TabsContent>

                                        <TabsContent value="subscription" className="mt-0 animate-in fade-in zoom-in-95 duration-500 relative z-10">
                                            <div className="bg-zinc-50/50 dark:bg-zinc-900/40 rounded-[40px] border border-zinc-200 dark:border-white/10 p-12 text-center space-y-6 max-w-2xl mx-auto mt-8 shadow-2xl backdrop-blur-xl">
                                                <div className="w-20 h-20 bg-primary/10 rounded-[32px] border border-primary/30 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/10 ring-1 ring-white/5">
                                                    <CreditCard className="w-8 h-8 text-primary" />
                                                </div>
                                                <h3 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">Gerenciar Assinatura</h3>
                                                <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                                                    Você está no plano <span className="text-zinc-900 dark:text-white font-bold">{plan}</span>
                                                    {plan === 'Essential' && ' (Gratuito)'}.
                                                    {status === 'active' && plan !== 'Essential' && (
                                                        <span className="inline-flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800/50">
                                                            <CheckCircle2 className="w-3 h-3" /> Ativo
                                                        </span>
                                                    )}
                                                    {status === 'past_due' && (
                                                        <span className="inline-flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-800/50">
                                                            Pagamento Pendente
                                                        </span>
                                                    )}
                                                    {status === 'canceled' && (
                                                        <span className="inline-flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-800/50">
                                                            Cancelada
                                                        </span>
                                                    )}
                                                </p>

                                                {plan === 'Essential' ? (
                                                    <UpgradePlanModal currentPlan={plan}>
                                                        <Button className="rounded-full px-10 h-12 font-bold tracking-wide shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all hover:-translate-y-1 bg-primary text-primary-foreground border border-white/10">
                                                            Ver Planos Upgrade
                                                        </Button>
                                                    </UpgradePlanModal>
                                                ) : plan === 'Professional' ? (
                                                    <div className="flex flex-col items-center gap-4">
                                                        <UpgradePlanModal currentPlan={plan}>
                                                            <Button className="rounded-full px-10 h-12 font-bold tracking-wide shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all hover:-translate-y-1 bg-primary text-primary-foreground border border-white/10">
                                                                Upgrade para Enterprise
                                                            </Button>
                                                        </UpgradePlanModal>
                                                        <button className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 font-medium transition-colors underline underline-offset-4">
                                                            Gerenciar assinatura
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-zinc-400 font-medium">Plano Enterprise — contate o suporte para alterações.</p>
                                                )}
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="prefs" className="mt-0 animate-in fade-in zoom-in-95 duration-500 relative z-10">
                                            <div className="space-y-12 max-w-2xl">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <Monitor className="h-5 w-5 text-primary" />
                                                        <h3 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Aparência</h3>
                                                    </div>
                                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 font-medium">
                                                        Escolha o tema que melhor se adapta ao seu ambiente de trabalho.
                                                    </p>

                                                    <div className="theme-selector grid grid-cols-2 gap-6">
                                                        <button
                                                            onClick={() => theme !== 'dark' && toggleTheme()}
                                                            className={cn(
                                                                "relative group p-5 rounded-[32px] border transition-all duration-500 flex flex-col items-center gap-4 overflow-hidden shadow-2xl",
                                                                theme === 'dark'
                                                                    ? "bg-zinc-900/80 border-white/25 ring-1 ring-white/10"
                                                                    : "bg-zinc-900/20 border-white/10 hover:bg-zinc-900/40 hover:border-white/20"
                                                            )}
                                                        >
                                                            <div className="w-full aspect-video rounded-2xl bg-[#050505] border border-white/10 flex items-center justify-center relative overflow-hidden shadow-2xl ring-1 ring-white/5">
                                                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-purple-500/10" />
                                                                <Moon className="w-8 h-8 text-white relative z-10 group-hover:scale-110 transition-transform duration-700 ease-out" />
                                                            </div>
                                                            <span className={cn("text-xs font-bold tracking-wider uppercase", theme === 'dark' ? "text-primary" : "text-zinc-500")}>Modo Escuro (Liquid Glass)</span>
                                                        </button>

                                                        <button
                                                            onClick={() => theme !== 'light' && toggleTheme()}
                                                            className={cn(
                                                                "relative group p-5 rounded-[32px] border transition-all duration-500 flex flex-col items-center gap-4 overflow-hidden shadow-2xl",
                                                                theme === 'light'
                                                                    ? "bg-zinc-100 border-zinc-300 ring-1 ring-zinc-200"
                                                                    : "bg-zinc-900/20 border-white/10 hover:bg-zinc-900/40 hover:border-white/20"
                                                            )}
                                                        >
                                                            <div className="w-full aspect-video rounded-2xl bg-[#fafafa] border border-zinc-200 flex items-center justify-center relative overflow-hidden shadow-2xl ring-1 ring-zinc-100">
                                                                <Sun className="w-8 h-8 text-zinc-900 relative z-10 group-hover:rotate-90 transition-transform duration-1000 ease-in-out" />
                                                            </div>
                                                            <span className={cn("text-xs font-bold tracking-wider uppercase", theme === 'light' ? "text-primary" : "text-zinc-500")}>Modo Claro (Ceramic)</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="h-px bg-white/5" />

                                                <div>
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <Sparkles className="h-5 w-5 text-primary" />
                                                        <h3 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Onboarding & Tour</h3>
                                                    </div>
                                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 font-medium">
                                                        Reveja o tour guiado ou reconfigure suas informações iniciais.
                                                    </p>

                                                    <Button
                                                        onClick={handleReplayTour}
                                                        variant="outline"
                                                        className="h-12 px-8 rounded-full bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/15 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/15 font-bold transition-all shadow-xl hover:-translate-y-0.5"
                                                    >
                                                        Reiniciar Tour do Aplicativo
                                                    </Button>
                                                </div>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="communication" className="mt-0 animate-in fade-in zoom-in-95 duration-500 relative z-10"><CommunicationSettings /></TabsContent>
                                        <TabsContent value="fiscal" className="mt-0 animate-in fade-in zoom-in-95 duration-500 relative z-10"><FiscalConfigPanel /></TabsContent>

                                        <TabsContent value="notifications" className="mt-0 animate-in fade-in zoom-in-95 duration-500 relative z-10"><NotificationSettings /></TabsContent>
                                        <TabsContent value="reports" className="mt-0 animate-in fade-in zoom-in-95 duration-500 relative z-10"><MonthlyReportSettings /></TabsContent>

                                        <TabsContent value="payments" className="mt-0 animate-in fade-in zoom-in-95 duration-500 relative z-10">
                                            <NeuroNexPayWizard />
                                        </TabsContent>

                                        <TabsContent value="integrations" className="mt-0 animate-in fade-in zoom-in-95 duration-500 relative z-10">
                                            <div className="flex flex-col gap-10 max-w-2xl">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <Link2 className="h-5 w-5 text-primary" />
                                                        <h3 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Integrações</h3>
                                                    </div>
                                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                                                        Conecte seus aplicativos favoritos para sincronizar dados e automatizar seu fluxo de trabalho.
                                                    </p>
                                                </div>

                                                <div className="space-y-6">
                                                    {/* Google Workspace */}
                                                    <div className="p-8 rounded-[40px] bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-8 group shadow-2xl hover:shadow-primary/5 transition-all relative overflow-hidden backdrop-blur-lg">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl pointer-events-none opacity-40" />
                                                        <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
                                                            <div className={cn(
                                                                "w-16 h-16 rounded-[24px] flex items-center justify-center border transition-all duration-700 shadow-xl shrink-0 ring-1 ring-inset",
                                                                isGoogleConnected
                                                                    ? "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-white/30 ring-primary/15"
                                                                    : "bg-zinc-100 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 ring-transparent"
                                                            )}>
                                                                <GoogleIcon className="h-8 w-8" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-3">
                                                                    <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Google Workspace</h4>
                                                                    {isGoogleConnected && <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-500/30">Ativo</span>}
                                                                </div>
                                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium max-w-[200px]">
                                                                    Calendar, Drive, Meet e Gmail.
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            onClick={isGoogleConnected ? disconnectGoogle : connectGoogle}
                                                            disabled={isLoadingGoogleAuth}
                                                            variant={isGoogleConnected ? "outline" : "default"}
                                                            className={cn(
                                                                "h-10 px-6 rounded-xl text-[10px] font-bold uppercase tracking-wider w-full md:w-auto transition-all",
                                                                isGoogleConnected
                                                                    ? "bg-transparent border-white/20 hover:bg-destructive/15 hover:text-destructive hover:border-destructive/40 shadow-xl"
                                                                    : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/30 hover:-translate-y-0.5"
                                                            )}
                                                        >
                                                            {isGoogleConnected ? "Desconectar" : "Conectar"}
                                                        </Button>
                                                    </div>

                                                    {/* Todoist */}
                                                    <div className="p-8 rounded-[40px] bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-8 group shadow-2xl hover:shadow-red-500/5 transition-all relative overflow-hidden backdrop-blur-lg">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl pointer-events-none opacity-40" />
                                                        <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
                                                            <div className={cn(
                                                                "w-16 h-16 rounded-[24px] flex items-center justify-center border transition-all duration-700 shadow-2xl shrink-0 ring-1 ring-white/5",
                                                                isTodoistConnected
                                                                    ? "bg-zinc-950 border-white/30 ring-4 ring-red-500/15"
                                                                    : "bg-zinc-900/50 border-white/10 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100"
                                                            )}>
                                                                <TodoistIcon className="h-8 w-8" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-3">
                                                                    <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Todoist</h4>
                                                                    {isTodoistConnected && <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-500/30">Ativo</span>}
                                                                </div>
                                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium max-w-[200px]">
                                                                    Sincronize tarefas e projetos.
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            onClick={isTodoistConnected ? disconnectTodoist : connectTodoist}
                                                            disabled={isLoadingTodoistAuth}
                                                            variant={isTodoistConnected ? "outline" : "default"}
                                                            className={cn(
                                                                "h-10 px-6 rounded-xl text-[10px] font-bold uppercase tracking-wider w-full md:w-auto transition-all",
                                                                isTodoistConnected
                                                                    ? "bg-transparent border-white/20 hover:bg-destructive/15 hover:text-destructive hover:border-destructive/40 shadow-xl"
                                                                    : "bg-zinc-100 hover:bg-white text-zinc-950 shadow-2xl hover:-translate-y-0.5"
                                                            )}
                                                        >
                                                            {isTodoistConnected ? "Desconectar" : "Conectar"}
                                                        </Button>
                                                    </div>

                                                    {/* Notion */}
                                                    <div className="p-8 rounded-[40px] bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-8 group shadow-2xl hover:shadow-stone-500/5 transition-all relative overflow-hidden backdrop-blur-lg">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-stone-500/10 blur-3xl pointer-events-none opacity-40" />
                                                        <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
                                                            <div className={cn(
                                                                "w-16 h-16 rounded-[24px] flex items-center justify-center border transition-all duration-700 shadow-2xl shrink-0 ring-1 ring-white/5",
                                                                isNotionConnected
                                                                    ? "bg-zinc-950 border-white/30 ring-4 ring-stone-500/15"
                                                                    : "bg-zinc-900/50 border-white/10 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100"
                                                            )}>
                                                                <NotionIcon className="h-9 w-9 text-zinc-800 dark:text-white" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-3">
                                                                    <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Notion</h4>
                                                                    {isNotionConnected && <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-500/30">Ativo</span>}
                                                                </div>
                                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium max-w-[200px]">
                                                                    Sincronize páginas e bancos de dados.
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            onClick={isNotionConnected ? disconnectNotion : connectNotion}
                                                            disabled={isLoadingNotionAuth}
                                                            variant={isNotionConnected ? "outline" : "default"}
                                                            className={cn(
                                                                "h-10 px-6 rounded-xl text-[10px] font-bold uppercase tracking-wider w-full md:w-auto transition-all",
                                                                isNotionConnected
                                                                    ? "bg-transparent border-white/20 hover:bg-destructive/15 hover:text-destructive hover:border-destructive/40 shadow-xl"
                                                                    : "bg-stone-100 hover:bg-white text-stone-950 shadow-2xl hover:-translate-y-0.5"
                                                            )}
                                                        >
                                                            {isNotionConnected ? "Desconectar" : "Conectar"}
                                                        </Button>
                                                    </div>

                                                    {/* Microsoft To Do */}
                                                    <div className="p-8 rounded-[40px] bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-8 group shadow-2xl hover:shadow-blue-500/5 transition-all relative overflow-hidden backdrop-blur-lg">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl pointer-events-none opacity-40" />
                                                        <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
                                                            <div className={cn(
                                                                "w-16 h-16 rounded-[24px] flex items-center justify-center border transition-all duration-700 shadow-2xl shrink-0 ring-1 ring-white/5",
                                                                isMicrosoftConnected
                                                                    ? "bg-zinc-950 border-white/30 ring-4 ring-blue-500/15"
                                                                    : "bg-zinc-900/50 border-white/10 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100"
                                                            )}>
                                                                <MicrosoftTodoIcon className="h-8 w-8" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-3">
                                                                    <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Microsoft To Do</h4>
                                                                    {isMicrosoftConnected && <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-500/30">Ativo</span>}
                                                                </div>
                                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium max-w-[200px]">
                                                                    Sincronize suas tarefas do Outlook.
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            onClick={isMicrosoftConnected ? disconnectMicrosoft : connectMicrosoft}
                                                            disabled={isLoadingMicrosoftAuth}
                                                            variant={isMicrosoftConnected ? "outline" : "default"}
                                                            className={cn(
                                                                "h-10 px-6 rounded-xl text-[10px] font-bold uppercase tracking-wider w-full md:w-auto transition-all",
                                                                isMicrosoftConnected
                                                                    ? "bg-transparent border-white/20 hover:bg-destructive/15 hover:text-destructive hover:border-destructive/40 shadow-xl"
                                                                    : "bg-zinc-100 hover:bg-white text-zinc-950 shadow-2xl hover:-translate-y-0.5"
                                                            )}
                                                        >
                                                            {isMicrosoftConnected ? "Desconectar" : "Conectar"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </TabsContent>

                                        {/* Organization Settings - Clinic plan only */}
                                        {canAccess('multiple_professionals') && (
                                            <TabsContent value="organization" className="mt-0 animate-in fade-in zoom-in-95 duration-500 relative z-10">
                                                <OrganizationSettings organizationId={currentOrganization?.id} />
                                            </TabsContent>
                                        )}
                                    </div>
                                </AnimatePresence>
                            </div>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Ajustes;
