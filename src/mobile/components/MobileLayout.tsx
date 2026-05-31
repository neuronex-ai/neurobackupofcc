"use client";

import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { useDashboardAlerts } from "@/hooks/use-dashboard-alerts";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { MobileBottomNav } from "./MobileBottomNav";

interface MobileLayoutProps {
    children: ReactNode;
    className?: string;
    showNav?: boolean;
    showBottomNav?: boolean;
}

export const MobileLayout = ({ children, className, showBottomNav = true }: MobileLayoutProps) => {
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const { theme } = useTheme();

    const { data: alerts } = useDashboardAlerts();
    const hasAlerts = alerts && alerts.length > 0;

    return (
        <div className="h-screen w-full text-foreground relative overflow-hidden selection:bg-foreground/20 font-sans antialiased bg-background flex flex-col">
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-foreground/[0.02] rounded-full blur-[120px]" />
            </div>

            {showBottomNav && (
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed top-0 left-0 right-0 z-[100] pt-safe-top"
                >
                    <div className="flex items-center justify-between px-6 py-4">
                        <Link to="/dashboard">
                            <button className="relative w-11 h-11 rounded-[14px] bg-foreground/5 dark:bg-white/5 backdrop-blur-2xl border border-foreground/5 dark:border-white/10 flex items-center justify-center shadow-sm transition-all duration-300 hover:bg-foreground/10 dark:hover:bg-white/10 active:scale-90 group">
                                <img
                                    src={theme === 'dark' ? "/favicon-S-FUNDO-BRANCA.ico" : "/favicon-S-FUNDO-PRETA.ico"}
                                    alt="NeuronEx"
                                    className="w-[18px] h-[18px] group-hover:scale-110 transition-transform object-contain opacity-80 group-hover:opacity-100"
                                />
                            </button>
                        </Link>

                        <div className="flex items-center gap-2.5">
                            <button
                                onClick={() => setNotificationsOpen(true)}
                                className="relative w-11 h-11 rounded-[14px] bg-foreground/5 dark:bg-white/5 backdrop-blur-2xl border border-foreground/5 dark:border-white/10 flex items-center justify-center shadow-sm transition-all duration-300 hover:bg-foreground/10 dark:hover:bg-white/10 active:scale-90"
                            >
                                <Bell className="w-[18px] h-[18px] text-foreground/70 dark:text-white/70" strokeWidth={1.5} />
                                {hasAlerts && (
                                    <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse" />
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <SheetContent side="bottom" className="h-[85vh] bg-zinc-950 border-t border-white/10 p-0 flex flex-col rounded-t-[32px] focus:outline-none z-[110] overflow-hidden">
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/10 rounded-full z-30" />
                    <AlertsPanel />
                </SheetContent>
            </Sheet>

            <main className={cn(
                "relative z-10 animate-fade-in flex-1 h-full",
                showBottomNav ? "pt-20 pb-32" : "pb-0",
                className
            )}>
                {children}
            </main>
            {showBottomNav && <MobileBottomNav />}
        </div>
    );
};