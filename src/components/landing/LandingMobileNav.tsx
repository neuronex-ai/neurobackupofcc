"use client";

import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Layers, PieChart, Menu, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTheme } from "@/hooks/use-theme";

export const LandingMobileNav = () => {
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { theme } = useTheme();

    const faviconSrc = theme === "dark" ? "/favicon-light.png" : "/favicon-dark.png";

    // Eagerly prefetch public pages for instant load on mobile - REMOVED FOR LEAN MVP
    useEffect(() => {
        const prefetchPages = () => {
            const prefetchQueue = [
                // Pages removed
            ];
            if ('requestIdleCallback' in window) {
                // @ts-ignore
                window.requestIdleCallback(() => {
                    prefetchQueue.forEach((prefetch) => prefetch());
                });
            } else {
                setTimeout(() => {
                    prefetchQueue.forEach((prefetch) => prefetch());
                }, 1000);
            }
        };

        prefetchPages();
    }, []);

    const extendedNavItems = [
        { label: "Ajuda", path: "/help" },
    ];

    return (
        <>
            {/* The Top Header Navbar for Mobile */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed top-0 left-0 right-0 z-[100] md:hidden px-6 py-5 flex items-center justify-between bg-transparent"
            >
                <Link to="/" className="flex items-center gap-2.5">
                    <img src={faviconSrc} className="w-8 h-8 object-contain" alt="NeuroNex" />
                    <span className="text-[12px] font-black tracking-[0.35em] uppercase opacity-50">NeuroNex</span>
                </Link>

                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="w-10 h-10 rounded-xl bg-foreground/[0.03] border border-border/10 flex items-center justify-center text-foreground active:scale-95 transition-all"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </div>
            </motion.header>

            {/* Apple iOS-Style Full Screen Drawer for Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed inset-0 z-[110] bg-background md:hidden flex flex-col overflow-y-auto"
                    >
                        <div className="absolute inset-0 premium-noise opacity-[0.03] pointer-events-none" />

                        <div className="flex items-center justify-between p-6 pb-2 relative z-10 border-b border-border/5">
                            <div className="flex items-center gap-2.5">
                                <img src={faviconSrc} className="w-6 h-6 object-contain" alt="NeuroNex" />
                                <span className="text-[12px] font-black tracking-[0.3em] uppercase opacity-40">NeuroNex</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <ThemeToggle />
                                <button
                                    onClick={() => setIsMenuOpen(false)}
                                    className="w-10 h-10 rounded-full bg-foreground/[0.03] border border-border/10 flex items-center justify-center text-foreground hover:bg-foreground/[0.05] active:scale-95 transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 p-8 flex flex-col justify-center gap-8 relative z-10">
                            {extendedNavItems.map((item, i) => (
                                <motion.div
                                    key={item.label}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 + 0.1, duration: 0.4 }}
                                >
                                    <Link
                                        to={item.path}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={cn(
                                            "text-3xl font-bold tracking-tight transition-all block",
                                            location.pathname === item.path ? "text-primary" : "text-foreground/80 hover:text-foreground hover:translate-x-2"
                                        )}
                                    >
                                        {item.label}
                                    </Link>
                                </motion.div>
                            ))}
                        </div>

                        <div className="p-8 pb-32 mt-auto border-t border-border/5 relative z-10 space-y-4">
                            <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                                <Button className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-[0.1em] text-[11px] shadow-premium active:scale-95 transition-all">
                                    Entrar no NeuroNex <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                            <p className="text-[10px] text-center text-muted-foreground/30 font-mono text-balance uppercase mt-4">
                                Construído com exclusividade para a neuropsicologia moderna
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};