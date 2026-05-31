import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { forceCollide, forceX, forceY } from "d3-force";
import { usePersonalNotes } from "@/hooks/use-personal-notes";
import { Loader2 } from "lucide-react";
import { NeuroConfig, NeuroViewControls } from "./NeuroViewControls";
import { NeuroViewSidebar } from "./NeuroViewSidebar";
import { GraphNode, GraphLink } from "./graph/graph-types";
import { useGraphData } from "./graph/use-graph-data";
import { lerp, drawNode, drawLink } from "./graph/canvas-renderers";
import { GraphDetailsPanel } from "./graph/GraphDetailsPanel";
import { PersonalNote, Patient } from "@/types";
import { NeuroViewUniverse } from "./NeuroViewUniverse";

// --- DEFAULT CONFIG ---
const DEFAULT_CONFIG: NeuroConfig = {
    repulsion: -200,
    linkDistance: 60,
    centerForce: 0.1,
    performanceMode: false,
    showPatients: true,
    showNotes: true,
    showTags: true
};

export const NeuroView = () => {
    // Universe mode
    const [isUniverseMode, setIsUniverseMode] = useState(false);

    // 1. Refs
    const graphRef = useRef<ForceGraphMethods>();
    const containerRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number>();
    const timeRef = useRef<number>(0);

    // Check theme manually since `next-themes` might not be fully available in this context or standard
    // Ideally use useTheme(), but fallback to class check on documentElement for simplicity if needed
    const [isDarkMode, setIsDarkMode] = useState(true);

    useEffect(() => {
        const checkTheme = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        };
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // 2. Data Hook
    const { updateNote, deleteNote } = usePersonalNotes();
    const [config, setConfig] = useState<NeuroConfig>(DEFAULT_CONFIG);
    const [searchQuery, setSearchQuery] = useState("");

    const { graphData, nodeMap, notes, patients, isLoading } = useGraphData({ config, searchQuery });

    // 3. UI State
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [selectedNote, setSelectedNote] = useState<PersonalNote | null>(null);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);

    // 4. Animation Loop
    useEffect(() => {
        const animate = () => {
            timeRef.current += 0.016;
            const lerpFactor = 0.15;

            graphData.nodes.forEach((n) => {
                const baseRadius = n.type === 'patient' ? 5 : (n.type === 'note' ? 3 : 2);
                const baseGlow = n.type === 'patient' ? 20 : (n.type === 'note' ? 15 : 10);

                // Determine targets based on hover state
                let targetRadius = baseRadius;
                let targetGlow = baseGlow;

                if (hoverNode && n.id === hoverNode.id) {
                    targetRadius = baseRadius * 1.8;
                    targetGlow = baseGlow * 2.5;
                } else if (hoverNode && hoverNode.neighbors?.includes(n)) {
                    targetRadius = baseRadius * 1.3;
                    targetGlow = baseGlow * 1.5;
                }

                // Breathing effect
                const breathe = Math.sin(timeRef.current * 2 + (n.id.charCodeAt(0) * 0.1)) * 0.1;

                n.currentRadius = lerp(n.currentRadius || baseRadius, targetRadius * (1 + breathe * 0.1), lerpFactor);
                n.currentGlow = lerp(n.currentGlow || baseGlow, targetGlow * (1 + breathe * 0.2), lerpFactor);
            });

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();
        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [graphData.nodes, hoverNode]);

    // 5. Interaction Handlers
    const handleNodeClick = useCallback((node: GraphNode) => {
        if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return;

        // Smooth camera transition
        graphRef.current?.centerAt(node.x!, node.y!, 800);
        graphRef.current?.zoom(3.5, 1000);

        if (node.type === 'patient') {
            setSelectedPatient(node.data);
            setSelectedNote(null);
        } else if (node.type === 'note') {
            setSelectedNote(node.data);
            setSelectedPatient(null);
        }
    }, []);

    const handleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().then(() => setIsFullscreen(true));
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false));
        }
    };

    const handleAnimate = useCallback(() => {
        if (!graphRef.current) return;
        const fg = graphRef.current;
        const totalNodes = graphData.nodes.length;

        // 1. Reset all to zero/hidden state
        graphData.nodes.forEach((n) => {
            n.currentRadius = 0;
            n.currentGlow = 0;
            n.currentOpacity = 0;
        });
        graphData.links.forEach((l) => {
            l.currentOpacity = 0;
            l.currentWidth = 0;
        });

        // 2. Randomize node order for organic feel
        const shuffledNodes = [...graphData.nodes].sort(() => Math.random() - 0.5);

        // 3. Staggered appearance: each node "blooms" progressively
        shuffledNodes.forEach((n, index) => {
            const delay = 50 + index * 40; // Staggered delay: 50ms base + 40ms per node
            const baseRadius = n.type === 'patient' ? 5 : (n.type === 'note' ? 3 : 2);
            const baseGlow = n.type === 'patient' ? 20 : (n.type === 'note' ? 15 : 10);

            setTimeout(() => {
                // Bloom effect: start slightly bigger then settle
                n.currentRadius = baseRadius * 1.5;
                n.currentGlow = baseGlow * 2;
                n.currentOpacity = 0.4;

                // Ease to target value over time (this smooths via the main animation loop)
                setTimeout(() => {
                    n.currentRadius = baseRadius;
                    n.currentGlow = baseGlow;
                    n.currentOpacity = 1;
                }, 200);
            }, delay);
        });

        // 4. Animate links after nodes
        const linkDelay = totalNodes * 40 + 200;
        graphData.links.forEach((l, index) => {
            setTimeout(() => {
                l.currentOpacity = 0.5;
                l.currentWidth = 1;
            }, linkDelay + index * 20);
        });

        // 5. Camera movement: Smoothly pull back then zoom to fit
        setTimeout(() => {
            fg.d3ReheatSimulation();
            fg.zoomToFit(800, 80);
        }, linkDelay + 200);

    }, [graphData]);


    const patientNotes = useMemo(() => {
        if (!selectedPatient || !notes) return [];
        return notes.filter(n => n.patient_id === selectedPatient.id);
    }, [selectedPatient, notes]);

    // Apply physics configuration updates
    useEffect(() => {
        if (graphRef.current) {
            const fg = graphRef.current;

            const charge = fg.d3Force('charge');
            if (charge) {
                (charge as any).strength(config.repulsion).distanceMax(500);
            }

            const link = fg.d3Force('link');
            if (link) {
                (link as any).distance(config.linkDistance);
            }

            // Radial forces for centering
            fg.d3Force('x', forceX(0).strength(config.centerForce));
            fg.d3Force('y', forceY(0).strength(config.centerForce));

            // Collision to prevent overlap
            fg.d3Force('collide', forceCollide((node: any) => {
                return (node.type === 'patient' ? 10 : 5) + 3;
            }));

            fg.d3ReheatSimulation();
        }
    }, [config, graphData]);

    // Canvas Objects Handlers
    const handleNodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        drawNode(node as GraphNode, ctx, globalScale, hoverNode, isDarkMode);
    }, [hoverNode, isDarkMode]);

    const handleLinkCanvasObject = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        drawLink(link as GraphLink, ctx, globalScale, hoverNode, isDarkMode);
    }, [hoverNode, isDarkMode]);

    return (
        <div ref={containerRef} className="relative w-full h-full overflow-hidden group/canvas bg-[#F5F5F7] dark:bg-[#020204]">

            {/* Cinematic Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0)_0%,rgba(0,0,0,0.05)_100%)] dark:bg-[radial-gradient(ellipse_at_center,#1a1a1a_0%,#0d0d0d_40%,#000000_100%)]" />
                <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            </div>

            <NeuroViewControls
                config={config}
                onConfigChange={setConfig}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                isFullscreen={isFullscreen}
                onToggleFullscreen={handleFullscreen}
                onZoomIn={() => graphRef.current?.zoom(graphRef.current.zoom() * 1.3, 400)}
                onZoomOut={() => graphRef.current?.zoom(graphRef.current.zoom() / 1.3, 400)}
                onCenter={() => graphRef.current?.zoomToFit(400)}
                onAnimate={handleAnimate}
            />

            <NeuroViewSidebar
                patients={patients || []}
                onHoverNode={(id) => id && nodeMap[id] ? setHoverNode(nodeMap[id]) : setHoverNode(null)}
                onSelectPatient={(p) => {
                    const id = `pat-${p.id}`;
                    if (nodeMap[id]) handleNodeClick(nodeMap[id]);
                }}
            />

            {isLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 dark:bg-black/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-primary dark:text-white" />
                        <p className="text-xs font-bold uppercase tracking-widest text-primary/60 dark:text-white/60 animate-pulse">Sincronizando Sinapses...</p>
                    </div>
                </div>
            )}

            <ForceGraph2D
                ref={graphRef}
                graphData={graphData}
                nodeLabel={() => ""}
                nodeColor={() => "transparent"}
                nodeCanvasObject={handleNodeCanvasObject}
                nodeRelSize={4}
                linkColor={() => "transparent"}
                linkCanvasObject={handleLinkCanvasObject}
                linkDirectionalParticles={hoverNode ? 2 : 0}
                linkDirectionalParticleWidth={1}
                linkDirectionalParticleSpeed={0.003}
                linkDirectionalParticleColor={() => "rgba(255, 255, 255, 0.48)"}
                backgroundColor="transparent"
                onNodeClick={(node) => handleNodeClick(node as GraphNode)}
                onNodeHover={(node) => setHoverNode((node as GraphNode) || null)}
                d3AlphaDecay={0.015}
                d3VelocityDecay={0.35}
                cooldownTicks={150}
                warmupTicks={50}
                onEngineStop={() => graphRef.current?.zoomToFit(600, 80)}
            />

            <GraphDetailsPanel
                selectedNote={selectedNote}
                selectedPatient={selectedPatient}
                onCloseNote={() => setSelectedNote(null)}
                onClosePatient={() => setSelectedPatient(null)}
                onDeleteNote={(id) => { deleteNote(id); setSelectedNote(null); }}
                onUpdateNote={(id, updates) => updateNote({ id, updates })}
                onSelectNote={(note) => { setSelectedNote(note); setSelectedPatient(null); }}
                patientNotes={patientNotes}
                patients={patients}
            />

            {/* Universe Mode Toggle */}
            <button
                onClick={() => setIsUniverseMode(!isUniverseMode)}
                className="absolute top-6 right-6 z-40 px-5 py-2.5 rounded-xl bg-zinc-900/80 dark:bg-white/10 backdrop-blur-xl border border-white/10 text-[10px] font-bold text-white/80 hover:text-white uppercase tracking-[0.15em] transition-all hover:bg-zinc-800 dark:hover:bg-white/20 shadow-lg"
            >
                {isUniverseMode ? '← Grafo 2D' : '🌌 Modo Universo'}
            </button>

            {/* Universe 3D Overlay */}
            {isUniverseMode && (
                <div className="absolute inset-0 z-30">
                    <NeuroViewUniverse onBack={() => setIsUniverseMode(false)} />
                </div>
            )}
        </div>
    );
};