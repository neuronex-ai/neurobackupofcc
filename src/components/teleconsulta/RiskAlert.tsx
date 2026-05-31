import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface RiskAlertProps {
  riskScore: number;
}

export const RiskAlert = ({ riskScore = 0 }: RiskAlertProps) => {
  const riskLevel = riskScore * 10; // Scale 0-10 to 0-100%

  if (riskLevel < 20) return null; // Don't show for low risk

  return (
    <div className="absolute top-6 left-6 z-30 w-56 p-3 rounded-2xl bg-white/40 dark:bg-[#050505]/40 backdrop-blur-[20px] border border-white/20 dark:border-white/10 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-full bg-rose-500/10 border border-rose-500/20">
            <AlertTriangle className="h-3 w-3 text-rose-500" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 dark:text-zinc-300">Risco Monitorado</span>
        </div>
        <span className="text-[10px] font-bold text-rose-500">{Math.round(riskLevel)}%</span>
      </div>
      <div className="w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.4)]"
          initial={{ width: "0%" }}
          animate={{ width: `${riskLevel}%` }}
          transition={{ duration: 1.5, ease: [0.32, 0.72, 0, 1] }}
        />
      </div>
    </div>
  );
};