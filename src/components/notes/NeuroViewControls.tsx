import { useState } from "react";
import {
  Settings2,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Target,
  ChevronDown,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface NeuroConfig {
  repulsion: number;
  linkDistance: number;
  centerForce: number;
  performanceMode: boolean;
  showPatients: boolean;
  showNotes: boolean;
  showTags: boolean;
}

interface NeuroViewControlsProps {
  config: NeuroConfig;
  onConfigChange: (config: NeuroConfig) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCenter: () => void;
  onAnimate: () => void;
}

const controlButtonClass =
  "h-10 w-10 shrink-0 rounded-2xl bg-white/62 dark:bg-white/[0.055] border border-black/[0.06] dark:border-white/[0.085] text-zinc-500 dark:text-white/62 hover:text-zinc-950 dark:hover:text-white hover:bg-white/86 dark:hover:bg-white/[0.105] transition-all duration-300 active:scale-95 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_18px_44px_-32px_rgba(0,0,0,0.55)]";

export const NeuroViewControls = ({
  config,
  onConfigChange,
  searchQuery,
  onSearchChange,
  isFullscreen,
  onToggleFullscreen,
  onZoomIn,
  onZoomOut,
  onCenter,
  onAnimate,
}: NeuroViewControlsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const update = (key: keyof NeuroConfig, value: any) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <div className="absolute inset-x-0 bottom-5 z-50 flex justify-center px-5 pointer-events-none">
      <div className="relative flex w-full max-w-[760px] flex-col items-center gap-3 pointer-events-auto">
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.96, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 18, scale: 0.96, filter: "blur(8px)" }}
              transition={{ type: "spring", damping: 28, stiffness: 360 }}
              className={cn(
                "w-full max-w-[430px] p-4 space-y-4",
                "rounded-[28px] bg-white/78 dark:bg-[#070708]/76 backdrop-blur-3xl",
                "border border-black/[0.07] dark:border-white/[0.085]",
                "shadow-[0_34px_110px_-48px_rgba(0,0,0,0.64),inset_0_1px_0_rgba(255,255,255,0.18)]",
              )}
            >
              <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.08]">
                <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-zinc-700 dark:text-white/72">
                  <Settings2 className="h-3.5 w-3.5" /> Fisica do NeuroView
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsExpanded(false)}
                  className="h-7 w-7 rounded-xl text-zinc-400 hover:bg-black/5 hover:text-zinc-900 dark:text-white/45 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="rounded-2xl border border-black/[0.055] bg-black/[0.025] p-3 dark:border-white/[0.07] dark:bg-white/[0.035]">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-zinc-700 dark:text-white/72">Otimizacao dinamica</Label>
                    <p className="text-[10px] leading-relaxed text-zinc-500 dark:text-white/42">
                      Reduz detalhes enquanto a rede esta em movimento intenso.
                    </p>
                  </div>
                  <Switch
                    checked={config.performanceMode}
                    onCheckedChange={(value) => update("performanceMode", value)}
                    className="scale-75 data-[state=checked]:bg-zinc-950 dark:data-[state=checked]:bg-white/80"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-white/44">
                  <span>Repulsao neural</span>
                  <span className="tabular-nums">{Math.abs(config.repulsion).toFixed(0)}</span>
                </div>
                <Slider
                  value={[Math.abs(config.repulsion)]}
                  min={120}
                  max={1300}
                  step={20}
                  onValueChange={([value]) => update("repulsion", -value)}
                  className="[&>span:first-child]:bg-zinc-200 dark:[&>span:first-child]:bg-white/10 [&_[role=slider]]:bg-zinc-950 dark:[&_[role=slider]]:bg-white [&_[role=slider]]:border-0 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-white/44">
                  <span>Comprimento dos elos</span>
                  <span className="tabular-nums">{config.linkDistance.toFixed(0)}px</span>
                </div>
                <Slider
                  value={[config.linkDistance]}
                  min={45}
                  max={210}
                  step={5}
                  onValueChange={([value]) => update("linkDistance", value)}
                  className="[&>span:first-child]:bg-zinc-200 dark:[&>span:first-child]:bg-white/10 [&_[role=slider]]:bg-zinc-950 dark:[&_[role=slider]]:bg-white [&_[role=slider]]:border-0 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-white/44">
                  <span>Gravidade central</span>
                  <span className="tabular-nums">{(config.centerForce * 100).toFixed(1)}%</span>
                </div>
                <Slider
                  value={[config.centerForce * 100]}
                  min={0}
                  max={26}
                  step={1}
                  onValueChange={([value]) => update("centerForce", value / 100)}
                  className="[&>span:first-child]:bg-zinc-200 dark:[&>span:first-child]:bg-white/10 [&_[role=slider]]:bg-zinc-950 dark:[&_[role=slider]]:bg-white [&_[role=slider]]:border-0 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-black/[0.06] pt-3 dark:border-white/[0.08]">
                {[
                  ["Pacientes", "showPatients"],
                  ["Notas", "showNotes"],
                  ["Tags", "showTags"],
                ].map(([label, key]) => (
                  <label
                    key={key}
                    className="flex items-center justify-between gap-2 rounded-2xl border border-black/[0.055] bg-black/[0.025] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500 dark:border-white/[0.07] dark:bg-white/[0.035] dark:text-white/48"
                  >
                    {label}
                    <Switch
                      checked={Boolean(config[key as keyof NeuroConfig])}
                      onCheckedChange={(value) => update(key as keyof NeuroConfig, value)}
                      className="scale-[0.68] data-[state=checked]:bg-zinc-950 dark:data-[state=checked]:bg-white/80"
                    />
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex w-full items-center gap-2 rounded-[28px] border border-black/[0.08] bg-white/72 px-2.5 py-2.5 shadow-[0_30px_90px_-42px_rgba(0,0,0,0.62),inset_0_1px_0_rgba(255,255,255,0.42)] backdrop-blur-3xl dark:border-white/[0.09] dark:bg-[#070708]/72 dark:shadow-[0_30px_90px_-42px_rgba(0,0,0,0.86),inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="relative min-w-[180px] flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-white/36" />
            <Input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar notas..."
              className={cn(
                "h-10 rounded-2xl border-transparent bg-black/[0.035] pl-10 pr-3 text-sm text-zinc-900 shadow-none outline-none transition-all",
                "placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:border-black/[0.08]",
                "dark:bg-white/[0.055] dark:text-white dark:placeholder:text-white/36 dark:focus-visible:border-white/[0.12]",
              )}
            />
          </div>

          <div className="hidden h-8 w-px bg-black/[0.08] dark:bg-white/[0.09] sm:block" />

          <div className="flex shrink-0 items-center gap-1.5">
            <Button size="icon" variant="ghost" onClick={onAnimate} className={controlButtonClass} title="Brotar rede neural">
              <Play className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onZoomOut} className={controlButtonClass} title="Visao panoramica">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onZoomIn} className={controlButtonClass} title="Foco de leitura">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onCenter} className={controlButtonClass} title="Centralizar rede">
              <Target className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => update("performanceMode", !config.performanceMode)}
              className={cn(
                controlButtonClass,
                config.performanceMode && "bg-amber-500/16 text-amber-600 dark:text-amber-300 dark:bg-amber-500/18"
              )}
              title={config.performanceMode ? "Desativar modo performance" : "Ativar modo performance"}
            >
              <Settings2 className={cn("h-4 w-4", config.performanceMode && "animate-pulse")} />
            </Button>
            <Button size="icon" variant="ghost" onClick={onToggleFullscreen} className={controlButtonClass} title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}>
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(controlButtonClass, isExpanded && "bg-zinc-950 text-white dark:bg-white dark:text-black")}
              title="Ajustar fisica"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
