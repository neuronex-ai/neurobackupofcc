import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TEMPLATES } from "@/data/clinical-templates";
import { cn } from "@/lib/utils";
import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Activity, BrainCircuit, FileText, LayoutTemplate, Plus, Search } from "lucide-react";
import { useState } from "react";

interface TemplateLibraryModalProps {
  onSelect: (content: string) => void;
  children?: React.ReactNode;
}

export const TemplateLibraryModal = ({ onSelect, children }: TemplateLibraryModalProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("todos");

  const filteredTemplates = TEMPLATES.filter(t =>
    (activeCategory === 'todos' || t.category === activeCategory) &&
    (t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelect = (content: string) => {
    onSelect(content);
    setOpen(false);
  };

  const Trigger = children || (
    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-white">
      <LayoutTemplate className="h-4 w-4" /> Modelos
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {Trigger}
      </DialogTrigger>
      <DialogContent className="max-w-5xl h-[85vh] bg-[#050505] border border-white/10 p-0 overflow-hidden rounded-[32px] shadow-2xl flex flex-col gap-0 outline-none">

        {/* Header Title for Accessibility */}
        <VisuallyHidden>
          <DialogTitle>Galeria de Templates</DialogTitle>
          <DialogDescription>Selecione um modelo para sua nota</DialogDescription>
        </VisuallyHidden>

        {/* Custom Header Area */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-[#0A0A0B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
              <LayoutTemplate className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">Galeria de Templates</h2>
          </div>

          <div className="relative group w-full max-w-sm">
            <div className="absolute inset-0 bg-white/5 rounded-full blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center bg-[#151518] border border-white/10 rounded-full px-4 h-11 transition-colors focus-within:border-white/20">
              <Search className="w-4 h-4 text-muted-foreground mr-3" />
              <input
                placeholder="Buscar modelo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none h-full w-full text-sm p-0 placeholder:text-muted-foreground/50 focus:outline-none text-white outline-none ring-0 focus:ring-0"
              />
            </div>
          </div>

          <div className="w-10" />
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Categories */}
          <div className="w-64 border-r border-white/5 bg-[#0A0A0B] p-6 flex flex-col gap-1">
            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em] mb-4 px-2">Categorias</p>
            {[
              { id: 'todos', label: 'Todas as Notas', icon: LayoutTemplate },
              { id: 'clinico', label: 'Clínico Geral', icon: Activity },
              { id: 'tcc', label: 'TCC', icon: BrainCircuit },
              { id: 'psicanalise', label: 'Psicanálise', icon: BrainCircuit },
              { id: 'documentos', label: 'Documentos', icon: FileText },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium transition-all text-left",
                  activeCategory === cat.id
                    ? "bg-white/10 text-white shadow-inner"
                    : "text-zinc-500 hover:text-white hover:bg-white/5"
                )}
              >
                <cat.icon className="h-4 w-4 opacity-70" />
                {cat.label}
              </button>
            ))}
          </div>

          {/* Grid Area */}
          <div className="flex-1 bg-[#050505] relative">
            <ScrollArea className="h-full">
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTemplates.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleSelect(t.content)}
                    className="group relative p-[1px] rounded-[24px] bg-gradient-to-b from-white/[0.05] to-transparent hover:from-white/[0.1] transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <div className="bg-[#0F0F11] rounded-[23px] p-6 h-full flex flex-col justify-between border border-white/5 group-hover:border-white/10 transition-colors relative overflow-hidden">
                      {/* Hover Glow */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-10 h-10 rounded-full bg-[#1A1A1D] border border-white/10 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                            {t.icon && <t.icon className="h-4 w-4" />}
                          </div>
                          <Plus className="h-4 w-4 text-zinc-600 group-hover:text-white transition-colors" />
                        </div>

                        <h4 className="text-base font-bold text-white mb-2">{t.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                          {t.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredTemplates.length === 0 && (
                  <div className="col-span-full h-full flex flex-col items-center justify-center text-muted-foreground/40 py-20">
                    <LayoutTemplate className="h-10 w-10 mb-4 opacity-20" />
                    <p className="text-sm">Nenhum modelo encontrado.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};