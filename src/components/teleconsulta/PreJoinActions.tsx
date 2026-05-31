import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Mail, MessageSquare, Loader2, Link } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Patient } from "@/types";

interface PreJoinActionsProps {
  appointmentId: string;
  patient: Patient | undefined | null;
  meetLink: string;
  therapistName: string;
}

export const PreJoinActions = ({ appointmentId, patient, meetLink, therapistName }: PreJoinActionsProps) => {
  const [sending, setSending] = useState<'whatsapp' | 'email' | null>(null);

  const handleSendReminder = async (method: 'email' | 'whatsapp') => {
    setSending(method);

    if (method === 'email') {
      if (!patient || !patient.email) {
        toast.error("E-mail do paciente não encontrado.");
        setSending(null);
        return;
      }

      const toastId = toast.loading("Enviando convite por e-mail...");
      try {
        const { error } = await supabase.functions.invoke('send-google-invite', {
          body: {
            patientEmail: patient.email,
            patientName: patient.name,
            meetLink: meetLink,
            therapistName: therapistName,
          },
        });

        if (error) throw new Error(error.message);

        toast.success("E-mail enviado com sucesso!", { id: toastId });
      } catch (error) {
        console.error("Failed to send Google invite:", error);
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
        toast.error(`Falha ao enviar e-mail: ${errorMessage}`, { id: toastId });
      } finally {
        setSending(null);
      }
    } else { // 'whatsapp'
      const toastId = toast.loading(`Enviando lembrete via ${method}...`);

      try {
        const { error } = await supabase.functions.invoke('send-reminder', {
          body: { appointmentId, method },
        });

        if (error) throw error;

        toast.success("Lembrete enviado com sucesso!", { id: toastId });
      } catch (error) {
        console.error("Failed to send reminder:", error);
        const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";

        if (errorMessage.includes("Webhook for reminder")) {
          toast.success("Lembrete enviado! (Webhook acionado)", { id: toastId });
        } else {
          toast.error(`Falha ao enviar lembrete: ${errorMessage}`, { id: toastId });
        }
      } finally {
        setSending(null);
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetLink);
    toast.success("Link copiado para a área de transferência!");
  };

  return (
    <div className="flex items-center gap-3 animate-fade-up delay-200">
      <Button
        variant="outline"
        size="icon"
        className="rounded-full h-12 w-12 bg-white/5 dark:bg-black/20 hover:bg-white/10 dark:hover:bg-white/5 border border-black/5 dark:border-white/10 backdrop-blur-md shadow-sm hover:scale-105 active:scale-95 transition-all duration-500 ease-apple group relative"
        onClick={() => handleSendReminder('whatsapp')}
        disabled={!!sending}
        aria-label="Enviar via WhatsApp"
      >
        {sending === 'whatsapp' ? (
          <Loader2 className="h-4 w-4 animate-spin text-zinc-500 dark:text-zinc-400" />
        ) : (
          <MessageSquare className="h-4 w-4 text-zinc-500 dark:text-zinc-400 group-hover:text-emerald-500 transition-colors duration-300" />
        )}
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="rounded-full h-12 w-12 bg-white/5 dark:bg-black/20 hover:bg-white/10 dark:hover:bg-white/5 border border-black/5 dark:border-white/10 backdrop-blur-md shadow-sm hover:scale-105 active:scale-95 transition-all duration-500 ease-apple group relative"
        onClick={() => handleSendReminder('email')}
        disabled={!!sending || !patient?.email}
        aria-label="Enviar via Gmail"
      >
        {sending === 'email' ? (
          <Loader2 className="h-4 w-4 animate-spin text-zinc-500 dark:text-zinc-400" />
        ) : (
          <Mail className="h-4 w-4 text-zinc-500 dark:text-zinc-400 group-hover:text-sky-500 transition-colors duration-300" />
        )}
      </Button>

      <div className="w-px h-8 bg-zinc-200 dark:bg-white/10 mx-1" />

      <Button
        variant="outline"
        size="icon"
        className="rounded-full h-12 w-12 bg-white/5 dark:bg-black/20 hover:bg-white/10 dark:hover:bg-white/5 border border-black/5 dark:border-white/10 backdrop-blur-md shadow-sm hover:scale-105 active:scale-95 transition-all duration-500 ease-apple group relative"
        onClick={handleCopyLink}
        aria-label="Copiar Link"
      >
        <Link className="h-4 w-4 text-zinc-500 dark:text-zinc-400 group-hover:text-amber-500 transition-colors duration-300" />
      </Button>

      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 ml-2">
        Convidar Paciente
      </span>
    </div>
  );
};