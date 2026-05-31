import { cn } from "@/lib/utils";

export const AudioWaveform = ({ isListening }: { isListening: boolean }) => {
  if (!isListening) return null;

  return (
    <div className="flex items-center justify-center gap-1 h-8">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1 bg-primary rounded-full animate-audio-wave",
            "bg-gradient-to-t from-primary/50 to-primary"
          )}
          style={{
            height: '100%',
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.8s'
          }}
        />
      ))}
    </div>
  );
};