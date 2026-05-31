import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Search, MoreHorizontal, Eye, EyeOff, History, X } from "lucide-react";
import { format, isToday, isYesterday, subDays, isAfter } from "date-fns";
import { ChatSession } from "@/hooks/use-ai-chat";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ChatSidebarProps {
    sessions: ChatSession[] | undefined;
    currentSessionId: string | null;
    onSelectSession: (id: string) => void;
    onCreateSession: () => void;
    onDeleteSession: (e: React.MouseEvent, id: string) => void;
    onClose: () => void;
}

export const ChatSidebar = ({
    sessions,
    currentSessionId,
    onSelectSession,
    onCreateSession,
    onDeleteSession,
    onClose
}: ChatSidebarProps) => {
    const [filter, setFilter] = useState("");
    const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

    const toggleReveal = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const newSet = new Set(revealedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setRevealedIds(newSet);
    };

    const filteredSessions = sessions?.filter(s =>
        s.title?.toLowerCase().includes(filter.toLowerCase())
    );

    const groupedSessions = filteredSessions?.reduce((acc, session) => {
        const date = new Date(session.created_at);
        let key = "Antigos";

        if (isToday(date)) key = "Hoje";
        else if (isYesterday(date)) key = "Ontem";
        else if (isAfter(date, subDays(new Date(), 7))) key = "7 Dias";
        else if (isAfter(date, subDays(new Date(), 30))) key = "30 Dias";

        if (!acc[key]) acc[key] = [];
        acc[key].push(session);
        return acc;
    }, {} as Record<string, ChatSession[]>);

    const groupOrder = ["Hoje", "Ontem", "7 Dias", "30 Dias", "Antigos"];

    return (
        <div className="h-full flex flex-col bg-transparent backdrop-blur-md relative overflow-hidden">

            {/* Header Area */}
            <div className="p-5 space-y-4 shrink-0 relative z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-foreground">
                        <History className="h-4 w-4 text-muted-foreground" />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-60">Histórico</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full hover:bg-secondary text-muted-foreground transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex gap-2">
                    <Button
                        onClick={onCreateSession}
                        className="flex-1 h-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs shadow-sm transition-all active:scale-95"
                    >
                        <Plus className="h-3.5 w-3.5 mr-1.5" /> Nova Conversa
                    </Button>
                </div>

                <div className="relative group/search">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 group-focus-within/search:text-white transition-colors" />
                    <Input
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder="Pesquisar histórico..."
                        className="h-10 pl-10 bg-secondary/30 border-border/10 focus:bg-secondary/50 focus:border-border/30 rounded-[14px] text-[11px] font-bold uppercase tracking-widest transition-all placeholder:text-muted-foreground/30 focus:ring-0"
                    />
                </div>
            </div>

            {/* Session List */}
            <ScrollArea className="flex-1 px-3 relative z-10">
                <div className="pb-20 space-y-6">
                    {groupedSessions && groupOrder.map(label => {
                        const list = groupedSessions[label];
                        if (!list || list.length === 0) return null;

                        return (
                            <div key={label} className="animate-fade-in px-1">
                                <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-3 px-2">
                                    {label}
                                </p>
                                <div className="space-y-1">
                                    {list.map(s => {
                                        const isRevealed = revealedIds.has(s.id);
                                        return (
                                            <div
                                                key={s.id}
                                                onClick={() => onSelectSession(s.id)}
                                                className={cn(
                                                    "group/item relative flex flex-col p-3 rounded-xl cursor-pointer transition-all duration-300 border",
                                                    currentSessionId === s.id
                                                        ? "bg-secondary border-border/10 shadow-sm"
                                                        : "border-transparent hover:bg-secondary/50"
                                                )}
                                            >
                                                {/* Header Line */}
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <span className={cn(
                                                        "text-[12px] font-bold tracking-tight truncate transition-all duration-300",
                                                        currentSessionId === s.id ? "text-foreground" : "text-muted-foreground group-hover/item:text-foreground/80"
                                                    )}>
                                                        {s.title || "Nova Conversa"}
                                                    </span>
                                                    <span className="text-[9px] text-muted-foreground/60 whitespace-nowrap shrink-0">
                                                        {format(new Date(s.updated_at), "HH:mm")}
                                                    </span>
                                                </div>

                                                {/* Snippet / Content Preview */}
                                                <div className="relative group/privacy">
                                                    <p className={cn(
                                                        "text-[10px] leading-relaxed text-muted-foreground/70 transition-all duration-300 line-clamp-1 font-medium",
                                                        !isRevealed && "blur-[3px] select-none opacity-60 grayscale"
                                                    )}>
                                                        {/* Placeholder snippet simulating content since we don't have it in the DB yet */}
                                                        Discussão clínica confidencial...
                                                    </p>

                                                    {/* Privacy Toggle Overlay */}
                                                    {!isRevealed && (
                                                        <div
                                                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/privacy:opacity-100 transition-opacity z-10"
                                                            onClick={(e) => toggleReveal(e, s.id)}
                                                        >
                                                            <div className="bg-secondary/50 backdrop-blur-md p-1 rounded-full">
                                                                <Eye className="h-3 w-3 text-foreground" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="absolute right-2 top-2 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center gap-1">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-5 w-5 rounded-md hover:bg-secondary"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <MoreHorizontal className="h-3 w-3" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-popover/90 backdrop-blur-xl border-border/10">
                                                            <DropdownMenuItem
                                                                className="text-xs gap-2 cursor-pointer focus:bg-secondary/50"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleReveal(e, s.id);
                                                                }}
                                                            >
                                                                {isRevealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                                {isRevealed ? "Ocultar Preview" : "Mostrar Preview"}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-muted-foreground focus:text-foreground text-[10px] font-black uppercase tracking-widest gap-2.5 cursor-pointer focus:bg-secondary/50 h-10 rounded-xl transition-colors"
                                                                onClick={(e) => onDeleteSession(e, s.id)}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" /> Excluir
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>

            {/* Footer Gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none z-20" />
        </div>
    );
};