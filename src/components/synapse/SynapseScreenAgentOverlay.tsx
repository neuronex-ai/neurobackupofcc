import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MousePointer2, X } from "lucide-react";
import {
  cancelSynapseInterfaceAction,
  SYNAPSE_SCREEN_AGENT_EVENT,
} from "@/lib/synapse-interface-actions";

interface AgentState {
  active: boolean;
  label?: string;
  action?: string;
}

export function SynapseScreenAgentOverlay() {
  const [state, setState] = useState<AgentState>({ active: false });

  useEffect(() => {
    const handleState = (event: Event) => {
      const detail = (event as CustomEvent<AgentState>).detail || { active: false };
      setState(detail);
    };
    window.addEventListener(SYNAPSE_SCREEN_AGENT_EVENT, handleState);
    return () => window.removeEventListener(SYNAPSE_SCREEN_AGENT_EVENT, handleState);
  }, []);

  return (
    <AnimatePresence>
      {state.active ? (
        <motion.div
          key="synapse-screen-agent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-[9988] rounded-[18px] ring-2 ring-indigo-500/35 ring-inset shadow-[inset_0_0_80px_rgba(99,102,241,0.045)]"
          aria-live="polite"
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="pointer-events-auto absolute left-1/2 top-4 flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-3 rounded-full border border-black/10 bg-white/90 py-2 pl-3 pr-2 shadow-[0_14px_50px_-20px_rgba(0,0,0,0.35)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/90"
          >
            <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
              <MousePointer2 className="h-3.5 w-3.5" />
              <span className="absolute inset-0 animate-ping rounded-full border border-indigo-500/30" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-zinc-950 dark:text-white">
                Synapse está utilizando sua tela
              </p>
              <p className="truncate text-[10px] text-zinc-500 dark:text-zinc-400">
                {state.label || "Executando uma ação assistida"}
              </p>
            </div>
            <button
              type="button"
              onClick={cancelSynapseInterfaceAction}
              className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-black/5 hover:text-zinc-950 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Cancelar ação do Synapse"
              title="Cancelar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
