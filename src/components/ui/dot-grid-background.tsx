import { cn } from "@/lib/utils";
import React from "react";

interface DotGridBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  dotColor?: string;
  dotSize?: string;
  spacing?: string;
  blur?: boolean; // New prop for blur
}

export const DotGridBackground = ({
  children,
  className,
  dotColor = "hsl(var(--foreground) / 0.1)",
  dotSize = "1px",
  spacing = "20px",
  blur = false,
}: DotGridBackgroundProps) => {
  const style = {
    backgroundImage: `radial-gradient(${dotColor} ${dotSize}, transparent 0)`,
    backgroundSize: `${spacing} ${spacing}`,
  };

  return (
    <div className={cn("relative h-full w-full", className)}>
      <div 
        className={cn("absolute inset-0", blur && "backdrop-blur-[0.5px]")} 
        style={style} 
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};