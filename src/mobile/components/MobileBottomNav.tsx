"use client";

import { useAuth } from "@/components/auth/SessionContextProvider";
import { WaitlistModal } from "@/components/landing/WaitlistModal";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, DollarSign, Home, LogIn, LogOut, Menu, Settings, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const PRIVATE_MENU = [
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

const PUBLIC_MENU = [
    { label: "Início", href: "/" },
    { label: "Funcionalidades", href: "/#features" },
    { label: "Preços", href: "/pricing" },
    { label: "Sobre", href: "/sobre" },
    { label: "Contato", href: "/contato" },
];

export const MobileBottomNav = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [waitlistOpen, setWaitlistOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { data: profile } = useProfile();

    const publicRoutes = ["/", "/auth", "/pricing", "/sobre", "/contato"];
    const publicMode = publicRoutes.includes(location.pathname) || !user;
    const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Usuário";
    const initials = fullName.substring(0, 2).toUpperCase();
    const menuItems = publicMode ? PUBLIC_MENU : PRIVATE_MENU;

    const isActive = (href: string) => {
        if (href === "/dashboard") return location.pathname === "/dashboard";
        if (href === "/financeiro") return location.pathname.startsWith("/financeiro");
        return location.pathname === href || location.pathname.startsWith(`${href}/`);
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            toast.error("Não foi possível encerrar a sessão.");
            return;
        }
        setMenuOpen(false);
        navigate("/auth");
    };

    const navItems = [
        { label: "Início", href: "/dashboard", icon: Home },
        { label: "Agenda", href: "/agenda", icon: Calendar },
        { label: "Financeiro", href: "/financeiro", icon: DollarSign },
    ];

    return (
        <>
            {publicMode ? (
                <div className="fixed right-4 top-[calc(0.75rem+env(safe-area-inset-top))] z-[120] flex items-center gap-2 md:hidden">
                    <ThemeToggle />
                    <button
                        type="button"
                        onClick={() => setMenuOpen(true)}
                        className="flex h-10 w-10 items-center justify-center rounded-[13px] border border-border/40 bg-background/85 text-foreground shadow-sm backdrop-blur-xl"
                        aria-label="Abrir menu"
                    >
                        <Menu className="h-4.5 w-4.5" />
                    </button>
                </div>
            ) : (
                <motion.nav
                    initial={{ y: 10, opacity: 0, x: "-50%" }}
                    animate={{ y: 0, opacity: 1, x: "-50%" }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed bottom-[calc(0.42rem+env(safe-area-inset-bottom))] left-1/2 z-[100] w-[calc(100%-1.15rem)] max-w-[410px] md:hidden"
                >
                    <div className="relative flex h-[4.2rem] items-center justify-between overflow-hidden rounded-[31px] border border-foreground/[0.08] bg-background/58 px-2 shadow-[0_26px_68px_-34px_rgba(0,0,0,0.72),0_1px_0_rgba(255,255,255,0.28)_inset] backdrop-blur-2xl dark:border-white/[0.13] dark:bg-white/[0.085]">
                        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-white/35 dark:bg-white/20" />
                        <div className="pointer-events-none absolute inset-x-10 bottom-0 h-px bg-black/5 dark:bg-white/8" />
                        {navItems.slice(0, 2).map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link key={item.href} to={item.href} className={cn("relative flex h-12 w-[3.25rem] flex-col items-center justify-center rounded-[18px] text-muted-foreground transition-all duration-200 active:scale-95", active && "bg-foreground/[0.075] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]")}>
                                    <item.icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 1.8} />
                                    <span className="mt-0.5 text-[7px] font-black">{item.label}</span>
                                </Link>
                            );
                        })}

                        <Link
                            to="/synapse-ai"
                            className={cn(
                                "relative -mt-3 flex h-[3.35rem] w-[3.35rem] items-center justify-center rounded-[21px] border shadow-[0_20px_46px_-24px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.16)] transition-transform active:scale-95",
                                isActive("/synapse-ai")
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-foreground/70 bg-foreground text-background",
                            )}
                            aria-label="Abrir Synapse"
                        >
                            <Sparkles className="h-5 w-5" />
                        </Link>

                        {navItems.slice(2).map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link key={item.href} to={item.href} className={cn("relative flex h-12 w-[3.25rem] flex-col items-center justify-center rounded-[18px] text-muted-foreground transition-all duration-200 active:scale-95", active && "bg-foreground/[0.075] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]")}>
                                    <item.icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 1.8} />
                                    <span className="mt-0.5 text-[7px] font-black">{item.label}</span>
                                </Link>
                            );
                        })}

                        <button
                            type="button"
                            onClick={() => setMenuOpen(true)}
                            className="flex h-12 w-[3.25rem] flex-col items-center justify-center rounded-[18px] text-muted-foreground transition-all duration-200 active:scale-95 active:bg-foreground/[0.06]"
                            aria-label="Abrir menu"
                        >
                            <Menu className="h-[18px] w-[18px]" strokeWidth={1.8} />
                            <span className="mt-0.5 text-[7px] font-black">Menu</span>
                        </button>
                    </div>
                </motion.nav>
            )}

            <AnimatePresence>
                {menuOpen ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.16 }}
                        className="fixed inset-0 z-[200] flex flex-col bg-background md:hidden"
                    >
                        <div className="flex items-center justify-between border-b border-border/35 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] dark:border-white/10">
                            <div>
                                <p className="text-[7px] font-black uppercase tracking-[0.17em] text-muted-foreground/45">Navegação</p>
                                <p className="mt-1 text-lg font-black tracking-[-0.035em] text-foreground">Menu principal</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <ThemeToggle />
                                <button type="button" onClick={() => setMenuOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-foreground/[0.045] text-foreground" aria-label="Fechar menu">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {!publicMode ? (
                            <Link to="/ajustes" onClick={() => setMenuOpen(false)} className="mx-4 mt-4 flex items-center gap-3 rounded-[18px] border border-border/40 bg-card/65 p-3.5 dark:border-white/10 dark:bg-white/[0.025]">
                                <Avatar className="h-11 w-11 border border-border/40">
                                    <AvatarImage src={profile?.avatar_url || ""} />
                                    <AvatarFallback className="bg-foreground text-xs font-black text-background">{initials}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[13px] font-black text-foreground">{fullName}</p>
                                    <p className="mt-0.5 truncate text-[9px] text-muted-foreground/60">{user?.email}</p>
                                </div>
                                <Settings className="h-4 w-4 text-muted-foreground/40" />
                            </Link>
                        ) : null}

                        <div className="mobile-scroll-owner min-h-0 flex-1 overflow-y-auto px-4 py-4">
                            <div className="grid gap-1.5">
                                {menuItems.map((item) => {
                                    const active = isActive(item.href);
                                    return (
                                        <Link
                                            key={item.href}
                                            to={item.href}
                                            onClick={() => setMenuOpen(false)}
                                            className={cn(
                                                "flex min-h-12 items-center justify-between rounded-[15px] px-4 text-[14px] font-black transition-colors",
                                                active ? "bg-foreground text-background" : "text-foreground active:bg-foreground/[0.05]",
                                            )}
                                        >
                                            {item.label}
                                            <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-background/60" : "bg-foreground/15")} />
                                        </Link>
                                    );
                                })}
                            </div>

                            {publicMode ? (
                                <div className="mt-4 grid gap-2">
                                    <Button type="button" variant="outline" onClick={() => { setMenuOpen(false); setWaitlistOpen(true); }} className="h-11 rounded-[14px] text-[8px] font-black uppercase tracking-[0.11em]">
                                        Lista de espera
                                    </Button>
                                    <Button asChild className="h-11 rounded-[14px] text-[8px] font-black uppercase tracking-[0.11em]">
                                        <Link to="/auth" onClick={() => setMenuOpen(false)}><LogIn className="mr-2 h-4 w-4" /> Entrar</Link>
                                    </Button>
                                </div>
                            ) : null}
                        </div>

                        {!publicMode ? (
                            <div className="border-t border-border/35 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:border-white/10">
                                <Button type="button" variant="outline" onClick={logout} className="h-11 w-full rounded-[14px] border-red-500/20 text-[8px] font-black uppercase tracking-[0.11em] text-red-500">
                                    <LogOut className="mr-2 h-4 w-4" /> Encerrar sessão
                                </Button>
                            </div>
                        ) : null}
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <WaitlistModal open={waitlistOpen} onOpenChange={setWaitlistOpen} />
        </>
    );
};
