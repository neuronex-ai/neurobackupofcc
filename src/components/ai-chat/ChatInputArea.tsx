import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Plus,
    Mic,
    StopCircle,
    ArrowUp,
    Loader2,
    X,
    File as FileIcon,
    Image as ImageIcon,
    Sparkles
} from "lucide-react";
import { AudioWaveform } from "./AudioWaveform";
import { cn } from "@/lib/utils";
import { useAI } from "@/context/AIContext";
import { usePatientById } from "@/hooks/use-patient-by-id";
import { motion, AnimatePresence } from "framer-motion";

interface ChatInputAreaProps {
    onSend: (text: string, attachments: File[]) => void;
    isListening: boolean;
    isSending: boolean;
    isUploading: boolean;
    onStartListening: () => void;
    onStopListening: () => void;
    transcript: string;
}

export const ChatInputArea = ({
    onSend,
    isListening,
    isSending,
    isUploading,
    onStartListening,
    onStopListening,
    transcript
}: ChatInputAreaProps) => {
    const { activePatientId } = useAI();
    const { data: activePatient } = usePatientById(activePatientId || '');

    const [inputValue, setInputValue] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [attachments, setAttachments] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isListening && transcript) {
            setInputValue(transcript);
        }
    }, [transcript, isListening]);

    useEffect(() => {
        if (textareaRef.current) {
            // Adjust height based on content
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${Math.min(scrollHeight, 240)}px`;
        }
    }, [inputValue, isFocused]);

    const handleSend = () => {
        if ((!inputValue.trim() && attachments.length === 0) || isListening) return;
        onSend(inputValue, attachments);
        setInputValue("");
        setAttachments([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setAttachments(prev => [...prev, ...newFiles]);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="w-full flex flex-col gap-3 group/input">

            {/* Attachments Bar */}
            <AnimatePresence>
                {attachments.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex gap-2 px-2 overflow-x-auto pb-1"
                    >
                        {attachments.map((file, i) => (
                            <div key={i} className="flex items-center gap-2 bg-secondary/30 backdrop-blur-xl border border-border/10 rounded-xl px-3 py-2 shrink-0">
                                {file.type.startsWith('image/') ? <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" /> : <FileIcon className="w-3.5 h-3.5 text-muted-foreground" />}
                                <span className="text-[11px] font-medium text-foreground/80 truncate max-w-[100px]">{file.name}</span>
                                <button onClick={() => removeAttachment(i)} className="p-1 hover:bg-secondary rounded-full transition-colors">
                                    <X className="w-3 h-3 text-muted-foreground" />
                                </button>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Input Capsule - Premium Refinement */}
            <motion.div
                animate={{
                    minHeight: isFocused ? "110px" : "72px",
                    paddingTop: isFocused ? "24px" : "18px",
                    paddingBottom: isFocused ? "24px" : "18px"
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={cn(
                    "relative flex items-end gap-4 px-6 rounded-[36px] transition-all duration-500",
                    "bg-card",
                    "border border-border/20",
                    "shadow-[0_10px_40px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_40px_-15px_rgba(0,0,0,0.8)]",
                    isFocused && "bg-card border-border/40 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.9)]"
                )}
            >
                {/* Inner Glow to give depth */}
                <div className="absolute inset-0 rounded-[36px] pointer-events-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]" />

                {/* Left controls */}
                <div className="flex items-center gap-1.5 h-10 pb-1">
                    <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 shrink-0 transition-all hover:scale-105 active:scale-95"
                        disabled={isSending || isListening}
                    >
                        <Plus className="h-4.5 w-4.5" />
                    </Button>

                    <AnimatePresence>
                        {activePatient && !isListening && !isFocused && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "auto" }}
                                exit={{ opacity: 0, width: 0 }}
                                className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/30 border border-border/10 text-[10px] font-black text-foreground uppercase tracking-[0.2em] whitespace-nowrap overflow-hidden shadow-lg"
                            >
                                <Sparkles className="w-3 w-3 text-muted-foreground" />
                                <span className="max-w-[90px] truncate">{activePatient.name.split(' ')[0]}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Text Input Area */}
                <div className="flex-1 min-w-0 relative flex items-center h-full">
                    {isListening ? (
                        <div className="h-[40px] flex items-center w-full px-2 justify-center">
                            <AudioWaveform isListening={true} />
                        </div>
                    ) : (
                        <Textarea
                            ref={textareaRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            onKeyDown={handleKeyDown}
                            placeholder="Pergunte sobre pacientes, agenda ou financeiro..."
                            className={cn(
                                "w-full bg-transparent border-none focus:ring-0 text-[15px] placeholder:text-muted-foreground/50 resize-none p-0 max-h-[240px] text-foreground leading-relaxed font-light px-2 scrollbar-none transition-all duration-300",
                                isFocused ? "min-h-[60px]" : "min-h-[24px]"
                            )}
                            rows={1}
                            disabled={isSending}
                        />
                    )}
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2 h-10 pb-0.5 pr-1">
                    {!inputValue && attachments.length === 0 ? (
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={isListening ? onStopListening : onStartListening}
                            className={cn(
                                "h-11 w-11 rounded-full transition-all duration-500 relative overflow-hidden",
                                isListening
                                    ? "bg-primary text-primary-foreground scale-110 shadow-[0_0_30px_rgba(0,0,0,0.15)] dark:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                            )}
                        >
                            {isListening ? (
                                <span className="relative z-10 flex items-center justify-center">
                                    <StopCircle className="h-5.5 w-5.5 fill-current" />
                                </span>
                            ) : (
                                <Mic className="h-5.5 w-5.5" />
                            )}
                        </Button>
                    ) : (
                        <Button
                            size="icon"
                            onClick={handleSend}
                            disabled={isSending || isUploading}
                            className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg active:scale-95 border border-transparent"
                        >
                            {isSending || isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-5 w-5 stroke-[2.5]" />}
                        </Button>
                    )}
                </div>
            </motion.div>

            {/* Hint Text */}
            <AnimatePresence>
                {isFocused && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="flex justify-between px-4 text-[10px] text-muted-foreground font-medium tracking-tight"
                    >
                        <span>Model: <span className="text-muted-foreground/80">Synapse v1.0</span></span>
                        <span>
                            <kbd className="font-sans px-1 text-muted-foreground/80 bg-secondary/50 rounded border border-border/10 mx-1">Enter</kbd> para enviar
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};