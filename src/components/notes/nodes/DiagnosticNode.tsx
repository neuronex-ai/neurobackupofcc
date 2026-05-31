import { useState } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';
import { Search, Brain, Activity, ClipboardList } from "lucide-react";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Mock DSM-5 Data
const DSM_CODES = [
    { code: "F32.9", label: "Transtorno Depressivo Maior, não especificado" },
    { code: "F41.1", label: "Transtorno de Ansiedade Generalizada" },
    { code: "F41.0", label: "Transtorno de Pnico" },
    { code: "F42", label: "Transtorno Obsessivo-Compulsivo" },
    { code: "F43.1", label: "Transtorno de Estresse Pós-Traumático" },
    { code: "F90.0", label: "TDAH - Tipo Desatento" },
    { code: "F90.1", label: "TDAH - Tipo Hiperativo/Impulsivo" },
    { code: "F90.2", label: "TDAH - Tipo Combinado" },
    { code: "F31.9", label: "Transtorno Bipolar, não especificado" },
    { code: "F60.3", label: "Transtorno de Personalidade Borderline" },
];

export const DiagnosticNode = ({ data, selected }: any) => {
    const [open, setOpen] = useState(false);
    const [selectedDiagnosis, setSelectedDiagnosis] = useState<any>(data.diagnosis || null);

    const handleSelect = (diagnosis: any) => {
        setSelectedDiagnosis(diagnosis);
        data.diagnosis = diagnosis;
        setOpen(false);
    };

    return (
        <div className={cn(
            "w-[340px] bg-[#0A0A0B]/95 backdrop-blur-3xl border rounded-[32px] shadow-2xl overflow-hidden group transition-all",
            selected ? "border-primary/40 shadow-[0_0_50px_-10px_rgba(255,255,255,0.1)]" : "border-white/10"
        )}>
            <NodeResizer
                minWidth={320}
                minHeight={250}
                isVisible={selected}
                lineClassName="border-primary/30"
                handleClassName="h-3 w-3 bg-white border-2 border-zinc-950 rounded-full"
            />

            {/* Enhanced Handles */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-4 !h-20 !-left-2 !bg-transparent !border-none !flex !items-center !justify-center group/h-left"
            >
                <div className="w-1 h-10 rounded-full bg-white/10 group-hover/h-left:bg-white transition-all duration-300" />
            </Handle>

            <Handle
                type="source"
                position={Position.Right}
                className="!w-4 !h-20 !-right-2 !bg-transparent !border-none !flex !items-center !justify-center group/h-right"
            >
                <div className="w-1 h-10 rounded-full bg-white/10 group-hover/h-right:bg-white transition-all duration-300" />
            </Handle>

            <Handle
                type="source"
                position={Position.Top}
                className="!w-20 !h-4 !-top-2 !bg-transparent !border-none !flex !items-center !justify-center group/h-top"
            >
                <div className="h-1 w-10 rounded-full bg-white/10 group-hover/h-top:bg-white transition-all duration-300" />
            </Handle>

            <Handle
                type="source"
                position={Position.Bottom}
                className="!w-20 !h-4 !-bottom-2 !bg-transparent !border-none !flex !items-center !justify-center group/h-bottom"
            >
                <div className="h-1 w-10 rounded-full bg-white/10 group-hover/h-bottom:bg-white transition-all duration-300" />
            </Handle>

            {/* Header with Icon */}
            <div className="h-28 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-6 relative border-b border-white/5 drag-handle">
                <div className="absolute top-4 right-4 opacity-[0.05]">
                    <Activity className="text-white w-16 h-16" />
                </div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-xl backdrop-blur-md">
                        <Brain className="text-indigo-400 w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Hipótese Diagnóstica</h3>
                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.1em]">Classificação DSM-5</p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-4">
                {!selectedDiagnosis ? (
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={open} className="w-full h-12 justify-between bg-white/[0.02] border-white/5 text-zinc-500 hover:text-white hover:bg-white/[0.05] rounded-2xl transition-all">
                                <span className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                                    <Search className="w-3.5 h-3.5" /> Vincular Código...
                                </span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 bg-[#0A0A0B] border-white/10 backdrop-blur-3xl">
                            <Command className="bg-transparent">
                                <CommandInput placeholder="Pesquisar DSM-5..." className="h-12 border-none bg-transparent text-xs font-medium" />
                                <CommandList className="max-h-[300px]">
                                    <CommandEmpty className="py-6 text-center text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Nada encontrado.</CommandEmpty>
                                    <CommandGroup heading="Resultados" className="text-zinc-600 px-2">
                                        {DSM_CODES.map((item) => (
                                            <CommandItem
                                                key={item.code}
                                                value={item.label}
                                                onSelect={() => handleSelect(item)}
                                                className="rounded-xl px-4 py-3 mb-1 text-[11px] font-medium aria-selected:bg-white/5 aria-selected:text-white cursor-pointer transition-all"
                                            >
                                                <span className="font-black mr-3 text-indigo-400 w-8">{item.code}</span>
                                                {item.label}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                ) : (
                    <div className="relative group/card cursor-pointer" onClick={() => setOpen(true)}>
                        <div className="absolute inset-0 bg-indigo-500/5 blur-2xl rounded-[24px] group-hover/card:bg-indigo-500/10 transition-all duration-500" />
                        <div className="relative bg-white/[0.02] border border-white/5 rounded-[24px] p-5 hover:border-indigo-500/20 transition-all duration-500 group-hover/card:translate-y-[-2px]">
                            <div className="flex justify-between items-start mb-3">
                                <span className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 text-[9px] font-black tracking-[0.2em] border border-indigo-500/10 shadow-inner uppercase">
                                    {selectedDiagnosis.code}
                                </span>
                                <ClipboardList className="w-5 h-5 text-zinc-800 group-hover/card:text-indigo-400 transition-colors duration-500" />
                            </div>
                            <p className="text-sm font-bold text-zinc-200 leading-relaxed tracking-tight">
                                {selectedDiagnosis.label}
                            </p>
                        </div>
                        <p className="text-[8px] text-zinc-700 mt-3 text-center font-black uppercase tracking-[0.3em] opacity-40 group-hover/card:opacity-100 transition-all duration-500">
                            Clique para refinar diagnóstico
                        </p>
                    </div>
                )}
            </div>

            <div className="p-4 bg-black/40 border-t border-white/5 text-center">
                <span className="text-[8px] font-black text-zinc-800 uppercase tracking-[0.5em]">NeuroFlow Diagnostics</span>
            </div>
        </div>
    );
};
