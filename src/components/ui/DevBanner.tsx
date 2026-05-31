"use client";

import { ShieldCheck } from "lucide-react";

export function DevBanner() {
    return (
        <div className="fixed top-[72px] right-5 z-[9998] pointer-events-none select-none">
            <div className="relative group pointer-events-auto">
                {/* The seal / label - collapsed by default, small icon */}
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/[0.08] border border-amber-500/20 backdrop-blur-2xl shadow-sm cursor-help hover:bg-amber-500/[0.15] transition-all">
                    <ShieldCheck className="h-4 w-4 text-amber-600/70" />
                    <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-500/60 animate-pulse top-0 right-0" />
                </div>

                {/* Tooltip on hover — expanded message */}
                <div className="absolute top-full right-0 mt-2 w-72 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300 pointer-events-none">
                    <div className="relative overflow-hidden rounded-2xl bg-zinc-900/95 dark:bg-zinc-950/95 backdrop-blur-3xl border border-zinc-800/60 dark:border-white/[0.06] shadow-[0_16px_48px_-8px_rgba(0,0,0,0.4)] ring-1 ring-white/5 p-4">
                        {/* Amber accent line */}
                        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

                        <p className="text-[11px] text-zinc-400 leading-[1.65] font-medium">
                            Sistema em <span className="text-amber-400/80 font-bold">fase de desenvolvimento</span>. Não insira dados pessoais ou sensíveis — apenas teste a plataforma até que o acesso antecipado seja liberado.
                        </p>
                        <div className="mt-2.5 pt-2.5 border-t border-white/[0.04] flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400/50 animate-pulse" />
                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                                Ambiente de Testes
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
