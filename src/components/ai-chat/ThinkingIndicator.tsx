import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Sparkles, Database, BrainCircuit, Search } from "lucide-react";

const STEPS = [
  { icon: BrainCircuit, text: "Processando contexto..." },
  { icon: Search, text: "Analisando intenção..." },
  { icon: Database, text: "Consultando dados seguros..." },
  { icon: Sparkles, text: "Formulando resposta..." },
];

export const ThinkingIndicator = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 800); // Faster transitions (800ms)
    return () => clearInterval(interval);
  }, []);



  return (
    <div className="flex justify-start w-full mb-8 pl-6 animate-fade-in relative z-20">
      <div className="flex items-center gap-4 p-3 pr-6 rounded-full bg-secondary/20 border border-border/10 backdrop-blur-md shadow-sm">

        {/* Synapse Orb Pulse */}
        <div className="relative flex items-center justify-center w-5 h-5">
          <div className="absolute inset-0 bg-foreground rounded-full opacity-10 animate-ping" />
          <div className="relative w-2.5 h-2.5 bg-foreground rounded-full shadow-[0_0_10px_rgba(0,0,0,0.2)] dark:shadow-[0_0_10px_rgba(255,255,255,0.5)] animate-pulse" />
        </div>

        {/* Text Transition */}
        <div className="relative overflow-hidden flex flex-col justify-center min-w-[140px]">
          <AnimatePresence mode="wait">
            <motion.span
              key={currentStep}
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -5, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-[11px] font-medium text-muted-foreground tracking-wider uppercase"
            >
              {STEPS[currentStep].text}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};