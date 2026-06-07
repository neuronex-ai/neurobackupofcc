import { useState } from "react";
import {
  Settings2,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Target,
  ChevronUp,
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
  sidebarOffset?: number;
}

const controlButtonClass =
  "h-9 w-9 rounded-xl bg-background/80 dark:bg-black/60 backdrop-blur-xl border border-border/10 dark:border-white/10 hover:bg-secondary dark:hover:bg-white/10 text-muted-foreground dark:text-white/70 hover:text-foreground dark:hover:text-white transition-colors shadow-[0_18px_40px_-24px_rgba(0,0,0,0.45)]";

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
  sidebarOffset = 16,
}: NeuroViewControlsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const update = (key: keyof NeuroConfig, value: any) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <div
      className="absolute top-4 right-4 z-50 pointer-events-none flex justify-end transition-[left] duration-500 ease-out"
      style={{ left: sidebarOffset }}
    >
      <div className="pointer-events-auto flex w-full max-w-[720px] flex-col items-end gap-3">
        <div className="relative w-full max-w-[360px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/45 dark:text-white/40" />
          <Input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar notas..."
            className={cn(
              "h-10 w-full rounded-xl pl-10 pr-4",
              "bg-background/82 dark:bg-black/62 backdrop-blur-xl",
              "border-border/10 dark:border-white/10 focus:border-border/20 dark:focus:border-white/20",
              "text-foreground dark:text-white placeholder:text-muted-foreground/45 dark:placeholder:text-white/40",
              "shadow-[0_24px_60px_-34px_rgba(0,0,0,0.5)] transition-colors",
            )}
          />
        </div>

        <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={onAnimate}
            className={controlButtonClass}
            title="Brotar rede neural"
          >
            <Play className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onZoomOut}
            className={controlButtonClass}
            title="Visao panoramica"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onZoomIn}
            className={controlButtonClass}
            title="Foco de leitura"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onCenter}
            className={controlButtonClass}
            title="Centralizar rede"
          >
            <Target className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => update("performanceMode", !config.performanceMode)}
            className={cn(
              "h-9 w-9 rounded-xl backdrop-blur-xl border transition-colors shadow-[0_18px_40px_-24px_rgba(0,0,0,0.45)]",
              config.performanceMode
                ? "bg-orange-500/20 text-orange-500 dark:text-orange-300 border-orange-500/30 hover:bg-orange-500/30"
                : "bg-background/80 dark:bg-black/60 border-border/10 dark:border-white/10 text-muted-foreground dark:text-white/70 hover:bg-secondary dark:hover:bg-white/10 hover:text-foreground dark:hover:text-white"
            )}
            title={config.performanceMode ? "Desativar modo performance" : "Ativar modo performance"}
          >
            <Settings2 className={cn("h-4 w-4", config.performanceMode && "animate-pulse")} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleFullscreen}
            className={controlButtonClass}
            title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "h-9 w-9 rounded-xl backdrop-blur-xl border border-border/10 dark:border-white/10 hover:bg-secondary dark:hover:bg-white/10 text-muted-foreground dark:text-white/70 hover:text-foreground dark:hover:text-white transition-colors shadow-[0_18px_40px_-24px_rgba(0,0,0,0.45)]",
              isExpanded ? "bg-secondary dark:bg-white/10" : "bg-background/80 dark:bg-black/60",
            )}
            title="Ajustar fisica"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
              className={cn(
                "w-full max-w-[320px] p-4 space-y-4",
                "bg-background/92 dark:bg-black/64 backdrop-blur-2xl",
                "border border-border/10 dark:border-white/10 rounded-2xl",
                "shadow-[0_30px_90px_-36px_rgba(0,0,0,0.62)]",
              )}
            >
              <div className="flex items-center justify-between border-b border-border/10 pb-2 dark:border-white/10">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground/80 dark:text-white/80">
                  <Settings2 className="h-3.5 w-3.5" /> Controles de fisica
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsExpanded(false)}
                  className="h-6 w-6 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground dark:text-white/50 dark:hover:bg-white/10"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="space-y-2">
                <div className={cn(
                  "flex items-center justify-between rounded-lg border p-2 transition-colors",
                  config.performanceMode
                    ? "bg-amber-500/10 border-amber-500/20"
                    : "bg-secondary/20 dark:bg-white/5 border-border/5"
                )}>
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium italic text-foreground/70 dark:text-white/70">Otimizacao dinamica</Label>
                    <p className="text-[9px] leading-tight text-muted-foreground">
                      Reduz detalhes visuais durante o movimento para manter a taxa de quadros estavel.
                    </p>
                  </div>
                  <Switch
                    checked={config.performanceMode}
                    onCheckedChange={(value) => update("performanceMode", value)}
                    className="scale-75 data-[state=checked]:bg-amber-500 dark:data-[state=checked]:bg-amber-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-muted-foreground dark:text-white/50">
                  <span>Repulsao neural</span>
                  <span className="tabular-nums">{Math.abs(config.repulsion).toFixed(0)}</span>
                </div>
                <Slider
                  value={[Math.abs(config.repulsion)]}
                  min={120}
                  max={1800}
                  step={20}
                  onValueChange={([value]) => update("repulsion", -value)}
                  className="[&>span:first-child]:bg-secondary dark:[&>span:first-child]:bg-white/10 [&_[role=slider]]:bg-rose-500 dark:[&_[role=slider]]:bg-rose-400 [&_[role=slider]]:border-0 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-muted-foreground dark:text-white/50">
                  <span>Comprimento dos elos</span>
                  <span className="tabular-nums">{config.linkDistance.toFixed(0)}px</span>
                </div>
                <Slider
                  value={[config.linkDistance]}
                  min={35}
                  max={220}
                  step={5}
                  onValueChange={([value]) => update("linkDistance", value)}
                  className="[&>span:first-child]:bg-secondary dark:[&>span:first-child]:bg-white/10 [&_[role=slider]]:bg-primary dark:[&_[role=slider]]:bg-white [&_[role=slider]]:border-0 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-muted-foreground dark:text-white/50">
                  <span>Gravidade central</span>
                  <span className="tabular-nums">{(config.centerForce * 100).toFixed(1)}%</span>
                </div>
                <Slider
                  value={[config.centerForce * 100]}
                  min={0}
                  max={40}
                  step={1}
                  onValueChange={([value]) => update("centerForce", value / 100)}
                  className="[&>span:first-child]:bg-secondary dark:[&>span:first-child]:bg-white/10 [&_[role=slider]]:bg-primary dark:[&_[role=slider]]:bg-white [&_[role=slider]]:border-0 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
                />
              </div>

              <div className="space-y-3 border-t border-border/10 pt-2 dark:border-white/10">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground dark:text-white/50">
                  Filtros
                </span>

                <div className="flex items-center justify-between">
                  <Label className="text-xs text-foreground/70 dark:text-white/70">Pacientes</Label>
                  <Switch
                    checked={config.showPatients}
                    onCheckedChange={(value) => update("showPatients", value)}
                    className="scale-75 data-[state=checked]:bg-primary dark:data-[state=checked]:bg-white/80"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-foreground/70 dark:text-white/70">Notas</Label>
                  <Switch
                    checked={config.showNotes}
                    onCheckedChange={(value) => update("showNotes", value)}
                    className="scale-75 data-[state=checked]:bg-primary dark:data-[state=checked]:bg-white/80"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-foreground/70 dark:text-white/70">Tags</Label>
                  <Switch
                    checked={config.showTags}
                    onCheckedChange={(value) => update("showTags", value)}
                    className="scale-75 data-[state=checked]:bg-primary dark:data-[state=checked]:bg-white/80"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
