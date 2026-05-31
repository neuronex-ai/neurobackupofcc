import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSendReminder } from "@/hooks/use-send-reminder";
import { supabase } from "@/integrations/supabase/client";
import { addHours, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Mail, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CommunicationActionModalProps {
  children: React.ReactNode;
  appointment: any; // Using any for flexibility with different appointment shapes
  patientPhone?: string;
  patientEmail?: string;
}

export const CommunicationActionModal = ({ children, appointment, patientPhone, patientEmail }: CommunicationActionModalProps) => {
  const [open, setOpen] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const { mutate: sendEmail, isPending: isSendingEmail } = useSendReminder();

  const handleSendWhatsApp = async () => {
      if (!patientPhone) {
          toast.error("Paciente sem telefone cadastrado.");
          return;
      }
      
      setIsGeneratingLink(true);
      try {
          const token = crypto.randomUUID();
          const expiresAt = addHours(new Date(), 48);
          
          const { error } = await supabase
            .from('appointment_confirmation_tokens')
            .insert({
                appointment_id: appointment.id,
                token: token,
                expires_at: expiresAt.toISOString()
            });

          if (error) throw error;

          const baseUrl = window.location.origin;
          const confirmLink = `${baseUrl}/confirmar-agendamento/${token}`;
          const dateStr = format(new Date(appointment.start_time), "dd/MM", { locale: ptBR });
          const timeStr = format(new Date(appointment.start_time), "HH:mm");
          
          // Use template if available, otherwise default
          let message = `Olá *${appointment.patient_name?.split(' ')[0]}*! 👋%0A%0ALembrete da sua consulta para *${dateStr}* às *${timeStr}*.%0A%0APor favor, confirme clicando aqui:%0A${confirmLink}`;

          const cleanPhone = patientPhone.replace(/\D/g, '');
          const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
          
          window.open(`https://wa.me/${fullPhone}?text=${message}`, '_blank');
          setOpen(false);
          toast.success("WhatsApp aberto!");

      } catch (e) {
          console.error(e);
          toast.error("Erro ao gerar link.");
      } finally {
          setIsGeneratingLink(false);
      }
  };

  const handleSendEmail = () => {
      if (!patientEmail) {
          toast.error("Paciente sem e-mail.");
          return;
      }

      sendEmail({
          appointmentId: appointment.id,
          patientEmail: patientEmail,
          patientName: appointment.patient_name,
          startTime: appointment.start_time,
          endTime: appointment.end_time,
          type: appointment.type,
          meetLink: appointment.google_meet_link,
          location: appointment.location
      }, {
          onSuccess: () => {
              setOpen(false);
          }
      });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        {children}
      </DialogTrigger>
      <DialogContent className="bg-[#0A0A0B] border-white/10 sm:max-w-md p-0 gap-0 overflow-hidden rounded-[24px]">
        <DialogHeader className="p-6 border-b border-white/5 bg-white/[0.02]">
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" /> Enviar Lembrete
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
                Escolha o canal para notificar {appointment.patient_name?.split(' ')[0]}.
            </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 grid grid-cols-2 gap-3">
            <button
                onClick={handleSendWhatsApp}
                disabled={isGeneratingLink}
                className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all group"
            >
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {isGeneratingLink ? <Loader2 className="h-6 w-6 text-emerald-400 animate-spin" /> : <MessageCircle className="h-6 w-6 text-emerald-400" />}
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">WhatsApp</span>
            </button>

            <button
                onClick={handleSendEmail}
                disabled={isSendingEmail}
                className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/30 transition-all group"
            >
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {isSendingEmail ? <Loader2 className="h-6 w-6 text-blue-400 animate-spin" /> : <Mail className="h-6 w-6 text-blue-400" />}
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">E-mail</span>
            </button>
        </div>
        
        <div className="p-4 bg-black/20 border-t border-white/5 text-center">
            <p className="text-[10px] text-muted-foreground">Ambos os métodos enviam link de confirmação seguro.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};