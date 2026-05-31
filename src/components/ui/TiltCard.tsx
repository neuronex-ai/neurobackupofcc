import { cn } from "@/lib/utils";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import React, { useRef } from "react";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  glareColor?: string;
}

export const TiltCard = ({ children, className, glareColor = "rgba(255, 255, 255, 0.1)" }: TiltCardProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseY = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const rotateXSpring = useSpring(rotateX, { stiffness: 300, damping: 30 });
  const rotateYSpring = useSpring(rotateY, { stiffness: 300, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    const mouseXVal = e.clientX - rect.left;
    const mouseYVal = e.clientY - rect.top;

    const rX = (mouseYVal / height - 0.5) * -20; // Max rotation deg
    const rY = (mouseXVal / width - 0.5) * 20;

    rotateX.set(rX);
    rotateY.set(rY);
    
    // Glare position
    x.set(mouseXVal);
    y.set(mouseYVal);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        rotateX: rotateXSpring,
        rotateY: rotateYSpring,
      }}
      className={cn(
        "relative group/tilt z-10 transition-all duration-200 ease-out transform perspective-1000",
        className
      )}
    >
      <div 
        style={{ transform: "translateZ(0px)" }}
        className="relative h-full w-full rounded-[inherit] overflow-hidden bg-[#0A0A0B]/80 backdrop-blur-xl border border-white/10 shadow-2xl"
      >
         {/* Holographic Glare */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/tilt:opacity-100 z-20"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                600px circle at ${mouseX}px ${mouseY}px,
                ${glareColor},
                transparent 80%
              )
            `,
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 h-full">
            {children}
        </div>
      </div>
    </motion.div>
  );
};