"use client";

import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { supabase } from "@/integrations/supabase/client";
import { Settings, Clock, Loader2, Save } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const DAYS_OF_WEEK = [
    { id: "0", label: "Domingo", short: "Dom" },
    { id: "1", label: "Segunda-feira", short: "Seg" },
    { id: "2", label: "Terça-feira", short: "Ter" },
    { id: "3", label: "Quarta-feira", short: "Qua" },
    { id: "4", label: "Quinta-feira", short: "Qui" },
    { id: "5", label: "Sexta-feira", short: "Sex" },
    { id: "6", label: "Sábado", short: "Sáb" },
];

type WorkingDayHours = { enabled: boolean; start: string; end: string };
type WorkingHours = Record<string, WorkingDayHours>;

const DEFAULT_WORKING_HOURS: WorkingHours = {
    "0": { enabled: false, start: "08:00", end: "12:00" },
    "1": { enabled: true, start: "08:00", end: "19:00" },
    "2": { enabled: true, start: "08:00", end: "19:00" },
    "3": { enabled: true, start: "08:00", end: "19:00" },
    "4": { enabled: true, start: "08:00", end: "19:00" },
    "5": { enabled: true, start: "08:00", end: "19:00" },
    "6": { enabled: false, start: "08:00", end: "12:00" }
};

export const AgendaSettingsModal = () => {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Configurações padrão
    const [workingHours, setWorkingHours] = useState<WorkingHours>({ ...DEFAULT_WORKING_HOURS });

    const loadSettings = useCallback(async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('profiles').select('working_hours').eq('id', user.id).single();
            if (error) {
                console.error("Error loading settings:", error);
                setWorkingHours({ ...DEFAULT_WORKING_HOURS });
            } else if (data?.working_hours && typeof data.working_hours === 'object') {
                setWorkingHours(data.working_hours as WorkingHours);
            } else {
                setWorkingHours({ ...DEFAULT_WORKING_HOURS });
            }
        } catch (error) {
            console.error(error);
            setWorkingHours({ ...DEFAULT_WORKING_HOURS });
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (open) loadSettings();
    }, [open, loadSettings]);

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            // Ensure working_hours is a clean JSON object
            const cleanHours = JSON.parse(JSON.stringify(workingHours)) as WorkingHours;

            const { error } = await supabase
                .from('profiles')
                .update({ working_hours: cleanHours })
                .eq('id', user.id);

            if (error) {
                console.error("Save error:", error);
                throw error;
            }
            toast.success("Horários atualizados com sucesso!");
            setOpen(false);
        } catch (error) {
            console.error("Save error detail:", error);
            toast.error(error?.message || "Erro ao salvar configuração.");
        } finally {
            setIsSaving(false);
        }
    };

    const updateDay = <K extends keyof WorkingDayHours>(dayId: string, field: K, value: WorkingDayHours[K]) => {
        setWorkingHours((prev) => ({
            ...prev,
            [dayId]: {
                ...(prev[dayId] ?? DEFAULT_WORKING_HOURS[dayId] ?? { enabled: false, start: "08:00", end: "18:00" }),
                [field]: value
            }
        }));
    };

    return (
        <ResponsiveModal
            open={open}
            onOpenChange={setOpen}
            trigger={
                <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-950 active:scale-95 dark:border-white/10 dark:bg-white/[0.055] dark:text-white/62 dark:hover:border-white/16 dark:hover:bg-white/[0.09] dark:hover:text-white motion-reduce:transition-none motion-reduce:active:scale-100">
                    <Settings className="h-4 w-4" />
                </Button>
            }
            className="sm:max-w-[520px] p-0 overflow-hidden bg-white dark:bg-[#0A0A0B] border border-zinc-200 dark:border-white/10 rounded-[32px] shadow-2xl"
        >
            <div className="p-5 sm:p-7 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 shadow-xl shrink-0">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Sua Grade</h2>
                        <p className="text-[9px] text-zinc-400 font-bold tracking-[0.2em] uppercase">Defina quando você atende</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="py-16 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-zinc-300" /></div>
                ) : (
                    <div className="space-y-2.5">
                        {DAYS_OF_WEEK.map((day) => {
                            const hw = workingHours[day.id] || { enabled: false, start: "08:00", end: "18:00" };
                            return (
                                <div key={day.id} className={cn(
                                    "rounded-2xl border transition-all",
                                    hw.enabled
                                        ? "bg-zinc-50 dark:bg-white/[0.03] border-zinc-200 dark:border-white/10"
                                        : "bg-transparent border-transparent opacity-50"
                                )}>
                                    <div className={cn(
                                        "flex items-center gap-3 p-3 sm:p-4",
                                        hw.enabled && "pb-2"
                                    )}>
                                        <Switch
                                            checked={hw.enabled}
                                            onCheckedChange={(checked) => updateDay(day.id, 'enabled', checked)}
                                        />
                                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-200 flex-1 truncate">
                                            <span className="hidden sm:inline">{day.label}</span>
                                            <span className="sm:hidden">{day.short}</span>
                                        </span>

                                        {/* Desktop: inline time inputs */}
                                        {hw.enabled && (
                                            <div className="hidden sm:flex items-center gap-2">
                                                <Input
                                                    type="time"
                                                    value={hw.start}
                                                    onChange={(e) => updateDay(day.id, 'start', e.target.value)}
                                                    className="w-[100px] h-9 text-sm font-bold text-center bg-white dark:bg-black/40 border-zinc-200 dark:border-white/10 rounded-xl focus:ring-zinc-500"
                                                />
                                                <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider shrink-0">até</span>
                                                <Input
                                                    type="time"
                                                    value={hw.end}
                                                    onChange={(e) => updateDay(day.id, 'end', e.target.value)}
                                                    className="w-[100px] h-9 text-sm font-bold text-center bg-white dark:bg-black/40 border-zinc-200 dark:border-white/10 rounded-xl focus:ring-zinc-500"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Mobile: stacked time inputs */}
                                    {hw.enabled && (
                                        <div className="sm:hidden px-3 pb-3">
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="time"
                                                    value={hw.start}
                                                    onChange={(e) => updateDay(day.id, 'start', e.target.value)}
                                                    className="flex-1 h-10 text-sm font-bold text-center bg-white dark:bg-black/40 border-zinc-200 dark:border-white/10 rounded-xl"
                                                />
                                                <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider shrink-0">até</span>
                                                <Input
                                                    type="time"
                                                    value={hw.end}
                                                    onChange={(e) => updateDay(day.id, 'end', e.target.value)}
                                                    className="flex-1 h-10 text-sm font-bold text-center bg-white dark:bg-black/40 border-zinc-200 dark:border-white/10 rounded-xl"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="pt-1">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || isLoading}
                        className="w-full h-13 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black uppercase tracking-[0.2em] text-[10.5px] shadow-xl hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-3" />}
                        {isSaving ? "Salvando..." : "Salvar Configuração"}
                    </Button>
                </div>
            </div>
        </ResponsiveModal>
    );
};
