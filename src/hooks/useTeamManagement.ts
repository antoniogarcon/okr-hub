import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  joinedAt: string;
}

export interface TeamWithDetails {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  isActive: boolean;
  leaderId: string | null;
  leaderName: string | null;
  leaderEmail: string | null;
  memberCount: number;
  members: TeamMember[];
  currentSprintName: string | null;
  activeOkrsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamData {
  name: string;
  description?: string;
  color?: string;
  leaderId?: string;
}

export interface UpdateTeamData {
  name?: string;
  description?: string;
  color?: string;
  leaderId?: string | null;
  isActive?: boolean;
}

// Generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Fetch teams with details
export const useTeams = (tenantId: string | null) => {
  return useQuery({
    queryKey: ['teams', tenantId],
    queryFn: async (): Promise<TeamWithDetails[]> => {
      if (!tenantId) return [];

      // Fetch teams with leader info
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          slug,
          description,
          color,
          is_active,
          leader_id,
          created_at,
          updated_at
        `)
        .eq('tenant_id', tenantId)
        .order('name');

      if (teamsError) throw teamsError;

      // Fetch all team members
      const teamIds = teams.map(t => t.id);
      const { data: allMembers, error: membersError } = await supabase
        .from('team_members')
        .select(`
          id,
          team_id,
          user_id,
          joined_at,
          profiles:user_id (
            id,
            name,
            email,
            avatar_url
          )
        `)
        .in('team_id', teamIds);

      if (membersError) throw membersError;

      // Fetch leaders info
      const leaderIds = teams.filter(t => t.leader_id).map(t => t.leader_id);
      const { data: leaders, error: leadersError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', leaderIds.length > 0 ? leaderIds : ['00000000-0000-0000-0000-000000000000']);

      if (leadersError) throw leadersError;

      // Fetch current sprints for each team
      const { data: currentSprints, error: sprintsError } = await supabase
        .from('sprints')
        .select('team_id, name')
        .in('team_id', teamIds)
        .eq('status', 'active');

      if (sprintsError) throw sprintsError;

      // Fetch active OKRs count for each team
      const { data: okrsCounts, error: okrsError } = await supabase
        .from('okrs')
        .select('team_id')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .in('team_id', teamIds);

      if (okrsError) throw okrsError;

      // Build the response
      const leadersMap = new Map(leaders?.map(l => [l.id, l]) || []);
      const sprintsMap = new Map(currentSprints?.map(s => [s.team_id, s.name]) || []);
      
      // Count OKRs per team
      const okrsCountMap = new Map<string, number>();
      okrsCounts?.forEach(okr => {
        if (okr.team_id) {
          okrsCountMap.set(okr.team_id, (okrsCountMap.get(okr.team_id) || 0) + 1);
        }
      });

      return teams.map(team => {
        const teamMembers = (allMembers || [])
          .filter(m => m.team_id === team.id)
          .map(m => {
            const profile = m.profiles as any;
            return {
              id: m.id,
              userId: m.user_id,
              name: profile?.name || '',
              email: profile?.email || '',
              avatarUrl: profile?.avatar_url || null,
              joinedAt: m.joined_at,
            };
          });

        const leader = team.leader_id ? leadersMap.get(team.leader_id) : null;

        return {
          id: team.id,
          name: team.name,
          slug: team.slug,
          description: team.description,
          color: team.color,
          isActive: team.is_active,
          leaderId: team.leader_id,
          leaderName: leader?.name || null,
          leaderEmail: leader?.email || null,
          memberCount: teamMembers.length,
          members: teamMembers,
          currentSprintName: sprintsMap.get(team.id) || null,
          activeOkrsCount: okrsCountMap.get(team.id) || 0,
          createdAt: team.created_at,
          updatedAt: team.updated_at,
        };
      });
    },
    enabled: !!tenantId,
  });
};

// Fetch available users for team assignment (users in tenant not already in a team)
export const useAvailableUsers = (tenantId: string | null, teamId?: string) => {
  return useQuery({
    queryKey: ['available-users', tenantId, teamId],
    queryFn: async () => {
      if (!tenantId) return [];

      // Get all users in the tenant
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, name, email, avatar_url')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (profilesError) throw profilesError;

      // Get users already in a team (exclude current team if editing)
      const { data: existingMembers, error: membersError } = await supabase
        .from('team_members')
        .select('user_id, team_id');

      if (membersError) throw membersError;

      // Filter out users who are already in another team
      const usersInOtherTeams = new Set(
        existingMembers
          ?.filter(m => !teamId || m.team_id !== teamId)
          .map(m => m.user_id) || []
      );

      return profiles
        .filter(p => !usersInOtherTeams.has(p.id))
        .map(p => ({
          id: p.id,
          userId: p.user_id,
          name: p.name,
          email: p.email,
          avatarUrl: p.avatar_url,
        }));
    },
    enabled: !!tenantId,
  });
};

// Create team
export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  const { getTenantId } = useAuth();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (data: CreateTeamData) => {
      const tenantId = getTenantId();
      if (!tenantId) throw new Error('No tenant selected');

      const slug = generateSlug(data.name);

      const { data: team, error } = await supabase
        .from('teams')
        .insert({
          tenant_id: tenantId,
          name: data.name,
          slug,
          description: data.description || null,
          color: data.color || '#6366f1',
          leader_id: data.leaderId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success(t('teams.createSuccess'));
    },
    onError: (error: Error) => {
      toast.error(t('teams.createError'));
      console.error('Error creating team:', error);
    },
  });
};

// Update team
export const useUpdateTeam = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({ teamId, data }: { teamId: string; data: UpdateTeamData }) => {
      const updateData: Record<string, unknown> = {};
      
      if (data.name !== undefined) {
        updateData.name = data.name;
        updateData.slug = generateSlug(data.name);
      }
      if (data.description !== undefined) updateData.description = data.description;
      if (data.color !== undefined) updateData.color = data.color;
      if (data.leaderId !== undefined) updateData.leader_id = data.leaderId;
      if (data.isActive !== undefined) updateData.is_active = data.isActive;

      const { data: team, error } = await supabase
        .from('teams')
        .update(updateData)
        .eq('id', teamId)
        .select()
        .single();

      if (error) throw error;
      return team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success(t('teams.updateSuccess'));
    },
    onError: (error: Error) => {
      toast.error(t('teams.updateError'));
      console.error('Error updating team:', error);
    },
  });
};

// Delete team (soft delete - set is_active to false)
export const useDeleteTeam = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase
        .from('teams')
        .update({ is_active: false })
        .eq('id', teamId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success(t('teams.deleteSuccess'));
    },
    onError: (error: Error) => {
      toast.error(t('teams.deleteError'));
      console.error('Error deleting team:', error);
    },
  });
};

// Add member to team
export const useAddTeamMember = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['available-users'] });
      toast.success(t('teams.memberAddSuccess'));
    },
    onError: (error: Error) => {
      toast.error(t('teams.memberAddError'));
      console.error('Error adding team member:', error);
    },
  });
};

// Remove member from team
export const useRemoveTeamMember = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({ teamId, memberId }: { teamId: string; memberId: string }) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId)
        .eq('team_id', teamId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['available-users'] });
      toast.success(t('teams.memberRemoveSuccess'));
    },
    onError: (error: Error) => {
      toast.error(t('teams.memberRemoveError'));
      console.error('Error removing team member:', error);
    },
  });
};

// Check if user can edit teams
export const useCanEditTeams = () => {
  const { hasMinimumRole, isRoot } = useAuth();
  return isRoot() || hasMinimumRole('admin');
};

// Check if user is a team leader
export const useIsTeamLeader = (teamId: string) => {
  const { profile, hasRole } = useAuth();
  const { data: teams } = useTeams(profile?.tenantId || null);
  
  if (!hasRole('leader')) return false;
  
  const team = teams?.find(t => t.id === teamId);
  return team?.leaderId === profile?.id;
};
