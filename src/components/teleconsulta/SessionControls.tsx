import { Copy, MessageSquare, Send, Mic, MicOff, Video, VideoOff, MonitorUp, MonitorOff, Eye, EyeOff, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface SessionControlsProps {
    isFocusMode: boolean;
    onToggleFocus: () => void;
    isProcessing: boolean;
    onEndSession: () => void;
    isScreenSharing: boolean;
    onToggleScreenShare: () => void;
    isOnline: boolean;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    onToggleAudio: () => void;
    onToggleVideo: () => void;
    meetLink?: string;
    onToggleChat?: () => void;
    isChatOpen?: boolean; // Novo prop
    onOpenInvite?: () => void; // Novo prop
}

export const SessionControls = ({
    isFocusMode,
    onToggleFocus,
    isProcessing,
    onEndSession,
    isScreenSharing,
    onToggleScreenShare,
    isOnline,
    isAudioEnabled,
    isVideoEnabled,
    onToggleAudio,
    onToggleVideo,
    meetLink,
    onToggleChat,
    isChatOpen = false,
    onOpenInvite
}: SessionControlsProps) => {

    const handleCopyLink = () => {
        if (meetLink) {
            navigator.clipboard.writeText(meetLink);
            toast.success("Link copiado para a área de transferência");
        }
    };

    const ControlButton = ({
        icon: Icon,
        active,
        onClick,
        label,
        danger = false,
        secondary = false,
        className
    }: any) => (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    onClick={onClick}
                    className={cn(
                        "desktop-tactile group relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl",
                        danger
                            ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20"
                            : secondary
                                ? "bg-white/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/10 border border-white/10"
                                : active
                                    ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-sm"
                                    : "bg-white/10 dark:bg-black/20 text-zinc-600 dark:text-zinc-400 hover:bg-white/20 dark:hover:bg-white/10 border border-white/10 hover:border-white/20",
                        className
                    )}
                >
                    <Icon className={cn("w-5 h-5 transition-all duration-300", danger ? "fill-current" : "stroke-[2]", active && "scale-90")} />
                    {danger && <div className="absolute inset-0 bg-rose-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />}
                </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="px-3 py-1.5 bg-white/80 dark:bg-zinc-900/80 border border-white/20 dark:border-white/10 text-[10px] uppercase font-bold tracking-widest text-zinc-900 dark:text-zinc-100 backdrop-blur-xl shadow-xl rounded-full">
                {label}
            </TooltipContent>
        </Tooltip>
    );

    return (
        <div className="flex items-center justify-between w-full max-w-5xl mx-auto px-6 pointer-events-none">
            {/* Left Group - Utilities */}
            {/* Oculta suavemente se o Chat estiver aberto */}
            <div className={cn(
                "flex items-center gap-3 transition-all duration-300",
                isChatOpen ? "opacity-0 translate-x-[-20px] pointer-events-none" : "opacity-100 pointer-events-auto"
            )}>
                {isOnline && (
                    <>
                        <ControlButton
                            icon={Copy}
                            secondary
                            onClick={handleCopyLink}
                            label="Copiar Link"
                        />
                        <ControlButton
                            icon={MessageSquare}
                            secondary
                            onClick={onToggleChat}
                            label="Chat"
                        />
                        <ControlButton
                            icon={Send}
                            secondary
                            onClick={onOpenInvite}
                            label="Enviar Convite"
                        />
                    </>
                )}
            </div>

            {/* Center Group - Main Controls */}
            <div className="desktop-apple-shell pointer-events-auto flex items-center gap-3 rounded-[24px] px-5 py-3 transition-colors hover:border-zinc-300 dark:hover:border-white/15">
                {isOnline && (
                    <>
                        <ControlButton
                            icon={isAudioEnabled ? Mic : MicOff}
                            active={!isAudioEnabled}
                            onClick={onToggleAudio}
                            label={isAudioEnabled ? "Mutar" : "Desmutar"}
                        />

                        <ControlButton
                            icon={isVideoEnabled ? Video : VideoOff}
                            active={!isVideoEnabled}
                            onClick={onToggleVideo}
                            label={isVideoEnabled ? "Desligar Vídeo" : "Ligar Vídeo"}
                        />

                        <ControlButton
                            icon={isScreenSharing ? MonitorOff : MonitorUp}
                            active={isScreenSharing}
                            onClick={onToggleScreenShare}
                            label={isScreenSharing ? "Parar Tela" : "Compartilhar Tela"}
                        />
                    </>
                )}

                <ControlButton
                    icon={isFocusMode ? EyeOff : Eye}
                    active={isFocusMode}
                    onClick={onToggleFocus}
                    label={isFocusMode ? "Sair do Foco" : "Modo Foco"}
                />

                <ControlButton
                    icon={Phone}
                    danger
                    onClick={onEndSession}
                    label="Encerrar"
                    className={cn("ml-2 h-12 w-12", isProcessing && "cursor-not-allowed opacity-50")}
                />
            </div>

            {/* Right Group - Placeholder for balance/layout */}
            <div className="w-[144px]" />
        </div>
    );
};
