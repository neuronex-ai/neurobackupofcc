import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";

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
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

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
                        className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/10 bg-card/90 shadow-2xl backdrop-blur-2xl pointer-events-auto dark:border-white/10 dark:bg-[#0A0A0B]/90"
                    >
                        <div className="flex flex-col gap-3 border-b border-border/10 bg-secondary/10 p-4 dark:border-white/10 dark:bg-white/[0.02]">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground dark:text-white">
                                    <Users className="h-3.5 w-3.5 text-primary" /> Pacientes
                                </span>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => onOpenChange(false)}
                                    className="h-6 w-6 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground dark:text-white/50 dark:hover:text-white"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50 dark:text-white/32">
                                {patients.length} nos ativos
                            </p>
                        </div>

                        <div className="relative flex-1 overflow-hidden">
                            <div className="custom-scrollbar absolute inset-0 space-y-1 overflow-y-auto p-2 pb-24">
                                {patients.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground/30">
                                        <Users className="h-8 w-8 opacity-20" />
                                        <p className="px-4 text-center text-[10px] font-medium">Nenhum paciente</p>
                                    </div>
                                ) : (
                                    patients.map((patient) => (
                                        <motion.button
                                            key={patient.id}
                                            layoutId={patient.id}
                                            onMouseEnter={() => onHoverNode(`pat-${patient.id}`)}
                                            onMouseLeave={() => onHoverNode(null)}
                                            onClick={() => onSelectPatient(patient)}
                                            whileHover={{ backgroundColor: "rgba(120,120,120,0.1)", scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-transparent p-2 text-left transition-colors duration-200 hover:border-border/10 dark:hover:border-white/5"
                                        >
                                            <Avatar className="h-8 w-8 shadow-sm ring-1 ring-border/10 transition-all group-hover:ring-primary/50 dark:ring-white/10">
                                                <AvatarImage src={patient.avatar_url || undefined} />
                                                <AvatarFallback className="bg-secondary/50 text-[9px] font-bold text-muted-foreground dark:bg-[#1A1A1D] dark:text-white/60">
                                                    {getInitials(patient.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground dark:text-white/70 dark:group-hover:text-white">
                                                    {patient.name}
                                                </p>
                                            </div>
                                            <ChevronRight className="h-3 w-3 text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-foreground/50" />
                                        </motion.button>
                                    ))
                                )}
                            </div>
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
                            className="h-10 w-10 rounded-xl border border-border/10 bg-card/80 text-muted-foreground shadow-xl backdrop-blur-xl hover:bg-secondary/80 hover:text-foreground dark:border-white/10 dark:bg-[#0A0A0B]/80 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
