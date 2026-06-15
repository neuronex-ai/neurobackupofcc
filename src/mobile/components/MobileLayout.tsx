"use client";

import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useUnreadNotificationCount } from "@/hooks/use-notifications";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import "@/styles/mobile-polish.css";
import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
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
    const { unreadCount } = useUnreadNotificationCount();
    const navigationVisible = showNav;
    const bottomNavigationVisible = showBottomNav;
    const immersive = !navigationVisible && !bottomNavigationVisible;

    return (
        <div
            className={cn(
                "nn-mobile-shell relative flex h-[100dvh] min-h-[100dvh] w-full flex-col overflow-hidden bg-background font-sans text-foreground antialiased selection:bg-foreground/20",
                immersive && "neurofinance-mobile-onboarding-shell",
            )}
        >
            <div className="mobile-surface-texture pointer-events-none fixed inset-0 z-0">
                <div className="absolute left-1/2 top-0 h-72 w-[min(34rem,120vw)] -translate-x-1/2 rounded-full bg-foreground/[0.018] blur-[96px]" />
                <div className="premium-noise absolute inset-0 text-foreground" />
            </div>

            {navigationVisible && (
                <motion.div
                    initial={{ y: -8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed left-0 right-0 top-0 z-[100] pt-[env(safe-area-inset-top)]"
                >
                    <div className="flex items-center justify-between px-4 py-3">
                        <Link to="/dashboard" className="rounded-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <span
                                className="group relative flex h-10 w-10 items-center justify-center rounded-[13px] border border-foreground/[0.055] bg-background/72 shadow-[0_10px_28px_-22px_rgba(0,0,0,0.65)] backdrop-blur-xl transition-colors active:bg-foreground/[0.08] dark:border-white/10 dark:bg-black/35"
                                aria-label="Ir para o Dashboard"
                            >
                                <img
                                    src={theme === "dark" ? "/favicon-S-FUNDO-BRANCA.ico" : "/favicon-S-FUNDO-PRETA.ico"}
                                    alt="NeuroNex"
                                    className="h-[17px] w-[17px] object-contain opacity-85"
                                />
                            </span>
                        </Link>

                        <button
                            type="button"
                            onClick={() => setNotificationsOpen(true)}
                            className="relative flex h-10 w-10 items-center justify-center rounded-[13px] border border-foreground/[0.055] bg-background/72 shadow-[0_10px_28px_-22px_rgba(0,0,0,0.65)] backdrop-blur-xl transition-colors active:bg-foreground/[0.08] dark:border-white/10 dark:bg-black/35"
                            aria-label={`Abrir notificações${unreadCount > 0 ? `, ${unreadCount} não lidas` : ""}`}
                        >
                            <Bell className="h-[17px] w-[17px] text-foreground/68" strokeWidth={1.7} />
                            {unreadCount > 0 && (
                                <span className="absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-background bg-red-500 px-1 text-[7px] font-black text-white">
                                    {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                            )}
                        </button>
                    </div>
                </motion.div>
            )}

            <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <SheetContent
                    side="bottom"
                    className="z-[110] flex h-[min(82dvh,46rem)] flex-col overflow-hidden rounded-t-[26px] border-x-0 border-b-0 border-t border-border/45 bg-background p-0 pb-[env(safe-area-inset-bottom)] shadow-[0_-20px_64px_-38px_rgba(0,0,0,0.5)] focus:outline-none dark:border-white/10"
                >
                    <div className="absolute left-1/2 top-2.5 z-30 h-1 w-9 -translate-x-1/2 rounded-full bg-foreground/14" />
                    <AlertsPanel />
                </SheetContent>
            </Sheet>

            <main
                className={cn(
                    "relative z-10 min-h-0 min-w-0 flex-1 overflow-hidden",
                    navigationVisible ? "pt-[calc(4rem+env(safe-area-inset-top))]" : "pt-0",
                    bottomNavigationVisible ? "pb-[calc(4.85rem+env(safe-area-inset-bottom))]" : "pb-0",
                    className,
                )}
            >
                {children}
            </main>

            {bottomNavigationVisible && <MobileBottomNav />}
        </div>
    );
};
