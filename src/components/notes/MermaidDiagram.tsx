import { useEffect, useState, useRef } from "react";
import mermaid from "mermaid";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Loader2, ZoomIn, ZoomOut, RotateCcw, AlertTriangle, Code } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MermaidDiagramProps {
  chart: string;
}

export const MermaidDiagram = ({ chart }: MermaidDiagramProps) => {
  const [svg, setSvg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Inicialização segura
    try {
      const isDark = document.documentElement.classList.contains("dark");

      mermaid.initialize({
        startOnLoad: false,
        suppressErrorRendering: true, // Importante: evita que o mermaid injete HTML de erro
        theme: 'base',
        themeVariables: {
          darkMode: isDark,
          background: isDark ? '#000000' : '#ffffff',
          primaryColor: isDark ? '#000000' : '#ffffff',
          primaryTextColor: isDark ? '#ffffff' : '#09090b',
          primaryBorderColor: isDark ? '#ffffff' : '#09090b',
          lineColor: isDark ? '#71717a' : '#a1a1aa',
          textColor: isDark ? '#e4e4e7' : '#27272a',
          mainBkg: isDark ? '#000000' : '#ffffff',
          nodeBorder: isDark ? '#ffffff' : '#09090b',
          clusterBkg: isDark ? '#000000' : '#ffffff',
          clusterBorder: isDark ? '#333333' : '#e4e4e7',
          defaultLinkColor: isDark ? '#71717a' : '#a1a1aa',
          fontFamily: 'Inter, sans-serif',
        },
        flowchart: {
          htmlLabels: true,
          curve: 'basis'
        }
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
        const id = `mermaid-${Date.now()}`;
        // Remove caracteres invisíveis que podem quebrar o parser
        const cleanChart = chart.replace(/[\u200B-\u200D\uFEFF]/g, '');

        const { svg } = await mermaid.render(id, cleanChart);
        setSvg(svg);
      } catch (e: any) {
        console.error("Mermaid Render Error:", e);
        setError("Não foi possível renderizar a estrutura lógica gerada.");
      }
    };

    renderChart();
  }, [chart]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-zinc-50 dark:bg-[#0F0F11]/50 rounded-xl border border-rose-500/20 m-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
          <AlertTriangle className="h-6 w-6 text-rose-500" />
        </div>
        <p className="text-sm font-bold text-zinc-900 dark:text-white mb-2">Falha na Visualização</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mb-4">{error}</p>

        <div className="w-full max-w-md bg-zinc-200/40 dark:bg-black/40 rounded-lg border border-zinc-200 dark:border-white/5 p-3 text-left">
          <div className="flex items-center gap-2 mb-2 text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
            <Code className="h-3 w-3" /> Debug (Código Gerado)
          </div>
          <pre className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 overflow-auto max-h-32 whitespace-pre-wrap break-all">
            {chart}
          </pre>
        </div>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-900/20 dark:text-white/20" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-600 animate-pulse">Construindo Gráfico...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative group bg-white dark:bg-[#020204] overflow-hidden" ref={containerRef}>

      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        centerOnInit={true}
        limitToBounds={false}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
              <div className="bg-white/90 dark:bg-[#151518]/90 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-xl p-1 flex flex-col gap-1 shadow-2xl">
                <Button variant="ghost" size="icon" onClick={() => zoomIn()} className="h-8 w-8 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => zoomOut()} className="h-8 w-8 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <div className="h-px w-full bg-zinc-200 dark:bg-white/10 my-0.5" />
                <Button variant="ghost" size="icon" onClick={() => resetTransform()} className="h-8 w-8 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <TransformComponent
              wrapperClass="w-full h-full"
              contentClass="w-full h-full flex items-center justify-center"
            >
              <div
                dangerouslySetInnerHTML={{ __html: svg }}
                className="mermaid-svg-container"
                style={{
                  opacity: 0.9,
                  filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.05))',
                  padding: '40px'
                }}
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
};