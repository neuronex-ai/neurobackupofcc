import { useState } from "react";
import { usePatientGoals } from "@/hooks/use-patient-goals";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarIcon, Plus, Trash2, Target, Loader2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface PatientGoalsTabProps {
  patientId: string;
}

export const PatientGoalsTab = ({ patientId }: PatientGoalsTabProps) => {
  const { goals, isLoading, addGoal, toggleGoal, deleteGoal, isAdding } = usePatientGoals(patientId);
  const [newDescription, setNewDescription] = useState("");
  const [date, setDate] = useState<Date>();

  const handleAdd = () => {
    if (!newDescription.trim()) return;
    addGoal({ description: newDescription, dueDate: date });
    setNewDescription("");
    setDate(undefined);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full bg-white/5 rounded-2xl" />
        <Skeleton className="h-16 w-full bg-white/5 rounded-2xl" />
        <Skeleton className="h-16 w-full bg-white/5 rounded-2xl" />
      </div>
    );
  }

  const completedCount = goals?.filter(g => g.is_completed).length || 0;
  const totalCount = goals?.length || 0;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header / Progress - Redesigned Layout */}
      <div className="pt-14 pb-8 px-8 rounded-[32px] bg-card border border-border/5 relative overflow-visible shadow-lg mt-10">
        <div className="absolute right-0 top-0 w-48 h-48 bg-primary/5 rounded-full blur-[60px] pointer-events-none" />

        {/* Circular Progress - Absolute Positioned at Top Center */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20">
          <div className="relative w-20 h-20 flex items-center justify-center bg-card rounded-full p-1.5 shadow-2xl border border-border/10">
            <svg className="w-full h-full -rotate-90 drop-shadow-lg" viewBox="0 0 36 36">
              <path className="text-secondary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <path
                className="text-primary transition-all duration-1000 ease-out"
                strokeDasharray={`${progress}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Target className="h-7 w-7 text-primary" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-6 relative z-10">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-foreground tracking-tight leading-none">Progresso Terapêutico</h3>
            <p className="text-[13px] text-muted-foreground font-medium opacity-60">
              <span className="text-foreground font-bold">{completedCount}</span> de <span className="text-foreground font-bold">{totalCount}</span> objetivos concluídos
            </p>
          </div>

          <div className="flex items-center">
            <span className="text-4xl font-black text-foreground tracking-tighter drop-shadow-sm">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Add New Goal Input */}
      <div className="flex gap-3">
        <div className="flex-1 bg-card rounded-2xl border border-border/10 focus-within:border-primary/50 focus-within:bg-secondary/10 transition-all flex items-center px-5 h-14 shadow-sm">
          <Input
            placeholder="Digite uma nova meta ou tarefa..."
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="border-none bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/40 h-full p-0 text-sm text-foreground"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "w-9 h-9 rounded-xl hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors ml-2",
                  date && "text-primary bg-primary/10 hover:bg-primary/20"
                )}
                title="Adicionar prazo"
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card border-border/10" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
        <Button onClick={handleAdd} disabled={isAdding || !newDescription.trim()} size="icon" className="w-14 h-14 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 flex-shrink-0 transition-all hover:scale-105">
          {isAdding ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-6 w-6 stroke-[3]" />}
        </Button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {goals?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/40 border border-dashed border-border/10 rounded-3xl bg-secondary/5">
            <Target className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm font-medium">Nenhuma meta definida.</p>
            <p className="text-xs mt-1 opacity-60">Comece adicionando objetivos para o paciente.</p>
          </div>
        ) : (
          goals?.map((goal) => (
            <div
              key={goal.id}
              className={cn(
                "group flex items-center justify-between p-5 rounded-2xl border transition-all duration-300",
                goal.is_completed
                  ? "bg-emerald-500/[0.02] border-emerald-500/10"
                  : "bg-card border-border/5 hover:bg-secondary/10 hover:border-border/10"
              )}
            >
              <div className="flex items-start gap-5 flex-1 min-w-0">
                <button
                  onClick={() => toggleGoal({ id: goal.id, isCompleted: !goal.is_completed })}
                  className="focus:outline-none mt-0.5 flex-shrink-0 transition-transform active:scale-90"
                >
                  {goal.is_completed ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-border/20 hover:border-primary/50 hover:bg-primary/10 transition-all" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium transition-all leading-snug",
                    goal.is_completed ? "text-muted-foreground line-through decoration-muted-foreground/20" : "text-foreground/90"
                  )}>
                    {goal.description}
                  </p>
                  {goal.due_date && (
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-2 font-medium uppercase tracking-wide">
                      <CalendarIcon className="h-3 w-3 opacity-70" />
                      <span>{format(new Date(goal.due_date + 'T00:00:00'), 'dd/MM/yyyy')}</span>
                    </div>
                  )}
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-all rounded-xl flex-shrink-0 ml-2"
                onClick={() => deleteGoal(goal.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};