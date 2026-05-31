import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { toast } from "sonner";

export type OrganizationRole = 'admin' | 'professional' | 'receptionist' | 'viewer';
export type MemberStatus = 'active' | 'pending' | 'inactive';

export interface Organization {
    id: string;
    name: string;
    slug: string | null;
    logo_url: string | null;
    owner_id: string;
    plan: string;
    settings: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface OrganizationMember {
    id: string;
    organization_id: string;
    user_id: string;
    role: OrganizationRole;
    status: MemberStatus;
    invited_by: string | null;
    invited_at: string | null;
    joined_at: string | null;
    permissions: {
        can_view_patients: boolean;
        can_edit_patients: boolean;
        can_view_finance: boolean;
        can_manage_team: boolean;
    };
    created_at: string;
    updated_at: string;
    // Joined data
    user?: {
        id: string;
        email: string;
        user_metadata?: {
            full_name?: string;
            avatar_url?: string;
        };
    };
}

export interface OrganizationInvitation {
    id: string;
    organization_id: string;
    email: string;
    role: OrganizationRole;
    token: string;
    invited_by: string;
    expires_at: string;
    accepted_at: string | null;
    created_at: string;
}

// Get user's organizations
export function useOrganizations() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['organizations', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];

            const { data, error } = await supabase
                .from('organizations')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Organization[];
        },
        enabled: !!user?.id,
    });
}

// Get a specific organization
export function useOrganization(organizationId: string | null) {
    return useQuery({
        queryKey: ['organization', organizationId],
        queryFn: async () => {
            if (!organizationId) return null;

            const { data, error } = await supabase
                .from('organizations')
                .select('*')
                .eq('id', organizationId)
                .single();

            if (error) throw error;
            return data as Organization;
        },
        enabled: !!organizationId,
    });
}

// Get organization members
export function useOrganizationMembers(organizationId: string | null) {
    return useQuery({
        queryKey: ['organization-members', organizationId],
        queryFn: async () => {
            if (!organizationId) return [];

            const { data: members, error } = await supabase
                .from('organization_members')
                .select('*')
                .eq('organization_id', organizationId)
                .order('joined_at', { ascending: false });

            if (error) throw error;

            // Fetch profiles for these members
            const userIds = members.map(m => m.user_id);
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .in('id', userIds);

            const profileMap = new Map(profiles?.map(p => [p.id, p]));

            // Merge profile data into member object
            return members.map(member => ({
                ...member,
                user: {
                    id: member.user_id,
                    email: '', // Email not accessible from profiles, but not critical for display
                    user_metadata: {
                        full_name: profileMap.get(member.user_id)?.full_name,
                        avatar_url: profileMap.get(member.user_id)?.avatar_url
                    }
                }
            })) as OrganizationMember[];
        },
        enabled: !!organizationId,
    });
}

// Get pending invitations
export function useOrganizationInvitations(organizationId: string | null) {
    return useQuery({
        queryKey: ['organization-invitations', organizationId],
        queryFn: async () => {
            if (!organizationId) return [];

            const { data, error } = await supabase
                .from('organization_invitations')
                .select('*')
                .eq('organization_id', organizationId)
                .is('accepted_at', null)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as OrganizationInvitation[];
        },
        enabled: !!organizationId,
    });
}

// Get current user's role in org
export function useUserRole(organizationId: string | null) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['user-role', organizationId, user?.id],
        queryFn: async () => {
            if (!organizationId || !user?.id) return null;

            const { data, error } = await supabase
                .from('organization_members')
                .select('role, permissions')
                .eq('organization_id', organizationId)
                .eq('user_id', user.id)
                .single();

            if (error) return null;
            return data as { role: OrganizationRole; permissions: OrganizationMember['permissions'] };
        },
        enabled: !!organizationId && !!user?.id,
    });
}

// Create organization
export function useCreateOrganization() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (data: { name: string; slug?: string }) => {
            if (!user?.id) throw new Error('Not authenticated');

            const { data: org, error } = await supabase
                .from('organizations')
                .insert({
                    name: data.name,
                    slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
                    owner_id: user.id,
                })
                .select()
                .single();

            if (error) throw error;
            return org as Organization;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
            toast.success('Organização criada com sucesso!');
        },
        onError: (error: Error) => {
            toast.error(`Erro ao criar organização: ${error.message}`);
        },
    });
}

// Invite member
export function useInviteMember() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (data: {
            organizationId: string;
            email: string;
            role: OrganizationRole
        }) => {
            if (!user?.id) throw new Error('Not authenticated');

            const { data: invitation, error } = await supabase
                .from('organization_invitations')
                .insert({
                    organization_id: data.organizationId,
                    email: data.email,
                    role: data.role,
                    invited_by: user.id,
                })
                .select()
                .single();

            if (error) throw error;
            return invitation as OrganizationInvitation;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['organization-invitations', variables.organizationId] });
            toast.success('Convite enviado com sucesso!');
        },
        onError: (error: Error) => {
            toast.error(`Erro ao enviar convite: ${error.message}`);
        },
    });
}

// Update member role/permissions
export function useUpdateMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            memberId: string;
            role?: OrganizationRole;
            permissions?: Partial<OrganizationMember['permissions']>;
            status?: MemberStatus;
        }) => {
            const updates: Record<string, unknown> = {};
            if (data.role) updates.role = data.role;
            if (data.permissions) updates.permissions = data.permissions;
            if (data.status) updates.status = data.status;

            const { data: member, error } = await supabase
                .from('organization_members')
                .update(updates)
                .eq('id', data.memberId)
                .select()
                .single();

            if (error) throw error;
            return member as OrganizationMember;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['organization-members', data.organization_id] });
            toast.success('Membro atualizado com sucesso!');
        },
        onError: (error: Error) => {
            toast.error(`Erro ao atualizar membro: ${error.message}`);
        },
    });
}

// Remove member
export function useRemoveMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { memberId: string; organizationId: string }) => {
            const { error } = await supabase
                .from('organization_members')
                .delete()
                .eq('id', data.memberId);

            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['organization-members', variables.organizationId] });
            toast.success('Membro removido da organização.');
        },
        onError: (error: Error) => {
            toast.error(`Erro ao remover membro: ${error.message}`);
        },
    });
}

// Accept invitation
export function useAcceptInvitation() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (token: string) => {
            if (!user?.id) throw new Error('Not authenticated');

            // Get invitation
            const { data: invitation, error: invError } = await supabase
                .from('organization_invitations')
                .select('*')
                .eq('token', token)
                .is('accepted_at', null)
                .gt('expires_at', new Date().toISOString())
                .single();

            if (invError || !invitation) throw new Error('Convite inválido ou expirado');

            // Create member
            const { error: memberError } = await supabase
                .from('organization_members')
                .insert({
                    organization_id: invitation.organization_id,
                    user_id: user.id,
                    role: invitation.role,
                    status: 'active',
                    invited_by: invitation.invited_by,
                    joined_at: new Date().toISOString(),
                });

            if (memberError) throw memberError;

            // Mark invitation as accepted
            await supabase
                .from('organization_invitations')
                .update({ accepted_at: new Date().toISOString() })
                .eq('id', invitation.id);

            return invitation;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
            toast.success('Você agora faz parte da organização!');
        },
        onError: (error: Error) => {
            toast.error(`Erro ao aceitar convite: ${error.message}`);
        },
    });
}
