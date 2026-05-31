import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import {
    Sparkles,
    Calendar,
    Users,
    Gem,
    ArrowRight,
    Check
} from "lucide-react";
import { useTour } from "@/components/onboarding/TourContext";

export const WelcomeTourModal = () => {
    const { user } = useAuth();
    const { startTour, isTourCompleted, completeTour } = useTour();
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Check if modal should be shown
    useEffect(() => {
        if (!user) return;

        const checkTourStatus = async () => {
            if (isTourCompleted) {
                setIsLoading(false);
                return;
            }

            // Show welcome modal for first-time users
            setShowModal(true);
            setIsLoading(false);
        };

        checkTourStatus();
    }, [user, isTourCompleted]);

    const handleStartTour = () => {
        // Trigger monochromatic confetti
        confetti({
            particleCount: 120,
            spread: 55,
            origin: { y: 0.65 },
            colors: ['#ffffff', '#d4d4d4', '#a3a3a3', '#737373', '#525252']
        });

        setShowModal(false);

        // Small delay to allow modal to close before tour starts
        setTimeout(() => {
            startTour();
            toast.success("Iniciando tour guiado...");
        }, 500);
    };

    const handleSkip = () => {
        completeTour();
        setShowModal(false);
    };

    if (isLoading || !showModal) return null;

    const features = [
        { icon: Calendar, label: "AGENDA" },
        { icon: Users, label: "PACIENTES" },
        { icon: Gem, label: "FINANCEIRO" },
    ];

    return (
        <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogContent
                className="w-full max-w-[92vw] sm:max-w-[400px] md:max-w-[420px] p-0 border-none bg-transparent shadow-none gap-0 overflow-visible focus:outline-none z-[9999]"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 24 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 24 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="relative flex flex-col items-center justify-center"
                >
                    {/* Main Card - Liquid Glass */}
                    <div className="relative w-full bg-white/80 dark:bg-zinc-900/70 backdrop-blur-3xl border border-black/[0.05] dark:border-white/[0.06] rounded-[24px] sm:rounded-[28px] md:rounded-[32px] overflow-hidden shadow-2xl shadow-black/[0.08] dark:shadow-black/40 flex flex-col items-center text-center p-5 sm:p-7 md:p-10">

                        {/* Liquid Glass Highlight */}
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent" />

                        {/* 1. Success Icon - Monochromatic */}
                        <div className="relative mb-5 sm:mb-7 md:mb-8">
                            <div className="absolute inset-0 bg-foreground/10 dark:bg-white/10 blur-[35px] sm:blur-[45px] rounded-full" />
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-[20px] sm:rounded-[28px] md:rounded-[32px] bg-white/50 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center shadow-lg z-10">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full bg-foreground dark:bg-white flex items-center justify-center shadow-lg"
                                >
                                    <Check className="w-4 h-4 sm:w-5 sm:h-5 md:w-5.5 md:h-5.5 text-background dark:text-black" strokeWidth={3} />
                                </motion.div>
                            </div>
                        </div>

                        {/* 2. Text Content */}
                        <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 md:mb-10 max-w-[260px] sm:max-w-[280px] md:max-w-[300px]">
                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="text-lg sm:text-xl md:text-2xl font-bold text-foreground tracking-tight"
                            >
                                Configuração Concluída!
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.5 }}
                                className="text-[11px] sm:text-xs md:text-sm text-muted-foreground font-medium leading-relaxed"
                            >
                                Seu NeuroNex está pronto. Que tal um tour rápido para conhecer o seu novo sistema?
                            </motion.p>
                        </div>

                        {/* 3. Feature Shortcuts - Monochromatic */}
                        <div className="flex items-center justify-center gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8 md:mb-10">
                            {features.map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                    className="flex flex-col items-center gap-2 sm:gap-2.5 group"
                                >
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-xl sm:rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.05] flex items-center justify-center transition-all duration-300 group-hover:bg-black/[0.06] dark:group-hover:bg-white/[0.06] group-hover:border-black/[0.08] dark:group-hover:border-white/[0.08]"
                                    >
                                        <item.icon className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 text-muted-foreground group-hover:text-foreground transition-colors duration-300" />
                                    </motion.div>
                                    <span className="text-[7px] sm:text-[8px] md:text-[9px] font-black tracking-[0.12em] sm:tracking-[0.18em] text-muted-foreground/60 uppercase">
                                        {item.label}
                                    </span>
                                </motion.div>
                            ))}
                        </div>

                        {/* 4. Action Buttons */}
                        <div className="w-full space-y-2.5 sm:space-y-3">
                            <Button
                                onClick={handleStartTour}
                                className="w-full h-11 sm:h-12 md:h-14 bg-foreground text-background dark:bg-white dark:text-black hover:opacity-90 hover:scale-[1.01] rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-[0.12em] sm:tracking-[0.18em] shadow-xl shadow-foreground/5 dark:shadow-white/5 transition-all duration-300 active:scale-[0.97] group will-change-transform"
                            >
                                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 sm:mr-2.5 text-background/70 dark:text-black/70" />
                                Iniciar Tour Guiado
                                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-2 sm:ml-2.5 opacity-50 group-hover:translate-x-1 transition-transform duration-300" />
                            </Button>

                            <button
                                onClick={handleSkip}
                                className="w-full h-8 sm:h-9 md:h-10 text-[7px] sm:text-[8px] md:text-[9px] font-black uppercase tracking-[0.25em] sm:tracking-[0.35em] text-muted-foreground/50 hover:text-foreground transition-all duration-300"
                            >
                                Pular Tour
                            </button>
                        </div>

                    </div>
                </motion.div>
            </DialogContent>
        </Dialog>
    );
};
