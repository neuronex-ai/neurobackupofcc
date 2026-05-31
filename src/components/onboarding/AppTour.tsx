"use client";

import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Command, PartyPopper, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TOUR_STEPS } from "./tour-content";
import confetti from "canvas-confetti";

interface AppTourProps {
    open: boolean;
    onComplete: () => void;
}

export const AppTour = ({ open, onComplete }: AppTourProps) => {
    const [active, setActive] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const [showCompletion, setShowCompletion] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();
    const isMobile = useIsMobile();

    const step = TOUR_STEPS[currentIndex];
    const isLast = currentIndex === TOUR_STEPS.length - 1;
    const isModal = step?.layout === 'modal';

    const handleNext = useCallback(() => {
        if (isLast) {
            // Show completion screen
            setShowCompletion(true);
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#ffffff', '#d4d4d4', '#a3a3a3', '#737373', '#525252']
            });
        } else {
            const nextStep = TOUR_STEPS[currentIndex + 1];
            if (nextStep?.expectedRoute && location.pathname !== nextStep.expectedRoute) {
                navigate(nextStep.expectedRoute);
            }
            setCurrentIndex(prev => prev + 1);
        }
    }, [isLast, currentIndex, location.pathname, navigate]);

    const handlePrev = useCallback(() => {
        if (currentIndex > 0) {
            const prevStep = TOUR_STEPS[currentIndex - 1];
            if (prevStep?.expectedRoute && location.pathname !== prevStep.expectedRoute) {
                navigate(prevStep.expectedRoute);
            }
            setCurrentIndex(prev => prev - 1);
        }
    }, [currentIndex, location.pathname, navigate]);

    const handleFinish = useCallback(() => {
        setShowCompletion(false);
        onComplete();
    }, [onComplete]);

    useLayoutEffect(() => {
        if (!active || !open || !step || isMobile || isModal || showCompletion) {
            setRect(null);
            return;
        }

        const sync = () => {
            const target = document.getElementById(step.targetId!);
            if (target) {
                const r = target.getBoundingClientRect();
                setRect(r);
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                setRect(null);
            }
        };

        const timer = setTimeout(sync, 150);
        window.addEventListener('resize', sync);
        const interval = setInterval(sync, 1000);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
            window.removeEventListener('resize', sync);
        };
    }, [active, open, step, isMobile, currentIndex, location.pathname, isModal, showCompletion]);

    useEffect(() => {
        if (open) {
            const timer = setTimeout(() => setActive(true), 100);
            return () => clearTimeout(timer);
        } else {
            setActive(false);
            setCurrentIndex(0);
            setShowCompletion(false);
        }
    }, [open]);

    const getPopoverStyle = () => {
        if (isMobile) return {};
        if (!rect || isModal) return { position: "fixed" as const, top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 380 };

        const GAP = 20;
        const popoverWidth = 380;
        let left = rect.left + (rect.width / 2) - (popoverWidth / 2);

        // Clamp to viewport
        if (left < 16) left = 16;
        if (left + popoverWidth > window.innerWidth - 16) left = window.innerWidth - popoverWidth - 16;

        return {
            position: "fixed" as const,
            top: rect.bottom + GAP,
            left,
            width: popoverWidth,
            zIndex: 10002
        };
    };

    const overlayPath = useMemo(() => {
        if (isMobile) return "";
        const w = window.innerWidth;
        const h = window.innerHeight;
        const full = `M 0 0 H ${w} V ${h} H 0 Z`;

        if (rect && !isModal && !showCompletion) {
            const padding = 12;
            const rx = rect.left - padding;
            const ry = rect.top - padding;
            const rw = rect.width + padding * 2;
            const rh = rect.height + padding * 2;
            const r = 16;
            const hole = `M ${rx + r} ${ry} H ${rx + rw - r} A ${r} ${r} 0 0 1 ${rx + rw} ${ry + r} V ${ry + rh - r} A ${r} ${r} 0 0 1 ${rx + rw - r} ${ry + rh} H ${rx + r} A ${r} ${r} 0 0 1 ${rx} ${ry + rh - r} V ${ry + r} A ${r} ${r} 0 0 1 ${rx + r} ${ry} Z`;
            return `${full} ${hole}`;
        }
        return full;
    }, [rect, isMobile, isModal, showCompletion]);

    if (!open || !active || (!step && !showCompletion)) return null;

    // ─── Completion Screen ──────────────────────────────────────────
    if (showCompletion) {
        return (
            <MotionConfig transition={{ type: "spring", stiffness: 400, damping: 40 }}>
                <div className="fixed inset-0 z-[10001] pointer-events-none select-none overflow-hidden">
                    {!isMobile && (
                        <svg className="absolute inset-0 w-full h-full pointer-events-auto">
                            <motion.path
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1, fill: "rgba(0,0,0,0.88)" }}
                                d={overlayPath}
                                fillRule="evenodd"
                            />
                        </svg>
                    )}

                    <motion.div
                        layout
                        className={cn(
                            "pointer-events-auto",
                            isMobile
                                ? "fixed inset-4 z-[10002] flex items-center justify-center"
                                : "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10002]"
                        )}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                    >
                        <div className={cn(
                            "relative overflow-hidden rounded-[32px] border transition-all duration-500 w-[400px] max-w-[90vw]",
                            "bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl shadow-[0_32px_120px_-20px_rgba(0,0,0,0.5)]",
                            "border-black/[0.05] dark:border-white/[0.08]"
                        )}>
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

                            <div className="p-8 md:p-10 flex flex-col items-center text-center">
                                {/* Success Icon */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 12 }}
                                    className="relative mb-8"
                                >
                                    <div className="absolute inset-0 bg-emerald-500/20 blur-[40px] rounded-full" />
                                    <div className="relative w-24 h-24 rounded-[28px] bg-white/50 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center shadow-2xl">
                                        <motion.div
                                            initial={{ scale: 0, rotate: -20 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 12 }}
                                            className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/30"
                                        >
                                            <Check className="w-7 h-7 text-white" strokeWidth={3} />
                                        </motion.div>
                                    </div>
                                    <motion.div
                                        animate={{ y: [0, -4, 0], rotate: [0, 10, 0] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute -top-2 -right-2 bg-amber-400 p-1.5 rounded-xl shadow-lg shadow-amber-500/20"
                                    >
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </motion.div>
                                </motion.div>

                                {/* Title */}
                                <motion.h3
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-2xl md:text-3xl font-black text-black dark:text-white tracking-tight mb-3"
                                >
                                    Tour Finalizado!
                                </motion.h3>

                                <motion.p
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-sm text-black/50 dark:text-white/50 font-medium leading-relaxed max-w-[280px] mb-8"
                                >
                                    Agora você conhece as principais funcionalidades do NeuroNex. Explore à vontade!
                                </motion.p>

                                {/* Progress dots — all complete */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="flex items-center gap-1.5 mb-8"
                                >
                                    {TOUR_STEPS.map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                                        />
                                    ))}
                                </motion.div>

                                {/* Finish button */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    className="w-full"
                                >
                                    <Button
                                        onClick={handleFinish}
                                        className="w-full h-14 rounded-2xl bg-black text-white dark:bg-white dark:text-black text-[11px] font-black uppercase tracking-[0.3em] transition-all active:scale-[0.97] shadow-xl"
                                    >
                                        <PartyPopper className="w-4 h-4 mr-2" />
                                        Começar a Usar
                                    </Button>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </MotionConfig>
        );
    }

    // ─── Tour Steps ─────────────────────────────────────────────────
    return (
        <MotionConfig transition={{ type: "spring", stiffness: 400, damping: 40 }}>
            <div className="fixed inset-0 z-[10001] pointer-events-none select-none overflow-hidden">

                {/* SVG Backdrop - Hidden on Mobile to see the app */}
                {!isMobile && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-auto">
                        <motion.path
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, fill: "rgba(0,0,0,0.85)" }}
                            d={overlayPath}
                            fillRule="evenodd"
                        />
                    </svg>
                )}

                {/* Mobile Wizard Assistant / Desktop Tooltip */}
                <motion.div
                    layout
                    className={cn(
                        "pointer-events-auto",
                        isMobile
                            ? "fixed bottom-8 left-4 right-4 z-[10002]"
                            : "absolute"
                    )}
                    style={getPopoverStyle()}
                    initial={isMobile ? { y: 100, opacity: 0 } : { scale: 0.9, opacity: 0 }}
                    animate={{ y: 0, scale: 1, opacity: 1 }}
                >
                    <div className={cn(
                        "relative overflow-hidden rounded-[32px] border transition-all duration-500",
                        "bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl shadow-[0_32px_120px_-20px_rgba(0,0,0,0.5)]",
                        "border-black/[0.05] dark:border-white/[0.08]"
                    )}>
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/20 to-transparent" />

                        <div className="p-6 md:p-8">
                            <button
                                onClick={onComplete}
                                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
                            >
                                <X size={14} strokeWidth={3} />
                            </button>

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={step.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex flex-col gap-5"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-black dark:bg-white flex items-center justify-center shadow-lg">
                                            <Command size={22} className="text-white dark:text-black" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-black/40 dark:text-white/40 uppercase tracking-[0.2em] mb-1">
                                                Dica {currentIndex + 1} de {TOUR_STEPS.length}
                                            </p>
                                            <h3 className="text-xl font-bold text-black dark:text-white tracking-tight leading-none">
                                                {step.title}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="text-black/60 dark:text-white/50 text-[15px] font-medium leading-relaxed">
                                        {step.description}
                                    </div>

                                    {/* Progress dots */}
                                    <div className="flex items-center gap-1.5">
                                        {TOUR_STEPS.map((_, i) => (
                                            <div
                                                key={i}
                                                className={cn(
                                                    "h-1.5 rounded-full transition-all duration-500",
                                                    i === currentIndex
                                                        ? "w-6 bg-black dark:bg-white"
                                                        : i < currentIndex
                                                            ? "w-1.5 bg-black/30 dark:bg-white/30"
                                                            : "w-1.5 bg-black/10 dark:bg-white/10"
                                                )}
                                            />
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-3 mt-2">
                                        {currentIndex > 0 && (
                                            <button
                                                onClick={handlePrev}
                                                className="h-14 w-14 rounded-2xl border border-black/[0.05] dark:border-white/[0.05] bg-black/5 dark:bg-white/5 flex items-center justify-center transition-all active:scale-95"
                                            >
                                                <ChevronLeft size={20} className="text-black dark:text-white" />
                                            </button>
                                        )}
                                        <Button
                                            onClick={handleNext}
                                            className={cn(
                                                "h-14 flex-1 rounded-2xl bg-black text-white dark:bg-white dark:text-black text-[11px] font-black uppercase tracking-[0.3em] transition-all active:scale-[0.97] shadow-xl"
                                            )}
                                        >
                                            {isLast ? "Concluir" : "Próximo"}
                                            {!isLast && <ChevronRight className="ml-2 w-4 h-4" />}
                                        </Button>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            </div>
        </MotionConfig>
    );
};