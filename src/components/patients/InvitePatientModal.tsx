import { useState } from "react";
import { DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Send, Coins, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { useInvitePatient } from "@/hooks/use-invite-patient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { useFinancialAccount } from "@/hooks/use-financial-account";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";

interface InvitePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: any;
}

export const InvitePatientModal = ({ isOpen, onClose, patient }: InvitePatientModalProps) => {
  const [paymentType, setPaymentType] = useState("manual");
  const [price, setPrice] = useState("150");
  const { mutate: invitePatient, isPending: loading } = useInvitePatient();
  // NeuroFinance: check payment readiness via Asaas BaaS
  const { isConnected, isApproved } = useFinancialAccount();
  const paymentStatus = { connected: isConnected, chargesEnabled: isApproved };
  const navigate = useNavigate();

  const isPaymentRestricted = paymentType === 'charge' && (!paymentStatus?.connected || !paymentStatus?.chargesEnabled);

  const handleSendInvite = () => {
    if (!patient) return;

    invitePatient({
      patientId: patient.id,
      options: {
        paymentType,
        price: paymentType === 'charge' ? parseFloat(price) : undefined,
        channel: 'email'
      }
    }, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={onClose}
      className="sm:max-w-[425px] p-0 overflow-hidden rounded-[32px]"
      drawerClassName="bg-background border-t border-border/10"
    >
      <div className="p-6 md:p-8 space-y-6">
        <DialogHeader className="p-0 border-none bg-transparent space-y-2">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Mail className="w-5 h-5 text-primary" />
            Convidar {patient?.name?.split(' ')[0]}
          </DialogTitle>
          <DialogDescription className="text-xs uppercase tracking-widest font-black text-muted-foreground">
            Acesso ao Portal do Paciente
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Enviaremos um link de agendamento e um código de segurança para o e-mail <span className="text-foreground font-bold">{patient?.email}</span>.
          </p>

          <div className="grid gap-2 mt-2">
            <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Valor da consulta?</Label>
            <Select value={paymentType} onValueChange={setPaymentType}>
              <SelectTrigger className="h-11 bg-secondary/20 border-border/10 rounded-xl">
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border/10">
                <SelectItem value="manual">Passar Cartão / Dinheiro / PIX</SelectItem>
                <SelectItem value="received">Já recebido / Convênio</SelectItem>
                <SelectItem value="charge">Gerar cobrança no convite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentType === 'charge' && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
              {isPaymentRestricted ? (
                <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-500 rounded-2xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="font-bold uppercase text-[10px] tracking-widest">Conta Restrita</AlertTitle>
                  <AlertDescription className="text-xs opacity-90 leading-relaxed mt-1">
                    Sua conta ainda não processa cobranças automáticas. regularize no menu financeiro.
                  </AlertDescription>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-red-500 font-black mt-2 flex items-center gap-1 text-[10px] uppercase tracking-widest"
                    onClick={() => {
                      onClose();
                      navigate('/financeiro');
                    }}
                  >
                    Ir para Financeiro <ExternalLink className="w-3 h-3" />
                  </Button>
                </Alert>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="price" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Valor (R$)</Label>
                  <div className="relative">
                    <Coins className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      className="pl-9 h-11 bg-secondary/20 border-border/10 rounded-xl"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3 pt-4 border-t border-border/10">
          <Button variant="ghost" onClick={onClose} disabled={loading} className="h-11 rounded-xl uppercase text-[10px] font-black tracking-widest">Cancelar</Button>
          <Button onClick={handleSendInvite} disabled={loading || isPaymentRestricted} className="flex-1 h-11 rounded-xl uppercase text-[10px] font-black tracking-widest gap-2 bg-foreground text-background hover:bg-foreground/90 transition-all">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>
                <Send className="w-4 h-4" />
                Enviar Convite
              </>
            )}
          </Button>
        </DialogFooter>
      </div>
    </ResponsiveModal>
  );
};