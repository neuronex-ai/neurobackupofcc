"use client";

import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { usePersonalNotes } from "@/hooks/use-personal-notes";
import { usePatients } from "@/hooks/use-patients";
import { motion } from "framer-motion";
import { Orbit, Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

// Types matching NeuroView data
interface UniverseNode {
  id: string;
  label: string;
  type: 'patient' | 'note' | 'tag';
  color: string;
  size: number;
}

interface UniverseLink {
  source: string;
  target: string;
}

interface NeuroViewUniverseProps {
  onBack: () => void;
}

const NODE_COLORS = {
  patient: { h: 220, s: 80, l: 60 },
  note: { h: 270, s: 60, l: 65 },
  tag: { h: 45, s: 80, l: 60 },
};

export const NeuroViewUniverse = ({ onBack }: NeuroViewUniverseProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState({ x: 0.3, y: 0 });
  const [autoRotate, setAutoRotate] = useState(true);

  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const { notes } = usePersonalNotes();
  const { data: patients } = usePatients();

  // Build 3D graph data
  const { nodes, links } = useMemo(() => {
    const nodeMap = new Map<string, UniverseNode>();
    const linkList: UniverseLink[] = [];

    // Add patients
    patients?.forEach(p => {
      nodeMap.set(p.id, {
        id: p.id,
        label: p.name,
        type: 'patient',
        color: `hsl(${NODE_COLORS.patient.h}, ${NODE_COLORS.patient.s}%, ${NODE_COLORS.patient.l}%)`,
        size: 12,
      });
    });

    // Add notes
    notes?.forEach(n => {
      nodeMap.set(n.id, {
        id: n.id,
        label: n.title || 'Sem título',
        type: 'note',
        color: `hsl(${NODE_COLORS.note.h}, ${NODE_COLORS.note.s}%, ${NODE_COLORS.note.l}%)`,
        size: 8,
      });

      // Link note to patient
      if (n.patient_id && nodeMap.has(n.patient_id)) {
        linkList.push({ source: n.id, target: n.patient_id });
      }

      // Add tags as nodes
      n.tags?.forEach((tag: string) => {
        const tagId = `tag-${tag}`;
        if (!nodeMap.has(tagId)) {
          nodeMap.set(tagId, {
            id: tagId,
            label: `#${tag}`,
            type: 'tag',
            color: `hsl(${NODE_COLORS.tag.h}, ${NODE_COLORS.tag.s}%, ${NODE_COLORS.tag.l}%)`,
            size: 6,
          });
        }
        linkList.push({ source: n.id, target: tagId });
      });
    });

    return { nodes: Array.from(nodeMap.values()), links: linkList };
  }, [notes, patients]);

  // Assign 3D positions using spherical distribution
  const nodePositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number; z: number }>();
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    nodes.forEach((node, i) => {
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / nodes.length);
      const radius = 250 + Math.random() * 100;

      positions.set(node.id, {
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.sin(phi) * Math.sin(theta),
        z: radius * Math.cos(phi),
      });
    });

    return positions;
  }, [nodes]);

  // Star field
  const stars = useMemo(() => {
    return Array.from({ length: 300 }, () => ({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      z: Math.random() * 2 - 1,
      brightness: 0.3 + Math.random() * 0.7,
      size: 0.5 + Math.random() * 1.5,
    }));
  }, []);

  // Project 3D -> 2D
  const project = useCallback((pos: { x: number; y: number; z: number }, w: number, h: number) => {
    const cosX = Math.cos(rotation.x), sinX = Math.sin(rotation.x);
    const cosY = Math.cos(rotation.y), sinY = Math.sin(rotation.y);

    // Rotate Y
    let x = pos.x * cosY + pos.z * sinY;
    let z = -pos.x * sinY + pos.z * cosY;
    // Rotate X
    let y = pos.y * cosX - z * sinX;
    z = pos.y * sinX + z * cosX;

    const perspective = 800;
    const scale = perspective / (perspective + z) * zoom;

    return {
      x: w / 2 + x * scale,
      y: h / 2 + y * scale,
      scale,
      z,
    };
  }, [rotation, zoom]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      const sw = canvas.offsetWidth;
      const sh = canvas.offsetHeight;

      // Clear
      ctx.fillStyle = '#030305';
      ctx.fillRect(0, 0, sw, sh);

      // Draw stars
      stars.forEach(star => {
        const proj = project({ x: star.x * 600, y: star.y * 600, z: star.z * 600 }, sw, sh);
        if (proj.z > -700) {
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, star.size * proj.scale * 0.3, 0, Math.PI * 2);
          const t = performance.now() / 3000;
          const twinkle = 0.5 + 0.5 * Math.sin(t + star.x * 10);
          ctx.fillStyle = `rgba(200, 210, 255, ${star.brightness * twinkle * 0.4})`;
          ctx.fill();
        }
      });

      // Draw links
      links.forEach(link => {
        const srcPos = nodePositions.get(link.source);
        const tgtPos = nodePositions.get(link.target);
        if (!srcPos || !tgtPos) return;

        const src = project(srcPos, sw, sh);
        const tgt = project(tgtPos, sw, sh);

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = `rgba(100, 120, 200, ${0.08 * Math.min(src.scale, tgt.scale)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });

      // Sort nodes by z for painter's algorithm
      const sortedNodes = nodes.map(node => ({
        node,
        pos: nodePositions.get(node.id)!,
      })).sort((a, b) => {
        const pA = project(a.pos, sw, sh);
        const pB = project(b.pos, sw, sh);
        return pA.z - pB.z;
      });

      // Draw nodes
      sortedNodes.forEach(({ node, pos }) => {
        const proj = project(pos, sw, sh);
        if (proj.z > -700) {
          const radius = node.size * proj.scale * 0.5;

          // Glow
          const gradient = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, radius * 3);
          gradient.addColorStop(0, node.color.replace(')', ', 0.3)').replace('hsl', 'hsla'));
          gradient.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, radius * 3, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();

          // Core
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = node.color;
          ctx.fill();

          // Label for larger nodes
          if (radius > 3) {
            ctx.font = `${Math.max(8, radius * 0.9)}px Inter, system-ui, sans-serif`;
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, proj.scale * 0.8)})`;
            ctx.textAlign = 'center';
            ctx.fillText(node.label, proj.x, proj.y + radius + 14);
          }
        }
      });

      // Auto-rotate
      if (autoRotate && !isDragging.current) {
        setRotation(prev => ({
          ...prev,
          y: prev.y + 0.002,
        }));
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationRef.current);
  }, [nodes, links, nodePositions, stars, rotation, zoom, autoRotate, project]);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setAutoRotate(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    setRotation(prev => ({
      x: prev.x + dy * 0.005,
      y: prev.y + dx * 0.005,
    }));
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    // Restart auto-rotate after 3s
    setTimeout(() => setAutoRotate(true), 3000);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(prev => Math.max(0.3, Math.min(3, prev - e.deltaY * 0.001)));
  };

  return (
    <div className={cn(
      "relative w-full h-full bg-[#030305] overflow-hidden rounded-none",
      isFullscreen && "fixed inset-0 z-[200]"
    )}>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* UI Controls Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-50">
        {/* Top Row */}
        <div className="flex items-start justify-between w-full">
          {/* Back button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={onBack}
            className="pointer-events-auto px-5 py-2.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 text-[10px] font-bold text-white/60 hover:text-white hover:bg-white/10 uppercase tracking-[0.2em] transition-all shadow-lg"
          >
            ← Voltar ao Grafo 2D
          </motion.button>

          {/* Legend */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="pointer-events-auto flex flex-col gap-2 p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg"
          >
            <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">Legenda</p>
            {[
              { label: 'Pacientes', color: `hsl(${NODE_COLORS.patient.h}, ${NODE_COLORS.patient.s}%, ${NODE_COLORS.patient.l}%)` },
              { label: 'Notas', color: `hsl(${NODE_COLORS.note.h}, ${NODE_COLORS.note.s}%, ${NODE_COLORS.note.l}%)` },
              { label: 'Tags', color: `hsl(${NODE_COLORS.tag.h}, ${NODE_COLORS.tag.s}%, ${NODE_COLORS.tag.l}%)` },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[9px] font-bold text-white/50 tracking-wider">{item.label}</span>
              </div>
            ))}
            <p className="text-[8px] text-white/30 mt-2 leading-relaxed">
              {nodes.length} nós · {links.length} conexões
            </p>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="flex justify-center w-full mb-2">
          {/* Controls Dock */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="pointer-events-auto flex items-center gap-2 p-2 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
          >
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-white/10",
                autoRotate ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
              )}
              title="Auto-rotação"
            >
              <Orbit className="h-4 w-4" />
            </button>
            <div className="w-px h-6 bg-white/10" />
            <button
              onClick={() => setZoom(prev => Math.min(3, prev + 0.3))}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/10 transition-all"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoom(prev => Math.max(0.3, prev - 0.3))}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/10 transition-all"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <div className="w-px h-6 bg-white/10" />
            <button
              onClick={() => { setRotation({ x: 0.3, y: 0 }); setZoom(1); setAutoRotate(true); }}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/10 transition-all"
              title="Resetar câmera"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/10 transition-all"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
