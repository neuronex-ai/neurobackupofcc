import { useAuth } from "@/components/auth/SessionContextProvider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit3, Loader2, Mail, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface EmailDraftModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: {
    to: string;
    subject: string;
    body: string;
    patientName?: string;
  } | null;
  onSent: () => void;
}

export const EmailDraftModal = ({ open, onOpenChange, initialData, onSent }: EmailDraftModalProps) => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTo(initialData.to || "");
      setSubject(initialData.subject || "");
      setBody(initialData.body || "");
    }
  }, [initialData]);

  const handleSend = async () => {
    if (!session?.access_token) return;
    setIsSending(true);

    try {
      const response = await fetch('https://krewdaklcyzqfxkkgvqr.supabase.co/functions/v1/send-document-email', {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              to,
              subject,
              htmlBody: body.replace(/\n/g, '<br>'), // Conversão simples para HTML
              documentType: 'Mensagem Direta'
          })
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Falha desconhecida no envio.");
      }
      
      toast.success("E-mail enviado com sucesso!");
      onSent();
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      if (e.message.includes("Google account not connected") || e.message.includes("Missing auth header")) {
          toast.error("Conta Google não conectada.", {
              description: "Vá em Configurações > Integrações para conectar.",
              action: {
                  label: "Conectar",
                  onClick: () => {
                      onOpenChange(false);
                      navigate('/ajustes?tab=integrations');
                  }
              },
              duration: 5000
          });
      } else if (e.message.includes("insufficient permissions") || e.message.includes("invalid_grant")) {
           toast.error("Permissão de e-mail expirada.", {
              description: "Por favor, reconecte sua conta Google para atualizar as permissões.",
              action: {
                  label: "Reconectar",
                  onClick: () => {
                      onOpenChange(false);
                      navigate('/ajustes?tab=integrations');
                  }
              },
              duration: 5000
           });
      } else {
          toast.error(`Erro ao enviar: ${e.message}`);
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0A0A0B] border-white/10 sm:max-w-[600px] p-0 overflow-hidden rounded-[24px] shadow-2xl">
        <DialogHeader className="p-6 border-b border-white/5 bg-white/[0.02]">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Mail className="h-5 w-5" />
                </div>
                Revisar E-mail
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
                A IA preparou este rascunho. Edite conforme necessário antes de enviar.
            </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5">
            <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Para</Label>
                <Input 
                    value={to} 
                    onChange={e => setTo(e.target.value)} 
                    className="bg-black/20 border-white/10 h-11 rounded-xl text-white font-mono text-xs"
                />
            </div>
            
            <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Assunto</Label>
                <Input 
                    value={subject} 
                    onChange={e => setSubject(e.target.value)} 
                    className="bg-black/20 border-white/10 h-11 rounded-xl text-white font-medium"
                />
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Mensagem</Label>
                <div className="relative">
                    <Textarea 
                        value={body} 
                        onChange={e => setBody(e.target.value)} 
                        className="bg-black/20 border-white/10 min-h-[200px] rounded-xl text-sm leading-relaxed p-4 resize-none text-white/90"
                    />
                    <Edit3 className="absolute bottom-4 right-4 h-4 w-4 text-white/20 pointer-events-none" />
                </div>
            </div>
        </div>

        <DialogFooter className="p-6 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-white">
                Descartar
            </Button>
            <Button 
                onClick={handleSend} 
                disabled={isSending}
                className="bg-blue-600 hover:bg-blue-500 text-white gap-2 rounded-xl h-11 px-6 shadow-lg shadow-blue-900/20"
            >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Confirmar e Enviar
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
