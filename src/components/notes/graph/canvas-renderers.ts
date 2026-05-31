import { GraphNode, GraphLink } from "./graph-types";

// Linear interpolation for smooth animations
export const lerp = (current: number, target: number, factor: number): number => {
  return current + (target - current) * factor;
};

export const drawNode = (
  node: GraphNode,
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  hoverNode: GraphNode | null,
  isDarkMode: boolean = true // Added theme awareness
) => {
  const x = node.x;
  const y = node.y;

  if (x === undefined || y === undefined || !Number.isFinite(x) || !Number.isFinite(y)) return;

  const isHovered = hoverNode === node;
  const isNeighbor = hoverNode && hoverNode.neighbors?.includes(node);
  const isConnectedChain = isHovered || isNeighbor;

  // Logic: Nodes are dimmed unless hovered or neighbor, or if no node is hovered at all
  const dimmed = hoverNode && !isConnectedChain;

  // Visual Properties
  const radius = Number.isFinite(node.currentRadius) && node.currentRadius > 0 ? node.currentRadius : 3;
  const glowRadius = Number.isFinite(node.currentGlow) ? node.currentGlow : 5;

  // Colors based on theme
  const borderColor = isDarkMode ? "#fff" : "#18181b"; // zinc-900 in light
  const dimOpacity = isDarkMode ? 0.1 : 0.05;
  const normalOpacity = isDarkMode ? 0.6 : 0.8;
  const activeOpacity = 1.0;

  const targetOpacity = dimmed ? dimOpacity : (isConnectedChain ? activeOpacity : normalOpacity);

  node.currentOpacity = node.currentOpacity ?? (isDarkMode ? 0.6 : 0.8);
  node.currentOpacity = lerp(node.currentOpacity, targetOpacity, 0.1);

  ctx.globalAlpha = node.currentOpacity;

  // --- DRAWING NODE BODY ---
  if (node.type === 'patient' && node.imgObj && node.imgObj.complete && node.imgObj.naturalWidth > 0) {
    // Patient Avatar
    ctx.save();
    ctx.shadowBlur = isHovered ? (isDarkMode ? 20 : 10) : 0;
    ctx.shadowColor = isDarkMode ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.2)";

    // Clip image circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.clip();
    try {
      ctx.drawImage(node.imgObj, x - radius, y - radius, radius * 2, radius * 2);
    } catch {
      ctx.fillStyle = isDarkMode ? "#fff" : "#18181b";
      ctx.fill();
    }
    ctx.restore();

    // Border Ring
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = isHovered ? borderColor : (isDarkMode ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.15)");
    ctx.lineWidth = (isHovered ? 2 : 1) / globalScale;
    ctx.stroke();

  } else {
    // Standard Node (Note/Tag)
    ctx.save();

    // Glow only if hovered or connected, OR always in light mode for visibility
    if (isConnectedChain) {
      ctx.shadowBlur = glowRadius;
      ctx.shadowColor = node.color;
    } else if (!isDarkMode) {
      // Light Mode: Subtle shadow for depth
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
    }

    // Core
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = node.color; // Keep node specific color
    ctx.fill();

    // White/Black center dot for Notes depending on theme
    if (node.type === 'note' && isConnectedChain) {
      ctx.fillStyle = isDarkMode ? "#fff" : "#fff"; // Keep white for contrast against colored node
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.4, 0, 2 * Math.PI);
      ctx.fill();
    }

    ctx.restore();
  }

  // --- LABEL RENDERING (POLISHED) ---
  // Only show label if:
  // 1. Node is hovered
  // 2. Node is a neighbor of hovered
  // 3. Zoom is very high (globalScale > 2.5)
  // 4. It's a Patient node (always visible but faint, bright on hover)

  const showLabel = isConnectedChain || (node.type === 'patient') || globalScale > 2.5;

  if (showLabel) {
    const fontSize = isHovered ? 14 / globalScale : 10 / globalScale;
    ctx.font = `${isHovered ? '600' : '500'} ${fontSize}px "Inter", sans-serif`;

    const label = node.label;
    const textWidth = ctx.measureText(label).width;
    const paddingX = 8 / globalScale;
    const paddingY = 4 / globalScale;

    const textY = y + radius + (8 / globalScale);

    // Fade in label
    const labelAlpha = isConnectedChain ? 1 : (isDarkMode ? 0.4 : 0.6);
    ctx.globalAlpha = labelAlpha * node.currentOpacity;

    // Label Background (Glassy pill)
    if (isConnectedChain) {
      ctx.fillStyle = isDarkMode ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.9)";
      ctx.beginPath();
      // Custom round rect
      const rw = textWidth + paddingX * 2;
      const rh = fontSize + paddingY * 2;
      const rx = x - rw / 2;
      const ry = textY;

      ctx.roundRect(rx, ry, rw, rh, 4 / globalScale);
      ctx.fill();

      // Border
      ctx.strokeStyle = isDarkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)";
      ctx.lineWidth = 1 / globalScale;
      ctx.stroke();
    }

    // Text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    if (isConnectedChain) {
      ctx.fillStyle = isDarkMode ? "#fff" : "#000";
    } else {
      ctx.fillStyle = isDarkMode ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)";
    }

    ctx.fillText(label, x, textY + paddingY);
  }

  ctx.globalAlpha = 1;
};

export const drawLink = (
  link: GraphLink,
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  hoverNode: GraphNode | null,
  isDarkMode: boolean = true
) => {
  const source = link.source as GraphNode;
  const target = link.target as GraphNode;

  const sx = source.x;
  const sy = source.y;
  const tx = target.x;
  const ty = target.y;

  if (!Number.isFinite(sx) || !Number.isFinite(sy) || !Number.isFinite(tx) || !Number.isFinite(ty)) return;

  const isConnectedToHover = hoverNode && (source.id === hoverNode.id || target.id === hoverNode.id);
  const dimmed = hoverNode && !isConnectedToHover;

  // Links are almost invisible unless hovered
  const targetOpacity = dimmed ? 0.05 : (isConnectedToHover ? 0.8 : (isDarkMode ? 0.15 : 0.2));
  const targetWidth = (isConnectedToHover ? 1.5 : 0.5) / globalScale;

  link.currentOpacity = link.currentOpacity ?? (isDarkMode ? 0.15 : 0.2);
  link.currentWidth = link.currentWidth ?? 0.5 / globalScale;

  link.currentOpacity = lerp(link.currentOpacity, targetOpacity, 0.1);
  link.currentWidth = lerp(link.currentWidth, targetWidth, 0.1);

  if (link.currentOpacity < 0.01) return;

  ctx.beginPath();
  ctx.moveTo(sx!, sy!);
  ctx.lineTo(tx!, ty!);

  // Gradient line for active links
  if (isConnectedToHover) {
    const grad = ctx.createLinearGradient(sx!, sy!, tx!, ty!);
    grad.addColorStop(0, source.color);
    grad.addColorStop(1, target.color);
    ctx.strokeStyle = grad;
  } else {
    ctx.strokeStyle = isDarkMode
      ? `rgba(255, 255, 255, ${link.currentOpacity})`
      : `rgba(0, 0, 0, ${link.currentOpacity * 0.8})`; // Darker lines for light mode
  }

  ctx.lineWidth = link.currentWidth;
  ctx.stroke();
};