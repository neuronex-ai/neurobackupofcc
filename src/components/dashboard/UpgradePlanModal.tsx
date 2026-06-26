import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ArrowRight, Star, MessageCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PROFESSIONAL_PLAN_PRICE } from "@/lib/subscription-plans";
import {
    isValidCpfCnpjLength,
    normalizeCpfCnpj,
    startSubscriptionCheckout,
} from "@/lib/subscription-checkout";

interface PlanOffer {
    id: string;
    name: string;
    price: string;
    description: string;
    features: string[];
    popular?: boolean;
    cta: string;
}

interface UpgradePlanModalProps {
    currentPlan: string;
    children: React.ReactNode;
}

export const UpgradePlanModal = ({ currentPlan, children }: UpgradePlanModalProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [documentRequired, setDocumentRequired] = useState(false);
    const [cpfCnpj, setCpfCnpj] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setUserProfile({ ...user, ...profile });
            }
        };
        fetchProfile();
    }, []);

    const WHATSAPP_NUMBER = "5547988730611";
    const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá! Gostaria de saber mais sobre o plano Enterprise do NeuroNex.")}`;

    const plans: PlanOffer[] = [
        {
            id: 'Professional',
            name: "Professional",
            price: PROFESSIONAL_PLAN_PRICE,
            description: "A escolha ideal para consultórios em pleno crescimento.",
            popular: true,
            features: [
                "Pacientes ilimitados",
                "IA Copilot (Transcrição & Resumos)",
                "Telemedicina HD Ilimitada",
                "Gestão Financeira & NeuroFinance",
                "Portal do Paciente"
            ],
            cta: "Assinar Agora"
        },
        {
            id: 'Enterprise',
            name: "Enterprise",
            price: "Sob consulta",
            description: "Soluções sob medida, agentes IA humanizados, clínicas e mais.",
            features: [
                "Tudo do Profissional",
                "Múltiplos profissionais",
                "Agentes IA humanizados",
                "Dashboard administrativo",
                "API & Integrações avançadas",
                "Suporte prioritário dedicado"
            ],
            cta: "Falar com Especialista"
        }
    ];

    const availableUpgrades = currentPlan === 'Professional'
        ? plans.filter(p => p.id === 'Enterprise')
        : plans;

    const handlePlanAction = async (plan: PlanOffer) => {
        if (plan.id === 'Professional') {
            if (!userProfile) {
                toast.error("Você precisa estar logado para assinar.");
                return;
            }

            if (documentRequired && !isValidCpfCnpjLength(cpfCnpj)) {
                toast.error("Informe um CPF ou CNPJ valido para continuar.");
                return;
            }

            setIsLoading(true);
            try {
                const result = await startSubscriptionCheckout({
                    planId: 'Professional',
                    name: userProfile.first_name ? `${userProfile.first_name} ${userProfile.last_name}` : userProfile.email,
                    email: userProfile.email,
                    cpfCnpj: cpfCnpj ? normalizeCpfCnpj(cpfCnpj) : undefined,
                });

                if (result.url) {
                    window.location.href = result.url;
                    return;
                }

                if (result.requiresDocument || result.code === "customer_document_required") {
                    setDocumentRequired(true);
                    toast.error("Informe CPF/CNPJ para abrir o checkout.");
                    return;
                }

                if (result.trialEndsAt) {
                    toast.info("Seu teste gratis ainda esta ativo.");
                    return;
                }

                toast.error(result.error || "Erro ao iniciar pagamento. Tente novamente.");
            } catch (error: any) {
                console.error('Error creating checkout session:', error);
                toast.error("Erro ao iniciar pagamento. Tente novamente.");
            } finally {
                setIsLoading(false);
            }
        } else if (plan.id === 'Enterprise') {
            window.open(WHATSAPP_URL, '_blank');
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-[900px] p-0 overflow-hidden bg-white dark:bg-[#050505] border-zinc-200 dark:border-white/10 rounded-[40px] md:rounded-[56px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] max-h-[92vh] outline-none">

                {/* Scrollable Container with Premium Scrollbar Styling */}
                <div className={cn(
                    "relative h-full max-h-[92vh] overflow-y-auto scroll-smooth",
                    "scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent",
                    "hover:scrollbar-thumb-zinc-300 dark:hover:scrollbar-thumb-zinc-700 transition-colors",
                    "[&::-webkit-scrollbar]:w-1.5",
                    "[&::-webkit-scrollbar-track]:bg-transparent",
                    "[&::-webkit-scrollbar-thumb]:bg-zinc-200 dark:[&::-webkit-scrollbar-thumb]:bg-white/10",
                    "[&::-webkit-scrollbar-thumb]:rounded-full",
                    "[&::-webkit-scrollbar-thumb]:border-4",
                    "[&::-webkit-scrollbar-thumb]:border-transparent",
                    "hover:[&::-webkit-scrollbar-thumb]:bg-zinc-300 dark:hover:[&::-webkit-scrollbar-thumb]:bg-white/20"
                )}>

                    {/* --- Micro-Textures & Polish Layers --- */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
                    <div className="absolute top-0 left-0 w-full h-full opacity-[0.4] pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05)_0%,transparent_50%)]" />

                    <div className="relative p-8 md:p-14 lg:p-20 flex flex-col items-center">

                        {/* Header Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="text-center space-y-6 md:space-y-8 mb-12 md:mb-20 max-w-2xl"
                        >
                            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl ring-1 ring-white/10">
                                <Star className="w-3 h-3 fill-current animate-pulse" />
                                Upgrade de Experiência
                            </div>

                            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-black dark:text-white tracking-tighter leading-[0.85] md:leading-[0.8]">
                                Evolua sua prática <br />
                                <span className="text-zinc-300 dark:text-zinc-800">sem limites.</span>
                            </h2>

                            <p className="text-xs md:text-base text-zinc-500/80/80 dark:text-zinc-500/80/80 font-medium tracking-tight px-4 leading-relaxed">
                                Explore novos horizontes clínicos com ferramentas de última geração. Escolha o plano que ressoa com sua visão de futuro.
                            </p>
                        </motion.div>

                        {/* Plans Grid */}
                        <div className={cn(
                            "grid gap-6 md:gap-10 w-full mb-10",
                            availableUpgrades.length > 1 ? "md:grid-cols-2" : "max-w-md mx-auto"
                        )}>
                            {availableUpgrades.map((plan, i) => (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.2 + (i * 0.1), ease: [0.16, 1, 0.3, 1] }}
                                    className={cn(
                                        "relative group p-8 md:p-12 rounded-[40px] border transition-all duration-700 flex flex-col justify-between h-full overflow-hidden",
                                        plan.popular
                                            ? "bg-zinc-900 dark:bg-white border-transparent text-white dark:text-black shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] dark:shadow-[0_40px_80px_-20px_rgba(255,255,255,0.05)]"
                                            : "bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/10 text-black dark:text-white"
                                    )}
                                >
                                    {/* Card Glow */}
                                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-current opacity-[0.03] blur-[60px] rounded-full pointer-events-none" />

                                    {plan.popular && (
                                        <div className="absolute top-6 right-8 px-4 py-1.5 rounded-full bg-white dark:bg-zinc-900 text-black dark:text-white text-[8px] font-black uppercase tracking-[0.2em] shadow-2xl border border-zinc-100 dark:border-white/10">
                                            Líder de Assinaturas
                                        </div>
                                    )}

                                    <div className="space-y-10 md:space-y-14">
                                        <div className="space-y-4 md:space-y-6">
                                            <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40">{plan.name}</p>
                                            <div className="flex items-baseline gap-2">
                                                <h3 className="text-4xl md:text-5xl font-black tracking-tighter tabular-nums">{plan.price}</h3>
                                                {plan.id !== 'Enterprise' && <span className="text-[10px] font-black uppercase tracking-widest opacity-40">/mês</span>}
                                            </div>
                                            <p className="text-xs md:text-sm font-medium leading-relaxed opacity-60 max-w-[240px]">
                                                {plan.description}
                                            </p>
                                        </div>

                                        <div className="h-px bg-current opacity-[0.08]" />

                                        <div className="space-y-5">
                                            {plan.features.map((feature, idx) => (
                                                <div key={idx} className="flex items-start gap-4">
                                                    <div className={cn(
                                                        "mt-1 p-1 rounded-full",
                                                        plan.popular ? "bg-white/10 dark:bg-black/5" : "bg-zinc-200 dark:bg-white/5"
                                                    )}>
                                                        <Check className="w-3 h-3" />
                                                    </div>
                                                    <span className="text-[11px] md:text-xs font-bold tracking-tight leading-tight uppercase opacity-80">{feature}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {plan.id === 'Professional' && documentRequired && (
                                        <div className="pt-8 space-y-2">
                                            <Label htmlFor="upgrade-cpf-cnpj" className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                                                CPF ou CNPJ
                                            </Label>
                                            <Input
                                                id="upgrade-cpf-cnpj"
                                                inputMode="numeric"
                                                autoComplete="off"
                                                value={cpfCnpj}
                                                onChange={(event) => setCpfCnpj(event.target.value)}
                                                placeholder="Digite somente numeros"
                                                className={cn(
                                                    plan.popular
                                                        ? "border-white/20 bg-white/10 text-white dark:text-black placeholder:text-white/40 dark:placeholder:text-black/40"
                                                        : "border-zinc-200 dark:border-white/10"
                                                )}
                                            />
                                            <p className="text-[11px] font-medium leading-relaxed opacity-50">
                                                Necessario para criar seu cliente na Asaas pela conta mestra da NeuroNex.
                                            </p>
                                        </div>
                                    )}

                                    <div className="pt-12 md:pt-16">
                                        <Button
                                            onClick={() => handlePlanAction(plan)}
                                            disabled={isLoading && plan.id === 'Professional'}
                                            className={cn(
                                                "w-full h-14 md:h-16 rounded-2xl md:rounded-[24px] font-black uppercase tracking-[0.3em] text-[10px] md:text-[11px] group/btn transition-all duration-700 active:scale-95",
                                                plan.popular
                                                    ? "bg-white dark:bg-zinc-900 text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-2xl"
                                                    : "bg-zinc-900 dark:bg-white text-white dark:text-black hover:shadow-xl"
                                            )}>
                                            {isLoading && plan.id === 'Professional' ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    {plan.id === 'Enterprise' && <MessageCircle className="mr-2 w-4 h-4" />}
                                                    {plan.cta}
                                                    <ArrowRight className="ml-3 w-4 h-4 group-hover/btn:translate-x-1.5 transition-transform duration-500 ease-apple" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Footer Section */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1, delay: 0.6 }}
                            className="text-center pt-10 md:pt-16 space-y-6"
                        >
                            <button
                                onClick={() => window.open(WHATSAPP_URL, '_blank')}
                                className="inline-flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500/80/80 dark:text-zinc-500/80/80 hover:text-black dark:hover:text-white transition-all duration-500 group/concierge"
                            >
                                <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-white/5 group-hover/concierge:scale-110 transition-transform">
                                    <MessageCircle className="w-4 h-4" />
                                </div>
                                Precisa de um plano customizado? Fale conosco
                            </button>

                            <p className="text-[9px] text-zinc-400 dark:text-zinc-700 font-bold uppercase tracking-[0.2em] opacity-40">
                                NeuroNex © 2024 • Termos de Uso e Privacidade
                            </p>
                        </motion.div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
