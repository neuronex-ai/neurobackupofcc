"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

interface OnboardingStepWelcomeProps {
    onNext: () => void;
}

export const OnboardingStepWelcome = ({ onNext }: OnboardingStepWelcomeProps) => {
    return (
        <div className="w-full max-w-[440px] px-6 py-8 flex flex-col items-center text-center">
            {/* Animated Logo/Icon */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative mb-12"
            >
                <div className="w-24 h-24 rounded-[32px] bg-black dark:bg-white flex items-center justify-center shadow-2xl overflow-hidden group">
                    <motion.div
                        animate={{ rotate: [0, 10, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <ShieldCheck className="w-10 h-10 text-white dark:text-black" strokeWidth={1.5} />
                    </motion.div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute -top-2 -right-2 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-xl border border-black/5 dark:border-white/10 shadow-sm"
                >
                    <Sparkles className="w-4 h-4 text-black dark:text-white" />
                </motion.div>
            </motion.div>

            {/* Typography */}
            <div className="space-y-4 mb-12">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-black dark:text-white leading-none">
                    Neuro<span className="text-black/20 dark:text-white/20">Nex</span>
                </h1>
                <p className="text-base md:text-lg text-black/40 dark:text-white/40 font-medium leading-relaxed max-w-[300px] mx-auto">
                    Sua prática clínica elevada ao estado da arte tecnológica.
                </p>
            </div>

            {/* Action */}
            <Button
                onClick={onNext}
                className="w-full h-20 rounded-[28px] bg-black text-white dark:bg-white dark:text-black text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-[0.98]"
            >
                Começar Jornada <ArrowRight className="ml-3 w-4 h-4" />
            </Button>
        </div>
    );
};