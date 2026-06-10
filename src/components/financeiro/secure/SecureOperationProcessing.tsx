import { useEffect, useState } from "react";
import { Check, Landmark, Loader2, Network, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Conectando Synapses", icon: Network },
  { label: "Enviando pagamento com segurança", icon: ShieldCheck },
  { label: "Aguardando confirmação bancária", icon: Landmark },
];

export function SecureOperationProcessing() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setActiveStep((current) => Math.min(current + 1, STEPS.length - 1)), 1050);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="relative mx-auto min-h-[540px] max-w-3xl overflow-hidden rounded-[36px] border border-white/[0.08] bg-[#050507] p-8 text-white shadow-[0_45px_140px_-45px_rgba(0,0,0,0.85)] md:p-12">
      <div className="pointer-events-none absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/10 blur-[110px]" />
      <div className="relative flex min-h-[440px] flex-col items-center justify-center">
        <div className="relative mb-10 flex h-28 w-28 items-center justify-center">
          <motion.div className="absolute inset-0 rounded-full border border-white/10" animate={{ scale: [0.9, 1.18, 0.9], opacity: [0.25, 0.7, 0.25] }} transition={{ duration: 2.2, repeat: Infinity }} />
          <motion.div className="absolute inset-3 rounded-full border border-blue-400/25" animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} />
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-black shadow-[0_0_55px_-12px_rgba(255,255,255,0.8)]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.28em] text-white/35">NeuroFinance seguro</p>
        <motion.h3 key={activeStep} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 text-center text-2xl font-black tracking-tight md:text-3xl">
          {STEPS[activeStep].label}
        </motion.h3>
        <p className="mt-3 max-w-md text-center text-xs leading-relaxed text-zinc-500">Não feche esta tela. Estamos protegendo e acompanhando cada etapa da solicitação.</p>
        <div className="mt-10 w-full max-w-lg space-y-2">
          {STEPS.map((step, index) => (
            <div key={step.label} className={cn(
              "flex items-center gap-3 rounded-[18px] border px-4 py-3 transition-all duration-500",
              index === activeStep ? "border-white/15 bg-white/[0.07] text-white" : index < activeStep ? "border-emerald-500/15 bg-emerald-500/[0.05] text-emerald-300" : "border-white/[0.04] bg-white/[0.015] text-white/25",
            )}>
              <div className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-white/[0.05]">
                {index < activeStep ? <Check className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.12em]">{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
