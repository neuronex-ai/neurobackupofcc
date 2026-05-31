import { cn } from "@/lib/utils";
import { Loader2, Mic, RefreshCcw } from "lucide-react";

interface AIOptionsOrbProps {
    isRecording: boolean;
    onToggleRecording: () => void;
    onReset: () => void;
    isProcessing: boolean;
}

export const AIOptionsOrb = ({ isRecording, onToggleRecording, onReset, isProcessing }: AIOptionsOrbProps) => {
    return (
        <div className="flex flex-col items-center justify-center space-y-12 relative z-20 py-8">

            {/* Container do Orbe com Efeitos Atmosféricos */}
            <div className="relative group">

                {/* Camada 1: Glow Ambiente (Fundo) - Pulsação Lenta */}
                <div className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px] transition-all duration-1000",
                    isProcessing
                        ? "w-[280px] h-[280px] bg-white/20 animate-pulse"
                        : isRecording
                            ? "w-[350px] h-[350px] bg-primary/30 animate-pulse-slow"
                            : "w-[180px] h-[180px] bg-primary/10 group-hover:bg-primary/20"
                )} />

                {/* Camada 2: Ondas de Voz (Apenas gravando) - Efeito Ripple */}
                {isRecording && !isProcessing && (
                    <>
                        <div className="absolute inset-0 rounded-full border border-primary/40 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                        <div className="absolute inset-[-20px] rounded-full border border-primary/20 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite_200ms]" />
                        <div className="absolute inset-[-40px] rounded-full border border-primary/10 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite_400ms]" />
                    </>
                )}

                {/* O Orbe Central "Liquid Glass" */}
                <button
                    onClick={onToggleRecording}
                    className={cn(
                        "relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-700 ease-out z-10 overflow-hidden",
                        // Base & Glass Effect
                        "bg-card/80 backdrop-blur-3xl border shadow-2xl",
                        // Interactive States
                        isProcessing
                            ? "scale-105 border-primary/40 shadow-[0_0_60px_rgba(var(--primary),0.2)]"
                            : isRecording
                                ? "scale-110 border-primary/60 shadow-[0_0_80px_hsl(var(--primary)/0.6),inset_0_0_30px_hsl(var(--primary)/0.4)]"
                                : "scale-100 border-border/10 hover:border-border/30 hover:scale-105 shadow-[0_0_40px_rgba(139,92,246,0.1)]"
                    )}
                >
                    {/* Inner Liquid Gradient - Animated Gradient */}
                    <div className={cn(
                        "absolute inset-0 rounded-full opacity-60 transition-opacity duration-700 bg-[size:200%_200%] animate-[gradient_5s_ease_infinite]",
                        isRecording
                            ? "bg-gradient-to-t from-primary/80 via-purple-600/30 to-transparent"
                            : "bg-gradient-to-br from-secondary/50 to-transparent"
                    )} />

                    {/* The Core Light (Logo) */}
                    {isProcessing ? (
                        <div className="relative z-20">
                            <Loader2 className="h-12 w-12 animate-spin text-primary drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                        </div>
                    ) : (
                        <div className="relative z-20 flex items-center justify-center transition-all duration-500">
                            {isRecording ? (
                                <div className="flex gap-1 h-6 items-center">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="w-1.5 bg-primary rounded-full animate-[audio-wave_0.8s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.15}s`, height: '100%' }} />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 group-hover:scale-110 transition-transform">
                                    <div className="w-3 h-3 bg-primary rounded-full shadow-[0_0_15px_hsl(var(--primary))]" />
                                    <Mic className="h-7 w-7 text-muted-foreground" />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Shine Reflection (Top) */}
                    <div className="absolute top-0 left-1/4 right-1/4 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-full blur-md opacity-50 pointer-events-none" />
                </button>
            </div>

            {/* Controls & Status Text */}
            <div className="flex flex-col items-center space-y-6 relative z-10">
                <div className="flex flex-col items-center gap-3">
                    {/* Status Pill */}
                    <div className={cn(
                        "px-4 py-1.5 rounded-full border backdrop-blur-md transition-all duration-500",
                        isRecording ? "bg-primary/10 border-primary/30" : "bg-secondary/20 border-border/10"
                    )}>
                        <span className={cn(
                            "text-[10px] font-bold tracking-[0.2em] uppercase transition-colors duration-300",
                            isRecording ? "text-primary animate-pulse" : "text-muted-foreground"
                        )}>
                            {isProcessing ? "Processando Raciocínio..." : isRecording ? "Ouvindo..." : "Toque para Falar"}
                        </span>
                    </div>
                </div>

                {!isRecording && (
                    <button
                        onClick={onReset}
                        disabled={isProcessing}
                        className="group flex items-center gap-2 px-6 py-3 rounded-full bg-card/20 hover:bg-card/80 border border-border/10 hover:border-border/30 transition-all duration-300 disabled:opacity-0 disabled:pointer-events-none active:scale-95 cursor-pointer"
                    >
                        <RefreshCcw className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors font-bold">Reiniciar Sessão</span>
                    </button>
                )}
            </div>
        </div>
    );
};