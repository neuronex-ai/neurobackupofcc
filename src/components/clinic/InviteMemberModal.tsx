import { useState } from "react";
import { motion } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useInviteMember, OrganizationRole } from "@/hooks/use-organization";
import {
    Mail,
    UserPlus,
    Crown,
    Shield,
    User,
    Eye,
    Loader2,
    Send
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InviteMemberModalProps {
    organizationId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const ROLES: { value: OrganizationRole; label: string; description: string; icon: typeof Crown }[] = [
    {
        value: 'professional',
        label: 'Profissional',
        description: 'Pode atender pacientes e acessar prontuários',
        icon: Shield
    },
    {
        value: 'admin',
        label: 'Administrador',
        description: 'Acesso completo, pode gerenciar equipe e finanças',
        icon: Crown
    },
    {
        value: 'receptionist',
        label: 'Recepcionista',
        description: 'Pode agendar consultas e visualizar pacientes',
        icon: User
    },
    {
        value: 'viewer',
        label: 'Visualizador',
        description: 'Apenas visualização, sem edição',
        icon: Eye
    },
];

export const InviteMemberModal = ({ organizationId, open, onOpenChange }: InviteMemberModalProps) => {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<OrganizationRole>("professional");
    const { mutate: inviteMember, isPending } = useInviteMember();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        inviteMember({
            organizationId,
            email: email.trim(),
            role,
        }, {
            onSuccess: () => {
                setEmail("");
                setRole("professional");
                onOpenChange(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-[#0A0A0C] border border-white/[0.08] rounded-3xl overflow-hidden">
                {/* Gradient glow */}
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

                <DialogHeader className="relative">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-white">
                                Convidar Profissional
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground text-sm">
                                Envie um convite por email para adicionar à sua equipe.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4 relative">
                    {/* Email input */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Email do Profissional
                        </Label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="profissional@email.com"
                                className="h-14 pl-12 bg-secondary/20 border-white/10 text-white placeholder:text-muted-foreground/50"
                                required
                            />
                        </div>
                    </div>

                    {/* Role selection */}
                    <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Papel na Organização
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                            {ROLES.map((r) => {
                                const Icon = r.icon;
                                const isSelected = role === r.value;
                                return (
                                    <motion.button
                                        key={r.value}
                                        type="button"
                                        onClick={() => setRole(r.value)}
                                        whileTap={{ scale: 0.98 }}
                                        className={cn(
                                            "p-4 rounded-xl border text-left transition-all duration-200",
                                            isSelected
                                                ? "bg-primary/10 border-primary/30"
                                                : "bg-secondary/10 border-white/5 hover:border-white/10"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <Icon className={cn(
                                                "w-4 h-4",
                                                isSelected ? "text-primary" : "text-muted-foreground"
                                            )} />
                                            <span className={cn(
                                                "font-semibold text-sm",
                                                isSelected ? "text-white" : "text-muted-foreground"
                                            )}>
                                                {r.label}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                                            {r.description}
                                        </p>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Submit */}
                    <Button
                        type="submit"
                        disabled={!email.trim() || isPending}
                        className="w-full h-14 bg-white text-black hover:bg-white/90 font-bold uppercase text-xs tracking-widest rounded-xl"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4 mr-2" />
                                Enviar Convite
                            </>
                        )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                        O profissional receberá um email com instruções para se juntar à sua clínica.
                    </p>
                </form>
            </DialogContent>
        </Dialog>
    );
};
