"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
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

const AutoSaveField = memo(function AutoSaveField({
    initialValue,
    type,
    onSave,
    className
}: {
    initialValue: string;
    type: 'question' | 'answer';
    onSave: (val: string) => void;
    className?: string;
}: {
    initialValue: string;
    type: 'question' | 'answer';
    onSave: (val: string) => void;
    className?: string;
}) {
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
                    "min-h-[132px] w-full resize-none overflow-hidden rounded-2xl border-border/70 bg-muted/45 p-5 text-[15px] leading-relaxed text-foreground transition-colors focus:ring-2 focus:ring-foreground/10",
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
                "group/field -mx-2 cursor-text rounded-xl px-2 transition-colors duration-200 hover:bg-muted/45",
                type === 'question' ? "py-1" : "py-2 min-h-[2.5rem]"
            )}
        >
            <p className={cn(
                type === 'question'
                    ? "text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 group-hover/field:text-zinc-900 dark:group-hover/field:text-zinc-300 transition-colors"
                    : "whitespace-pre-wrap break-words text-[15px] font-medium leading-relaxed text-foreground/88",
                className
            )}>
                {value || <span className="opacity-50 italic font-normal text-zinc-500">Clique para adicionar resposta...</span>}
            </p>
        </div>
    );
});

const AnamnesisEntry = memo(function AnamnesisEntry({
    item,
    index,
    onUpdate,
}: {
    item: ExtractedItem;
    index: number;
    onUpdate: (index: number, field: 'question' | 'answer', value: string) => void;
}) {
    if (item.isSection) {
        return (
            <div
                className="relative mb-2 pb-5 pt-8 first:pt-0"
                style={{ contentVisibility: "auto", containIntrinsicSize: "72px" }}
            >
                <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                <div className="relative z-10 flex justify-center">
                    <div className="rounded-full border border-border/70 bg-card px-8 py-2 shadow-sm">
                        <AutoSaveField
                            type="question"
                            initialValue={item.question}
                            onSave={(value) => onUpdate(index, 'question', value)}
                            className="!text-center !text-[11px] !font-bold !uppercase !tracking-[0.24em] !text-foreground"
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="group/item relative rounded-[22px] border border-border/65 bg-card/48 p-6 shadow-[0_14px_38px_-34px_rgba(15,23,42,0.45)] transition-colors duration-200 hover:border-border hover:bg-card/72 dark:bg-white/[0.025] dark:hover:bg-white/[0.04] md:p-7"
            style={{ contentVisibility: "auto", containIntrinsicSize: "190px" }}
        >
            <div className="relative z-10 mb-4">
                <AutoSaveField
                    type="question"
                    initialValue={item.question}
                    onSave={(value) => onUpdate(index, 'question', value)}
                    className="!text-[10px] !font-bold !uppercase !tracking-[0.2em] !text-muted-foreground"
                />
            </div>
            <div className="relative z-10">
                <AutoSaveField
                    type="answer"
                    initialValue={item.answer}
                    onSave={(value) => onUpdate(index, 'answer', value)}
                    className="!text-[15px] !font-medium !leading-relaxed !text-foreground/90"
                />
            </div>
        </div>
    );
});

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
    const saveStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
            const { data: records, error } = await supabase
                .from('patient_anamneses')
                .select('id, content, updated_at')
                .eq('patient_id', patientId)
                .order('updated_at', { ascending: false });

            if (error) throw error;

            const record = records?.find((candidate) => {
                const content = candidate.content as any;
                return (Array.isArray(content) && content.length > 0)
                    || Boolean(content && typeof content === 'object' && content.fields && Object.keys(content.fields).length > 0);
            });
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

    const saveToDb = useCallback(async (newData: ExtractedItem[]) => {
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
            if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
            saveStatusTimerRef.current = setTimeout(() => setSaveStatus('idle'), 1600);
        } catch (err) {
            console.error(err);
            toast.error("Erro ao salvar alteração");
            setSaveStatus('idle');
        }
    }, [anamnesisId]);

    const handleUpdate = useCallback((index: number, field: 'question' | 'answer', newValue: string) => {
        setData((currentData) => {
            const newData = currentData.map((item, itemIndex) => (
                itemIndex === index ? { ...item, [field]: newValue } : item
            ));
            void saveToDb(newData);
            return newData;
        });
    }, [saveToDb]);

    useEffect(() => () => {
        if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
    }, []);

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
        <div className="flex h-[calc(100vh-220px)] w-full flex-col items-center overflow-hidden px-1 pb-8">
            <div className="relative flex h-full w-full max-w-5xl flex-1 flex-col">

                <motion.div
                    initial={{ opacity: 0, scale: 0.98, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="group/doc-container relative flex h-full w-full flex-col overflow-hidden rounded-[26px] border border-border/70 bg-card/72 shadow-[0_20px_54px_-42px_rgba(15,23,42,0.6)] backdrop-blur-xl dark:bg-[#0b0c0e]/86 dark:shadow-[0_24px_58px_-42px_rgba(0,0,0,0.95)]"
                >
                    <div className="premium-noise pointer-events-none absolute inset-0 opacity-[0.018] dark:opacity-[0.026]" />

                    <div className="relative z-20 flex flex-col items-center justify-between gap-4 border-b border-border/60 bg-background/28 p-6 backdrop-blur-md sm:flex-row">
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-foreground text-background shadow-sm">
                                <ClipboardList className="h-4.5 w-4.5" />
                            </div>
                            <div>
                                <h3 className="mb-1 text-base font-bold leading-none tracking-tight text-foreground">Ficha de anamnese</h3>
                                <p className="text-[9px] font-bold uppercase tracking-[0.2em] leading-none text-muted-foreground">Documento clínico • NeuroNex</p>
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
                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl border border-border/70 bg-muted/45 text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground">
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

                    <div className="anamnesis-scroll-surface custom-scrollbar relative z-10 flex-1 overflow-y-auto overscroll-contain p-6 [scrollbar-gutter:stable] sm:p-8">
                        <div className="mx-auto max-w-4xl space-y-5">
                            {data.map((item, idx) => (
                                <AnamnesisEntry key={`${item.isSection ? "section" : "field"}-${idx}`} item={item} index={idx} onUpdate={handleUpdate} />
                            ))}
                            <div className="h-20" />
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
