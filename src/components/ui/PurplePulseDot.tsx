import { cn } from "@/lib/utils";

interface PurplePulseDotProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  xs: "w-2 h-2",
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-6 h-6",
  xl: "w-12 h-12",
};

export const PurplePulseDot = ({ size = "md", className }: PurplePulseDotProps) => {
  return (
    <div className={cn("relative flex items-center justify-center", sizes[size], className)}>
      <span className="animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
      <span className="relative inline-flex rounded-full h-full w-full bg-primary"></span>
    </div>
  );
};