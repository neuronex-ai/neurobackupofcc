import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface WheelPickerProps {
  items: string[];
  value: string;
  onChange: (value: string) => void;
  height?: number;
  itemHeight?: number;
}

export const WheelPicker = ({ items, value, onChange, height = 150, itemHeight = 40 }: WheelPickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Scroll to initial value
  useEffect(() => {
    const index = items.indexOf(value);
    if (containerRef.current && index !== -1) {
      containerRef.current.scrollTop = index * itemHeight;
    }
  }, []); // Run once on mount

  const handleScroll = () => {
    if (isDragging) return;
    if (!containerRef.current) return;
    
    const scrollTop = containerRef.current.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const boundedIndex = Math.max(0, Math.min(items.length - 1, index));
    
    // Only update if changed and valid
    if (items[boundedIndex] !== value) {
        // Debounce or check logic if needed
        // For simplicity, we won't auto-snap here to allow smooth scrolling, 
        // but we could trigger onChange after a timeout.
    }
  };

  const handleScrollEnd = () => {
      if (!containerRef.current) return;
      const scrollTop = containerRef.current.scrollTop;
      const index = Math.round(scrollTop / itemHeight);
      const boundedIndex = Math.max(0, Math.min(items.length - 1, index));
      
      // Snap
      containerRef.current.scrollTo({ top: boundedIndex * itemHeight, behavior: 'smooth' });
      onChange(items[boundedIndex]);
  };

  return (
    <div className="relative overflow-hidden" style={{ height }}>
      {/* Selection Highlight */}
      <div 
        className="absolute left-0 right-0 border-y border-white/10 bg-white/5 pointer-events-none z-10"
        style={{ top: (height - itemHeight) / 2, height: itemHeight }}
      />
      
      <div 
        ref={containerRef}
        className="h-full overflow-y-auto no-scrollbar snap-y snap-mandatory py-[55px]" // Padding to center first/last
        onScroll={handleScroll}
        onMouseUp={handleScrollEnd}
        onTouchEnd={handleScrollEnd}
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
      >
        {items.map((item) => (
            <div 
                key={item} 
                className={cn(
                    "flex items-center justify-center snap-center transition-opacity duration-200 cursor-pointer",
                    item === value ? "opacity-100 text-white font-bold scale-110" : "opacity-40 text-muted-foreground scale-90"
                )}
                style={{ height: itemHeight }}
                onClick={() => {
                    onChange(item);
                    const idx = items.indexOf(item);
                    containerRef.current?.scrollTo({ top: idx * itemHeight, behavior: 'smooth' });
                }}
            >
                {item}
            </div>
        ))}
      </div>
    </div>
  );
};