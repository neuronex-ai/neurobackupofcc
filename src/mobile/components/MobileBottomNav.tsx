"use client";

import { useAuth } from "@/components/auth/SessionContextProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar, DollarSign, Home, LogOut, Menu, Settings, Sparkles,
    X, LogIn, Instagram, Linkedin, Twitter
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { WaitlistModal } from "@/components/landing/WaitlistModal";

export const MobileBottomNav = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [waitlistOpen, setWaitlistOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { data: profile } = useProfile();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const publicRoutes = ["/", "/auth", "/pricing", "/sobre", "/contato"];
    const isPublicRoute = publicRoutes.includes(location.pathname) || !user;

    const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Usuário';
    const initials = fullName.substring(0, 2).toUpperCase();

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) {
            toast.success("Até logo.");
            navigate('/auth');
        }
    };

    const sideMenuItems = [
        { label: "Painel", href: "/dashboard" },
        { label: "Agenda", href: "/agenda" },
        { label: "Pacientes", href: "/pacientes" },
        { label: "Teleconsulta", href: "/teleconsulta" },
        { label: "Notas", href: "/notas" },
        { label: "Financeiro", href: "/financeiro" },
        { label: "Synapse AI", href: "/synapse-ai" },
        { label: "Integrações", href: "/integracoes" },
        { label: "Configurações", href: "/ajustes" },
    ];

    const publicMenuItems = [
        { label: "Início", href: "/" },
        { label: "Funcionalidades", href: "/#features" },
        { label: "Preços", href: "/pricing" },
        { label: "Sobre", href: "/sobre" },
        { label: "Contato", href: "/contato" },
    ];

    const mainNavItems = [
        { label: "Início", href: "/dashboard", icon: Home },
        { label: "Agenda", href: "/agenda", icon: Calendar },
        { label: "Synapse", href: "/synapse-ai", icon: Sparkles, floating: true },
        { label: "Banco", href: "/financeiro", icon: DollarSign },
    ];

    const menuToRender = isPublicRoute ? publicMenuItems : sideMenuItems;

    const springConfig = { type: "spring" as const, stiffness: 450, damping: 35 };

    return (
        <>
            {isPublicRoute && (
                <div className={cn(
                    "fixed top-0 right-0 z-[120] md:hidden flex items-center h-24 px-6 gap-2 transition-all duration-500",
                    scrolled ? "h-20" : "h-24"
                )}>
                    <ThemeToggle />
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className={cn(
                            "relative w-11 h-11 rounded-full flex items-center justify-center border transition-all duration-300 active:scale-90 shadow-xl backdrop-blur-xl",
                            "bg-white/10 dark:bg-white/5 border-white/10 hover:bg-white/20 text-foreground"
                        )}
                    >
                        <Menu className="w-5.5 h-5.5" />
                    </button>
                </div>
            )}

            <AnimatePresence>
                {!isPublicRoute && (
                    <motion.nav
                        initial={false}
                        animate={{ y: 0, opacity: 1, x: "-50%" }}
                        className="fixed bottom-8 left-1/2 z-[100] md:hidden w-[calc(100%-2.5rem)] max-w-[420px]"
                    >
                        <div className="relative group">
                            <div className="absolute -inset-1.5 bg-primary/5 rounded-[40px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                            
                            <div className={cn(
                                "relative bg-background/60 dark:bg-[#0c0d0e]/70 backdrop-blur-[24px] rounded-[30px] px-2 py-1.5 flex items-center justify-between",
                                "border border-white/15 dark:border-white/5 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.25)]"
                            )}>
                                {/* Esquerda */}
                                <div className="flex items-center gap-0.5 flex-1 justify-around">
                                    {mainNavItems.slice(0, 2).map((item) => {
                                        const Icon = item.icon!;
                                        const isActive = location.pathname === item.href;
                                        return (
                                            <Link
                                                key={item.href}
                                                to={item.href}
                                                className={cn(
                                                    "relative flex flex-col items-center justify-center w-13 h-11 rounded-2xl transition-all duration-300 active:scale-90",
                                                    isActive ? "text-primary" : "text-muted-foreground/70 hover:text-foreground"
                                                )}
                                            >
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="mobile-nav-pill"
                                                        className="absolute inset-0 bg-primary/[0.08] dark:bg-primary/[0.12] rounded-2xl"
                                                        transition={springConfig}
                                                    />
                                                )}
                                                <motion.div
                                                    animate={isActive ? { y: -1, scale: 1.05 } : { y: 0, scale: 1 }}
                                                    transition={springConfig}
                                                >
                                                    <Icon className={cn("w-[21px] h-[21px]", isActive ? "stroke-[2.5px]" : "stroke-[1.8px]")} />
                                                </motion.div>
                                                <span className={cn(
                                                    "text-[8.5px] font-bold tracking-tight mt-0.5 transition-colors duration-300",
                                                    isActive ? "opacity-100" : "opacity-50"
                                                )}>
                                                    {item.label}
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>

                                {/* Centro - Synapse AI (Reduzido para 58px) */}
                                <div className="relative -mt-9 mx-1 z-20">
                                    <Link
                                        to="/synapse-ai"
                                        className="group/btn relative block"
                                    >
                                        <div className="absolute -inset-1 bg-primary/20 rounded-full blur-md opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                                        <div className={cn(
                                            "w-[58px] h-[58px] rounded-full flex items-center justify-center transition-all duration-500",
                                            "bg-gradient-to-br from-primary via-primary/95 to-primary/80",
                                            "shadow-[0_10px_20px_-5px_rgba(var(--primary),0.4)] active:scale-90 group-hover/btn:shadow-[0_12px_24px_-8px_rgba(var(--primary),0.5)]",
                                            "border-[1.5px] border-white/20"
                                        )}>
                                            <motion.div
                                                animate={{ 
                                                    rotate: location.pathname === "/synapse-ai" ? 180 : 0,
                                                    scale: location.pathname === "/synapse-ai" ? 1.05 : 1
                                                }}
                                                transition={springConfig}
                                            >
                                                <Sparkles className="w-6 h-6 text-primary-foreground drop-shadow-sm" strokeWidth={2.5} />
                                            </motion.div>
                                        </div>
                                    </Link>
                                </div>

                                {/* Direita */}
                                <div className="flex items-center gap-0.5 flex-1 justify-around">
                                    {mainNavItems.slice(3).map((item) => {
                                        const Icon = item.icon!;
                                        const isActive = location.pathname === item.href;
                                        return (
                                            <Link
                                                key={item.href}
                                                to={item.href}
                                                className={cn(
                                                    "relative flex flex-col items-center justify-center w-13 h-11 rounded-2xl transition-all duration-300 active:scale-90",
                                                    isActive ? "text-primary" : "text-muted-foreground/70 hover:text-foreground"
                                                )}
                                            >
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="mobile-nav-pill"
                                                        className="absolute inset-0 bg-primary/[0.08] dark:bg-primary/[0.12] rounded-2xl"
                                                        transition={springConfig}
                                                    />
                                                )}
                                                <motion.div
                                                    animate={isActive ? { y: -1, scale: 1.05 } : { y: 0, scale: 1 }}
                                                    transition={springConfig}
                                                >
                                                    <Icon className={cn("w-[21px] h-[21px]", isActive ? "stroke-[2.5px]" : "stroke-[1.8px]")} />
                                                </motion.div>
                                                <span className={cn(
                                                    "text-[8.5px] font-bold tracking-tight mt-0.5 transition-colors duration-300",
                                                    isActive ? "opacity-100" : "opacity-50"
                                                )}>
                                                    {item.label}
                                                </span>
                                            </Link>
                                        );
                                    })}

                                    <button
                                        onClick={() => setSidebarOpen(true)}
                                        className="relative flex flex-col items-center justify-center w-13 h-11 rounded-2xl transition-all duration-300 active:scale-90 text-muted-foreground/70 hover:text-foreground"
                                    >
                                        <Menu className="w-[21px] h-[21px] stroke-[1.8px]" />
                                        <span className="text-[8.5px] font-bold tracking-tight mt-0.5 opacity-50">Menu</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.nav>
                )}
            </AnimatePresence>

            {/* Sidebar Full Screen */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 10 }}
                        transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
                        className="fixed inset-0 z-[200] bg-background md:hidden flex flex-col overflow-hidden"
                    >
                        <div className="absolute inset-0 premium-noise opacity-[0.02] pointer-events-none" />

                        <div className="flex items-center justify-between p-6 pb-4 relative z-10">
                            <span className="text-[10px] font-black tracking-[0.4em] uppercase opacity-30">Navegação Principal</span>
                            <div className="flex items-center gap-3">
                                {!isPublicRoute && <ThemeToggle />}
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="w-10 h-10 rounded-full bg-foreground/[0.03] border border-border/10 flex items-center justify-center text-foreground hover:bg-foreground/[0.06] active:scale-90 transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {!isPublicRoute && (
                            <div className="px-6 py-4 relative z-10">
                                <Link to="/ajustes" onClick={() => setSidebarOpen(false)}>
                                    <div className="flex items-center gap-4 p-4 rounded-[24px] bg-foreground/[0.02] border border-border/5 hover:bg-foreground/[0.04] transition-all group">
                                        <Avatar className="h-14 w-14 border-2 border-background shadow-xl">
                                            <AvatarImage src={profile?.avatar_url || ''} />
                                            <AvatarFallback className="bg-primary/10 text-primary text-base font-bold">{initials}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xl font-bold text-foreground tracking-tight truncate">{fullName}</p>
                                            <p className="text-xs text-muted-foreground truncate opacity-70">{user?.email}</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-foreground/40 shadow-sm group-active:scale-90 transition-all">
                                            <Settings className="w-5 h-5" />
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        )}

                        <div className="flex-1 px-6 py-4 space-y-1 overflow-y-auto custom-scrollbar relative z-10">
                            {menuToRender.map((item, i) => {
                                const isActive = location.pathname === item.href;
                                return (
                                    <motion.div
                                        key={item.label}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.03 + 0.1, ease: "easeOut" }}
                                    >
                                        <Link
                                            to={item.href}
                                            onClick={() => setSidebarOpen(false)}
                                            className={cn(
                                                "flex items-center justify-between px-6 py-4 rounded-[20px] transition-all duration-300 active:scale-[0.97] group",
                                                isActive
                                                    ? "bg-foreground text-background shadow-lg shadow-foreground/5"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.03]"
                                            )}
                                        >
                                            <span className="text-[17px] font-bold tracking-tight">{item.label}</span>
                                            {!isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary/20 group-hover:bg-primary/50 transition-colors" />}
                                        </Link>
                                    </motion.div>
                                );
                            })}

                            {isPublicRoute && (
                                <>
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <button
                                            onClick={() => {
                                                setSidebarOpen(false);
                                                setWaitlistOpen(true);
                                            }}
                                            className="w-full flex items-center justify-between px-6 py-4 rounded-[20px] text-muted-foreground hover:text-foreground hover:bg-foreground/[0.03] transition-all"
                                        >
                                            <span className="text-[17px] font-bold tracking-tight">Lista de Espera</span>
                                        </button>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="pt-4"
                                    >
                                        <Link
                                            to="/auth"
                                            onClick={() => setSidebarOpen(false)}
                                            className="flex items-center justify-center gap-3 w-full py-4 rounded-[24px] bg-primary text-primary-foreground shadow-xl shadow-primary/20 active:scale-95 transition-all"
                                        >
                                            <LogIn className="w-5 h-5" strokeWidth={2.5} />
                                            <span className="text-[16px] font-black uppercase tracking-widest">Entrar na Plataforma</span>
                                        </Link>
                                    </motion.div>

                                    <div className="flex items-center justify-center gap-8 pt-10 pb-6 opacity-40">
                                        <a href="#" className="hover:text-primary transition-colors"><Instagram className="w-6 h-6" /></a>
                                        <a href="#" className="hover:text-primary transition-colors"><Linkedin className="w-6 h-6" /></a>
                                        <a href="#" className="hover:text-primary transition-colors"><Twitter className="w-6 h-6" /></a>
                                    </div>
                                </>
                            )}
                        </div>

                        {!isPublicRoute && (
                            <div className="p-6 pb-10 mt-auto border-t border-border/5 relative z-10 bg-gradient-to-t from-background to-transparent">
                                <button
                                    onClick={handleLogout}
                                    className="w-full h-14 rounded-2xl bg-destructive/[0.08] text-destructive font-bold text-sm flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-destructive/15 border border-destructive/10"
                                >
                                    <LogOut className="w-5 h-5" strokeWidth={2.5} />
                                    Encerrar Sessão
                                </button>
                            </div>
                        )}
                        {isPublicRoute && (
                            <div className="p-8 mt-auto text-center relative z-10 border-t border-border/5">
                                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-foreground/40 mb-2">NEURONEX AI CLÍNICA</p>
                                <p className="text-[9px] font-mono text-muted-foreground/20 uppercase tracking-[0.2em]">© 2024 • TECNOLOGIA PARA SAÚDE MENTAL</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <WaitlistModal open={waitlistOpen} onOpenChange={setWaitlistOpen} />
        </>
    );
};