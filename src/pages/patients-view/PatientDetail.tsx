"use client";

import { AnamnesisTab } from "@/components/patients/anamnesis/AnamnesisTab";
import { DocumentGeneratorModal } from "@/components/patients/DocumentGeneratorModal";
import { EditPatientModal } from "@/components/patients/EditPatientModal";
import { PatientDocumentsTab } from "@/components/patients/PatientDocumentsTab";
import { PatientFinanceTab } from "@/components/patients/PatientFinanceTab";
import { PatientGoalsTab } from "@/components/patients/PatientGoalsTab";
import { PatientHistoryTab } from "@/components/patients/PatientHistoryTab";
import { PatientMoodTab } from "@/components/patients/PatientMoodTab";
import { PatientPackagesTab } from "@/components/patients/PatientPackagesTab";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePatientById } from "@/hooks/use-patient-by-id";
import { useSessionNotes } from "@/hooks/use-session-notes";
import { cn } from "@/lib/utils";
import { addWeeks, format } from "date-fns";
import {
    ArrowLeft, Cake, ClipboardList, Edit, Edit2, FileOutput, FileText, Loader2, MapPin, Package, Phone, Pill, RotateCw, Shield,
    Smile, Target,
    Wallet
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";


import { SideNotes } from "@/components/patients/anamnesis/SideNotes";
import { BiofeedbackWidget } from "@/components/patients/BiofeedbackWidget";
import { ClinicalSummaryCard } from "@/components/patients/ClinicalSummaryCard";
import { MedicationUpdateModal } from "@/components/patients/MedicationUpdateModal";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { useAddAppointment } from "@/hooks/use-add-appointment";
import { usePatientAppointments } from "@/hooks/use-patient-appointments";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { GlassCard } from "@/components/ui/GlassCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobilePatientDetail } from "@/mobile/pages/MobilePatientDetail";

export default function PatientDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isMobile = useIsMobile();
    const [activeTab, setActiveTab] = useState("history");
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ["history", "anamnesis", "mood", "goals", "packages", "finance", "documents"].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const { data: patient, isLoading: isLoadingPatient } = usePatientById(id || "");
    const { data: notes, isLoading: isLoadingNotes } = useSessionNotes(id || "");
    const { data: appointments } = usePatientAppointments();
    const { mutate: addAppointment, isPending: isScheduling } = useAddAppointment();
    const queryClient = useQueryClient();

    const handleStatusChange = async (newStatus: string) => {
        try {
            const { error } = await supabase
                .from('patients')
                .update({ status: newStatus })
                .eq('id', id!);

            if (error) throw error;

            toast.success("Status atualizado com sucesso");
            queryClient.invalidateQueries({ queryKey: ['patient', id] });
        } catch (error) {
            console.error(error);
            toast.error("Erro ao atualizar status");
        }
    };

    // Drag to scroll functionality
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollContainerRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
        setScrollLeft(scrollContainerRef.current.scrollLeft);
    };

    const handleMouseLeaveOrUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !scrollContainerRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startX) * 2; // Scroll speed
        scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    };


    if (isMobile) {
        return <MobilePatientDetail />;
    }



    const isLoading = isLoadingPatient || isLoadingNotes;

    const riskScore = patient?.risk_score || 0;
    if (riskScore >= 4 && riskScore <= 7) {
        // Atenção (Medium risk)
    } else if (riskScore >= 8) {
        // Alto Risco (High risk)
    }

    const latestNote = notes?.[0];

    const handleRepeatLastAppointment = () => {
        if (!appointments || appointments.length === 0) {
            toast.error("Nenhum agendamento anterior para repetir.");
            return;
        }

        const lastAppt = appointments
            .filter(a => a.patient_id === id)
            .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())[0];

        if (!lastAppt) {
            toast.error("Nenhum agendamento encontrado.");
            return;
        }

        const lastDate = new Date(lastAppt.start_time);
        const nextDate = addWeeks(lastDate, 1);
        const durationMs = new Date(lastAppt.end_time).getTime() - lastDate.getTime();
        const nextEndTime = new Date(nextDate.getTime() + durationMs);

        addAppointment({
            patient_id: id!,
            start_time: nextDate,
            end_time: nextEndTime,
            type: lastAppt.type,
            notes: "Repetição rápida",
            location: lastAppt.location
        }, {
            onSuccess: () => toast.success("Agendamento repetido para próxima semana!")
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen w-full p-6 md:p-8 space-y-8 max-w-[1800px] mx-auto pt-32">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full bg-white/5" />
                    <Skeleton className="h-8 w-48 bg-white/5 rounded-lg" />
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-8">
                    <Skeleton className="h-[700px] w-full rounded-[32px] bg-white/5" />
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <Skeleton className="h-24 rounded-[20px] bg-white/5" />
                            <Skeleton className="h-24 rounded-[20px] bg-white/5" />
                            <Skeleton className="h-24 rounded-[20px] bg-white/5" />
                        </div>
                        <Skeleton className="h-[500px] w-full rounded-[32px] bg-white/5" />
                    </div>
                </div>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center text-muted-foreground">
                <div className="w-24 h-24 rounded-3xl bg-secondary/10 flex items-center justify-center mb-6 border border-border/10">
                    <Shield className="h-10 w-10 opacity-20" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Paciente não encontrado</h2>
                <Button variant="outline" onClick={() => navigate('/pacientes')} className="rounded-full h-12 px-8 border-border/10 hover:bg-secondary/10">
                    Voltar para Lista
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full pt-10 pb-32 md:pb-40 relative selection:bg-zinc-900/10 dark:selection:bg-white/10 selection:text-zinc-900 dark:selection:text-white font-sans text-zinc-900 dark:text-zinc-100">

            {/* ─── Header Top Bar ─── */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "circOut" }}
                className="mb-8 sticky top-4 z-40 w-full max-w-[1920px] mx-auto px-6 md:px-12 lg:px-20 xl:px-24"
            >
                <div className="w-full">
                    <div className="w-full flex items-center justify-between p-2 pl-6 bg-white dark:bg-[#080809] backdrop-blur-3xl border border-black/[0.04] dark:border-white/[0.08] rounded-full shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)]">

                        {/* Left Side: Back & Title */}
                        <div className="flex items-center gap-6">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate('/pacientes')}
                                className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-white/5 hover:bg-zinc-900 dark:hover:bg-white text-zinc-500 hover:text-white dark:text-zinc-400 dark:hover:text-black transition-all border border-transparent shadow-sm"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>

                            <div className="flex flex-col justify-center h-full -space-y-0.5">
                                <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.3em] pl-0.5">Prontuário Digital</span>
                                <h1 className="text-base md:text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tighter leading-none">{patient.name}</h1>
                            </div>
                        </div>

                        {/* Right Side: Actions */}
                        <div className="flex items-center gap-3 pr-1">

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleRepeatLastAppointment}
                                disabled={isScheduling}
                                className="hidden sm:flex h-11 rounded-full px-6 text-[10px] uppercase font-black tracking-[0.2em] gap-3 text-zinc-500 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
                            >
                                {isScheduling ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
                                Agendamento
                            </Button>

                            <div className="h-6 w-px bg-zinc-200 dark:bg-white/5 mx-2 hidden sm:block" />

                            <Select value={patient.status || ""} onValueChange={handleStatusChange}>
                                <SelectTrigger className="h-11 w-auto gap-3 px-6 rounded-full border-none bg-zinc-100/50 dark:bg-white/[0.04] hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-all text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 dark:text-zinc-300 ring-0 focus:ring-0 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <span className={cn("w-2 h-2 rounded-full shadow-lg",
                                            patient.status === 'active' ? "bg-emerald-500 shadow-emerald-500/20" :
                                                patient.status === 'archived' ? "bg-orange-500" : "bg-zinc-400")}
                                        />
                                        <SelectValue placeholder="Status" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent align="end" className="w-[200px] rounded-3xl border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-[#080809]/95 backdrop-blur-2xl shadow-2xl p-2">
                                    <SelectItem value="active" className="rounded-2xl font-black text-[10px] uppercase tracking-widest py-3">Paciente Ativo</SelectItem>
                                    <SelectItem value="inactive" className="rounded-2xl font-black text-[10px] uppercase tracking-widest py-3">Inativo</SelectItem>
                                    <SelectItem value="archived" className="rounded-2xl font-black text-[10px] uppercase tracking-widest py-3 text-orange-500">Arquivado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </motion.div>


            {/* ─── Main Layout Grid ─── */}
            <div className="max-w-[1920px] mx-auto px-6 md:px-12 lg:px-20 xl:px-24 relative z-10">
                <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-8 md:gap-16 items-start">

                    {/* LEFT COLUMN: Patient Info */}
                    <aside className="xl:sticky xl:top-24 z-20 w-full space-y-6">
                        <GlassCard
                            className="w-full"
                            innerClassName="p-0"
                        >
                            <div className="p-8 md:p-10 relative overflow-hidden group">
                                <div className="flex flex-col items-center text-center relative z-10 mb-8 md:mb-10">
                                    <div className="relative mb-6 md:mb-8">
                                        <div className="absolute inset-0 bg-zinc-500/10 dark:bg-white/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                        <Avatar className="h-28 w-28 md:h-36 md:w-36 border-[6px] border-white dark:border-[#0C0C0E] shadow-2xl relative z-10 rounded-3xl">
                                            <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-4xl md:text-5xl font-black">
                                                {patient.name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">{patient.name}</h3>
                                    <p className="text-[11px] md:text-xs text-zinc-500 dark:text-zinc-500 mt-2 font-bold uppercase tracking-widest">{patient.email}</p>
                                </div>

                                <div className="space-y-3 md:space-y-4">
                                    <div className="flex items-center gap-4 p-4 md:p-5 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/[0.06] hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-all duration-300">
                                        <Phone className="h-4 w-4 text-zinc-400" />
                                        <span className="text-xs md:text-sm text-zinc-700 dark:text-zinc-300 font-bold tracking-tight">{patient.phone || "Não informado"}</span>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 md:p-5 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/[0.06] hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-all duration-300">
                                        <MapPin className="h-4 w-4 text-zinc-400" />
                                        <span className="text-xs md:text-sm text-zinc-700 dark:text-zinc-300 font-bold tracking-tight truncate">{patient.address || "Endereço ausente"}</span>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 md:p-5 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/[0.06] hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-all duration-300">
                                        <Cake className="h-4 w-4 text-zinc-400" />
                                        <span className="text-xs md:text-sm text-zinc-700 dark:text-zinc-300 font-bold tracking-tight">
                                            {patient.birth_date ? format(new Date(patient.birth_date), 'dd/MM/yyyy') : "Nascimento ausente"}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 md:gap-4 pt-8 md:pt-10 mt-8 md:mt-10 border-t border-zinc-100 dark:border-white/[0.08]">
                                    <EditPatientModal patient={patient}>
                                        <Button variant="ghost" className="w-full h-12 md:h-14 rounded-2xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-900 dark:hover:bg-white hover:text-white dark:hover:text-black text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 transition-all shadow-sm">
                                            <Edit className="h-4 w-4 mr-2" /> Editar
                                        </Button>
                                    </EditPatientModal>
                                    <DocumentGeneratorModal patient={patient}>
                                        <Button variant="ghost" className="w-full h-12 md:h-14 rounded-2xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-900 dark:hover:bg-white hover:text-white dark:hover:text-black text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 transition-all shadow-sm">
                                            <FileOutput className="h-4 w-4 mr-2" /> Docs
                                        </Button>
                                    </DocumentGeneratorModal>
                                </div>

                                {/* Medications Block in Sidebar */}
                                <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-white/[0.08]">
                                    <div className="flex items-center justify-between mb-5">
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500">Medicações</h4>
                                        <MedicationUpdateModal patient={patient}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl transition-all hover:bg-zinc-100 dark:hover:bg-white/10">
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </MedicationUpdateModal>
                                    </div>

                                    <div className="space-y-3">
                                        {patient.medications && patient.medications.length > 0 ? (
                                            patient.medications.map((med, idx) => (
                                                <div key={idx} className="group relative overflow-hidden rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/[0.06] p-4 hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-all">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{med.name}</span>
                                                        {med.dosage && (
                                                            <span className="text-[10px] font-black text-zinc-500 bg-white dark:bg-black/40 px-2 py-0.5 rounded-lg border border-zinc-200 dark:border-white/5 shadow-sm">
                                                                {med.dosage}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-6 rounded-2xl border-2 border-dashed border-zinc-100 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-white/[0.01] text-center">
                                                <Pill className="h-5 w-5 text-zinc-300 dark:text-zinc-800 mx-auto mb-3 opacity-30" />
                                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">Nenhuma medicação</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard className="h-[650px]" innerClassName="p-0">
                            <SideNotes />
                        </GlassCard>
                    </aside>

                    {/* RIGHT COLUMN: Content Area */}
                    <main className="space-y-10 md:space-y-12 min-w-0 pb-20">

                        <ClinicalSummaryCard latestNote={latestNote} patient={patient} />

                        <div className="w-full flex flex-col min-h-[800px] relative">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col h-full">

                                <div className="sticky top-[72px] md:top-24 z-30 mb-3 md:mb-4">
                                    <div
                                        ref={scrollContainerRef}
                                        onMouseDown={handleMouseDown}
                                        onMouseLeave={handleMouseLeaveOrUp}
                                        onMouseUp={handleMouseLeaveOrUp}
                                        onMouseMove={handleMouseMove}
                                        className={cn(
                                            "bg-white/95 dark:bg-[#080809]/95 backdrop-blur-3xl border border-black/[0.04] dark:border-white/[0.08] p-2.5 rounded-3xl flex items-center shadow-2xl w-full overflow-x-auto ring-1 ring-black/5 dark:ring-white/5 select-none transition-all duration-300",
                                            isDragging ? "cursor-grabbing scale-[0.99]" : "cursor-grab",
                                            "custom-premium-scrollbar"
                                        )}
                                    >
                                        <TabsList className="bg-transparent h-auto p-0 gap-2 w-full justify-between min-w-max">
                                            {[
                                                { val: "history", label: "Histórico", icon: FileText },
                                                { val: "anamnesis", label: "Anamneses", icon: ClipboardList },
                                                { val: "mood", label: "Humor", icon: Smile },
                                                { val: "goals", label: "Metas", icon: Target },
                                                { val: "packages", label: "Planos", icon: Package },
                                                { val: "finance", label: "Financeiro", icon: Wallet },
                                                { val: "documents", label: "Arquivos", icon: FileOutput }
                                            ].map((tab) => (
                                                <TabsTrigger
                                                    key={tab.val}
                                                    value={tab.val}
                                                    className={cn(
                                                        "relative h-12 rounded-[18px] px-6 text-[11px] font-black uppercase tracking-[0.25em] transition-all duration-500",
                                                        "data-[state=active]:bg-zinc-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black data-[state=active]:shadow-2xl data-[state=active]:scale-[1.02]",
                                                        "text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]",
                                                        "flex items-center gap-3 whitespace-nowrap active:scale-95"
                                                    )}
                                                >
                                                    <tab.icon className="h-4.5 w-4.5" />
                                                    {tab.label}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                    </div>

                                    {/* Premium Scrollbar Indicator Styling (Injecting CSS via style tag for simplicity in this component) */}
                                    <style>{`
                                        .custom-premium-scrollbar::-webkit-scrollbar {
                                            height: 4px;
                                        }
                                        .custom-premium-scrollbar::-webkit-scrollbar-track {
                                            background: transparent;
                                            margin: 0 40px;
                                        }
                                        .custom-premium-scrollbar::-webkit-scrollbar-thumb {
                                            background: rgba(0, 0, 0, 0.05);
                                            border-radius: 20px;
                                            transition: all 0.3s;
                                        }
                                        .dark .custom-premium-scrollbar::-webkit-scrollbar-thumb {
                                            background: rgba(255, 255, 255, 0.05);
                                        }
                                        .custom-premium-scrollbar:hover::-webkit-scrollbar-thumb {
                                            background: rgba(0, 0, 0, 0.1);
                                        }
                                        .dark .custom-premium-scrollbar:hover::-webkit-scrollbar-thumb {
                                            background: rgba(255, 255, 255, 0.1);
                                        }
                                    `}</style>
                                </div>

                                <div className="h-full">
                                    <TabsContent value="history" className="mt-0 h-full focus-visible:outline-none data-[state=inactive]:hidden animate-fade-in">
                                        <PatientHistoryTab patientId={id!} />
                                    </TabsContent>
                                    <TabsContent value="anamnesis" className="mt-0 h-full focus-visible:outline-none data-[state=inactive]:hidden animate-fade-in">
                                        <AnamnesisTab />
                                    </TabsContent>
                                    <TabsContent value="mood" className="mt-0 h-full focus-visible:outline-none data-[state=inactive]:hidden animate-fade-in">
                                        <PatientMoodTab patientId={id!} />
                                    </TabsContent>
                                    <TabsContent value="biofeedback" className="mt-0 h-full focus-visible:outline-none data-[state=inactive]:hidden animate-fade-in">
                                        <BiofeedbackWidget patientId={id!} />
                                    </TabsContent>
                                    <TabsContent value="goals" className="mt-0 h-full focus-visible:outline-none data-[state=inactive]:hidden animate-fade-in">
                                        <PatientGoalsTab patientId={id!} />
                                    </TabsContent>
                                    <TabsContent value="packages" className="mt-0 h-full focus-visible:outline-none data-[state=inactive]:hidden animate-fade-in">
                                        <PatientPackagesTab patientId={id!} />
                                    </TabsContent>
                                    <TabsContent value="finance" className="mt-0 h-full focus-visible:outline-none data-[state=inactive]:hidden animate-fade-in">
                                        <PatientFinanceTab patientId={id!} />
                                    </TabsContent>
                                    <TabsContent value="documents" className="mt-0 h-full focus-visible:outline-none data-[state=inactive]:hidden animate-fade-in">
                                        <PatientDocumentsTab patientId={id!} />
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
