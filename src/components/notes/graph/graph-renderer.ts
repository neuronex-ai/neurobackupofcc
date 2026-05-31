import { GraphNode, GraphLink, GRAPH_COLORS } from "./graph-types";
import { GraphConfig } from "../GraphSettings";

// Engine state type for rendering
interface EngineState {
    width: number;
    height: number;
    camera: { x: number; y: number; k: number };
    targetCamera: { x: number; y: number; k: number };
    pulse: number;
    particles: Array<{ x: number; y: number; r: number; alpha: number }>;
    hoveredNode: GraphNode | null;
    simulation?: any;
    draggingNode?: GraphNode | null;
    dragStartPos: { x: number; y: number };
}

export const lerp = (start: number, end: number, t: number) => {
    return start * (1 - t) + end * t;
};

export const drawBackground = (
    ctx: CanvasRenderingContext2D,
    state: EngineState
) => {
    // Clear with a radial gradient for depth - deeper space feel
    const gradient = ctx.createRadialGradient(
        state.width / 2, state.height / 2, 0,
        state.width / 2, state.height / 2, state.width * 0.7
    );
    gradient.addColorStop(0, GRAPH_COLORS.backgroundGradient);
    gradient.addColorStop(0.5, '#0a0812');
    gradient.addColorStop(1, GRAPH_COLORS.background);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.width, state.height);

    // Parallax Nebula Effect with organic breathing - more layers for depth
    ctx.save();
    ctx.translate(
        state.width / 2 + (state.camera.x - state.width / 2) * 0.03,
        state.height / 2 + (state.camera.y - state.height / 2) * 0.03
    );

    // Layer 1: Deep background particles (slowest, largest, faintest)
    state.particles.slice(0, 30).forEach((p, i) => {
        const phase = i * 1.2;
        const breathe = Math.sin(state.pulse * 0.25 + phase) * 0.25 + 1;
        const drift = Math.sin(state.pulse * 0.08 + phase * 0.3) * 3;

        ctx.beginPath();
        const hue = 265 + Math.sin(state.pulse * 0.5 + phase) * 15;
        ctx.fillStyle = `hsla(${hue}, 50%, 50%, ${p.alpha * 0.06 * breathe})`;
        ctx.arc(
            p.x * 1.5 + drift,
            p.y * 1.5 + Math.cos(state.pulse * 0.1 + phase) * 2,
            p.r * 3 * breathe * state.camera.k,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });

    // Layer 2: Mid particles (medium speed, softer)
    state.particles.slice(30, 60).forEach((p, i) => {
        const phase = i * 0.9;
        const breathe = Math.sin(state.pulse * 0.4 + phase) * 0.35 + 1;
        const drift = Math.sin(state.pulse * 0.12 + phase * 0.6) * 2;

        ctx.beginPath();
        const hue = 275 + Math.sin(state.pulse * 0.7 + phase) * 12;
        ctx.fillStyle = `hsla(${hue}, 60%, 60%, ${p.alpha * 0.10 * breathe})`;
        ctx.arc(
            p.x + drift,
            p.y + Math.cos(state.pulse * 0.18 + phase) * 1.5,
            p.r * 2 * breathe * state.camera.k,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });

    // Layer 3: Foreground particles (fastest, brightest, smallest)
    state.particles.slice(60).forEach((p, i) => {
        const phase = i * 0.6;
        const breathe = Math.sin(state.pulse * 0.55 + phase) * 0.4 + 1;
        const drift = Math.sin(state.pulse * 0.18 + phase * 0.8) * 1.5;

        ctx.beginPath();
        const hue = 285 + Math.sin(state.pulse * 0.9 + phase) * 8;
        ctx.fillStyle = `hsla(${hue}, 70%, 70%, ${p.alpha * 0.15 * breathe})`;
        ctx.arc(
            p.x * 0.8 + drift,
            p.y * 0.8 + Math.cos(state.pulse * 0.22 + phase) * 1,
            p.r * 1.5 * breathe * state.camera.k,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });

    ctx.restore();
};

export const drawLinks = (
    ctx: CanvasRenderingContext2D,
    links: GraphLink[],
    config: GraphConfig,
    state: EngineState
) => {
    ctx.lineCap = 'round';

    links.forEach(link => {
        const source = link.source as GraphNode;
        const target = link.target as GraphNode;

        let targetLinkOpacity = 0.15;
        let isConnected = false;

        if (state.hoveredNode) {
            if (link.source === state.hoveredNode || link.target === state.hoveredNode) {
                targetLinkOpacity = 0.9;
                isConnected = true;
            } else {
                targetLinkOpacity = 0.05;
            }
        }

        link.currentOpacity = lerp(link.currentOpacity || 0, targetLinkOpacity, 0.2);
        if (link.currentOpacity < 0.01) return;

        const [sx, sy, tx, ty] = [source.x!, source.y!, target.x!, target.y!];

        const dx = tx - sx;
        const dy = ty - sy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const bend = dist * 0.1;

        const mx = (sx + tx) / 2;
        const my = (sy + ty) / 2;

        const nx = dy / dist;
        const ny = -dx / dist;

        const cpx = mx + nx * bend;
        const cpy = my + ny * bend;

        // Single pass drawing for thinner lines
        ctx.beginPath();
        ctx.strokeStyle = isConnected ? GRAPH_COLORS.linkActive : GRAPH_COLORS.linkDefault;
        ctx.lineWidth = (isConnected ? config.linkThickness * 1.5 : config.linkThickness) / state.camera.k;
        ctx.globalAlpha = link.currentOpacity;
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(cpx, cpy, tx, ty);
        ctx.stroke();

        ctx.globalAlpha = 1;
    });
};

export const drawNodes = (
    ctx: CanvasRenderingContext2D,
    nodes: GraphNode[],
    config: GraphConfig,
    state: EngineState,
    checkConnection: (a: GraphNode, b: GraphNode) => boolean,
    isFullscreen: boolean
) => {
    nodes.forEach(node => {
        const hNode = state.hoveredNode;
        const isHovered = hNode?.id === node.id;
        const isConnected = hNode && checkConnection(node, hNode);
        const isDimmed = hNode && !isHovered && !isConnected;

        const targetOpacity = isDimmed ? 0.1 : 1;
        const targetScale = isHovered ? 1.3 : (isConnected ? 1.1 : 1);

        node.currentOpacity = lerp(node.currentOpacity ?? 1, targetOpacity, 0.15);
        node.currentScale = lerp(node.currentScale ?? 1, targetScale, 0.2);

        if (node.currentOpacity < 0.05) return;

        const baseSize = config.nodeSize + (node.type === 'patient' ? 4 : 0);
        const size = baseSize * node.currentScale;

        ctx.globalAlpha = node.currentOpacity;

        // --- Glow Effect using shadow ---
        if (isHovered) {
            ctx.shadowBlur = isFullscreen ? 50 : 30;
            ctx.shadowColor = isFullscreen ? "rgba(168, 85, 247, 0.8)" : "rgba(255, 255, 255, 0.8)";
        } else {
            ctx.shadowBlur = 15;
            ctx.shadowColor = node.color;
        }

        // --- Node Body ---
        ctx.beginPath();
        ctx.fillStyle = node.color;
        ctx.arc(node.x!, node.y!, size, 0, Math.PI * 2);
        ctx.fill();

        // Reset shadow for next elements
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';

        // --- Avatar (if patient) ---
        if (node.type === 'patient' && node.imgObj?.complete) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(node.x!, node.y!, size * 0.9, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(node.imgObj, node.x! - size, node.y! - size, size * 2, size * 2);
            ctx.restore();
        }

        // --- Labels ---
        if (!isDimmed && (isHovered || isConnected || state.camera.k > config.textThreshold)) {
            ctx.globalAlpha = node.currentOpacity * (isHovered || isConnected ? 1 : 0.6);

            const fontSize = (10 / state.camera.k) + (isHovered ? 2 : 0);
            ctx.font = `${isHovered ? "600" : "400"} ${fontSize}px Inter, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const textY = node.y! + size + (12 / state.camera.k);

            ctx.fillStyle = "#ffffff";
            ctx.fillText(node.label, node.x!, textY);
        }

        ctx.globalAlpha = 1;
    });
};