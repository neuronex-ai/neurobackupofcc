"use client";

import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useDashboardAlerts } from "@/hooks/use-dashboard-alerts";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowLeft, Bell } from "lucide-react";
import { ReactNode, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MobileBottomNav } from "./MobileBottomNav";

interface MobileLayoutProps {
    children: ReactNode;
    className?: string;
    showNav?: boolean;
    showBottomNav?: boolean;
}

export const MobileLayout = ({
    children,
    className,
    showNav = true,
    showBottomNav = true,
}: MobileLayoutProps) => {
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const { theme } = useTheme();
    const navigate = useNavigate();

    const isOnboardingShell = !showBottomNav;
    const navigationVisible = showNav && showBottomNav;

    const { data: alerts } = useDashboardAlerts();
    const hasAlerts = alerts && alerts.length > 0;

    return (
        <div
            className={cn(
                "relative flex h-[100dvh] min-h-[100dvh] w-full flex-col overflow-hidden bg-background font-sans text-foreground antialiased selection:bg-foreground/20",
                isOnboardingShell && "neurofinance-mobile-onboarding-shell",
            )}
        >
            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
                <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-foreground/[0.02] blur-[120px]" />
            </div>

            {isOnboardingShell && (
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="fixed left-4 top-[calc(1rem+env(safe-area-inset-top))] z-[150] flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07] text-white shadow-[0_18px_50px_-36px_rgba(0,0,0,0.95)] transition-all active:scale-95"
                    aria-label="Voltar"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
            )}

            {navigationVisible && (
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed left-0 right-0 top-0 z-[100] pt-safe-top"
                >
                    <div className="flex items-center justify-between px-6 py-4">
                        <Link to="/dashboard">
                            <button
                                type="button"
                                className="group relative flex h-11 w-11 items-center justify-center rounded-[14px] border border-foreground/5 bg-foreground/5 shadow-sm backdrop-blur-2xl transition-all duration-300 hover:bg-foreground/10 active:scale-90 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                                aria-label="Ir para o Dashboard"
                            >
                                <img
                                    src={theme === "dark" ? "/favicon-S-FUNDO-BRANCA.ico" : "/favicon-S-FUNDO-PRETA.ico"}
                                    alt="NeuroNex"
                                    className="h-[18px] w-[18px] object-contain opacity-80 transition-transform group-hover:scale-110 group-hover:opacity-100"
                                />
                            </button>
                        </Link>

                        <button
                            type="button"
                            onClick={() => setNotificationsOpen(true)}
                            className="relative flex h-11 w-11 items-center justify-center rounded-[14px] border border-foreground/5 bg-foreground/5 shadow-sm backdrop-blur-2xl transition-all duration-300 hover:bg-foreground/10 active:scale-90 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                            aria-label="Abrir notificações"
                        >
                            <Bell className="h-[18px] w-[18px] text-foreground/70 dark:text-white/70" strokeWidth={1.5} />
                            {hasAlerts && (
                                <span className="absolute right-3 top-3 h-2 w-2 animate-pulse rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                            )}
                        </button>
                    </div>
                </motion.div>
            )}

            <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <SheetContent
                    side="bottom"
                    className="z-[110] flex h-[85dvh] flex-col overflow-hidden rounded-t-[32px] border-x-0 border-b-0 border-t border-border/45 bg-background p-0 shadow-[0_-24px_80px_-36px_rgba(0,0,0,0.55)] focus:outline-none dark:border-white/10"
                >
                    <div className="absolute left-1/2 top-3 z-30 h-1 w-10 -translate-x-1/2 rounded-full bg-foreground/15" />
                    <AlertsPanel />
                </SheetContent>
            </Sheet>

            <main
                className={cn(
                    "relative z-10 h-full flex-1 animate-fade-in",
                    navigationVisible ? "pb-32 pt-20" : "pb-0 pt-0",
                    className,
                )}
            >
                {children}
            </main>

            {navigationVisible && <MobileBottomNav />}
        </div>
    );
};
