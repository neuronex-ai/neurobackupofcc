"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, ChevronLeft, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

interface OnboardingStepThemeProps {
    onNext: () => void;
    onBack: () => void;
}

export const OnboardingStepTheme = ({ onNext, onBack }: OnboardingStepThemeProps) => {
    const { theme, setTheme } = useTheme();

    const themes = [
        { id: 'light', name: 'Light', icon: Sun },
        { id: 'dark', name: 'Dark', icon: Moon },
        { id: 'system', name: 'System', icon: Monitor },
    ];

    return (
        <div className="w-full max-w-[440px] px-6 py-8 flex flex-col items-center">
            {/* Header */}
            <div className="text-center space-y-3 mb-12">
                <h2 className="text-3xl font-black tracking-tighter text-black dark:text-white uppercase">
                    Ambiente
                </h2>
                <p className="text-sm text-black/40 dark:text-white/40 font-bold uppercase tracking-widest">
                    Escolha sua preferência visual
                </p>
            </div>

            {/* Theme Grid */}
            <div className="grid grid-cols-1 gap-4 w-full mb-12">
                {themes.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={cn(
                            "relative group flex items-center justify-between p-6 rounded-[24px] border transition-all duration-500",
                            theme === t.id 
                                ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-xl scale-[1.02]" 
                                : "bg-transparent border-black/5 dark:border-white/5 hover:border-black/20 dark:hover:border-white/20"
                        )}
                    >
                        <div className="flex items-center gap-5">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                                theme === t.id ? "bg-white/10 dark:bg-black/10" : "bg-black/5 dark:bg-white/5"
                            )}>
                                <t.icon size={20} />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-[0.2em]">{t.name}</span>
                        </div>
                        {theme === t.id && (
                            <motion.div layoutId="check" className="mr-2">
                                <Check size={18} strokeWidth={3} />
                            </motion.div>
                        )}
                    </button>
                ))}
            </div>

            {/* Actions */}
            <div className="w-full flex flex-col gap-4">
                <Button
                    onClick={onNext}
                    className="w-full h-20 rounded-[28px] bg-black text-white dark:bg-white dark:text-black text-[11px] font-black uppercase tracking-[0.4em] shadow-xl"
                >
                    Confirmar Estilo
                </Button>
                <button
                    onClick={onBack}
                    className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white transition-colors"
                >
                    <ChevronLeft size={14} /> Voltar
                </button>
            </div>
        </div>
    );
};