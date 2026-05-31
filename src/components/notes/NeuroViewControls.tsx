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
  onAnimate: () => void; // New: trigger bloom animation
}

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
    <div className="absolute top-4 right-4 z-50 pointer-events-none">
      <div className="pointer-events-auto flex flex-col gap-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar notas..."
            className={cn(
              "pl-10 pr-4 h-10 w-[280px]",
              "bg-background/80 dark:bg-black/60 backdrop-blur-xl",
              "border-border/10 dark:border-white/10 focus:border-border/20 dark:focus:border-white/20",
              "text-foreground dark:text-white placeholder:text-muted-foreground/40 dark:placeholder:text-white/40",
              "rounded-xl shadow-2xl transition-colors",
            )}
          />
        </div>

        {/* Quick Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={onAnimate}
            className="h-9 w-9 rounded-xl bg-background/80 dark:bg-black/60 backdrop-blur-xl border border-border/10 dark:border-white/10 hover:bg-secondary dark:hover:bg-white/10 text-muted-foreground dark:text-white/70 hover:text-foreground dark:hover:text-white transition-colors"
            title="Animar rede neural"
          >
            <Play className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onZoomOut}
            className="h-9 w-9 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 hover:bg-white/10 text-white/70 hover:text-white"
            title="Visão Panormica (0.8x)"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onZoomIn}
            className="h-9 w-9 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 hover:bg-white/10 text-white/70 hover:text-white"
            title="Foco de Leitura (1.5x)"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onCenter}
            className="h-9 w-9 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 hover:bg-white/10 text-white/70 hover:text-white"
          >
            <Target className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => update("performanceMode", !config.performanceMode)}
            className={cn(
              "h-9 w-9 rounded-xl backdrop-blur-xl border border-white/10 transition-colors",
              config.performanceMode
                ? "bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30"
                : "bg-black/60 text-white/70 hover:bg-white/10 hover:text-white"
            )}
            title={config.performanceMode ? "Desativar Modo Performance" : "Ativar Modo Performance"}
          >
            <Settings2 className={cn("h-4 w-4", config.performanceMode && "animate-pulse")} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleFullscreen}
            className="h-9 w-9 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 hover:bg-white/10 text-white/70 hover:text-white"
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "h-9 w-9 rounded-xl backdrop-blur-xl border border-border/10 dark:border-white/10 hover:bg-secondary dark:hover:bg-white/10 text-muted-foreground dark:text-white/70 hover:text-foreground dark:hover:text-white transition-colors",
              isExpanded ? "bg-secondary dark:bg-white/10" : "bg-background/80 dark:bg-black/60",
            )}
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Expanded Settings Panel */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
              className={cn(
                "w-[280px] p-4 space-y-4",
                "bg-background/90 dark:bg-black/60 backdrop-blur-2xl",
                "border border-border/10 dark:border-white/10 rounded-2xl",
                "shadow-2xl",
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-border/10 dark:border-white/10">
                <span className="text-xs font-semibold text-foreground/80 dark:text-white/80 uppercase tracking-wider flex items-center gap-2">
                  <Settings2 className="h-3.5 w-3.5" /> Controles de Física
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsExpanded(false)}
                  className="h-6 w-6 rounded-md hover:bg-secondary dark:hover:bg-white/10 text-muted-foreground dark:text-white/50"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Performance Mode */}
              <div className="space-y-2">
                <div className={cn(
                  "flex items-center justify-between p-2 rounded-lg border transition-colors",
                  config.performanceMode
                    ? "bg-amber-500/10 border-amber-500/20"
                    : "bg-secondary/20 dark:bg-white/5 border-border/5"
                )}>
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium text-foreground/70 dark:text-white/70 italic">Otimização Dinmica</Label>
                    <p className="text-[9px] text-muted-foreground leading-tight">Reduz detalhes visuais durante o movimento para manter a taxa de quadros estável.</p>
                  </div>
                  <Switch
                    checked={config.performanceMode}
                    onCheckedChange={(v) => update("performanceMode", v)}
                    className="scale-75 data-[state=checked]:bg-amber-500 dark:data-[state=checked]:bg-amber-400"
                  />
                </div>
              </div>

              {/* Repulsion Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-muted-foreground dark:text-white/50">
                  <span>Repulsão (Espaçamento)</span>
                  <span className="tabular-nums">{(Math.abs(config.repulsion) / 1000).toFixed(0)}k</span>
                </div>
                <Slider
                  value={[Math.abs(config.repulsion)]}
                  min={10000}
                  max={1000000}
                  step={10000}
                  onValueChange={([v]) => update("repulsion", -v)}
                  className="[&>span:first-child]:bg-secondary dark:[&>span:first-child]:bg-white/10 [&_[role=slider]]:bg-rose-500 dark:[&_[role=slider]]:bg-rose-400 [&_[role=slider]]:border-0 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
                />
              </div>

              {/* Link Distance Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-muted-foreground dark:text-white/50">
                  <span>Comprimento dos Elos</span>
                  <span className="tabular-nums">{config.linkDistance.toFixed(0)}px</span>
                </div>
                <Slider
                  value={[config.linkDistance]}
                  min={100}
                  max={5000}
                  step={100}
                  onValueChange={([v]) => update("linkDistance", v)}
                  className="[&>span:first-child]:bg-secondary dark:[&>span:first-child]:bg-white/10 [&_[role=slider]]:bg-primary dark:[&_[role=slider]]:bg-white [&_[role=slider]]:border-0 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
                />
              </div>

              {/* Center Force Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-muted-foreground dark:text-white/50">
                  <span>Gravidade Central</span>
                  <span className="tabular-nums">
                    {(config.centerForce * 100).toFixed(1)}%
                  </span>
                </div>
                <Slider
                  value={[config.centerForce * 100]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={([v]) => update("centerForce", v / 100)}
                  className="[&>span:first-child]:bg-secondary dark:[&>span:first-child]:bg-white/10 [&_[role=slider]]:bg-primary dark:[&_[role=slider]]:bg-white [&_[role=slider]]:border-0 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
                />
              </div>

              {/* Filters */}
              <div className="pt-2 space-y-3 border-t border-border/10 dark:border-white/10">
                <span className="text-[10px] font-semibold text-muted-foreground dark:text-white/50 uppercase tracking-wider">
                  Filtros
                </span>

                <div className="flex items-center justify-between">
                  <Label className="text-xs text-foreground/70 dark:text-white/70">Pacientes</Label>
                  <Switch
                    checked={config.showPatients}
                    onCheckedChange={(v) => update("showPatients", v)}
                    className="scale-75 data-[state=checked]:bg-primary dark:data-[state=checked]:bg-white/80"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-foreground/70 dark:text-white/70">Notas</Label>
                  <Switch
                    checked={config.showNotes}
                    onCheckedChange={(v) => update("showNotes", v)}
                    className="scale-75 data-[state=checked]:bg-primary dark:data-[state=checked]:bg-white/80"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-foreground/70 dark:text-white/70">Tags</Label>
                  <Switch
                    checked={config.showTags}
                    onCheckedChange={(v) => update("showTags", v)}
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
