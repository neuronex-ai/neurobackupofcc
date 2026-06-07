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
        <div className="relative min-h-screen w-full bg-background pb-28 pt-5 font-sans text-foreground selection:bg-zinc-900/10 dark:selection:bg-white/10">
            <div className="pointer-events-none fixed inset-0 z-0 premium-noise opacity-[0.025] dark:opacity-[0.035]" />
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute right-[-12%] top-[-22%] h-[620px] w-[780px] rounded-full bg-zinc-400/[0.035] blur-[170px] dark:bg-white/[0.018]" />
            </div>

            <div className="relative z-10 mx-auto w-full max-w-[2200px] px-5">
                <section className="relative isolate overflow-visible rounded-[30px] border border-zinc-200/75 bg-white/62 shadow-[0_24px_64px_-42px_rgba(24,24,27,0.22),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl dark:border-white/[0.065] dark:bg-white/[0.018] dark:shadow-[0_24px_64px_-42px_rgba(0,0,0,0.72),inset_0_1px_0_rgba(255,255,255,0.025)]">
                    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[30px] premium-noise opacity-[0.012] dark:opacity-[0.018]" />

            {/* ─── Header Top Bar ─── */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "circOut" }}
                className="sticky top-3 z-40 w-full rounded-t-[30px] border-b border-zinc-200/65 bg-white/78 px-4 py-3 backdrop-blur-3xl dark:border-white/[0.055] dark:bg-[#080809]/76"
            >
                <div className="w-full">
                    <div className="flex w-full items-center justify-between gap-4">

                        {/* Left Side: Back & Title */}
                        <div className="flex min-w-0 items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate('/pacientes')}
                                className="h-10 w-10 shrink-0 rounded-xl border border-zinc-200/70 bg-white text-zinc-500 shadow-sm transition-all hover:bg-zinc-950 hover:text-white dark:border-white/[0.07] dark:bg-white/[0.035] dark:text-zinc-400 dark:hover:bg-white dark:hover:text-black"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>

                            <div className="flex min-w-0 flex-col justify-center">
                                <span className="text-[8px] font-black uppercase tracking-[0.28em] text-zinc-400 dark:text-zinc-600">Prontuário clínico</span>
                                <h1 className="truncate text-base font-black leading-tight tracking-tight text-zinc-950 dark:text-zinc-100 md:text-lg">{patient.name}</h1>
                            </div>
                        </div>

                        {/* Right Side: Actions */}
                        <div className="flex shrink-0 items-center gap-2">

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleRepeatLastAppointment}
                                disabled={isScheduling}
                                className="hidden h-10 gap-2 rounded-xl px-4 text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500 transition-all hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-500 dark:hover:bg-white/[0.055] dark:hover:text-white sm:flex"
                            >
                                {isScheduling ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
                                Repetir sessão
                            </Button>

                            <div className="mx-1 hidden h-5 w-px bg-zinc-200 dark:bg-white/[0.055] sm:block" />

                            <Select value={patient.status || ""} onValueChange={handleStatusChange}>
                                <SelectTrigger className="h-10 w-auto gap-2 rounded-xl border border-zinc-200/70 bg-white px-4 text-[9px] font-black uppercase tracking-[0.17em] text-zinc-600 shadow-sm ring-0 transition-all hover:bg-zinc-100 focus:ring-0 dark:border-white/[0.07] dark:bg-white/[0.035] dark:text-zinc-300 dark:hover:bg-white/[0.07]">
                                    <div className="flex items-center gap-3">
                                        <span className={cn("h-1.5 w-1.5 rounded-full shadow-lg",
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
            <div className="relative z-10">
                <div className="grid grid-cols-1 items-start xl:grid-cols-[310px_minmax(0,1fr)]">

                    {/* LEFT COLUMN: Patient Info */}
                    <aside className="z-20 w-full space-y-5 border-b border-zinc-200/65 p-5 dark:border-white/[0.055] xl:sticky xl:top-[86px] xl:border-b-0 xl:border-r">
                        <GlassCard
                            className="w-full !rounded-[24px] !border-zinc-200/70 !bg-white/55 !shadow-none !backdrop-blur-none dark:!border-white/[0.06] dark:!bg-white/[0.014]"
                            innerClassName="p-0"
                        >
                            <div className="group relative overflow-hidden p-5">
                                <div className="relative z-10 mb-6 flex flex-col items-center text-center">
                                    <div className="relative mb-4">
                                        <div className="absolute inset-0 bg-zinc-500/10 dark:bg-white/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                        <Avatar className="relative z-10 h-24 w-24 rounded-[24px] border-4 border-white shadow-xl dark:border-[#0C0C0E]">
                                            <AvatarFallback className="bg-zinc-100 text-3xl font-black text-zinc-900 dark:bg-zinc-800 dark:text-white">
                                                {patient.name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <h3 className="text-xl font-black tracking-tight text-zinc-950 dark:text-white">{patient.name}</h3>
                                    <p className="mt-1.5 max-w-full truncate text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500">{patient.email}</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 rounded-xl border border-zinc-200/60 bg-white/70 p-3 transition-colors hover:bg-white dark:border-white/[0.055] dark:bg-white/[0.025] dark:hover:bg-white/[0.045]">
                                        <Phone className="h-3.5 w-3.5 text-zinc-400" />
                                        <span className="text-[11px] font-bold tracking-tight text-zinc-700 dark:text-zinc-300">{patient.phone || "Não informado"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 rounded-xl border border-zinc-200/60 bg-white/70 p-3 transition-colors hover:bg-white dark:border-white/[0.055] dark:bg-white/[0.025] dark:hover:bg-white/[0.045]">
                                        <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                                        <span className="truncate text-[11px] font-bold tracking-tight text-zinc-700 dark:text-zinc-300">{patient.address || "Endereço ausente"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 rounded-xl border border-zinc-200/60 bg-white/70 p-3 transition-colors hover:bg-white dark:border-white/[0.055] dark:bg-white/[0.025] dark:hover:bg-white/[0.045]">
                                        <Cake className="h-3.5 w-3.5 text-zinc-400" />
                                        <span className="text-[11px] font-bold tracking-tight text-zinc-700 dark:text-zinc-300">
                                            {patient.birth_date ? format(new Date(patient.birth_date), 'dd/MM/yyyy') : "Nascimento ausente"}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 grid grid-cols-2 gap-2 border-t border-zinc-200/60 pt-5 dark:border-white/[0.06]">
                                    <EditPatientModal patient={patient}>
                                        <Button variant="ghost" className="h-11 w-full rounded-xl bg-zinc-100 text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500 shadow-sm transition-all hover:bg-zinc-950 hover:text-white dark:bg-white/[0.04] dark:text-zinc-400 dark:hover:bg-white dark:hover:text-black">
                                            <Edit className="h-4 w-4 mr-2" /> Editar
                                        </Button>
                                    </EditPatientModal>
                                    <DocumentGeneratorModal patient={patient}>
                                        <Button variant="ghost" className="h-11 w-full rounded-xl bg-zinc-100 text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500 shadow-sm transition-all hover:bg-zinc-950 hover:text-white dark:bg-white/[0.04] dark:text-zinc-400 dark:hover:bg-white dark:hover:text-black">
                                            <FileOutput className="h-4 w-4 mr-2" /> Docs
                                        </Button>
                                    </DocumentGeneratorModal>
                                </div>

                                {/* Medications Block in Sidebar */}
                                <div className="mt-6 border-t border-zinc-200/60 pt-5 dark:border-white/[0.06]">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h4 className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-500">Medicações</h4>
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

                        <div className="h-[520px] overflow-hidden rounded-[24px]">
                            <SideNotes />
                        </div>
                    </aside>

                    {/* RIGHT COLUMN: Content Area */}
                    <main className="min-w-0 space-y-7 p-5 pb-16 md:p-7 lg:p-8">

                        <ClinicalSummaryCard latestNote={latestNote} patient={patient} />

                        <div className="relative flex min-h-[760px] w-full flex-col">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col h-full">

                                <div className="sticky top-[84px] z-30 mb-5">
                                    <div
                                        ref={scrollContainerRef}
                                        onMouseDown={handleMouseDown}
                                        onMouseLeave={handleMouseLeaveOrUp}
                                        onMouseUp={handleMouseLeaveOrUp}
                                        onMouseMove={handleMouseMove}
                                        className={cn(
                                            "flex w-full select-none items-center overflow-x-auto rounded-2xl border border-zinc-200/70 bg-white/82 p-1.5 shadow-[0_18px_50px_-36px_rgba(24,24,27,0.35)] backdrop-blur-3xl transition-colors dark:border-white/[0.07] dark:bg-[#080809]/82 dark:shadow-[0_18px_50px_-36px_rgba(0,0,0,0.8)]",
                                            isDragging ? "cursor-grabbing" : "cursor-grab",
                                            "custom-premium-scrollbar"
                                        )}
                                    >
                                        <TabsList className="h-auto w-full min-w-max justify-between gap-1 bg-transparent p-0">
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
                                                        "relative flex h-10 items-center gap-2 whitespace-nowrap rounded-xl px-4 text-[9px] font-black uppercase tracking-[0.16em] transition-all duration-200 active:scale-95",
                                                        "data-[state=active]:bg-zinc-950 data-[state=active]:text-white data-[state=active]:shadow-lg dark:data-[state=active]:bg-white dark:data-[state=active]:text-black",
                                                        "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-500 dark:hover:bg-white/[0.045] dark:hover:text-white"
                                                    )}
                                                >
                                                    <tab.icon className="h-3.5 w-3.5" />
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
                </section>
            </div>
        </div>
    );
}
