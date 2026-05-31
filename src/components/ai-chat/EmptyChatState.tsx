"use client";

import { cn } from "@/lib/utils";
import { Calendar, Wallet, FileText, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const SUGGESTIONS = [
  { text: "Resumo executivo da agenda", icon: Calendar, delay: 0 },
  { text: "Análise de tendências financeiras", icon: Wallet, delay: 0.1 },
  { text: "Elaborar documentação clínica", icon: FileText, delay: 0.2 },
  { text: "Planejar seguimento do paciente", icon: Sparkles, delay: 0.3 },
];

interface EmptyChatStateProps {
  onSuggestionClick: (text: string) => void;
}

const OrbCore = () => {
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      {/* Outer Glow - Monochromatic */}
      <div className="absolute inset-0 bg-white/[0.03] blur-2xl rounded-full" />

      {/* Main Orb Body - Monochromatic Glass */}
      <div className="relative w-16 h-16 rounded-full bg-gradient-to-b from-zinc-800 to-black shadow-[0_0_30px_-5px_rgba(255,255,255,0.05)] border border-white/10 flex items-center justify-center overflow-hidden">

        {/* Top Highlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-6 bg-white/[0.04] blur-lg rounded-full" />

        {/* Inner Core Pulsing Dot - Monochromatic */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 0.9, 0.7] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-2 h-2 bg-white rounded-full shadow-[0_0_12px_2px_rgba(255,255,255,0.3)]"
        />

        {/* Premium Noise Texture */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-cover mix-blend-overlay"
        />
      </div>

      {/* Orbiting Dot - Monochromatic */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 10, ease: "linear", repeat: Infinity }}
        className="absolute w-full h-full rounded-full"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-white/[0.15] rounded-full blur-[0.5px]" />
      </motion.div>
    </div>
  );
};

export const EmptyChatState = ({ onSuggestionClick }: EmptyChatStateProps) => {

  return (
    <div className="flex flex-col items-center justify-center w-full h-full flex-1 text-center relative z-10 overflow-hidden min-h-[600px] px-4 pb-32">

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="mb-8"
      >
        <OrbCore />
      </motion.div>

      {/* Welcome Text */}
      <div className="space-y-4 max-w-2xl px-4 relative z-20 mb-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-4xl md:text-5xl font-medium tracking-tight text-foreground leading-tight antialiased"
        >
          Olá! Vamos Começar?
        </motion.h2>
      </div>

      {/* Suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl px-6 relative z-20">
        {SUGGESTIONS.map((item, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + item.delay, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => onSuggestionClick(item.text)}
            className={cn(
              "group relative flex items-start gap-4 p-5 rounded-[24px] text-left transition-all duration-500",
              "bg-secondary/20 hover:bg-secondary/40 border border-border/20 hover:border-border/40",
              "backdrop-blur-xl shadow-2xl hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]",
              "hover:scale-[1.02] active:scale-[0.98]"
            )}
            whileTap={{ scale: 0.98 }}
          >
            {/* Icon Container */}
            <div className="relative w-12 h-12 rounded-[18px] bg-secondary/30 border border-border/20 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-lg">
              <item.icon className="h-5 w-5 transition-transform duration-500 group-hover:scale-110" strokeWidth={1.5} />
            </div>

            <div className="flex flex-col justify-center h-full space-y-1">
              <span className="text-[14px] font-semibold text-foreground/80 group-hover:text-foreground transition-colors tracking-tight">
                {item.text}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-black group-hover:text-muted-foreground/80 transition-colors">
                  Sugestão Synapse
                </span>
                <div className="w-1 h-1 rounded-full bg-border" />
                <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60 font-bold group-hover:text-muted-foreground/80">
                  Click to start
                </span>
              </div>
            </div>

            {/* Shine Effect */}
            <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          </motion.button>
        ))}
      </div>
    </div>
  );
};