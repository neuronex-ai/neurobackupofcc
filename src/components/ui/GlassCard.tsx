import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

// Omitimos as propriedades de drag que causam conflito entre React.HTMLAttributes e HTMLMotionProps
interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "onDrag" | "onDragStart" | "onDragEnd"> {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  delay?: number;
}

export const GlassCard = ({ 
  children, 
  className, 
  innerClassName, 
  delay = 0, 
  ...props 
}: GlassCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay / 1000 }}
      className={cn(
        "desktop-apple-surface overflow-hidden rounded-[28px]",
        className
      )}
      {...props}
    >
      <div className={cn("h-full w-full", innerClassName)}>
        {children}
      </div>
    </motion.div>
  );
};
