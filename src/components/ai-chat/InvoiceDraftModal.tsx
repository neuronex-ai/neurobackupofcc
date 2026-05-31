import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGenerateInvoice } from "@/hooks/use-generate-invoice";
import { usePatients } from "@/hooks/use-patients";
import { CheckCircle, DollarSign, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface InvoiceDraftModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: {
    patientName?: string; // A IA tenta adivinhar o nome para ajudar a gente a conferir
    patientId?: string;   // Se a IA achou o ID exato
    amount: number;
    description: string;
    dueDate?: string;
  } | null;
  onSent: () => void;
}

export const InvoiceDraftModal = ({ open, onOpenChange, initialData, onSent }: InvoiceDraftModalProps) => {
  const { mutate: generateInvoice, isPending } = useGenerateInvoice();
  const { data: patients } = usePatients();
  
  const [patientId, setPatientId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (initialData && open) {
      setAmount(initialData.amount?.toString() || "");
      setDescription(initialData.description || "Sessões de Terapia");
      
      // Tenta encontrar o paciente pelo ID enviado pela IA ou pelo nome aproximado
      if (initialData.patientId) {
          setPatientId(initialData.patientId);
      } else if (initialData.patientName && patients) {
          const found = patients.find(p => p.name.toLowerCase().includes(initialData.patientName!.toLowerCase()));
          if (found) setPatientId(found.id);
      }

      // Data padrão: Hoje + 3 dias se não vier nada
      if (initialData.dueDate) {
          setDueDate(initialData.dueDate);
      } else {
          const d = new Date();
          d.setDate(d.getDate() + 3);
          setDueDate(d.toISOString().split('T')[0]);
      }
    }
  }, [initialData, open, patients]);

  const handleConfirm = () => {
    if (!patientId || !amount || !dueDate) {
        toast.error("Preencha todos os campos obrigatórios.");
        return;
    }

    generateInvoice({
        patientId,
        amount: parseFloat(amount),
        description,
        dueDate: new Date(dueDate)
    }, {
        onSuccess: () => {
            onSent();
            onOpenChange(false);
        }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0A0A0B] border-white/10 sm:max-w-[450px] p-0 overflow-hidden rounded-[24px] shadow-2xl">
        <DialogHeader className="p-6 border-b border-white/5 bg-white/[0.02]">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <DollarSign className="h-5 w-5" />
                </div>
                Gerar Cobrança
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
                A IA preparou este lançamento financeiro. Confirme os dados.
            </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5">
            <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Paciente</Label>
                <Select value={patientId} onValueChange={setPatientId}>
                    <SelectTrigger className="bg-black/20 border-white/10 h-11 rounded-xl text-white text-xs">
                        <SelectValue placeholder="Selecione o paciente..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0A0B] border-white/10">
                        {patients?.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Valor (R$)</Label>
                    <Input 
                        type="number"
                        value={amount} 
                        onChange={e => setAmount(e.target.value)} 
                        className="bg-black/20 border-white/10 h-11 rounded-xl text-white font-bold text-lg"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Vencimento</Label>
                    <Input 
                        type="date"
                        value={dueDate} 
                        onChange={e => setDueDate(e.target.value)} 
                        className="bg-black/20 border-white/10 h-11 rounded-xl text-white text-xs"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Descrição</Label>
                <Input 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    className="bg-black/20 border-white/10 h-11 rounded-xl text-white text-sm"
                />
            </div>
        </div>

        <DialogFooter className="p-6 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-white">
                Cancelar
            </Button>
            <Button 
                onClick={handleConfirm} 
                disabled={isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 rounded-xl h-11 px-6 shadow-lg shadow-emerald-900/20"
            >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Emitir Cobrança
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};