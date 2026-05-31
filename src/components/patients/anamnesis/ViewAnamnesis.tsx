"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check, MoreVertical, FileDown, Mail, Trash2, RefreshCcw, ClipboardList, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { usePatientById } from "@/hooks/use-patient-by-id";
import { useProfile } from "@/hooks/use-profile";
import { useGoogleAuth } from "@/hooks/use-google-auth";
import { downloadDocumentPDF, generateDocumentPDFBase64, DocumentPDFData } from "@/lib/pdf-generator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";

interface ExtractedItem {
    question: string;
    answer: string;
    isSection?: boolean;
}

const AutoSaveField = ({
    initialValue,
    type,
    onSave,
    className
}: {
    initialValue: string;
    type: 'question' | 'answer';
    onSave: (val: string) => void;
    className?: string;
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(initialValue);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
        }
    }, [isEditing]);

    useEffect(() => {
        if (!isEditing) {
            setValue(initialValue);
        }
    }, [initialValue, isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        if (value !== initialValue) {
            onSave(value);
        }
    };

    if (isEditing) {
        return (
            <Textarea
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleBlur}
                className={cn(
                    "w-full bg-zinc-100 dark:bg-black/40 border-zinc-300 dark:border-white/10 rounded-2xl focus:ring-4 focus:ring-zinc-900/5 dark:focus:ring-white/5 resize-none overflow-hidden transition-all duration-500 min-h-[160px] p-6 text-base md:text-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-800",
                    type === 'question' && "text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 min-h-[40px] py-2 px-3",
                    className
                )}
            />
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={cn(
                "cursor-text transition-all duration-500 rounded-3xl hover:bg-zinc-100/50 dark:hover:bg-white/[0.03] px-2 -mx-2 group/field",
                type === 'question' ? "py-1" : "py-2 min-h-[2.5rem]"
            )}
        >
            <p className={cn(
                type === 'question'
                    ? "text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 group-hover/field:text-zinc-900 dark:group-hover/field:text-zinc-300 transition-colors"
                    : "text-base md:text-lg text-zinc-800 dark:text-zinc-200 font-medium leading-relaxed whitespace-pre-wrap break-words",
                className
            )}>
                {value || <span className="opacity-50 italic font-normal text-zinc-500">Clique para adicionar resposta...</span>}
            </p>
        </div>
    );
};

interface ViewAnamnesisProps {
    onChangeTemplate?: () => void;
    onResetToSelection?: () => void;
}

export function ViewAnamnesis({ onChangeTemplate, onResetToSelection }: ViewAnamnesisProps = {}) {
    const { id: patientId } = useParams<{ id: string }>();
    const [data, setData] = useState<ExtractedItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [anamnesisId, setAnamnesisId] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const { isConnected: isGoogleConnected } = useGoogleAuth();

    const { data: profile } = useProfile();
    const { data: patient } = usePatientById(patientId || "");

    useEffect(() => {
        if (patientId) {
            fetchAnamnesis();
        }
    }, [patientId]);

    const fetchAnamnesis = async () => {
        try {
            // Small delay to ensure database consistency after save/import
            await new Promise(r => setTimeout(r, 300));

            const { data: records, error } = await supabase
                .from('patient_anamneses')
                .select('*')
                .eq('patient_id', patientId)
                .limit(1);

            if (error) throw error;

            const record = records?.[0];
            if (record) {
                setAnamnesisId(record.id);
                let items: ExtractedItem[] = [];
                if (Array.isArray(record.content)) {
                    items = record.content as ExtractedItem[];
                } else if (record.content && typeof record.content === 'object') {
                    if ((record.content as any).fields) {
                        const fields = (record.content as any).fields;
                        items = Object.entries(fields).map(([k, v]) => ({
                            question: k,
                            answer: String(v)
                        }));
                    } else {
                        // Try to use the content as-is
                        items = record.content as any;
                    }
                }
                // Final validation: ensure items is always a valid array
                if (!Array.isArray(items)) {
                    console.warn('[ViewAnamnesis] Content parsed to non-array, resetting to empty:', items);
                    items = [];
                }
                setData(items);
            }
        } catch (err) {
            console.error('[ViewAnamnesis] Fetch error:', err);
            toast.error("Erro ao carregar anamnese");
        } finally {
            setIsLoading(false);
        }
    };

    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [publicToken, setPublicToken] = useState<string | null>(null);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    useEffect(() => {
        if (!anamnesisId) return;

        const channel = supabase
            .channel(`anamnesis-${anamnesisId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'patient_anamneses', filter: `id=eq.${anamnesisId}` }, (payload) => {
                const newContent = payload.new.content;
                let items: ExtractedItem[] = [];
                if (Array.isArray(newContent)) {
                    items = newContent as ExtractedItem[];
                } else if (newContent && typeof newContent === 'object') {
                    if ((newContent as any).fields) {
                        const fields = (newContent as any).fields;
                        items = Object.entries(fields).map(([k, v]) => ({
                            question: k,
                            answer: String(v)
                        }));
                    } else {
                        items = newContent as any;
                    }
                }
                setData(items);
                toast.info("Anamnese atualizada remotamente!");
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [anamnesisId]);

    const handleUpdate = async (index: number, field: 'question' | 'answer', newValue: string) => {
        const newData = [...data];
        newData[index][field] = newValue;
        setData(newData);
        saveToDb(newData);
    };

    const saveToDb = async (newData: ExtractedItem[]) => {
        if (!anamnesisId) return;

        setSaveStatus('saving');
        try {
            const { error } = await supabase
                .from('patient_anamneses')
                .update({
                    content: newData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', anamnesisId);

            if (error) throw error;
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err) {
            console.error(err);
            toast.error("Erro ao salvar alteração");
            setSaveStatus('idle');
        }
    };

    const getPDFData = (): DocumentPDFData => {
        const formattedContent = data.map(item =>
            `<p><strong>${item.question}</strong></p><p>${item.answer || "Não informado"}</p>`
        ).join('<br/>');

        return {
            type: "Anamnese",
            title: "Ficha de Anamnese",
            content: formattedContent,
            patientName: patient?.name || "Paciente",
            patientDoc: patient?.cpf || undefined,
            professionalName: [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || "Profissional",
            professionalRegistry: profile?.crp || "NeuroNex CRP",
            date: format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
            clinicName: "NeuroNex Clinic"
        };
    };

    const handleDownloadPDF = async () => {
        if (!patient || !profile) {
            toast.error("Aguarde o carregamento dos dados...");
            return;
        }
        try {
            toast.info("Gerando PDF...");
            const pdfData = getPDFData();
            await downloadDocumentPDF(pdfData, `anamnese_${patient.name.split(' ')[0]}.pdf`);
            toast.success("Download iniciado!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao gerar PDF");
        }
    };

    const handleSendEmail = async () => {
        if (!patient?.email) {
            toast.error("Paciente sem e-mail cadastrado.");
            return;
        }

        if (isGoogleConnected === false) {
            toast.error("Conecte sua conta Google Workspace nos Ajustes para utilizar o envio via Gmail.", {
                action: {
                    label: "Conectar",
                    onClick: () => window.location.href = "/ajustes?tab=integrations"
                }
            });
            return;
        }

        setIsSending(true);
        toast.info("Gerando PDF e enviando via Gmail...");

        try {
            const pdfData = getPDFData();
            const base64 = await generateDocumentPDFBase64(pdfData);

            const { error } = await supabase.functions.invoke('send-document-email', {
                body: {
                    to: patient.email,
                    subject: `Ficha de Anamnese - ${patient.name}`,
                    htmlBody: `<p>Olá, ${patient.name.split(' ')[0]}.</p><p>Segue em anexo a sua ficha de anamnese completa.</p>`,
                    documentType: 'Ficha de Anamnese',
                    pdfAttachment: {
                        filename: `Anamnese_${patient.name.split(' ')[0]}.pdf`,
                        content: base64,
                        contentType: 'application/pdf'
                    }
                }
            });

            if (error) {
                console.error("Function error:", error);
                throw new Error("Erro na função de envio.");
            }

            toast.success(`Enviado para ${patient.email}`);
        } catch (error: any) {
            console.error(error);
            toast.error("Erro ao enviar e-mail via Gmail.");
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-zinc-300 dark:text-zinc-600 animate-spin" />
            </div>
        );
    }

    if (!data.length && !isLoading) {
        // No data found — redirect back to the selection screen
        if (onResetToSelection) {
            onResetToSelection();
        }
        return null;
    }


    const handleDelete = async () => {
        if (!anamnesisId) return;
        try {
            // Try hard delete first
            const { data: deleted, error } = await supabase
                .from('patient_anamneses')
                .delete()
                .eq('id', anamnesisId)
                .select('id');

            if (error) throw error;

            // If RLS blocked the delete (0 rows affected), fall back to clearing content
            if (!deleted || deleted.length === 0) {
                console.warn('[Anamnesis] Hard delete returned 0 rows - falling back to content clear');
                const { error: updateError } = await supabase
                    .from('patient_anamneses')
                    .update({
                        content: [],
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', anamnesisId);

                if (updateError) throw updateError;
            }

            toast.success("Ficha de anamnese excluída!");
            setData([]);
            setAnamnesisId(null);
            setConfirmDeleteOpen(false);
            if (onResetToSelection) {
                onResetToSelection();
            }
        } catch (err) {
            console.error('[Anamnesis] Delete error:', err);
            toast.error("Erro ao excluir.");
            setConfirmDeleteOpen(false);
        }
    };

    const handleGenerateLink = async () => {
        if (!anamnesisId) return;
        setLinkModalOpen(true);

        const token = Math.floor(10000 + Math.random() * 90000).toString();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        try {
            const { error } = await supabase
                .from('patient_anamneses')
                .update({
                    access_token: token,
                    token_expires_at: expiresAt.toISOString()
                })
                .eq('id', anamnesisId);

            if (error) throw error;
            setPublicToken(token);
        } catch (err) {
            console.error(err);
            toast.error("Erro ao gerar link.");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copiado!");
    };

    return (
        <div className="w-full flex flex-col items-center gap-8 animate-fade-in pb-12 px-1 h-[calc(100vh-220px)] overflow-hidden">
            <div className="w-full max-w-5xl flex-1 flex flex-col gap-10 relative h-full">

                <motion.div
                    initial={{ opacity: 0, scale: 0.98, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full h-full bg-white dark:bg-zinc-950/40 backdrop-blur-3xl border border-zinc-200 dark:border-white/5 rounded-[48px] shadow-2xl relative overflow-hidden flex flex-col group/doc-container"
                >
                    <div className="absolute top-0 right-0 p-40 bg-zinc-100/50 dark:bg-white/5 rounded-full blur-[100px] pointer-events-none" />

                    <div className="flex flex-col sm:flex-row items-center justify-between p-10 border-b border-zinc-100 dark:border-white/5 bg-white/50 dark:bg-white/[0.02] backdrop-blur-md z-20 relative gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-[20px] bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 shadow-xl ring-1 ring-zinc-200 dark:ring-white/10">
                                <ClipboardList className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter leading-none mb-1">Ficha de Anamnese</h3>
                                <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] leading-none">Documento Digital v4.0 • NeuroNex</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <AnimatePresence mode="wait">
                                {saveStatus === 'saving' && (
                                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-3 bg-zinc-50 dark:bg-white/5 px-5 py-2.5 rounded-full border border-zinc-100 dark:border-white/5 shadow-sm">
                                        <Loader2 className="w-4 h-4 animate-spin" /> SALVANDO...
                                    </motion.div>
                                )}
                                {saveStatus === 'saved' && (
                                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-white flex items-center gap-3 bg-zinc-100 dark:bg-white/10 px-5 py-2.5 rounded-full border border-zinc-200 dark:border-white/5 shadow-lg">
                                        <Check className="w-4 h-4" /> ATUALIZADO
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400 transition-all border border-zinc-100 dark:border-white/10 shadow-sm">
                                        <MoreVertical className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-72 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-3xl border-zinc-200 dark:border-white/10 p-3 rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] ring-1 ring-black/5 dark:ring-white/5">
                                    <div className="px-4 py-3 text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-1">Ações do Documento</div>
                                    <DropdownMenuItem onClick={handleDownloadPDF} className="gap-4 rounded-2xl cursor-pointer text-zinc-700 dark:text-zinc-300 text-[11px] font-black uppercase tracking-widest py-4 px-5 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all">
                                        <div className="p-2 rounded-xl bg-zinc-50 dark:bg-white/10"><FileDown className="h-4 w-4" /></div> Baixar PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleSendEmail} disabled={isSending} className="gap-4 rounded-2xl cursor-pointer text-zinc-700 dark:text-zinc-300 text-[11px] font-black uppercase tracking-widest py-4 px-5 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all">
                                        <div className="p-2 rounded-xl bg-zinc-50 dark:bg-white/10">
                                            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                                        </div> Enviar por E-mail
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleGenerateLink} className="gap-4 rounded-2xl cursor-pointer text-zinc-700 dark:text-zinc-300 text-[11px] font-black uppercase tracking-widest py-4 px-5 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all">
                                        <div className="p-2 rounded-xl bg-zinc-50 dark:bg-white/10"><ClipboardList className="h-4 w-4" /></div> Enviar ao paciente
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-zinc-100 dark:bg-white/5 my-3 mx-2" />
                                    <DropdownMenuItem
                                        onClick={() => {
                                            if (onChangeTemplate) {
                                                onChangeTemplate();
                                            } else {
                                                setConfirmDeleteOpen(true);
                                            }
                                        }}
                                        className="gap-4 rounded-2xl cursor-pointer text-zinc-600 dark:text-zinc-400 text-[11px] font-black uppercase tracking-widest py-4 px-5 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all"
                                    >
                                        <div className="p-2 rounded-xl bg-zinc-50 dark:bg-white/10"><RefreshCcw className="h-4 w-4" /></div> Trocar Modelo
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => { setConfirmDeleteOpen(true); }}
                                        className="gap-4 rounded-2xl cursor-pointer text-rose-500 text-[11px] font-black uppercase tracking-widest py-4 px-5 hover:bg-rose-500/5 transition-all"
                                    >
                                        <div className="p-2 rounded-xl bg-rose-500/10"><Trash2 className="h-4 w-4" /></div> Excluir Modelo
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-10 sm:p-16 relative z-10 scroll-smooth">
                        <div className="max-w-5xl mx-auto space-y-16">
                            {data.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-100px" }}
                                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: idx * 0.05 }}
                                    className="group/item"
                                >
                                    {item.isSection ? (
                                        <div className="relative pt-12 pb-8 mb-4 first:pt-0">
                                            <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-zinc-100 dark:via-white/10 to-transparent pointer-events-none" />
                                            <div className="relative z-10 flex justify-center">
                                                <div className="bg-white dark:bg-zinc-950 px-12 py-3 border border-zinc-200 dark:border-white/10 rounded-full shadow-xl ring-4 ring-zinc-50 dark:ring-black/20">
                                                    <AutoSaveField
                                                        type="question"
                                                        initialValue={item.question}
                                                        onSave={(val) => handleUpdate(idx, 'question', val)}
                                                        className="!text-[12px] !text-zinc-900 dark:!text-white !uppercase !tracking-[0.4em] font-black text-center"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative p-10 md:p-12 rounded-[40px] bg-zinc-50/40 dark:bg-white/[0.01] border border-zinc-100 dark:border-white/[0.04] hover:border-zinc-300 dark:hover:border-white/10 hover:bg-white dark:hover:bg-white/[0.03] transition-all duration-700 group-hover/item:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] group-hover/item:-translate-y-2">
                                            <div className="absolute top-0 right-0 p-24 bg-zinc-900/5 dark:bg-white/5 rounded-full blur-[48px] opacity-0 group-hover/item:opacity-100 transition-opacity duration-700" />
                                            <div className="mb-6 relative z-10">
                                                <AutoSaveField
                                                    type="question"
                                                    initialValue={item.question}
                                                    onSave={(val) => handleUpdate(idx, 'question', val)}
                                                    className="!text-[10px] !font-black !text-zinc-400 dark:!text-zinc-500 !tracking-[0.3em] !uppercase transition-colors group-hover/item:text-zinc-900 dark:group-hover/item:text-white"
                                                />
                                            </div>
                                            <div className="relative z-10">
                                                <AutoSaveField
                                                    type="answer"
                                                    initialValue={item.answer}
                                                    onSave={(val) => handleUpdate(idx, 'answer', val)}
                                                    className="!text-lg md:text-xl !font-medium !text-zinc-900 dark:!text-zinc-200 !leading-relaxed"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                            <div className="h-60" />
                        </div>
                    </div>
                </motion.div>
            </div>

            <AnimatePresence>
                {linkModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xl p-4 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-md"
                        >
                            <GlassCard className="p-8 relative shadow-[0_48px_96px_-24px_rgba(0,0,0,0.4)] border-white/10 bg-black/90 dark:bg-zinc-950/90 rounded-[40px] text-center">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setLinkModalOpen(false)}
                                    className="absolute top-6 right-6 text-zinc-500 hover:text-white rounded-xl h-10 w-10 bg-white/5 hover:bg-white/10 transition-all"
                                >
                                    <X className="h-5 w-5" />
                                </Button>

                                <div className="flex flex-col items-center gap-6">
                                    <div className="w-16 h-16 rounded-[24px] bg-white dark:bg-white text-zinc-900 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.15)]">
                                        <ClipboardList className="h-8 w-8" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black text-white tracking-tight leading-none">Portal Ativado</h3>
                                        <p className="text-sm text-zinc-400 max-w-[280px] mx-auto leading-relaxed font-medium">
                                            O link de preenchimento foi gerado com sucesso.
                                        </p>
                                    </div>

                                    <div className="w-full space-y-6">
                                        <div className="space-y-2 text-left">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 block">Link de Acesso Único</label>
                                            <div className="flex gap-2">
                                                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-zinc-300 truncate font-mono tracking-wider">
                                                    {`${window.location.origin}/anamnese-externa/${anamnesisId}`}
                                                </div>
                                                <Button size="icon" className="h-11 w-11 shrink-0 rounded-xl bg-white text-zinc-900 hover:scale-105 active:scale-95 transition-all shadow-xl" onClick={() => copyToClipboard(`${window.location.origin}/anamnese-externa/${anamnesisId}`)}>
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-left">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 block">Código de Segurança</label>
                                            <div className="flex gap-2">
                                                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-2xl font-black tracking-[0.4em] text-center text-white tabular-nums">
                                                    {publicToken || <Loader2 className="h-6 w-6 animate-spin mx-auto text-white" />}
                                                </div>
                                                <Button size="icon" className="h-11 w-11 shrink-0 rounded-xl bg-white text-zinc-900 hover:scale-105 active:scale-95 transition-all shadow-xl" onClick={() => copyToClipboard(publicToken || "")}>
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3 w-full pt-2">
                                        <Button className="w-full h-14 bg-white text-zinc-900 hover:bg-zinc-100 rounded-[20px] font-black uppercase tracking-[0.15em] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all text-[10px]" onClick={() => {
                                            const text = `Olá! Segue o link para preenchimento da sua ficha de anamnese:\n\nLink: ${window.location.origin}/anamnese-externa/${anamnesisId}\nCódigo: ${publicToken}\n\nPor favor, preencha assim que possível.`;
                                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                                        }}>
                                            <MessageCircle className="h-4 w-4 mr-3" /> WhatsApp
                                        </Button>
                                        <Button variant="ghost" className="w-full h-11 text-zinc-400 hover:text-white rounded-[18px] font-bold uppercase tracking-widest text-[9px]" onClick={() => setLinkModalOpen(false)}>
                                            Fechar Gerenciador
                                        </Button>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {confirmDeleteOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-xl p-4 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-xs"
                        >
                            <GlassCard className="p-8 relative flex flex-col items-center text-center gap-6 shadow-[0_48px_96px_-24px_rgba(0,0,0,0.4)] border-white/10 bg-black/90 dark:bg-zinc-950/90 rounded-[40px]">
                                <div className="w-16 h-16 rounded-[24px] bg-white text-zinc-900 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                                    <Trash2 className="h-8 w-8" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-white tracking-tighter leading-none">
                                        Excluir Modelo?
                                    </h3>
                                    <p className="text-sm text-zinc-400 leading-relaxed font-medium max-w-[240px]">
                                        O modelo e todas as respostas preenchidas serão removidos permanentemente. Você poderá escolher um novo template ou importar um documento.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-3 w-full">
                                    <Button
                                        className="w-full h-14 bg-white text-zinc-900 hover:bg-zinc-100 rounded-[20px] font-black uppercase tracking-[0.15em] shadow-2xl transition-all text-[10px]"
                                        onClick={handleDelete}
                                    >
                                        Confirmar Exclusão
                                    </Button>
                                    <Button variant="ghost" className="w-full h-11 text-zinc-400 hover:text-white rounded-[18px] font-bold uppercase tracking-widest text-[9px]" onClick={() => setConfirmDeleteOpen(false)}>
                                        Manter
                                    </Button>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

const MessageCircle = ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /><path d="M8 12h.01" /><path d="M12 12h.01" /><path d="M16 12h.01" /></svg>
);