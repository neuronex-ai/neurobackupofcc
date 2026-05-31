"use client";


import { AnimatePresence, motion } from "framer-motion";
import { useState } from 'react';
import { OnboardingStepSuccess } from './OnboardingStepSuccess';
import { OnboardingStepTheme } from './OnboardingStepTheme';
import { OnboardingStepWelcome } from './OnboardingStepWelcome';

interface WelcomeOnboardingProps {
    onComplete: (startTour: boolean) => void;
}

export const WelcomeOnboarding = ({ onComplete }: WelcomeOnboardingProps) => {
    const [state, setState] = useState({
        currentStep: 'welcome'
    });

    const handleNext = (next: string) => {
        setState(prev => ({ ...prev, currentStep: next }));
    };

    const handleComplete = (startTour: boolean) => {
        onComplete(startTour);
    };

    // removed AppTour rendering logic as it is now handled by the parent layout

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col overflow-hidden bg-white dark:bg-zinc-950">
            {/* Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            {/* Animated Ambient Light */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.2, 0.1],
                        x: [0, 50, 0]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] bg-black/5 dark:bg-white/10 blur-[120px] rounded-full"
                />
            </div>

            {/* Content Scroller */}
            <div className="relative h-full w-full overflow-y-auto overflow-x-hidden flex items-center justify-center pt-10 md:pt-0 scrollbar-hide">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={state.currentStep}
                        initial={{ opacity: 0, scale: 0.98, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.02, y: -15 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="w-full max-w-2xl flex justify-center"
                    >
                        {state.currentStep === 'welcome' && (
                            <OnboardingStepWelcome onNext={() => handleNext('theme')} />
                        )}
                        {state.currentStep === 'theme' && (
                            <OnboardingStepTheme onNext={() => handleNext('success')} onBack={() => handleNext('welcome')} />
                        )}
                        {state.currentStep === 'success' && (
                            <OnboardingStepSuccess onComplete={handleComplete} />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};