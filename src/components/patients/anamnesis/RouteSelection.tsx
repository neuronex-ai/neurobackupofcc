"use client";

import { motion } from "framer-motion";
import { FileText, ArrowRight, BrainCircuit, Sparkles, Wand2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

interface RouteSelectionProps {
  onSelectRoute: (route: 'import' | 'template') => void;
}

export function RouteSelection({ onSelectRoute }: RouteSelectionProps) {
  return (
    <div className="w-full relative z-10 font-sans text-zinc-900 dark:text-zinc-100 selection:bg-zinc-900/10 dark:selection:bg-white/10 selection:text-zinc-900 dark:selection:text-white">
      <div className="flex flex-col items-center justify-center py-8 md:py-14 space-y-10 md:space-y-12 animate-fade-in relative overflow-hidden bg-transparent rounded-[48px]">
        
        {/* Dynamic Background Background Elements - Coordinated with page style */}
        <div className="absolute top-0 right-0 p-40 bg-zinc-100/30 dark:bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 p-40 bg-zinc-100/30 dark:bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

        <div className="text-center space-y-6 max-w-3xl mx-auto relative z-10 px-4 pt-4">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-[2px] w-8 bg-gradient-to-r from-transparent to-zinc-300 dark:to-zinc-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 dark:bg-zinc-100 shadow-[0_0_15px_rgba(0,0,0,0.2)] dark:shadow-[0_0_15px_rgba(255,255,255,0.4)] animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400 dark:text-zinc-500">Fluxo de Triagem Digital</span>
            <div className="h-[2px] w-8 bg-gradient-to-l from-transparent to-zinc-300 dark:to-zinc-700" />
          </div>

          <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100 leading-[1.1]">
            Como deseja dar <span className="text-zinc-400 dark:text-zinc-600">início?</span>
          </h2>

          <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-lg max-w-xl mx-auto leading-relaxed font-medium">
            Escolha o método mais ágil para configurar os dados clínicos deste paciente utilizando as ferramentas da <span className="text-zinc-900 dark:text-zinc-200 font-bold">NeuroNex AI</span>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 w-full max-w-5xl px-6 md:px-10 relative z-10">
          {/* Route 1: Import */}
          <motion.div
            onClick={() => onSelectRoute('import')}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <GlassCard
              className="group cursor-pointer hover:-translate-y-2 transition-all duration-500 h-full"
              innerClassName="p-10 md:p-12 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute -right-4 -top-4 w-40 h-40 bg-zinc-100 dark:bg-white/5 rounded-full blur-3xl group-hover:bg-zinc-200 dark:group-hover:bg-white/10 transition-colors" />

              <div className="flex flex-col space-y-12 relative z-10">
                <div className="w-16 h-16 rounded-[24px] bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-2xl border border-white/10 dark:border-black/10">
                  <Wand2 className="w-7 h-7 stroke-[2.5]" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-zinc-900 dark:text-zinc-100" />
                    <h3 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">NeuroScan AI</h3>
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base leading-relaxed font-medium">
                    Digitalize documentos existentes. Nossa IA extrai campos, interpreta respostas e organiza tudo <strong className="text-zinc-900 dark:text-zinc-200">automaticamente</strong> no prontuário.
                  </p>
                </div>
              </div>

              <div className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 gap-3 transition-colors pt-6 border-t border-zinc-100 dark:border-white/5 mt-8 relative z-10">
                <span>Iniciar Processamento</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </GlassCard>
          </motion.div>

          {/* Route 2: Templates */}
          <motion.div
            onClick={() => onSelectRoute('template')}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <GlassCard
              className="group cursor-pointer hover:-translate-y-2 transition-all duration-500 h-full"
              innerClassName="p-10 md:p-12 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute -right-4 -top-4 w-40 h-40 bg-zinc-900/5 dark:bg-white/5 rounded-full blur-3xl group-hover:bg-zinc-900/10 dark:group-hover:bg-white/10 transition-colors" />

              <div className="flex flex-col space-y-12 relative z-10">
                <div className="w-16 h-16 rounded-[24px] bg-zinc-100 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-sm border border-zinc-200 dark:border-white/5">
                  <FileText className="w-7 h-7" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">Modelos Clínicos</h3>
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base leading-relaxed font-medium">
                    Selecione entre templates estruturados e validados (Adulto, Infantil, Escolar, etc.) para realizar a anamnese <strong className="text-zinc-900 dark:text-zinc-200">em tempo real</strong> com o paciente.
                  </p>
                </div>
              </div>

              <div className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 gap-3 transition-colors pt-6 border-t border-zinc-100 dark:border-white/5 mt-8 relative z-10">
                <span>Explorar Modelos</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </div>
            </GlassCard>
          </motion.div>
        </div>

        <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-600 bg-white dark:bg-zinc-900/50 px-6 py-3 rounded-full border border-zinc-200 dark:border-white/10 shadow-lg relative z-10 mb-4 transition-all hover:scale-105 hover:bg-zinc-50 dark:hover:bg-zinc-900">
          <BrainCircuit className="w-4 h-4 text-zinc-900 dark:text-zinc-200" />
          <span>NeuroNex Intelligence Engine v4.0</span>
        </div>
      </div>
    </div>
  );
}