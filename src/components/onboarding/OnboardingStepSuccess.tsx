"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Check, Layers, PlayCircle, Sparkles } from "lucide-react";

interface OnboardingStepSuccessProps {
    onComplete: (startTour: boolean) => void;
}

export const OnboardingStepSuccess = ({ onComplete }: OnboardingStepSuccessProps) => {
    return (
        <div className="w-full max-w-[440px] px-6 py-8 flex flex-col items-center text-center">
            {/* 3D Success Logo Container - Refactored for clean layering */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
                className="relative mb-12"
            >
                {/* Ambient Glow */}
                <div className="absolute inset-0 bg-black/5 dark:bg-white/10 blur-3xl rounded-full scale-150" />

                {/* Main Squircle Container */}
                <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-[32px] md:rounded-[40px] bg-white/40 dark:bg-white/[0.05] backdrop-blur-3xl border border-white/20 dark:border-white/10 shadow-2xl flex items-center justify-center overflow-visible group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-[inherit] pointer-events-none" />

                    {/* Layered Icon Composition */}
                    <div className="relative flex items-center justify-center">
                        {/* 1. Background Logo (Subtle) */}
                        <motion.img
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.15 }}
                            transition={{ delay: 0.5 }}
                            src="/favicon-dark.png"
                            alt=""
                            className="absolute w-16 h-16 md:w-20 md:h-20 object-contain grayscale invert dark:invert-0"
                        />

                        {/* 2. Base Stack Icon */}
                        <motion.div
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                        >
                            <Layers className="w-10 h-10 md:w-12 md:h-12 text-black/20 dark:text-white/20" strokeWidth={1.5} />
                        </motion.div>

                        {/* 3. Success Checkmark - Overlapping cleanly */}
                        <motion.div
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.6, type: "spring", stiffness: 200, damping: 12 }}
                            className="absolute inset-0 flex items-center justify-center"
                        >
                            <div className="bg-black dark:bg-white p-2 rounded-full shadow-xl">
                                <Check className="w-6 h-6 md:w-7 md:h-7 text-white dark:text-black" strokeWidth={3} />
                            </div>
                        </motion.div>
                    </div>

                    {/* 4. Floating Sparkle Accessory */}
                    <motion.div
                        animate={{
                            y: [0, -4, 0],
                            rotate: [0, 10, 0]
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-2 -right-2 bg-amber-400 dark:bg-amber-400 p-1.5 rounded-xl shadow-lg shadow-amber-500/20"
                    >
                        <Sparkles className="w-4 h-4 text-white" />
                    </motion.div>
                </div>
            </motion.div>

            {/* Content Header */}
            <div className="space-y-4 mb-12 px-4">
                <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-4xl md:text-5xl font-black tracking-tighter text-black dark:text-white leading-tight"
                >
                    Protocolo <span className="text-black/30 dark:text-white/30 italic">Ativo.</span>
                </motion.h2>
                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="text-base md:text-lg text-black/40 dark:text-white/40 font-medium leading-relaxed max-w-[320px] mx-auto"
                >
                    Sua clínica inteligente está configurada. Bem-vindo à primeira versão do NeuroNex.
                </motion.p>
            </div>

            {/* Final Action Area */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="w-full space-y-4 px-2"
            >
                <Button
                    onClick={() => onComplete(true)}
                    className="w-full h-20 rounded-[28px] bg-black text-white dark:bg-white dark:text-black text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl transition-all duration-500 hover:opacity-95 active:scale-95"
                >
                    <span className="flex items-center gap-4">
                        <PlayCircle className="w-5 h-5 fill-current" /> Iniciar Experiência
                    </span>
                </Button>

                <button
                    onClick={() => onComplete(false)}
                    className="w-full h-14 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white transition-colors duration-300"
                >
                    Ir direto ao Dashboard
                </button>
            </motion.div>
        </div>
    );
};