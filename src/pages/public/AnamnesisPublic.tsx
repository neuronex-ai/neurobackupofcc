import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight, Clock, Loader2, Lock, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

interface ExtractedItem {
    question: string;
    answer: string;
    isSection?: boolean;
}

export default function AnamnesisPublic() {
    const { id } = useParams<{ id: string }>();
    const [token, setToken] = useState("");
    const [status, setStatus] = useState<'input' | 'verifying' | 'valid'>('input');
    const [data, setData] = useState<ExtractedItem[]>([]);
    const [patientName, setPatientName] = useState("");
    const [patientId, setPatientId] = useState<string | null>(null);
    const [therapistId, setTherapistId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isNotifying, setIsNotifying] = useState(false);

    const handleVerify = async () => {
        if (token.length !== 5) {
            toast.error("O código deve ter 5 dígitos.");
            return;
        }
        setStatus('verifying');

        try {
            const { data: result, error } = await supabase.rpc('get_public_anamnesis', {
                p_id: id,
                p_token: token
            });

            if (error) throw error;
            if (!result) throw new Error("Acesso inválido.");

            const record = result as any;

            if (record.patient_name) setPatientName(record.patient_name);
            if (record.patient_id) setPatientId(record.patient_id);
            if (record.user_id) setTherapistId(record.user_id);

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
                    items = record.content as any;
                }
            }
            setData(items);
            setStatus('valid');
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Erro ao validar acesso.");
            setStatus('input');
        }
    };

    const handleUpdate = (index: number, val: string) => {
        const newData = [...data];
        newData[index].answer = val;
        setData(newData);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { error } = await supabase.rpc('update_public_anamnesis', {
                p_id: id,
                p_token: token,
                p_content: data
            });

            if (error) throw error;
            toast.success("Anamnese salva com sucesso!");
        } catch (err) {
            console.error(err);
            toast.error("Erro ao salvar.");
        } finally {
            setIsSaving(false);
        }
    };

    const progress = useMemo(() => {
        if (!data.length) return 0;
        const questions = data.filter(i => !i.isSection);
        const answered = questions.filter(i => i.answer && i.answer.trim().length > 0).length;
        return Math.round((answered / questions.length) * 100);
    }, [data]);

    const handleFinishLater = async () => {
        if (!therapistId) {
            toast.error("Erro ao identificar o profissional para notificação.");
            return;
        }

        setIsNotifying(true);
        try {
            await supabase.rpc('update_public_anamnesis', {
                p_id: id,
                p_token: token,
                p_content: data
            });

            const { error: notifyError } = await supabase.from('notifications').insert({
                user_id: therapistId,
                title: "Preenchimento Parcial de Anamnese",
                message: `O paciente ${patientName || 'X'} preencheu ${progress}% da anamnese e salvou para continuar mais tarde.`,
                type: 'anamnesis_update',
                action_url: `/pacientes/${patientId}?tab=anamnesis`,
                priority: 'high'
            });

            if (notifyError) throw notifyError;

            toast.success("Progresso salvo e profissional notificado!", {
                description: "Você pode fechar esta página e voltar mais tarde com o mesmo código."
            });
        } catch (err) {
            console.error(err);
            toast.error("Erro ao processar sua solicitação.");
        } finally {
            setIsNotifying(false);
        }
    };

    if (status === 'input' || status === 'verifying') {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-white dark:bg-[#050505] selection:bg-zinc-200 dark:selection:bg-zinc-800">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-md"
                >
                    <GlassCard className="p-10 flex flex-col items-center text-center gap-8 border-zinc-200/50 dark:border-white/5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] bg-white/70 dark:bg-black/40 backdrop-blur-3xl rounded-[40px] relative overflow-hidden group">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-zinc-900/5 dark:via-white/5 to-transparent" />
                        
                        <div className="mx-auto w-20 h-20 rounded-3xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 shadow-2xl shadow-zinc-900/20 dark:shadow-white/10 ring-8 ring-zinc-50 dark:ring-white/[0.02] transform transition-transform group-hover:scale-110 duration-700">
                            <Lock className="h-8 w-8" />
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Acesso Restrito</h1>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-[280px] leading-relaxed font-medium">
                                Digite o código de 5 dígitos fornecido pelo seu psicólogo para acessar a ficha.
                            </p>
                        </div>

                        <div className="w-full space-y-4">
                            <div className="relative group/input">
                                <Input
                                    value={token}
                                    onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 5))}
                                    className="text-center text-3xl font-black tracking-[0.5em] h-20 bg-zinc-50 dark:bg-white/[0.03] border-zinc-200 dark:border-white/10 rounded-2xl focus:ring-0 focus:border-zinc-900 dark:focus:border-white transition-all duration-500 placeholder:text-zinc-200 dark:placeholder:text-white/5"
                                    placeholder="00000"
                                    autoFocus
                                />
                                <div className="absolute inset-0 rounded-2xl ring-1 ring-zinc-900/5 dark:ring-white/5 pointer-events-none group-focus-within/input:ring-zinc-900/20 dark:group-focus-within/input:ring-white/20 transition-all duration-500" />
                            </div>

                            <Button
                                onClick={handleVerify}
                                disabled={status === 'verifying' || token.length !== 5}
                                className="w-full h-16 text-sm font-black uppercase tracking-widest bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 active:scale-[0.98] gap-3"
                            >
                                {status === 'verifying' ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        Acessar Ficha
                                        <ChevronRight className="h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>

                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 dark:text-white/10">Protegido por Criptografia de Ponta</p>
                    </GlassCard>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-[#f8f8f8] dark:bg-[#050505] selection:bg-zinc-200 dark:selection:bg-zinc-800 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="bg-white/80 dark:bg-black/60 border-b border-zinc-200/50 dark:border-white/5 z-50 backdrop-blur-2xl">
                <div className="max-w-6xl mx-auto px-6 sm:px-10 h-24 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                        <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-white/5 items-center justify-center text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/10">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] leading-none mb-1.5">Ficha de Anamnese</h2>
                            {patientName && <p className="text-lg font-black text-zinc-900 dark:text-white tracking-tight leading-none">Paciente: {patientName}</p>}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={handleFinishLater}
                            disabled={isNotifying}
                            className="hidden md:flex h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-all border border-transparent hover:border-zinc-200 dark:hover:border-white/10 gap-2"
                        >
                            {isNotifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock className="h-3.5 w-3.5" />}
                            Finalizar mais tarde
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-zinc-900/20 dark:shadow-white/10 hover:scale-[1.02] active:scale-[0.98] transition-all gap-2"
                        >
                            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            Salvar Ficha
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-hidden flex justify-center p-4 sm:p-10 relative">
                <div className="w-full max-w-4xl h-full bg-white dark:bg-white/[0.02] rounded-[40px] border border-zinc-200/50 dark:border-white/[0.05] shadow-2xl relative overflow-y-auto custom-scrollbar p-8 sm:p-12">
                    <div className="absolute top-0 right-0 p-40 bg-zinc-100/50 dark:bg-white/5 rounded-full blur-[100px] pointer-events-none" />
                    
                    <div className="max-w-3xl mx-auto space-y-12 relative z-10">
                        {data.map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                            >
                                {item.isSection ? (
                                    <div className="relative pt-12 pb-6">
                                        <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-white/10 to-transparent" />
                                        <div className="relative z-10 flex justify-center">
                                            <span className="bg-white dark:bg-zinc-900 px-10 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 dark:text-zinc-500 rounded-full py-2 border border-zinc-100 dark:border-white/5 shadow-sm">
                                                {item.question}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="group relative bg-zinc-50/30 dark:bg-white/[0.01] p-8 sm:p-10 rounded-[40px] border border-zinc-200/50 dark:border-white/[0.05] shadow-sm hover:shadow-xl transition-all duration-700 hover:-translate-y-1">
                                        <div className="absolute top-0 right-0 p-20 bg-zinc-900/5 dark:bg-white/5 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                        
                                        <label className="block text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-6 relative z-10 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors duration-500">
                                            {item.question}
                                        </label>
                                        
                                        <textarea
                                            value={item.answer}
                                            onChange={(e) => handleUpdate(idx, e.target.value)}
                                            placeholder="Digite sua resposta aqui..."
                                            className="w-full bg-white dark:bg-black/40 border border-zinc-200/50 dark:border-white/10 rounded-[24px] p-6 text-base md:text-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-800 focus:outline-none focus:ring-4 focus:ring-zinc-900/5 dark:focus:ring-white/5 focus:border-zinc-300 dark:focus:border-white/20 min-h-[160px] resize-none transition-all duration-500 relative z-10 shadow-inner"
                                        />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                        
                        <div className="pt-20 pb-32 flex flex-col items-center text-center gap-8">
                            <div className="w-px h-20 bg-gradient-to-b from-zinc-200 dark:from-white/10 to-transparent" />
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Tudo pronto?</h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Certifique-se de salvar suas respostas antes de sair.</p>
                            </div>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 h-16 px-12 rounded-[24px] text-xs font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all"
                            >
                                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Finalizar e Salvar"}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Vertical Progress Bar */}
                <div className="hidden lg:flex flex-col items-center gap-4 sticky top-0 h-full py-20 px-10">
                    <div className="w-1.5 flex-1 bg-zinc-200 dark:bg-white/5 rounded-full overflow-hidden relative">
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${progress}%` }}
                            transition={{ duration: 1, ease: "circOut" }}
                            className="absolute bottom-0 inset-x-0 bg-zinc-900 dark:bg-white shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                        />
                    </div>
                    <div className="flex flex-col items-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">Progresso</p>
                        <p className="text-2xl font-black text-zinc-900 dark:text-white tabular-nums">{progress}%</p>
                    </div>
                </div>
            </main>

            {/* Mobile Progress Bar */}
            <div className="lg:hidden fixed bottom-0 inset-x-0 h-1.5 bg-zinc-200 dark:bg-white/5 z-50">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-zinc-900 dark:bg-white"
                />
            </div>
        </div>
    );
}