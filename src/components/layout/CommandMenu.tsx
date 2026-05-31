import { useAuth } from "@/components/auth/SessionContextProvider";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import {
    ArrowRight, Calendar, DollarSign,
    FileText, LayoutDashboard, Loader2, LogOut, Search // Added missing import
    , Settings,
    User, Users, Zap
} from "lucide-react";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Simple Regex-based Intent Parser (Client-side "AI")
const parseIntent = (input: string) => {
    const lower = input.toLowerCase();
    
    // Intent: Create Appointment
    if (lower.includes("agendar") || lower.includes("consulta") || lower.includes("sessão")) {
        return { type: "appointment", label: "Agendar Sessão", icon: Calendar, action: "/agenda?action=new" };
    }
    
    // Intent: New Patient
    if (lower.includes("novo paciente") || lower.includes("criar paciente") || lower.includes("cadastro")) {
        return { type: "patient", label: "Cadastrar Paciente", icon: User, action: "/pacientes?action=new" };
    }
    
    // Intent: Financial
    if (lower.includes("receita") || lower.includes("despesa") || lower.includes("pagamento") || lower.includes("lançar")) {
        return { type: "finance", label: "Novo Lançamento Financeiro", icon: DollarSign, action: "/financeiro?action=new" };
    }

    // Intent: Note
    if (lower.includes("nota") || lower.includes("anotação") || lower.includes("lembrete")) {
        return { type: "note", label: "Criar Nota Rápida", icon: FileText, action: "/notas?action=new" };
    }

    return null;
};

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<{ patients: any[], notes: any[] }>({ patients: [], notes: [] });
  const [isSearching, setIsSearching] = React.useState(false);
  const [intent, setIntent] = React.useState<any>(null);
  
  const navigate = useNavigate();
  const { user } = useAuth();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Smart Search Logic
  React.useEffect(() => {
    // 1. Check Intents instantly
    const detectedIntent = parseIntent(query);
    setIntent(detectedIntent);

    const search = async () => {
        if (!query || query.length < 2 || !user) {
            setResults({ patients: [], notes: [] });
            return;
        }

        setIsSearching(true);
        
        // Parallel Search
        const [patientsRes, notesRes] = await Promise.all([
             supabase.from('patients').select('id, name, status').eq('user_id', user.id).ilike('name', `%${query}%`).limit(3),
             supabase.from('session_notes').select('id, notes, created_at, patient:patient_id(name, id)').eq('user_id', user.id).ilike('notes', `%${query}%`).limit(3)
        ]);

        setResults({ 
            patients: patientsRes.data || [], 
            notes: notesRes.data || [] 
        });
        setIsSearching(false);
    };

    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [query, user]);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) toast.error(error.message);
    else toast.success("Sessão encerrada.");
  };

  if (!user) return null;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <div className="bg-[#0A0A0B]/90 backdrop-blur-2xl border border-white/10 overflow-hidden rounded-2xl shadow-2xl">
        <div className="flex items-center border-b border-white/5 px-4">
            <Search className="h-4 w-4 text-muted-foreground/50 mr-2" />
            <CommandInput 
                placeholder="O que você precisa fazer?" 
                className="border-none focus:ring-0 text-base h-16 bg-transparent text-white placeholder:text-muted-foreground/40"
                value={query}
                onValueChange={setQuery}
            />
            {isSearching && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </div>
        
        <CommandList className="max-h-[500px] overflow-y-auto custom-scrollbar p-2">
          <CommandEmpty className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
             <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-2">
                 <Zap className="h-6 w-6 text-white/20" />
             </div>
             <p>Sem resultados.</p>
             <p className="text-xs text-muted-foreground/50">Tente "Novo Paciente" ou "Agendar"</p>
          </CommandEmpty>
          
          {/* AI Intent Suggestion */}
          {intent && (
              <CommandGroup heading="Ação Sugerida">
                  <CommandItem 
                    onSelect={() => runCommand(() => { navigate(intent.action); toast.success(`Iniciando: ${intent.label}`); })}
                    className="aria-selected:bg-primary/20 aria-selected:text-primary border border-primary/20 bg-primary/10 mb-2 rounded-xl"
                  >
                      <intent.icon className="mr-3 h-5 w-5" />
                      <div className="flex flex-col">
                          <span className="font-bold text-sm">{intent.label}</span>
                          <span className="text-[10px] opacity-70 font-normal">Comando de voz identificado</span>
                      </div>
                      <ArrowRight className="ml-auto h-4 w-4 opacity-50" />
                  </CommandItem>
              </CommandGroup>
          )}

          {/* Database Results */}
          {(results.patients.length > 0 || results.notes.length > 0) && (
              <CommandGroup heading="Resultados da Busca">
                  {results.patients.map(p => (
                      <CommandItem key={p.id} onSelect={() => runCommand(() => navigate(`/pacientes/${p.id}`))} className="aria-selected:bg-white/10 aria-selected:text-white rounded-xl mb-1">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mr-3 border border-white/5">
                            <span className="text-xs font-bold">{p.name.substring(0,2).toUpperCase()}</span>
                          </div>
                          <div className="flex flex-col">
                             <span className="font-medium">{p.name}</span>
                             <span className="text-[10px] text-muted-foreground capitalize">{p.status === 'active' ? 'Em Tratamento' : 'Inativo'}</span>
                          </div>
                      </CommandItem>
                  ))}
                  {results.notes.map(n => (
                      <CommandItem key={n.id} onSelect={() => runCommand(() => navigate(`/pacientes/${n.patient.id}`))} className="aria-selected:bg-white/10 aria-selected:text-white rounded-xl mb-1">
                          <FileText className="mr-3 h-4 w-4 text-emerald-400" />
                          <div className="flex flex-col min-w-0">
                             <span className="text-xs text-muted-foreground">Nota de <span className="text-white">{n.patient.name}</span></span>
                             <span className="text-[11px] text-muted-foreground/60 truncate max-w-[300px]">"{n.notes.substring(0, 60)}..."</span>
                          </div>
                      </CommandItem>
                  ))}
              </CommandGroup>
          )}

          {!query && (
            <>
                <CommandGroup heading="Atalhos Globais">
                    <CommandItem onSelect={() => runCommand(() => navigate("/dashboard"))} className="aria-selected:bg-white/10 aria-selected:text-white rounded-xl">
                        <LayoutDashboard className="mr-3 h-4 w-4 text-blue-400" />
                        <span>Dashboard</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/agenda"))} className="aria-selected:bg-white/10 aria-selected:text-white rounded-xl">
                        <Calendar className="mr-3 h-4 w-4 text-purple-400" />
                        <span>Agenda</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/pacientes"))} className="aria-selected:bg-white/10 aria-selected:text-white rounded-xl">
                        <Users className="mr-3 h-4 w-4 text-emerald-400" />
                        <span>Pacientes</span>
                    </CommandItem>
                    {/* MVP CUT: AI Chat Disabled 
                    <CommandItem onSelect={() => runCommand(() => navigate("/ai-chat"))} className="aria-selected:bg-white/10 aria-selected:text-white rounded-xl">
                        <Sparkles className="mr-3 h-4 w-4 text-amber-400" />
                        <span>Assistente IA</span>
                    </CommandItem>
                    */}
                </CommandGroup>
                
                <CommandSeparator className="bg-white/5 my-2" />
                
                <CommandGroup heading="Sistema">
                    <CommandItem onSelect={() => runCommand(() => navigate("/integrations"))} className="aria-selected:bg-white/10 aria-selected:text-white rounded-xl">
                    <Settings className="mr-3 h-4 w-4" />
                    <span>Configurações</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(handleLogout)} className="text-rose-400 aria-selected:bg-rose-500/10 aria-selected:text-rose-400 rounded-xl">
                    <LogOut className="mr-3 h-4 w-4" />
                    <span>Sair</span>
                    </CommandItem>
                </CommandGroup>
            </>
          )}
        </CommandList>
        
        <div className="p-2 border-t border-white/5 bg-white/[0.02] flex justify-between items-center text-[10px] text-muted-foreground px-4">
            <span>NeuroNex OS v3.5</span>
            <div className="flex gap-2">
                <span className="bg-white/10 px-1.5 py-0.5 rounded text-white/50">↑↓</span> navegar
                <span className="bg-white/10 px-1.5 py-0.5 rounded text-white/50">↵</span> selecionar
            </div>
        </div>
      </div>
    </CommandDialog>
  );
}