"use client";

import { PremiumFileIcon } from '@/components/ui/PremiumFileIcons';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';
import {
    Activity, Brain, ChevronRight, Clock,
    Database, Download, ExternalLink, FileText, GitBranch, Maximize2, Minimize2, Quote, Zap
} from "lucide-react";
import { memo, useState } from 'react';
import { Handle, NodeProps, NodeResizer, Position } from 'reactflow';

const iconMap = {
    start: Brain,
    logic: GitBranch,
    action: Zap,
    quote: Quote,
    document: Database,
    anamnesis: Activity,
    somatic: Zap,
    timeline: Clock,
    item: FileText,
};

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const isPreviewable = (fileName: string = '', mimeType: string = '') => {
    const images = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const pdf = 'application/pdf';

    if (images.includes(mimeType) || /\.(jpg|jpeg|png|webp|gif)$/i.test(fileName)) return 'image';
    if (mimeType === pdf || /\.pdf$/i.test(fileName)) return 'pdf';
    return null;
};

export const NeuralNode = memo(({ data, selected, type }: NodeProps) => {
    const Icon = iconMap[type as keyof typeof iconMap] || FileText;
    const [isExpanded, setIsExpanded] = useState(false);
    const { theme: _theme } = useTheme();

    const renderContent = () => {
        switch (type) {
            case 'quote':
                return (
                    <div className="mt-3 p-3 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 italic text-zinc-500 dark:text-zinc-400 text-xs line-clamp-3">
                        "{data.content || 'O que o paciente disse...'}"
                    </div>
                );
            case 'somatic':
                return (
                    <div className="mt-3 space-y-2">
                        <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-900 rounded-full overflow-hidden border border-zinc-300 dark:border-white/5">
                            <div className="h-full bg-zinc-900 dark:bg-white transition-all" style={{ width: `${data.intensity || 50}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] font-black text-zinc-600 uppercase">
                            <span>Sutil</span>
                            <span>Intenso</span>
                        </div>
                    </div>
                );
            case 'document':
                return renderDocumentPreview();
            default:
                if (data.sourceNoteId && data.content) {
                    return (
                        <div className="mt-3 p-3 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 text-zinc-600 dark:text-zinc-500 text-[11px] line-clamp-3 leading-relaxed">
                            {data.content.substring(0, 180)}
                        </div>
                    );
                }
                return null;
        }
    };

    const renderDocumentPreview = () => {
        const { fileName, fileUrl, fileMimetype, fileSize, patientName, fileSource } = data;
        const previewType = isPreviewable(fileName, fileMimetype);
        const cardHeight = isExpanded ? 520 : 220;

        return (
            <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Arquivo Conectado</span>
                    </div>
                    {fileSize && (
                        <span className="text-[9px] font-bold text-zinc-700 tabular-nums">
                            {formatFileSize(fileSize)}
                        </span>
                    )}
                </div>

                <div className="relative group/doc">
                    {previewType && fileUrl ? (
                        <div
                            className="relative rounded-[24px] overflow-hidden border border-zinc-200 dark:border-white/5 bg-zinc-100 dark:bg-black/40 shadow-inner backdrop-blur-sm transition-all duration-700 group-hover/doc:border-zinc-300 dark:group-hover/doc:border-white/10"
                            style={{ height: cardHeight, minHeight: 160 }}
                        >
                            {previewType === 'image' ? (
                                <img
                                    src={fileUrl}
                                    alt={fileName}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover/doc:scale-105"
                                    draggable={false}
                                />
                            ) : previewType === 'pdf' ? (
                                <iframe
                                    src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                                    className="w-full h-full border-0 grayscale-[0.2] opacity-90 group-hover/doc:grayscale-0 group-hover/doc:opacity-100 transition-all duration-700"
                                    title={fileName}
                                />
                            ) : null}

                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover/doc:opacity-100 transition-all duration-500 translate-y-[-4px] group-hover/doc:translate-y-0">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                                    className="h-9 w-9 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-xl"
                                >
                                    {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                                </button>
                                <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="h-9 w-9 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-xl"
                                >
                                    <ExternalLink size={14} />
                                </a>
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black via-black/40 to-transparent">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                                        <PremiumFileIcon filename={fileName} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-black text-white/90 truncate uppercase tracking-widest">{fileName}</p>
                                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Clique para visualizar</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 rounded-[28px] bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 flex items-center gap-5 group-hover/doc:bg-zinc-100 dark:group-hover/doc:bg-white/[0.04] transition-all duration-500">
                            <div className="h-14 w-14 rounded-2xl bg-zinc-200 dark:bg-white/5 flex items-center justify-center border border-zinc-300 dark:border-white/10 shadow-2xl group-hover/doc:scale-110 transition-transform">
                                <PremiumFileIcon filename={fileName} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-zinc-900 dark:text-white truncate mb-1">{fileName}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">{fileMimetype?.split('/')[1] || 'Arquivo'}</span>
                                    <span className="h-1 w-1 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">{formatFileSize(fileSize)}</span>
                                </div>
                            </div>
                            {fileUrl && (
                                <a href={fileUrl} download className="h-10 w-10 rounded-full bg-black/20 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all">
                                    <Download size={18} />
                                </a>
                            )}
                        </div>
                    )}
                </div>

                {fileSource === 'patient' && patientName && (
                    <div className="flex items-center gap-2 px-1">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">Enviado por:</span>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/80">{patientName}</span>
                    </div>
                )}
            </div>
        );
    };

    const isDocType = type === 'document';
    const hasImportedNote = data.sourceNoteId;

    return (
        <div className={cn(
            "group relative p-1 rounded-[32px] transition-all duration-700",
            isDocType ? "min-w-[320px]" : "min-w-[280px]",
            selected
                ? "bg-gradient-to-br from-black/10 to-transparent dark:from-white/20 dark:to-white/5"
                : "bg-zinc-100 dark:bg-white/[0.05]"
        )}>
            <NodeResizer
                minWidth={280}
                minHeight={100}
                isVisible={selected}
                lineClassName="border-zinc-300 dark:border-white/20"
                handleClassName="h-3 w-3 bg-white border-2 border-zinc-900 dark:border-zinc-950 rounded-full"
            />

            <Handle
                type="target"
                position={Position.Left}
                className="!w-4 !h-16 !-left-2 !bg-transparent !border-none !flex !items-center !justify-center group/h-left"
            >
                <div className="w-1.5 h-8 rounded-full bg-zinc-300 dark:bg-white/10 group-hover/h-left:bg-zinc-900 dark:group-hover/h-left:bg-white transition-all duration-300" />
            </Handle>

            <Handle
                type="source"
                position={Position.Right}
                className="!w-4 !h-16 !-right-2 !bg-transparent !border-none !flex !items-center !justify-center group/h-right"
            >
                <div className="w-1.5 h-8 rounded-full bg-zinc-300 dark:bg-white/10 group-hover/h-right:bg-zinc-900 dark:group-hover/h-right:bg-white transition-all duration-300" />
            </Handle>

            <Handle
                type="source"
                position={Position.Top}
                className="!w-16 !h-4 !-top-2 !bg-transparent !border-none !flex !items-center !justify-center group/h-top"
            >
                <div className="h-1.5 w-8 rounded-full bg-zinc-300 dark:bg-white/10 group-hover/h-top:bg-zinc-900 dark:group-hover/h-top:bg-white transition-all duration-300" />
            </Handle>

            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-16 !h-4 !-bottom-2 !bg-transparent !border-none !flex !items-center !justify-center group/h-bottom"
            >
                <div className="h-1.5 w-8 rounded-full bg-zinc-300 dark:bg-white/10 group-hover/h-bottom:bg-zinc-900 dark:group-hover/h-bottom:bg-white transition-all duration-300" />
            </Handle>

            <div className={cn(
                "p-5 rounded-[31px] transition-all duration-700 h-full",
                "bg-white dark:bg-[#0a0a0b] border border-zinc-200 dark:border-white/10",
                selected
                    ? "shadow-2xl dark:shadow-[0_0_40px_-10px_rgba(255,255,255,0.2)]"
                    : "hover:border-zinc-300 dark:hover:border-white/20"
            )}>
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center border transition-all duration-700 flex-shrink-0",
                        selected
                            ? "bg-zinc-900 border-zinc-900 text-white dark:bg-white dark:border-white dark:text-black"
                            : "bg-zinc-100 border-zinc-200 text-zinc-400 dark:bg-white/5 dark:border-white/10 dark:text-zinc-500"
                    )}>
                        {isDocType && data.fileName ? (
                            <PremiumFileIcon filename={data.fileName} />
                        ) : (
                            <Icon size={20} />
                        )}
                    </div>

                    <div className="flex-1 min-w-0 pr-4">
                        <p className="text-[14px] font-black text-zinc-900 dark:text-white tracking-tight truncate">
                            {data.label}
                        </p>
                        <p className="text-[9px] font-bold uppercase text-zinc-600 tracking-[0.2em] mt-0.5">
                            {isDocType ? 'Documento' : hasImportedNote ? 'Nota Importada' : type === 'item' ? 'Bloco Livre' : type}
                        </p>
                    </div>

                    <div className="h-8 w-8 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center text-zinc-800 opacity-20 group-hover:opacity-100 transition-all">
                        <ChevronRight size={14} />
                    </div>
                </div>

                {renderContent()}
            </div>
        </div>
    );
});

NeuralNode.displayName = 'NeuralNode';

export default NeuralNode;
