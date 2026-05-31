import { useState } from "react";
import { motion } from "framer-motion";
import {
    useOrganization,
    useOrganizationMembers,
    useOrganizationInvitations,
    useCreateOrganization
} from "@/hooks/use-organization";
import { useSubscription } from "@/context/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Building2,
    Users,
    Plus,
    Mail,
    Clock,
    Shield
} from "lucide-react";
import { TeamMemberCard } from "./TeamMemberCard";
import { InviteMemberModal } from "./InviteMemberModal";
import { GlassCard } from "@/components/ui/GlassCard";
import { LockedFeatureScreen } from "@/components/subscription";

interface OrganizationSettingsProps {
    organizationId?: string | null;
}

export const OrganizationSettings = ({ organizationId }: OrganizationSettingsProps) => {
    const { canAccess } = useSubscription();
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [newOrgName, setNewOrgName] = useState("");

    const { data: organization, isLoading: isLoadingOrg } = useOrganization(organizationId || null);
    const { data: members, isLoading: isLoadingMembers } = useOrganizationMembers(organizationId || null);
    const { data: invitations } = useOrganizationInvitations(organizationId || null);
    const { mutate: createOrg, isPending: isCreating } = useCreateOrganization();

    // Check if user has access to multiple professionals feature
    if (!canAccess('multiple_professionals')) {
        return (
            <LockedFeatureScreen
                feature="multiple_professionals"
                title="Gestão de Equipe"
                description="Gerencie múltiplos profissionais na mesma clínica, defina papéis e permissões, e colabore de forma eficiente. Exclusivo do plano Clinic."
            />
        );
    }

    const handleCreateOrg = () => {
        if (!newOrgName.trim()) return;
        createOrg({ name: newOrgName });
        setNewOrgName("");
    };

    // If no organization exists, show create form
    if (!organizationId && !isLoadingOrg) {
        return (
            <div className="max-w-2xl mx-auto py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                        <Building2 className="w-9 h-9 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">Crie sua Clínica</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Configure sua organização para começar a adicionar profissionais e gerenciar sua equipe.
                    </p>
                </motion.div>

                <GlassCard className="p-8">
                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                                Nome da Clínica
                            </label>
                            <Input
                                value={newOrgName}
                                onChange={(e) => setNewOrgName(e.target.value)}
                                placeholder="Ex: Clínica Bem Estar"
                                className="h-14 text-lg bg-secondary/20 border-white/10"
                            />
                        </div>
                        <Button
                            onClick={handleCreateOrg}
                            disabled={!newOrgName.trim() || isCreating}
                            className="w-full h-14 bg-white text-black hover:bg-white/90 font-bold uppercase text-xs tracking-widest"
                        >
                            <Building2 className="w-4 h-4 mr-2" />
                            {isCreating ? "Criando..." : "Criar Organização"}
                        </Button>
                    </div>
                </GlassCard>
            </div>
        );
    }

    const activeMembers = members?.filter(m => m.status === 'active') || [];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
                <div className="flex flex-col items-center gap-4 md:flex-row">
                    <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">{organization?.name || "Carregando..."}</h2>
                        <p className="text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                            <Users className="w-3.5 h-3.5" />
                            {activeMembers.length} profissionais ativos
                        </p>
                    </div>
                </div>

                <Button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="h-11 px-6 bg-white text-black hover:bg-white/90 font-bold uppercase text-[10px] tracking-widest rounded-full w-full md:w-auto"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Convidar Profissional
                </Button>
            </div>

            {/* Team Grid */}
            <div className="space-y-6">
                {/* Active Members */}
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5" />
                        Equipe Ativa
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {isLoadingMembers ? (
                            [...Array(3)].map((_, i) => (
                                <div key={i} className="h-32 rounded-2xl bg-secondary/10 animate-pulse" />
                            ))
                        ) : activeMembers.length === 0 ? (
                            <div className="col-span-full py-16 text-center text-muted-foreground border border-dashed border-white/10 rounded-2xl">
                                <Users className="w-8 h-8 mx-auto mb-3 opacity-30" />
                                <p>Nenhum membro na equipe ainda.</p>
                            </div>
                        ) : (
                            activeMembers.map((member) => (
                                <TeamMemberCard
                                    key={member.id}
                                    member={member}
                                    isOwner={organization?.owner_id === member.user_id}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Pending Invitations */}
                {invitations && invitations.length > 0 && (
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" />
                            Convites Pendentes
                        </h3>
                        <div className="space-y-2">
                            {invitations.map((invitation) => (
                                <div
                                    key={invitation.id}
                                    className="flex items-center justify-between p-4 bg-secondary/10 border border-white/5 rounded-xl"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                                            <Mail className="w-4 h-4 text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{invitation.email}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{invitation.role}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
                                        Aguardando
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Invite Modal */}
            <InviteMemberModal
                organizationId={organizationId || ""}
                open={isInviteModalOpen}
                onOpenChange={setIsInviteModalOpen}
            />
        </div>
    );
};
