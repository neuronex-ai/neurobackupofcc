import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Appointment } from "@/types";
import { Video } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface JoinSessionModalProps {
  appointment: Appointment;
  children: React.ReactNode;
}

export const JoinSessionModal = ({ appointment, children }: JoinSessionModalProps) => {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const handleJoin = () => {
      navigate(`/join/${appointment.id}`);
      setOpen(false);
  };

  const Content = () => (
    <div className="h-full w-full flex flex-col p-6 bg-[#050505] items-center justify-center text-center space-y-8">
        <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full" />
            <div className="w-32 h-32 rounded-[32px] bg-[#0A0A0B] border border-white/10 flex items-center justify-center shadow-2xl relative z-10 transform rotate-3">
                <Video className="h-12 w-12 text-white" />
            </div>
        </div>
        
        <div className="space-y-2 max-w-xs mx-auto">
            <h2 className="text-2xl font-bold text-white">Sala de Teleconsulta</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
                Você será redirecionado para a sala segura com seu psicólogo.
            </p>
        </div>

        <div className="mt-auto space-y-3 w-full max-w-sm">
            <Button 
                size="lg" 
                className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 font-bold text-sm uppercase tracking-widest gap-2"
                onClick={handleJoin}
            >
                Entrar Agora
            </Button>
            <Button 
                variant="ghost" 
                className="w-full text-muted-foreground hover:text-white"
                onClick={() => setOpen(false)}
            >
                Cancelar
            </Button>
        </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent className="h-[50vh] p-0 border-none bg-black rounded-none outline-none">
            <Content />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md h-[50vh] p-0 border-white/10 bg-black shadow-2xl gap-0 overflow-hidden outline-none rounded-[24px]">
        <Content />
      </DialogContent>
    </Dialog>
  );
};