import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, Code, Loader2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import mermaid from "mermaid";
import { useEffect, useRef, useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

interface MermaidDiagramProps {
  chart: string;
  compact?: boolean;
  className?: string;
}

export const MermaidDiagram = ({ chart, compact = false, className }: MermaidDiagramProps) => {
  const [svg, setSvg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const isDark = document.documentElement.classList.contains("dark");

      mermaid.initialize({
        startOnLoad: false,
        suppressErrorRendering: true,
        theme: "base",
        themeVariables: {
          darkMode: isDark,
          background: isDark ? "#000000" : "#ffffff",
          primaryColor: isDark ? "#000000" : "#ffffff",
          primaryTextColor: isDark ? "#ffffff" : "#09090b",
          primaryBorderColor: isDark ? "#ffffff" : "#09090b",
          lineColor: isDark ? "#71717a" : "#a1a1aa",
          textColor: isDark ? "#e4e4e7" : "#27272a",
          mainBkg: isDark ? "#000000" : "#ffffff",
          nodeBorder: isDark ? "#ffffff" : "#09090b",
          clusterBkg: isDark ? "#000000" : "#ffffff",
          clusterBorder: isDark ? "#333333" : "#e4e4e7",
          defaultLinkColor: isDark ? "#71717a" : "#a1a1aa",
          fontFamily: "Inter, sans-serif",
        },
        flowchart: {
          htmlLabels: true,
          curve: "basis",
        },
      });
    } catch (e) {
      console.error("Mermaid init error", e);
    }
  }, []);

  useEffect(() => {
    const renderChart = async () => {
      if (!chart) return;

      setError(null);
      setSvg("");

      try {
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const cleanChart = chart.replace(/[\u200B-\u200D\uFEFF]/g, "");
        const { svg } = await mermaid.render(id, cleanChart);
        setSvg(svg);
      } catch (e) {
        console.error("Mermaid Render Error:", e);
        setError("Nao foi possivel renderizar a estrutura logica gerada.");
      }
    };

    void renderChart();
  }, [chart]);

  if (error) {
    return (
      <div
        className={cn(
          "flex h-full flex-col items-center justify-center rounded-xl border border-rose-500/20 bg-zinc-50 text-center dark:bg-[#0F0F11]/50",
          compact ? "m-0 p-4" : "m-4 p-8",
          className,
        )}
      >
        <div className={cn("mb-4 flex items-center justify-center rounded-full bg-rose-500/10", compact ? "h-9 w-9" : "h-12 w-12")}>
          <AlertTriangle className={cn("text-rose-500", compact ? "h-4 w-4" : "h-6 w-6")} />
        </div>
        <p className={cn("mb-2 font-bold text-zinc-900 dark:text-white", compact ? "text-xs" : "text-sm")}>
          Falha na Visualizacao
        </p>
        <p className={cn("mb-4 max-w-xs text-zinc-500 dark:text-zinc-400", compact ? "text-[10px]" : "text-xs")}>
          {error}
        </p>

        <div className={cn("w-full max-w-md rounded-lg border border-zinc-200 bg-zinc-200/40 text-left dark:border-white/5 dark:bg-black/40", compact ? "p-2" : "p-3")}>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            <Code className="h-3 w-3" /> Debug
          </div>
          <pre className={cn("overflow-auto whitespace-pre-wrap break-all font-mono text-zinc-500 dark:text-zinc-400", compact ? "max-h-20 text-[8px]" : "max-h-32 text-[10px]")}>
            {chart}
          </pre>
        </div>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className={cn("flex h-full flex-col items-center justify-center gap-4", className)}>
        <Loader2 className={cn("animate-spin text-zinc-900/20 dark:text-white/20", compact ? "h-5 w-5" : "h-8 w-8")} />
        <span className={cn("animate-pulse font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-600", compact ? "text-[8px]" : "text-[10px]")}>
          Construindo Grafico...
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn("group relative h-full w-full overflow-hidden bg-white dark:bg-[#020204]", compact && "rounded-2xl", className)}
      ref={containerRef}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />

      <TransformWrapper
        initialScale={compact ? 0.82 : 1}
        minScale={compact ? 0.35 : 0.5}
        maxScale={compact ? 2.5 : 4}
        centerOnInit
        limitToBounds={false}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {!compact && (
              <div className="absolute bottom-6 right-6 z-20 flex translate-y-2 flex-col gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <div className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white/90 p-1 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#151518]/90">
                  <Button variant="ghost" size="icon" onClick={() => zoomIn()} className="h-8 w-8 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => zoomOut()} className="h-8 w-8 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <div className="my-0.5 h-px w-full bg-zinc-200 dark:bg-white/10" />
                  <Button variant="ghost" size="icon" onClick={() => resetTransform()} className="h-8 w-8 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <TransformComponent
              wrapperClass="w-full h-full"
              contentClass="w-full h-full flex items-center justify-center"
            >
              <div
                dangerouslySetInnerHTML={{ __html: svg }}
                className="mermaid-svg-container"
                style={{
                  opacity: 0.9,
                  filter: "drop-shadow(0 0 20px rgba(255,255,255,0.05))",
                  padding: compact ? "14px" : "40px",
                }}
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
};
