import createGlobe from "cobe";
import { useEffect, useRef, useState } from "react";
import { useSpring, useMotionValue } from "framer-motion";

export function InteractiveGlobe({ className }: { className?: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pointerInteracting = useRef<number | null>(null);
    const pointerInteractionMovement = useRef(0);
    const [isLight, setIsLight] = useState(false);

    useEffect(() => {
        const checkTheme = () => {
            setIsLight(document.documentElement.classList.contains("light"));
        };
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    const r = useMotionValue(0);
    const springR = useSpring(r, {
        stiffness: 280,
        damping: 80,
        mass: 1.2
    });

    useEffect(() => {
        let phi = 4.5;
        let width = 0;
        if (canvasRef.current) {
            width = canvasRef.current.offsetWidth;
        }

        const globe = createGlobe(canvasRef.current!, {
            devicePixelRatio: 2,
            width: width * 2,
            height: width * 2,
            phi: 4.5,
            theta: 0.4,
            dark: isLight ? 0 : 1,
            diffuse: 3,
            mapSamples: 10000,
            mapBrightness: isLight ? 0.3 : 12,
            baseColor: isLight ? [0, 0, 0] : [0.21, 0.21, 0.21],
            markerColor: [0, 0.5, 1],
            glowColor: isLight ? [0.1, 0.1, 0.1] : [0.43, 0.43, 0.43],
            opacity: 1,
            markers: [
                { location: [-23.5505, -46.6333], size: 0.1 }, // São Paulo
                { location: [40.7128, -74.0060], size: 0.1 }, // NY
                { location: [51.5074, -0.1278], size: 0.1 },  // London
                { location: [35.6762, 139.6503], size: 0.1 }, // Tokyo
                { location: [-33.8688, 151.2093], size: 0.1 }, // Sydney
                { location: [25.2048, 55.2708], size: 0.1 },  // Dubai
            ],
            onRender: (state) => {
                // Auto rotation
                phi += 0.003;
                state.phi = phi + springR.get();
                if (canvasRef.current) {
                    state.width = canvasRef.current.offsetWidth * 2;
                    state.height = canvasRef.current.offsetHeight * 2;
                }
            },
        });

        setTimeout(() => canvasRef.current && (canvasRef.current.style.opacity = '1'));

        return () => {
            globe.destroy();
        }
    }, [isLight]);

    return (
        <div className={`w-full h-full relative flex items-center justify-center ${className} gpu-accelerated`}>
            <canvas
                ref={canvasRef}
                className="w-full h-full object-contain transition-opacity duration-1500 ease-in-out"
                style={{
                    width: '100%',
                    height: '100%',
                    cursor: 'grab',
                    contain: 'layout paint size',
                    opacity: 0,
                }}
                onPointerDown={(e) => {
                    pointerInteracting.current = e.clientX - pointerInteractionMovement.current;
                    canvasRef.current!.style.cursor = 'grabbing';
                }}
                onPointerUp={() => {
                    pointerInteracting.current = null;
                    canvasRef.current!.style.cursor = 'grab';
                }}
                onPointerOut={() => {
                    pointerInteracting.current = null;
                    canvasRef.current!.style.cursor = 'grab';
                }}
                onMouseMove={(e) => {
                    if (pointerInteracting.current !== null) {
                        const delta = e.clientX - pointerInteracting.current;
                        pointerInteractionMovement.current = delta;
                        r.set(delta / 300);
                    }
                }}
                onTouchMove={(e) => {
                    if (pointerInteracting.current !== null && e.touches[0]) {
                        const delta = e.touches[0].clientX - pointerInteracting.current;
                        pointerInteractionMovement.current = delta;
                        r.set(delta / 150);
                    }
                }}
            />
        </div>
    );
}
