import { useEffect, useRef } from 'react';

interface GravityGridProps {
  className?: string;
}

interface Point {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  mass: number;
}

export const GravityGrid = ({ className }: GravityGridProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Point[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const rafRef = useRef<number>();

  // Configurações da Física - Ajustadas para sutileza extrema
  const SPACING = 14; // 50% menor (mais denso)
  const RADIUS = 0.8; // Pontos menores
  const MOUSE_RADIUS = 180; // Raio de influência
  const MOUSE_STRENGTH = 0.008; // 80% mais sutil (apenas um "toque")
  const SPRING_STIFFNESS = 0.05; // Retorno suave
  const DAMPING = 0.90; // Mais fluido, menos oscilação elástica

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const initPoints = () => {
      const points: Point[] = [];
      const cols = Math.ceil(width / SPACING);
      const rows = Math.ceil(height / SPACING);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * SPACING;
          const y = j * SPACING;
          points.push({
            x,
            y,
            originX: x,
            originY: y,
            vx: 0,
            vy: 0,
            mass: 1
          });
        }
      }
      pointsRef.current = points;
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initPoints();
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Cor dos pontos com opacidade reduzida (30% menor)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.09)';

      pointsRef.current.forEach(point => {
        // 1. Calcular distncia do mouse
        const dx = mouseRef.current.x - point.x;
        const dy = mouseRef.current.y - point.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 2. Aplicar força do mouse (Gravidade/Atração sutil)
        if (distance < MOUSE_RADIUS) {
          const force = (1 - distance / MOUSE_RADIUS) * MOUSE_STRENGTH;
          // Usando um easing cúbico para suavizar a borda da influência
          const smoothForce = force * force * force; 
          point.vx += dx * smoothForce;
          point.vy += dy * smoothForce;
        }

        // 3. Aplicar força de mola (Retorno à origem)
        const springDx = point.originX - point.x;
        const springDy = point.originY - point.y;
        
        point.vx += springDx * SPRING_STIFFNESS;
        point.vy += springDy * SPRING_STIFFNESS;

        // 4. Aplicar velocidade e fricção
        point.vx *= DAMPING;
        point.vy *= DAMPING;

        point.x += point.vx;
        point.y += point.vy;

        // 5. Renderizar
        // Otimização: Só desenha se estiver na tela
        if (point.x > 0 && point.x < width && point.y > 0 && point.y < height) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, RADIUS, 0, Math.PI * 2);
            ctx.fill();
        }
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    // Inicialização
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    />
  );
};