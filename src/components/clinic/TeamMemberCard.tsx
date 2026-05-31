import { motion } from "framer-motion";
import {
    OrganizationMember,
    OrganizationRole,
    useRemoveMember,
    useUpdateMember
} from "@/hooks/use-organization";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Crown,
    MoreVertical,
    Shield,
    User,
    Eye,
    Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMemberCardProps {
    member: OrganizationMember;
    isOwner?: boolean;
}

const ROLE_CONFIG: Record<OrganizationRole, { label: string; icon: typeof Crown; color: string }> = {
    admin: { label: 'Administrador', icon: Crown, color: 'text-amber-400' },
    professional: { label: 'Profissional', icon: Shield, color: 'text-primary' },
    receptionist: { label: 'Recepcionista', icon: User, color: 'text-blue-400' },
    viewer: { label: 'Visualizador', icon: Eye, color: 'text-muted-foreground' },
};

export const TeamMemberCard = ({ member, isOwner }: TeamMemberCardProps) => {
    const { mutate: removeMember } = useRemoveMember();
    const { mutate: updateMember } = useUpdateMember();

    const roleConfig = ROLE_CONFIG[member.role];
    const RoleIcon = roleConfig.icon;

    // Get display name from user metadata or email
    const displayName = member.user?.user_metadata?.full_name ||
        member.user?.email?.split('@')[0] ||
        'Membro';
    const initials = displayName.substring(0, 2).toUpperCase();
    const avatarUrl = member.user?.user_metadata?.avatar_url;

    const handleRemove = () => {
        if (confirm('Tem certeza que deseja remover este membro?')) {
            removeMember({
                memberId: member.id,
                organizationId: member.organization_id
            });
        }
    };

    const handleChangeRole = (newRole: OrganizationRole) => {
        updateMember({
            memberId: member.id,
            role: newRole,
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative p-5 bg-secondary/10 border border-white/5 rounded-2xl hover:border-white/10 transition-all duration-300"
        >
            {/* Owner badge */}
            {isOwner && (
                <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-amber-500 text-black text-[8px] font-black uppercase tracking-widest rounded-full">
                    Dono
                </div>
            )}

            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border border-white/10">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback className="bg-secondary text-white font-bold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h4 className="font-semibold text-white">{displayName}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <RoleIcon className={cn("w-3 h-3", roleConfig.color)} />
                            <span className={cn("text-xs font-medium", roleConfig.color)}>
                                {roleConfig.label}
                            </span>
                        </div>
                    </div>
                </div>

                {!isOwner && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                                onClick={() => handleChangeRole('admin')}
                                disabled={member.role === 'admin'}
                            >
                                <Crown className="w-4 h-4 mr-2 text-amber-400" />
                                Tornar Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleChangeRole('professional')}
                                disabled={member.role === 'professional'}
                            >
                                <Shield className="w-4 h-4 mr-2 text-primary" />
                                Tornar Profissional
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleChangeRole('receptionist')}
                                disabled={member.role === 'receptionist'}
                            >
                                <User className="w-4 h-4 mr-2 text-blue-400" />
                                Tornar Recepcionista
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={handleRemove}
                                className="text-red-400 focus:text-red-400"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remover da Equipe
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {/* Permissions quick view */}
            <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-2">
                {member.permissions.can_view_patients && (
                    <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 rounded-full">
                        Pacientes
                    </span>
                )}
                {member.permissions.can_view_finance && (
                    <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 rounded-full">
                        Financeiro
                    </span>
                )}
                {member.permissions.can_manage_team && (
                    <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 rounded-full">
                        Equipe
                    </span>
                )}
            </div>
        </motion.div>
    );
};
