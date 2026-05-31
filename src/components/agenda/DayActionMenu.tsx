import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ArrowRight, Trash2, CalendarDays, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDayOperations } from "@/hooks/use-day-operations";
import { useAuth } from "@/components/auth/SessionContextProvider";

interface DayActionMenuProps {
  date: Date;
}

export const DayActionMenu = ({ date }: DayActionMenuProps) => {
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [targetDate, setTargetDate] = useState<Date | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { calculateMove, executeMove } = useDayOperations();
  const { user } = useAuth();

  const handleMoveDay = async () => {
      if (!targetDate || !user) return;
      setIsProcessing(true);
      
      const operations = await calculateMove(date, targetDate, user.id);
      
      if (operations.length > 0) {
          await executeMove(operations);
          setIsMoveOpen(false);
      }
      
      setIsProcessing(false);
  };

  return (
    <>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-white/10 text-muted-foreground hover:text-white">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#0A0A0B] border-white/10 w-48 backdrop-blur-xl">
                <DropdownMenuItem 
                    onSelect={() => setIsMoveOpen(true)}
                    className="text-xs cursor-pointer gap-2 focus:bg-white/5 focus:text-white"
                >
                    <ArrowRight className="h-3.5 w-3.5" /> Mover agendamentos
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem 
                    className="text-xs cursor-pointer gap-2 text-rose-400 focus:text-rose-300 focus:bg-rose-500/10"
                    onClick={() => console.log("Clear day logic here")}
                >
                    <Trash2 className="h-3.5 w-3.5" /> Limpar dia
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={isMoveOpen} onOpenChange={setIsMoveOpen}>
            <DialogContent className="bg-[#0A0A0B] border-white/10 sm:max-w-sm p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2 border-b border-white/5 bg-white/[0.02]">
                    <DialogTitle className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-primary" />
                        Mover Agenda
                    </DialogTitle>
                </DialogHeader>
                
                <div className="p-6 space-y-4">
                    <p className="text-xs text-muted-foreground">
                        Selecione a data para onde deseja mover todos os agendamentos de <strong>{format(date, "dd/MM", { locale: ptBR })}</strong>.
                    </p>
                    
                    <div className="flex justify-center border border-white/5 rounded-xl p-2 bg-black/20">
                        <Calendar
                            mode="single"
                            selected={targetDate}
                            onSelect={setTargetDate}
                            initialFocus
                            locale={ptBR}
                            disabled={(d) => d < new Date()}
                            className="bg-transparent"
                        />
                    </div>
                    
                    <Button 
                        onClick={handleMoveDay} 
                        disabled={!targetDate || isProcessing}
                        className="w-full h-10 bg-white text-black hover:bg-white/90 font-bold text-xs uppercase tracking-widest"
                    >
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Mudança"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    </>
  );
};