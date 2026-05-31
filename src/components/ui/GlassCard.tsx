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
        "bg-white/80 dark:bg-[#0A0A0B]/80 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-[32px] overflow-hidden shadow-xl",
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