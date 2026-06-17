"use client";

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import {
    Search, FileText, Hash, MessageSquare,
    Zap, Brain, Target, BookOpen, Clock,
    Plus, ChevronRight, FolderOpen,
    User, Users, ChevronDown, Loader2,
    Smile, TableProperties, Stethoscope, Mic,
    Link2, Sparkles
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/components/auth/SessionContextProvider';
import { usePatientsList } from '@/hooks/use-patients-list';
import { PremiumFileIcon } from '@/components/ui/PremiumFileIcons';
import { cn } from '@/lib/utils';

export type NodeType = 'start' | 'category' | 'action' | 'item' | 'logic' | 'quote' | 'document' | 'anamnesis' | 'somatic' | 'timeline' | 'mood' | 'table' | 'diagnostic' | 'transcription' | 'bridge';

interface SegundoCerebroProps {
    isOpen: boolean;
    onClose: () => void;
    onAddNode?: (type: NodeType, data?: any) => void;
}

interface FileItem {
    name: string;
    id: string;
    created_at: string;
    size: number;
    path: string;
    mimetype?: string;
}

const BUCKET_NAME = "files_psico";


const nodeCategories = [
    { id: 'item', label: 'Nota Genérica', icon: FileText, color: 'text-zinc-400', bg: 'bg-zinc-400/10' },
    { id: 'category', label: 'Categoria/Grupo', icon: Hash, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { id: 'action', label: 'Ação / Tarefa', icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { id: 'logic', label: 'Conclusão Lógica', icon: Brain, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { id: 'quote', label: 'Citação Paciente', icon: MessageSquare, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { id: 'somatic', label: 'Queixa Somática', icon: Zap, color: 'text-red-400', bg: 'bg-red-400/10' },
    { id: 'timeline', label: 'Evento Temporal', icon: Clock, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    { id: 'document', label: 'Anexo / Arquivo', icon: BookOpen, color: 'text-zinc-500', bg: 'bg-zinc-500/10' },
    { id: 'mood', label: 'Mapa de Humor', icon: Smile, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { id: 'table', label: 'Tabela Dinmica', icon: TableProperties, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { id: 'diagnostic', label: 'Hipótese Diagnóstica', icon: Stethoscope, color: 'text-red-500', bg: 'bg-red-500/10' },
    { id: 'transcription', label: 'Transcrição de Voz', icon: Mic, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { id: 'bridge', label: 'Ponte Terapêutica', icon: Link2, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
];

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export const SegundoCerebro = ({ isOpen, onClose, onAddNode }: SegundoCerebroProps) => {
    const { user } = useAuth();
    const userId = user?.id;
    const [searchTerm, setSearchTerm] = useState('');
    const [myNotes, setMyNotes] = useState<any[]>([]);
    const [isLoadingNotes, setIsLoadingNotes] = useState(false);

    // Files state
    const [personalFiles, setPersonalFiles] = useState<FileItem[]>([]);
    const [patientFilesMap, setPatientFilesMap] = useState<Record<string, FileItem[]>>({});
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    const [expandedPatient, setExpandedPatient] = useState<string | null>(null);
    const [filesSubTab, setFilesSubTab] = useState<'personal' | 'patients'>('personal');

    const { data: patients } = usePatientsList();

    useEffect(() => {
        if (isOpen) {
            fetchMyNotes();
            fetchFiles();
        }
    }, [isOpen]);

    const fetchMyNotes = async () => {
        setIsLoadingNotes(true);
        try {
            const { data, error } = await supabase
                .from('personal_notes')
                .select('id, title, content, created_at, tags')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setMyNotes(data || []);
        } catch (error) {
            console.error("Erro ao buscar notas:", error);
        } finally {
            setIsLoadingNotes(false);
        }
    };

    const fetchFiles = async () => {
        if (!userId) return;
        setIsLoadingFiles(true);
        try {
            // Fetch personal files
            const folderPath = `${userId}/personal`;
            const { data: pFiles, error: pError } = await supabase.storage
                .from(BUCKET_NAME)
                .list(folderPath, { limit: 200, sortBy: { column: "created_at", order: "desc" } });

            if (!pError && pFiles) {
                setPersonalFiles(
                    pFiles
                        .filter(item => item.name !== "" && item.name !== ".emptyFolderPlaceholder")
                        .map(item => ({
                            name: item.name,
                            id: item.id || item.name,
                            created_at: item.created_at,
                            size: item.metadata?.size || 0,
                            path: `${folderPath}/${item.name}`,
                            mimetype: item.metadata?.mimetype,
                        }))
                );
            }

            // Fetch patient files
            if (patients && patients.length > 0) {
                const result: Record<string, FileItem[]> = {};
                for (const patient of patients) {
                    const patientFolder = `${userId}/${patient.id}`;
                    try {
                        const { data } = await supabase.storage
                            .from(BUCKET_NAME)
                            .list(patientFolder, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
                        if (data && data.length > 0) {
                            const files = data
                                .filter(item => item.name !== "" && item.name !== ".emptyFolderPlaceholder")
                                .map(item => ({
                                    name: item.name,
                                    id: item.id || item.name,
                                    created_at: item.created_at,
                                    size: item.metadata?.size || 0,
                                    path: `${patientFolder}/${item.name}`,
                                    mimetype: item.metadata?.mimetype,
                                }));
                            if (files.length > 0) result[patient.id] = files;
                        }
                    } catch { }
                }
                setPatientFilesMap(result);
            }
        } catch (err) {
            console.error("Erro ao buscar arquivos:", err);
        } finally {
            setIsLoadingFiles(false);
        }
    };

    const onDragStart = (event: any, nodeType: NodeType, data?: any) => {
        if (!event.dataTransfer) return;
        event.dataTransfer.setData('application/reactflow/type', nodeType);
        if (data) {
            event.dataTransfer.setData('application/reactflow/data', JSON.stringify(data));
        }
        event.dataTransfer.effectAllowed = 'move';
    };

    const handleQuickAdd = (type: NodeType, data?: any) => {
        if (onAddNode) {
            onAddNode(type, data);
            onClose();
        }
    };

    const getFilePublicUrl = (path: string) => {
        const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
        return data?.publicUrl || '';
    };

    const getCleanFileName = (name: string) => {
        return name.replace(/^\d+_/, '');
    };

    const filteredCategories = nodeCategories.filter(c =>
        c.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredNotes = myNotes.filter(n =>
        (n.title || 'Sem título').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredPersonalFiles = personalFiles.filter(f =>
        getCleanFileName(f.name).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const patientsWithFiles = patients?.filter(p => patientFilesMap[p.id]) || [];
    const filteredPatients = patientsWithFiles.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl h-[85vh] bg-[#0A0A0B]/90 border border-white/5 backdrop-blur-3xl p-0 overflow-hidden flex flex-col rounded-[40px] shadow-2xl">
                {/* Premium Texture Overlay */}
                <div className="absolute inset-0 notes-retina-texture opacity-[0.18] pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

                <div className="flex-1 flex flex-col overflow-hidden relative">
                    <ScrollArea className="flex-1 h-full">
                        <DialogHeader className="px-10 pt-10 pb-4 relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shadow-2xl">
                                    <Brain className="h-5 w-5 text-white" />
                                </div>
                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-[0.3em] border-white/10 text-zinc-500 bg-white/[0.02] py-1">Segundo Cérebro</Badge>
                            </div>
                            <DialogTitle className="text-4xl font-black text-white tracking-tighter leading-tight">O que vamos mapear?</DialogTitle>
                            <DialogDescription className="text-zinc-500 font-bold text-[13px] tracking-tight">Arraste para o canvas ou clique para adicionar instantaneamente.</DialogDescription>
                        </DialogHeader>

                        <div className="px-10 mb-8 relative z-10">
                            <div className="relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-700 group-focus-within:text-primary transition-all duration-500" />
                                <Input
                                    placeholder="Pesquisar componentes, notas ou arquivos..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-white/[0.02] border-white/5 h-14 pl-14 rounded-[22px] text-white placeholder:text-zinc-800 focus:ring-2 focus:ring-primary/20 focus:bg-white/[0.04] transition-all duration-500 text-sm font-medium shadow-inner"
                                />
                            </div>
                        </div>

                        <Tabs defaultValue="components" className="flex-1 flex flex-col relative z-10">
                            <div className="px-10 mb-6 sticky top-0 bg-[#0A0A0B]/80 backdrop-blur-md py-2 z-50">
                                <TabsList className="bg-white/[0.02] border border-white/5 h-11 p-1 rounded-2xl gap-1">
                                    <TabsTrigger value="components" className="flex-1 data-[state=active]:bg-white/[0.05] data-[state=active]:text-white text-zinc-500 font-black text-[9px] uppercase tracking-[0.2em] rounded-xl transition-all duration-500 py-2">Ferramentas</TabsTrigger>
                                    <TabsTrigger value="notes" className="flex-1 data-[state=active]:bg-white/[0.05] data-[state=active]:text-white text-zinc-500 font-black text-[9px] uppercase tracking-[0.2em] rounded-xl transition-all duration-500 py-2">Minhas Notas</TabsTrigger>
                                    <TabsTrigger value="files" className="flex-1 data-[state=active]:bg-white/[0.05] data-[state=active]:text-white text-zinc-500 font-black text-[9px] uppercase tracking-[0.2em] rounded-xl transition-all duration-500 py-2">Arquivos</TabsTrigger>
                                </TabsList>
                            </div>

                            <div className="px-10 pt-2 pb-10">
                                <TabsContent value="components" className="m-0 focus-visible:outline-none">
                                    <div className="grid grid-cols-2 gap-4 pb-8">
                                        {filteredCategories.map((cat) => (
                                            <motion.div
                                                key={cat.id}
                                                whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}
                                                whileTap={{ scale: 0.98 }}
                                                draggable
                                                onDragStart={(e) => onDragStart(e, cat.id as NodeType)}
                                                onClick={() => handleQuickAdd(cat.id as NodeType)}
                                                className="p-6 rounded-[32px] bg-white/[0.015] border border-white/5 cursor-grab group transition-all duration-300 relative overflow-hidden"
                                            >
                                                <div className="absolute top-4 right-6 opacity-20 group-hover:opacity-100 transition-opacity">
                                                    <Plus size={14} className="text-zinc-500 group-hover:text-primary" />
                                                </div>

                                                <div className="flex flex-col gap-4">
                                                    <div className={cn(
                                                        "h-12 w-12 rounded-2xl flex items-center justify-center border border-white/5 transition-all duration-500 group-hover:scale-110 group-hover:border-primary/20",
                                                        cat.bg,
                                                        "bg-opacity-5"
                                                    )}>
                                                        <cat.icon className={cn("h-5 w-5", cat.color)} strokeWidth={1.5} />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <h4 className="text-[15px] font-black text-white tracking-tight">{cat.label}</h4>
                                                        <p className="text-[11px] text-zinc-600 font-bold uppercase tracking-wider leading-relaxed">Clique para adicionar ao centro.</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </TabsContent>

                                {/* ─── NOTES TAB ─── */}
                                <TabsContent value="notes" className="m-0 focus-visible:outline-none">
                                    {isLoadingNotes ? (
                                        <div className="flex items-center justify-center h-40">
                                            <Loader2 className="h-5 w-5 text-primary animate-spin mr-3" />
                                            <span className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Carregando Notas...</span>
                                        </div>
                                    ) : filteredNotes.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-2.5 pb-8">
                                            {filteredNotes.map((note) => (
                                                <motion.div
                                                    key={note.id}
                                                    whileHover={{ x: 6, backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}
                                                    whileTap={{ scale: 0.99 }}
                                                    draggable
                                                    onDragStart={(e) => onDragStart(e, 'item', {
                                                        label: note.title || 'Sem título',
                                                        sourceNoteId: note.id,
                                                        content: note.content || '',
                                                    })}
                                                    onClick={() => handleQuickAdd('item', {
                                                        label: note.title || 'Sem título',
                                                        sourceNoteId: note.id,
                                                        content: note.content || '',
                                                    })}
                                                    className="p-5 rounded-[24px] bg-white/[0.01] border border-white/5 cursor-grab group flex items-center justify-between transition-all duration-300"
                                                >
                                                    <div className="flex items-center gap-5">
                                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/10 group-hover:bg-primary/20 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
                                                            <FileText className="h-6 w-6 text-primary" strokeWidth={1.5} />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-[14px] font-black text-white leading-tight group-hover:text-primary transition-colors">{note.title || 'Sem título'}</h4>
                                                            <div className="flex items-center gap-3 mt-1.5">
                                                                <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Criada em {new Date(note.created_at).toLocaleDateString()}</span>
                                                                {note.tags?.slice(0, 2).map((t: string) => (
                                                                    <span key={t} className="text-[9px] text-primary/40 font-black uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10">#{t}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-all duration-500 opacity-0 group-hover:opacity-100 shadow-xl group-hover:shadow-primary/10">
                                                            <Plus size={16} className="text-primary" strokeWidth={3} />
                                                        </div>
                                                        <ChevronRight size={16} className="text-zinc-800 group-hover:text-zinc-500 transition-colors" />
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[32px]">
                                            <p className="text-zinc-700 font-black uppercase text-[10px] tracking-widest">Nenhuma nota encontrada</p>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* ─── FILES TAB ─── */}
                                <TabsContent value="files" className="m-0 focus-visible:outline-none">
                                    {/* Sub-tabs for personal vs patient files */}
                                    <div className="flex items-center gap-2 mb-6">
                                        <button
                                            onClick={() => setFilesSubTab('personal')}
                                            className={cn(
                                                "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all border",
                                                filesSubTab === 'personal' ? "bg-white/10 text-white border-white/20 shadow-lg" : "text-zinc-600 hover:text-white hover:bg-white/5 border-transparent"
                                            )}
                                        >
                                            <User size={12} /> Meus Arquivos
                                        </button>
                                        <button
                                            onClick={() => setFilesSubTab('patients')}
                                            className={cn(
                                                "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all border",
                                                filesSubTab === 'patients' ? "bg-white/10 text-white border-white/20 shadow-lg" : "text-zinc-600 hover:text-white hover:bg-white/5 border-transparent"
                                            )}
                                        >
                                            <Users size={12} /> Pacientes
                                        </button>
                                    </div>

                                    {isLoadingFiles ? (
                                        <div className="flex items-center justify-center h-40">
                                            <Loader2 className="h-5 w-5 animate-spin text-primary mr-3" />
                                            <span className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Carregando Arquivos...</span>
                                        </div>
                                    ) : filesSubTab === 'personal' ? (
                                        // ─── Personal Files ───
                                        filteredPersonalFiles.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-2.5 pb-8">
                                                {filteredPersonalFiles.map((file) => {
                                                    const cleanName = getCleanFileName(file.name);
                                                    const fileUrl = getFilePublicUrl(file.path);
                                                    const fileData = {
                                                        label: cleanName,
                                                        fileName: cleanName,
                                                        filePath: file.path,
                                                        fileUrl: fileUrl,
                                                        fileMimetype: file.mimetype || '',
                                                        fileSize: file.size,
                                                        fileSource: 'personal',
                                                    };
                                                    return (
                                                        <motion.div
                                                            key={file.id}
                                                            whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}
                                                            draggable
                                                            onDragStart={(e) => onDragStart(e, 'document', fileData)}
                                                            onClick={() => handleQuickAdd('document', fileData)}
                                                            className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 cursor-grab group flex items-center justify-between transition-all"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center shadow-lg">
                                                                    <PremiumFileIcon filename={cleanName} className="w-5 h-6" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-[13px] font-bold text-white truncate max-w-[300px] leading-tight">{cleanName}</h4>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="text-[8px] text-zinc-600 font-black uppercase tracking-wider">{formatFileSize(file.size)}</span>
                                                                        <span className="text-[8px] text-zinc-800">•</span>
                                                                        <span className="text-[8px] text-zinc-600 font-black uppercase tracking-wider">Pessoal</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className="text-[8px] font-black border-white/5 text-zinc-600 uppercase tracking-widest bg-white/[0.02]">Importar</Badge>
                                                                <ChevronRight size={14} className="text-zinc-800 group-hover:text-zinc-500" />
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[32px]">
                                                <FolderOpen className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
                                                <p className="text-zinc-700 font-black uppercase text-[10px] tracking-widest">Nenhum arquivo pessoal encontrado</p>
                                            </div>
                                        )
                                    ) : (
                                        // ─── Patient Files ───
                                        filteredPatients.length > 0 ? (
                                            <div className="space-y-2.5 pb-8">
                                                {filteredPatients.map((patient) => (
                                                    <div key={patient.id} className="space-y-1.5">
                                                        <button
                                                            onClick={() => setExpandedPatient(expandedPatient === patient.id ? null : patient.id)}
                                                            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all group"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/5">
                                                                    <User className="h-5 w-5 text-primary" />
                                                                </div>
                                                                <div className="text-left">
                                                                    <p className="text-sm font-bold text-white leading-tight">{patient.name}</p>
                                                                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.1em]">
                                                                        {patientFilesMap[patient.id]?.length || 0} arquivo(s)
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <ChevronDown className={cn(
                                                                "h-4 w-4 text-zinc-600 transition-transform duration-300",
                                                                expandedPatient === patient.id && "rotate-180"
                                                            )} />
                                                        </button>

                                                        <AnimatePresence>
                                                            {expandedPatient === patient.id && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: "auto", opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    transition={{ duration: 0.2 }}
                                                                    className="overflow-hidden pl-4 space-y-2"
                                                                >
                                                                    {patientFilesMap[patient.id]?.map((file) => {
                                                                        const cleanName = getCleanFileName(file.name);
                                                                        const fileUrl = getFilePublicUrl(file.path);
                                                                        const fileData = {
                                                                            label: cleanName,
                                                                            fileName: cleanName,
                                                                            filePath: file.path,
                                                                            fileUrl: fileUrl,
                                                                            fileMimetype: file.mimetype || '',
                                                                            fileSize: file.size,
                                                                            fileSource: 'patient',
                                                                            patientId: patient.id,
                                                                            patientName: patient.name,
                                                                        };
                                                                        return (
                                                                            <motion.div
                                                                                key={file.id}
                                                                                whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)' }}
                                                                                draggable
                                                                                onDragStart={(e) => onDragStart(e, 'document', fileData)}
                                                                                onClick={() => handleQuickAdd('document', fileData)}
                                                                                className="p-3.5 rounded-xl bg-white/[0.01] border border-white/5 cursor-grab group flex items-center justify-between transition-all"
                                                                            >
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="h-9 w-9 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center shadow-md">
                                                                                        <PremiumFileIcon filename={cleanName} className="w-4 h-5" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <h4 className="text-[12px] font-bold text-white truncate max-w-[250px] leading-tight">{cleanName}</h4>
                                                                                        <div className="flex items-center gap-2 mt-0.5">
                                                                                            <span className="text-[8px] text-zinc-600 font-black uppercase">{formatFileSize(file.size)}</span>
                                                                                            <span className="text-[8px] text-primary/40 font-black uppercase">Prontuário</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <Plus size={12} className="text-zinc-800 group-hover:text-primary transition-colors mr-2" />
                                                                            </motion.div>
                                                                        );
                                                                    })}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[32px]">
                                                <Users className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
                                                <p className="text-zinc-700 font-black uppercase text-[10px] tracking-widest">Nenhum arquivo de paciente</p>
                                            </div>
                                        )
                                    )}
                                </TabsContent>
                            </div>
                        </Tabs>
                    </ScrollArea>
                </div>

                {/* Footer Quick Tip */}
                <div className="px-10 py-4 border-t border-white/5 bg-white/[0.02] flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                        <span className="text-[8px] text-zinc-500 font-black uppercase tracking-[0.1em]">Dica: Arraste os componentes diretamente para o mapa.</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors"
                    >
                        Fechar Mapeador
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
