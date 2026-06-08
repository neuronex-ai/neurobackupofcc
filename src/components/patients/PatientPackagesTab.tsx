"use client";

import { useAuth } from "@/components/auth/SessionContextProvider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { GlassCard } from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/skeleton";
import { usePatientData } from "@/hooks/use-patient-data";
import { usePatientPackages } from "@/hooks/use-patient-packages";
import { useProfile } from "@/hooks/use-profile";
import { useSessionNotes } from "@/hooks/use-session-notes";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, FileText, Loader2, Mail, MessageCircle, Package, Plus, Printer } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { MonthlyReportTemplate } from "./MonthlyReportTemplate";
import { NewPackageModal } from "./NewPackageModal";
import { PackageCard } from "./PackageCard";

interface PatientPackagesTabProps {
    patientId: string;
}

export const PatientPackagesTab = ({ patientId }: PatientPackagesTabProps) => {
    const { data: packages, isLoading: isLoadingPackages, error: packagesError } = usePatientPackages(patientId);
    const { data: notes } = useSessionNotes(patientId);
    const { data: profile } = useProfile();
    const { data: patient } = usePatientData(patientId);

    const { session } = useAuth();
    const [isSending, setIsSending] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    const monthSessions = notes?.filter(n => {
        const d = new Date(n.created_at);
        return d >= currentMonthStart && d <= currentMonthEnd;
    }) || [];

    const activePkg = packages?.find(p => p.total_sessions > p.sessions_used);

    const isRunningLow = activePkg && (activePkg.total_sessions - activePkg.sessions_used <= 1);

    const reportData = {
        patientName: patient?.name || "Paciente",
        month: format(now, "MMMM 'de' yyyy", { locale: ptBR }),
        professionalName: profile ? `${profile.first_name} ${profile.last_name}` : "Seu Psicólogo",
        stats: {
            attended: monthSessions.length,
            cancelled: 0,
            next: null
        },
        financialSummary: activePkg ? {
            totalInvested: (activePkg.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            packagesActive: activePkg.description
        } : undefined,
        clinicalSummary: monthSessions.length > 0 && monthSessions[0].ai_summary
            ? `Foco recente: ${monthSessions[0].ai_summary.summary}`
            : undefined
    };

    const handlePrintReport = () => {
        const content = printRef.current;
        if (!content) return;
        const w = window.open('', '', 'height=900,width=800');
        w?.document.write('<html><head><title>Relatório</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-gray-100 flex justify-center p-8">');
        w?.document.write(content.innerHTML);
        w?.document.write('</body></html>');
        w?.document.close();
        setTimeout(() => w?.print(), 1000);
    };

    const handleSendReportEmail = async () => {
        if (!patient?.email) {
            toast.error("Paciente sem e-mail.");
            return;
        }
        setIsSending(true);
        try {
            const html = printRef.current?.innerHTML || "";
            await fetch('https://krewdaklcyzqfxkkgvqr.supabase.co/functions/v1/send-document-email', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: patient.email,
                    subject: `Relatório Mensal - ${reportData.month}`,
                    htmlBody: html,
                    documentType: "Relatório de Progresso"
                })
            });
            toast.success("Relatório enviado!");
        } catch (e) {
            toast.error("Erro ao enviar.");
        } finally {
            setIsSending(false);
        }
    };

    if (isLoadingPackages) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-40 w-full bg-zinc-100/50 dark:bg-zinc-800/50 rounded-3xl" />
                <Skeleton className="h-40 w-full bg-zinc-100/50 dark:bg-zinc-800/50 rounded-3xl" />
            </div>
        );
    }

    if (packagesError) {
        return (
            <div className="text-center py-12 px-6">
                <div className="p-4 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-500 inline-block mb-4">
                    <AlertCircle className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Erro ao carregar pacotes</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Tente recarregar a página.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in pb-10">

            {isRunningLow && (
                <GlassCard 
                    className="border-zinc-200 dark:!border-white/[0.085] bg-zinc-50 dark:!bg-[#0b0b0d]"
                    innerClassName="p-5 md:p-6"
                >
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md shrink-0">
                                <AlertCircle className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wide">Pacote Acabando</p>
                                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">Resta apenas <span className="font-black text-zinc-900 dark:text-white">{activePkg.total_sessions - activePkg.sessions_used}</span> sessão neste pacote.</p>
                            </div>
                        </div>
                        <NewPackageModal patientId={patientId}>
                            <Button size="sm" variant="outline" className="h-9 border-zinc-200 dark:border-white/[0.075] text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-[#18181a] bg-transparent text-xs font-black uppercase tracking-wider rounded-xl transition-all">
                                Renovar
                            </Button>
                        </NewPackageModal>
                    </div>
                </GlassCard>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center p-2 bg-zinc-50/50 dark:bg-[#0b0b0d] backdrop-blur-xl rounded-[24px] border border-zinc-200/50 dark:border-white/[0.085] gap-3 sm:gap-0 shadow-sm">
                <div className="px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 flex items-center gap-3 w-full sm:w-auto">
                    <Package className="h-4 w-4 opacity-50" />
                    Gerenciamento de Planos
                </div>
                <div className="flex gap-2 w-full sm:w-auto p-1">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="gap-2 h-10 text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#18181a] hover:text-zinc-900 dark:hover:text-white transition-all rounded-xl flex-1 sm:flex-none"
                            >
                                <FileText className="h-3.5 w-3.5" /> Relatório Mensal
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[900px] h-[90vh] bg-zinc-50 dark:bg-[#0b0b0d] border-zinc-200 dark:border-white/[0.085] p-0 rounded-[32px] overflow-hidden flex flex-col shadow-2xl">
                            <div className="flex-1 bg-zinc-100/50 dark:bg-[#080809] p-8 overflow-y-auto flex justify-center custom-scrollbar">
                                <div ref={printRef} className="w-full max-w-[600px] scale-95 origin-top shadow-xl">
                                    <MonthlyReportTemplate {...reportData} />
                                </div>
                            </div>
                            <div className="p-6 border-t border-zinc-200 dark:border-white/[0.085] bg-white dark:bg-[#0b0b0d] flex justify-end gap-3 shrink-0">
                                <Button variant="outline" onClick={handlePrintReport} className="border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 gap-2 h-11 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                                    <Printer className="h-4 w-4" /> Imprimir
                                </Button>
                                <Button variant="outline" onClick={handleSendReportEmail} disabled={isSending} className="border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 gap-2 h-11 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Email
                                </Button>
                                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2 h-11 rounded-xl shadow-lg shadow-emerald-500/20 text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95">
                                    <MessageCircle className="h-4 w-4" /> WhatsApp
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <NewPackageModal patientId={patientId}>
                        <Button size="sm" className="gap-2 bg-zinc-900 dark:bg-white text-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-xl h-10 text-[10px] font-black uppercase tracking-widest px-6 rounded-xl transition-all hover:scale-105 flex-1 sm:flex-none">
                            <Plus className="h-3.5 w-3.5 stroke-[3]" />
                            Novo Pacote
                        </Button>
                    </NewPackageModal>
                </div>
            </div>

            {packages && packages.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
                    {packages.map((pkg, index) => (
                        <div key={pkg.id} className="animate-fade-up" style={{ animationDelay: `${index * 100}ms` }}>
                            <PackageCard pkg={pkg} patientId={patientId} />
                        </div>
                    ))}
                </div>
            ) : (
                <GlassCard className="flex flex-col items-center justify-center py-24 md:py-36 text-center border-dashed rounded-[48px]">
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-none mb-3">Nenhum pacote ativo</h3>
                </GlassCard>
            )}
        </div>
    );
};
