import { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Starfield } from "../ui/starfield";
import { useNavigate } from "react-router-dom";
import { LocationBreadcrumb } from "./LocationBreadcrumb";

interface PatientLayoutProps {
  children: ReactNode;
}

export const PatientLayout = ({ children }: PatientLayoutProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao sair: " + error.message);
    } else {
      toast.success("Sessão encerrada com sucesso.");
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen text-foreground relative overflow-x-hidden selection:bg-primary/30">
      <Starfield />
      
      {/* Ambient Background Glows (Responsive) */}
      <div className="fixed top-[-20vh] left-[-20vw] w-[80vw] h-[80vh] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none z-0 animate-aurora" />
      <div className="fixed bottom-[-20vh] right-[-20vw] w-[70vw] h-[70vh] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0 animate-aurora [animation-delay:-5s]" />

      {/* Breadcrumb (Visible on Desktop) */}
      <LocationBreadcrumb />

      {/* Navbar Capsule */}
      <header className="fixed top-6 left-0 right-0 z-50 px-4 flex justify-center">
        <div className="glass-capsule px-6 py-2.5 rounded-full flex items-center justify-between gap-8 min-w-[320px] max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-white uppercase tracking-widest">
              Portal do Paciente
            </span>
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-3 rounded-full hover:bg-white/10 text-muted-foreground hover:text-rose-400 gap-2 transition-all text-[10px] font-bold uppercase tracking-wider"
            onClick={handleLogout}
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-12 px-4 sm:px-6 animate-fade-up">
        <div className="mx-auto max-w-5xl">
          {children}
        </div>
      </main>
      
      {/* Footer Simple */}
      <footer className="relative z-10 py-8 text-center text-[10px] text-muted-foreground/30 uppercase tracking-[0.2em]">
        <p>NeuroNex &copy; {new Date().getFullYear()} • Área Segura</p>
      </footer>
    </div>
  );
};