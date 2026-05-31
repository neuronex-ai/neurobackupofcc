import { GlassCard } from "@/components/ui/GlassCard";
import { Calendar } from "lucide-react";

const PatientPortal = () => {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12 space-y-8">
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Portal do Paciente</h1>
          <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest mt-1">Acesso Seguro & Histórico</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <GlassCard className="md:col-span-2">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold">Próximas Sessões</h3>
          </div>
          <div className="p-8 border border-dashed border-border rounded-3xl text-center text-muted-foreground">
            <p className="text-sm">Nenhum agendamento futuro encontrado.</p>
          </div>
        </GlassCard>

        {/* Linha 100: Ajustando o valor de 'premium' para 'default' ou outro tipo válido conforme a tipagem do componente */}
        <GlassCard className="h-fit">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-emerald-500/10 rounded-2xl">
              <Shield className="h-5 w-5 text-emerald-500" />
            </div>
            <h3 className="font-bold">Dados de Saúde</h3>
          </div>
          <div className="space-y-4">
             <div className="p-4 rounded-2xl bg-secondary/50 border border-border/50">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Status</p>
                <p className="text-sm font-bold">Tratamento em Curso</p>
             </div>
          </div>
        </GlassCard>
      </main>
    </div>
  );
};

const Shield = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
);

export default PatientPortal;