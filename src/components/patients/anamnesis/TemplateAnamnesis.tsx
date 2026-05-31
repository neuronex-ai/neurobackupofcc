import { useState } from "react";
import { Baby, User, UserCheck, ArrowLeft, Info, Loader2, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/GlassCard";

interface TemplateAnamnesisProps {
    onBack: () => void;
    onSuccess?: () => void;
}

const TEMPLATES = [
    {
        id: 'infantil',
        label: 'Anamnese Infantil',
        icon: Baby,
        description: 'Focada no desenvolvimento, gestação, parto, histórico escolar e dinmica familiar.',
        color: 'from-zinc-500/10 to-zinc-700/10',
        borderColor: 'border-zinc-500/20',
        iconColor: 'text-zinc-700 dark:text-zinc-300',
        contentProfile: { type: 'infantil' },
        sections: [
            {
                title: 'Identificação',
                fields: ['Nome', 'Apelido', 'Data de Nascimento', 'Idade', 'Sexo', 'Naturalidade', 'Religião', 'Escolaridade', 'Endereço', 'Telefones']
            },
            {
                title: 'Filiação',
                fields: ['Pai (Nome, Profissão, Idade)', 'Mãe (Nome, Profissão, Idade)', 'Cuidador (Nome, Vínculo)', 'Telefones de contato']
            },
            {
                title: 'Motivo da Consulta',
                fields: ['Queixa principal', 'Histórico da queixa', 'Acompanhamento de saúde atual?', 'Fármacos em uso', 'Alergias']
            },
            {
                title: 'Concepção, Gestação e Parto',
                fields: ['Informações da concepção (planejada, reações)', 'Histórico da gestação (pré-natal, intercorrências)', 'Parto (tipo, complicações)', 'Intercorrências neonatais (incubadora, choro)']
            },
            {
                title: 'Desenvolvimento',
                fields: ['Controle cervical (pescoço)', 'Sentar', 'Andar', 'Fala', 'Controle de esfíncteres (anal/vesical)', 'Histórico de doenças/internações']
            },
            {
                title: 'Dinmica Familiar',
                fields: ['Com quem mora', 'Relacionamento dos pais', 'Relacionamento com a criança', 'Relacionamento com irmãos', 'Histórico familiar de transtornos']
            },
            {
                title: 'Vida Acadêmica',
                fields: ['Escola/Série', 'Repetência', 'Relacionamento com colegas', 'Relacionamento com professores', 'Habilidades/Déficits acadêmicos']
            },
            {
                title: 'Rotina e Hábitos',
                fields: ['Sono (horários, qualidade)', 'Alimentação (hábitos, histórico)', 'Lazer e Brincadeiras', 'Habilidades sociais']
            }
        ]
    },
    {
        id: 'adolescente',
        label: 'Anamnese Adolescente',
        icon: User,
        description: 'Abrange desenvolvimento, sexualidade, saúde, contexto escolar e vida social.',
        color: 'from-zinc-500/10 to-zinc-700/10',
        borderColor: 'border-zinc-500/20',
        iconColor: 'text-zinc-700 dark:text-zinc-300',
        sections: [
            {
                title: 'Identificação',
                fields: ['Nome', 'Idade', 'Data de Nascimento', 'Escolaridade', 'Mora com quem', 'Filiação (Pai/Mãe)']
            },
            {
                title: 'Motivo da Consulta',
                fields: ['Queixa principal', 'Histórico da queixa', 'Sintomas atuais']
            },
            {
                title: 'Histórico de Desenvolvimento',
                fields: ['Gestação (intercorrências)', 'Parto', 'Desenvolvimento motor/fala', 'Sono (qualidade, distúrbios)', 'Controle de esfíncteres']
            },
            {
                title: 'Sexualidade',
                fields: ['Curiosidade sexual', 'Orientação/Educação sexual', 'Menarca/Poluções noturnas', 'Sintomas associados']
            },
            {
                title: 'Histórico Médico',
                fields: ['Doenças da infncia', 'Infeções/Alergias', 'Traumatismos/Convulsões', 'Dores de cabeça/Enxaquecas', 'Medicações em uso']
            },
            {
                title: 'Sistemas e Saúde Geral',
                fields: ['Sistema Uro-genital', 'Sistema Endócrino', 'Acompanhamentos (Neuro, Psi)', 'Histórico familiar de doenças']
            },
            {
                title: 'Ambiente Familiar e Social',
                fields: ['Relacionamento paterno/materno', 'Relacionamento com irmãos/outros', 'Vida social/Amigos', 'Lazer/Interesses']
            },
            {
                title: 'Escolaridade',
                fields: ['Desempenho atual', 'Dificuldades específicas', 'Relacionamento escolar', 'Comportamento']
            }
        ]
    },
    {
        id: 'adulto_idoso',
        label: 'Adulto e Idoso',
        icon: UserCheck,
        description: 'Foco em histórico clínico, profissional, relacionamentos, autonomia e saúde mental.',
        color: 'from-zinc-500/10 to-zinc-700/10',
        borderColor: 'border-zinc-500/20',
        iconColor: 'text-zinc-700 dark:text-zinc-300',
        sections: [
            {
                title: 'Identificação',
                fields: ['Nome', 'Idade', 'Estado Civil', 'Profissão', 'Escolaridade', 'Contatos']
            },
            {
                title: 'Queixa Principal',
                fields: ['Motivo da busca', 'Tempo de queixa', 'Histórico do problema atual', 'Tratamentos anteriores']
            },
            {
                title: 'Histórico Clínico',
                fields: ['Histórico Psiquiátrico/Psicológico', 'Medicações em uso', 'Doenças prévias/atuais', 'Histórico familiar (físico/mental)']
            },
            {
                title: 'Histórico Social e Familiar',
                fields: ['Composição familiar', 'Relacionamento familiar', 'Rede de apoio', 'Vida social/afetiva']
            },
            {
                title: 'Histórico Profissional',
                fields: ['Satisfação profissional', 'Relacionamentos no trabalho', 'Carreira/Aposentadoria']
            },
            {
                title: 'Hábitos e Estilo de Vida',
                fields: ['Qualidade do sono', 'Alimentação', 'Atividade física', 'Uso de substncias']
            },
            {
                title: 'Avaliação Mental (Obs.)',
                fields: ['Aparência geral', 'Humor e afeto', 'Pensamento/Linguagem', 'Cognição/Memória', 'Insight']
            },
            {
                title: 'Conclusão',
                fields: ['Hipóteses diagnósticas', 'Plano terapêutico', 'Observações finais']
            }
        ]
    },
] as const;

export function TemplateAnamnesis({ onBack, onSuccess }: TemplateAnamnesisProps) {
    const { id: patientId } = useParams<{ id: string }>();
    const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[number] | null>(null);
    const [isSaving, setIsSaving] = useState(false);


    const handleConfirmTemplate = async () => {
        if (!selectedTemplate || !patientId) return;

        setIsSaving(true);
        try {
            const structuredContent: any[] = [];

            selectedTemplate.sections.forEach(section => {
                structuredContent.push({
                    question: section.title,
                    answer: "",
                    isSection: true
                });

                section.fields.forEach(field => {
                    structuredContent.push({
                        question: field,
                        answer: ""
                    });
                });
            });

            // Strategy: Try to update existing record first, then insert if none exists.
            // This avoids UNIQUE constraint violations that occur when DELETE is silently
            // blocked by RLS policies.
            const { data: existingRecords } = await supabase
                .from('patient_anamneses')
                .select('id')
                .eq('patient_id', patientId);

            if (existingRecords && existingRecords.length > 0) {
                // Update the first existing record with new content
                const primaryRecord = existingRecords[0];
                const { error: updateError } = await supabase
                    .from('patient_anamneses')
                    .update({
                        type: 'template',
                        content: structuredContent
                    })
                    .eq('id', primaryRecord.id);

                if (updateError) throw updateError;

                // Clean up any duplicate records (best-effort, ignore errors)
                if (existingRecords.length > 1) {
                    for (let i = 1; i < existingRecords.length; i++) {
                        await supabase
                            .from('patient_anamneses')
                            .delete()
                            .eq('id', existingRecords[i].id)
                            .then(/* ignore result */);
                    }
                }
            } else {
                // No existing record — insert a new one
                const { error: insertError } = await supabase
                    .from('patient_anamneses')
                    .insert({
                        patient_id: patientId,
                        type: 'template',
                        content: structuredContent
                    });
                if (insertError) throw insertError;
            }

            toast.success("Modelo aplicado com sucesso!");
            if (onSuccess) onSuccess();

        } catch (error) {
            console.error(error);
            toast.error("Erro ao aplicar modelo.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="w-full h-full relative selection:bg-zinc-900/10 dark:selection:bg-white/10">
            <AnimatePresence mode="wait">
                {!selectedTemplate ? (
                    <motion.div
                        key="selection-grid"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="max-w-6xl mx-auto px-6 py-12"
                    >
                        <div className="flex items-center gap-6 mb-16">
                            <Button
                                onClick={onBack}
                                variant="ghost"
                                size="icon"
                                className="h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 transition-all"
                            >
                                <ArrowLeft className="w-5 h-5 text-zinc-500" />
                            </Button>
                            <div>
                                <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight leading-none mb-2">Modelos NeuroNex</h2>
                                <p className="text-sm text-zinc-500 font-bold uppercase tracking-widest leading-none">Selecione uma estrutura para iniciar</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {TEMPLATES.map((template) => (
                                <GlassCard
                                    key={template.id}
                                    className="cursor-pointer group hover:-translate-y-3 transition-all duration-700 rounded-[40px] border-zinc-200/50 dark:border-white/[0.05] overflow-hidden"
                                    onClick={() => setSelectedTemplate(template)}
                                >
                                    <div className="absolute top-0 right-0 p-32 bg-zinc-900/5 dark:bg-white/5 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                    <div className="flex flex-col h-full relative z-10 p-10 space-y-8">
                                        <div className="w-20 h-20 rounded-3xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 shadow-2xl group-hover:scale-110 transition-transform duration-700">
                                            <template.icon className="w-10 h-10" />
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight">
                                                {template.label}
                                            </h3>
                                            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
                                                {template.description}
                                            </p>
                                        </div>

                                        <div className="pt-8 mt-auto border-t border-zinc-100 dark:border-white/5 flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">Ver Estrutura</span>
                                            <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-zinc-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-zinc-900 transition-all duration-500">
                                                <ChevronRight className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="confirmation-modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/40 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 40, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 40, opacity: 0 }}
                            transition={{ type: "spring", duration: 0.8, bounce: 0.1 }}
                            className="w-full h-full max-w-7xl bg-white dark:bg-[#050505] border border-zinc-200 dark:border-white/5 rounded-[48px] shadow-[0_64px_128px_-32px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col relative"
                        >
                            <div className="absolute top-0 right-0 p-64 bg-zinc-100/50 dark:bg-white/5 rounded-full blur-[120px] pointer-events-none" />

                            {/* Modal Header - Reduced height and added Confirm button */}
                            <div className="p-6 md:p-8 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between relative z-10 shrink-0">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 shadow-xl">
                                        <selectedTemplate.icon className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none mb-2">
                                            {selectedTemplate.label}
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 bg-zinc-100 dark:bg-white/5 px-3 py-1 rounded-lg border border-zinc-200/50 dark:border-white/5">
                                                Visualização
                                            </span>
                                            <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest">
                                                {selectedTemplate.sections.length} Seções
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setSelectedTemplate(null)}
                                        className="h-12 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleConfirmTemplate}
                                        disabled={isSaving}
                                        className="h-12 px-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl text-[10px] gap-2"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                        Confirmar Modelo
                                    </Button>
                                </div>
                            </div>

                            {/* Modal Content - Preview */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 md:p-14 relative z-10 min-h-[500px]">
                                <div className="max-w-5xl mx-auto space-y-16">
                                    <div className="bg-zinc-50 dark:bg-white/[0.01] border border-zinc-200 dark:border-white/[0.04] rounded-[32px] p-8 md:p-10 flex gap-6 md:gap-8 backdrop-blur-sm relative group overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-zinc-100/50 dark:from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                        <div className="w-14 h-14 shrink-0 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 relative z-10">
                                            <Info className="w-7 h-7" />
                                        </div>
                                        <div className="relative z-10">
                                            <p className="text-lg font-black text-zinc-900 dark:text-white tracking-tight mb-2">
                                                Guia do Modelo
                                            </p>
                                            <p className="text-base text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                                                {selectedTemplate.description} Esta estrutura foi validada por especialistas e contém todos os campos necessários para uma avaliação completa.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-20">
                                        {selectedTemplate.sections.map((section, idx) => (
                                            <div key={idx} className="space-y-8">
                                                <div className="flex items-center gap-6">
                                                    <span className="text-5xl font-black text-zinc-100 dark:text-white/5 tracking-tighter tabular-nums">
                                                        {(idx + 1).toString().padStart(2, '0')}
                                                    </span>
                                                    <h4 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                                                        {section.title}
                                                    </h4>
                                                    <div className="flex-1 h-px bg-gradient-to-r from-zinc-100 dark:from-white/5 to-transparent" />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {section.fields.map((field, fIdx) => (
                                                        <div key={fIdx} className="group relative bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-[24px] p-6 hover:bg-zinc-50 dark:hover:bg-white/5 hover:border-zinc-300 dark:hover:border-white/10 transition-all duration-500">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-2 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 group-hover:bg-zinc-900 dark:group-hover:bg-white transition-colors" />
                                                                <span className="text-sm font-bold text-zinc-600 dark:text-zinc-300">
                                                                    {field}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="h-20" />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-10 md:p-12 border-t border-zinc-100 dark:border-white/5 bg-transparent flex justify-end gap-6 relative z-10 shrink-0">
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedTemplate(null)}
                                    className="h-20 px-12 rounded-[24px] font-black uppercase tracking-widest text-zinc-500 border-zinc-200 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all text-xs"
                                >
                                    Voltar
                                </Button>
                                <Button
                                    onClick={handleConfirmTemplate}
                                    disabled={isSaving}
                                    className="h-20 px-16 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-[24px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl text-xs gap-4"
                                >
                                    {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" />}
                                    Aplicar Modelo
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}