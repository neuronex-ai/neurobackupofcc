import { PreJoinActions } from "@/components/teleconsulta/PreJoinActions";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import { Patient } from "@/types";
import { motion } from "framer-motion";
import { ArrowLeft, Chrome, Loader2, Play, Video as VideoIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface MobileTeleconsultationLobbyProps {
    patientName: string;
    patient?: Patient | null;
    appointmentId: string;
    meetLink: string;
    therapistName: string;
    isLoadingToken: boolean;
    onJoin: () => void;
    onBack: () => void;
}

export const MobileTeleconsultationLobby = ({
    patientName,
    patient,
    appointmentId,
    meetLink,
    therapistName,
    isLoadingToken,
    onJoin,
    onBack
}: MobileTeleconsultationLobbyProps) => {
    const [isChrome, setIsChrome] = useState(true);

    useEffect(() => {
        const isChromium = !!(window as any).chrome;
        setIsChrome(isChromium);
    }, []);

    return (
        <div className="fixed inset-0 bg-background z-[110] flex flex-col overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-foreground/[0.03] rounded-full blur-[100px] pointer-events-none z-0 opacity-30" />

            <div className="relative z-10 px-6 pt-10 flex flex-col items-center h-full">
                {/* Top Navigation */}
                <div className="w-full flex items-center justify-center mb-8 relative">
                    <button
                        onClick={onBack}
                        className="absolute left-0 rounded-full bg-foreground/[0.04] border border-border/10 text-foreground w-10 h-10 flex items-center justify-center active:scale-90 transition-all z-20"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>

                    <div className="text-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80">Sala de Espera</span>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest">NeuroNex Telemetria</p>
                    </div>
                </div>

                {/* Browser Alert */}
                {!isChrome && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full mb-4"
                    >
                        <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-500 rounded-2xl py-2 px-3">
                            <Chrome className="h-3 w-3" />
                            <AlertTitle className="text-[9px] font-bold uppercase tracking-wider">Use o Chrome para melhor conexão</AlertTitle>
                        </Alert>
                    </motion.div>
                )}

                {/* Patient Hero */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative mb-6"
                >
                    <div className="absolute inset-0 bg-foreground/[0.02] blur-[60px] rounded-full animate-pulse" />
                    <div className="relative w-40 h-40 rounded-full border-[6px] border-background ring-1 ring-border shadow-2xl p-1 bg-card">
                        <Avatar className="w-full h-full">
                            <AvatarFallback className="bg-foreground text-background text-4xl font-black">
                                {getInitials(patientName)}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="absolute bottom-1 right-1">
                        <div className="bg-blue-500 p-3.5 rounded-2xl border-4 border-background shadow-lg">
                            <VideoIcon className="w-5 h-5 text-background" />
                        </div>
                    </div>
                </motion.div>

                <div className="text-center space-y-2 mb-8">
                    <h2 className="text-3xl font-black text-foreground tracking-tighter">Tudo pronto?</h2>
                    <p className="text-muted-foreground text-sm font-medium">
                        Paciente: <span className="text-foreground font-bold">{patientName}</span>
                    </p>
                </div>

                {/* Main Action */}
                <div className="w-full max-w-xs space-y-3 mb-6">
                    {isLoadingToken ? (
                        <Button disabled className="w-full h-16 rounded-2xl bg-foreground/[0.04] text-muted-foreground border border-border/10">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            <span className="text-[10px] uppercase tracking-widest">Iniciando...</span>
                        </Button>
                    ) : (
                        <Button
                            onClick={onJoin}
                            className="w-full h-16 rounded-2xl bg-foreground text-background hover:bg-foreground/90 font-black text-[12px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 group"
                        >
                            <Play className="w-4 h-4 mr-2 fill-current" />
                            Iniciar Atendimento
                        </Button>
                    )}
                </div>

                {/* Reminder Section - Movido para cima */}
                <div className="w-full pt-4 border-t border-border/10 px-2 pb-10">
                    <div className="bg-foreground/[0.02] border border-border/10 rounded-[28px] p-5 text-center">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Enviar link da consulta</p>
                        <div className="scale-100 origin-top">
                            <PreJoinActions
                                appointmentId={appointmentId}
                                patient={patient}
                                meetLink={meetLink}
                                therapistName={therapistName}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};