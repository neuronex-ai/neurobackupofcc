import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Search, Users, X } from "lucide-react";
import { useState } from "react";

interface Patient {
    id: string;
    name: string;
    avatar_url?: string | null;
}

interface NeuroViewSidebarProps {
    patients: Patient[];
    onHoverNode: (id: string | null) => void;
    onSelectPatient: (patient: Patient) => void;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export const NeuroViewSidebar = ({
    patients,
    onHoverNode,
    onSelectPatient,
    isOpen,
    onOpenChange
}: NeuroViewSidebarProps) => {
    const [search, setSearch] = useState("");

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="absolute top-4 left-4 bottom-4 z-40 flex pointer-events-none">
            <AnimatePresence mode="wait">
                {isOpen ? (
                    <motion.div
                        key="sidebar-open"
                        initial={{ opacity: 0, x: -20, width: 0 }}
                        animate={{ opacity: 1, x: 0, width: 240 }}
                        exit={{ opacity: 0, x: -20, width: 0 }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="flex flex-col bg-card/90 dark:bg-[#0A0A0B]/90 backdrop-blur-2xl border border-border/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto h-full"
                    >
                        {/* Header */}
                        <div className="flex flex-col gap-3 p-4 border-b border-border/10 dark:border-white/10 bg-secondary/10 dark:bg-white/[0.02]">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-foreground dark:text-white uppercase tracking-widest flex items-center gap-2">
                                    <Users className="h-3.5 w-3.5 text-primary" /> Pacientes
                                </span>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => onOpenChange(false)}
                                    className="h-6 w-6 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground dark:text-white/50 dark:hover:text-white"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                            </div>

                            <div className="relative group">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 group-focus-within:text-foreground transition-colors" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Filtrar..."
                                    className="h-8 pl-8 bg-background/50 dark:bg-black/40 border-border/10 dark:border-white/10 text-xs rounded-lg placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-border/20 transition-all text-foreground dark:text-white"
                                />
                                {search && (
                                    <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Patient List */}
                        <div className="flex-1 overflow-hidden relative">
                            <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                {filteredPatients.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/30 gap-2">
                                        <Users className="h-8 w-8 opacity-20" />
                                        <p className="text-[10px] font-medium text-center px-4">
                                            {search ? "Nenhum resultado" : "Nenhum paciente"}
                                        </p>
                                    </div>
                                ) : (
                                    filteredPatients.map((patient) => (
                                        <motion.button
                                            key={patient.id}
                                            layoutId={patient.id}
                                            onMouseEnter={() => onHoverNode(`pat-${patient.id}`)}
                                            onMouseLeave={() => onHoverNode(null)}
                                            onClick={() => onSelectPatient(patient)}
                                            whileHover={{ backgroundColor: "rgba(120,120,120,0.1)", scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="w-full flex items-center gap-3 p-2 rounded-xl transition-colors duration-200 group cursor-pointer text-left border border-transparent hover:border-border/10 dark:hover:border-white/5"
                                        >
                                            <Avatar className="h-8 w-8 ring-1 ring-border/10 dark:ring-white/10 group-hover:ring-primary/50 transition-all shadow-sm">
                                                <AvatarImage src={patient.avatar_url || undefined} />
                                                <AvatarFallback className="bg-secondary/50 dark:bg-[#1A1A1D] text-muted-foreground dark:text-white/60 text-[9px] font-bold">
                                                    {getInitials(patient.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-muted-foreground group-hover:text-foreground dark:text-white/70 dark:group-hover:text-white transition-colors truncate">
                                                    {patient.name}
                                                </p>
                                            </div>
                                            <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-foreground/50 transition-colors opacity-0 group-hover:opacity-100" />
                                        </motion.button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Footer Status */}
                        <div className="p-3 border-t border-border/10 dark:border-white/5 bg-secondary/20 dark:bg-black/20 text-[9px] text-center text-muted-foreground/50 dark:text-white/30 uppercase tracking-widest font-mono">
                            {filteredPatients.length} nós ativos
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="sidebar-closed"
                        initial={{ opacity: 0, scale: 0.8, x: -20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: -20 }}
                        transition={{ type: "spring", damping: 20, stiffness: 400 }}
                        className="pointer-events-auto"
                    >
                        <Button
                            size="icon"
                            variant="outline"
                            onClick={() => onOpenChange(true)}
                            className="h-10 w-10 rounded-xl bg-card/80 dark:bg-[#0A0A0B]/80 backdrop-blur-xl border border-border/10 dark:border-white/10 hover:bg-secondary/80 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground dark:text-white/70 dark:hover:text-white shadow-xl"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
