import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Types for the Member Dashboard
export interface MemberOKR {
  id: string;
  title: string;
  description: string | null;
  progress: number;
  status: 'active' | 'at_risk' | 'behind' | 'completed';
  startDate: string | null;
  endDate: string | null;
  type: string;
  parentTitle: string | null;
  teamName: string | null;
  teamColor: string | null;
  keyResultsCount: number;
  keyResultsCompleted: number;
}

export interface MemberKeyResult {
  id: string;
  okrId: string;
  okrTitle: string;
  title: string;
  description: string | null;
  targetValue: number;
  currentValue: number;
  unit: string;
  progress: number;
  updatedAt: string;
}

export interface MemberSprint {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  plannedPoints: number;
  completedPoints: number;
  capacity: number;
  teamName: string;
  teamColor: string | null;
  daysRemaining: number;
  progress: number;
}

export interface MemberTeam {
  id: string;
  name: string;
  color: string | null;
}

// Get the team where the current user is a member
export const useMemberTeam = () => {
  const { profile, getTenantId } = useAuth();
  const tenantId = getTenantId();

  return useQuery({
    queryKey: ['member-team', profile?.id, tenantId],
    queryFn: async (): Promise<MemberTeam | null> => {
      if (!profile?.id || !tenantId) return null;

      // Find team where current user is a member
      const { data: teamMember, error: memberError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (memberError) throw memberError;
      if (!teamMember) return null;

      // Get team details
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id, name, color')
        .eq('id', teamMember.team_id)
        .eq('is_active', true)
        .maybeSingle();

      if (teamError) throw teamError;
      if (!team) return null;

      return {
        id: team.id,
        name: team.name,
        color: team.color,
      };
    },
    enabled: !!profile?.id && !!tenantId,
  });
};

// Get OKRs where the user is the owner
export const useMemberOKRs = (profileId: string | undefined) => {
  const { getTenantId } = useAuth();
  const tenantId = getTenantId();

  return useQuery({
    queryKey: ['member-okrs', profileId, tenantId],
    queryFn: async (): Promise<MemberOKR[]> => {
      if (!profileId || !tenantId) return [];

      // Get OKRs where user is owner
      const { data: okrs, error } = await supabase
        .from('okrs')
        .select(`
          id,
          title,
          description,
          progress,
          status,
          start_date,
          end_date,
          type,
          parent_id,
          team_id
        `)
        .eq('tenant_id', tenantId)
        .eq('owner_id', profileId)
        .in('status', ['active', 'at_risk', 'behind'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!okrs || okrs.length === 0) return [];

      // Get parent titles
      const parentIds = [...new Set(okrs.map(o => o.parent_id).filter(Boolean) as string[])];
      let parentsMap: Record<string, string> = {};
      if (parentIds.length > 0) {
        const { data: parents } = await supabase
          .from('okrs')
          .select('id, title')
          .in('id', parentIds);
        if (parents) {
          parentsMap = parents.reduce((acc, p) => ({ ...acc, [p.id]: p.title }), {});
        }
      }

      // Get team names
      const teamIds = [...new Set(okrs.map(o => o.team_id).filter(Boolean) as string[])];
      let teamsMap: Record<string, { name: string; color: string | null }> = {};
      if (teamIds.length > 0) {
        const { data: teams } = await supabase
          .from('teams')
          .select('id, name, color')
          .in('id', teamIds);
        if (teams) {
          teamsMap = teams.reduce((acc, t) => ({ ...acc, [t.id]: { name: t.name, color: t.color } }), {});
        }
      }

      // Get key results counts
      const okrIds = okrs.map(o => o.id);
      const { data: keyResults } = await supabase
        .from('key_results')
        .select('id, okr_id, progress')
        .in('okr_id', okrIds);

      const krCountsMap: Record<string, { total: number; completed: number }> = {};
      if (keyResults) {
        keyResults.forEach(kr => {
          if (!krCountsMap[kr.okr_id]) {
            krCountsMap[kr.okr_id] = { total: 0, completed: 0 };
          }
          krCountsMap[kr.okr_id].total++;
          if (kr.progress >= 100) {
            krCountsMap[kr.okr_id].completed++;
          }
        });
      }

      return okrs.map(okr => ({
        id: okr.id,
        title: okr.title,
        description: okr.description,
        progress: okr.progress,
        status: okr.status as MemberOKR['status'],
        startDate: okr.start_date,
        endDate: okr.end_date,
        type: okr.type,
        parentTitle: okr.parent_id ? parentsMap[okr.parent_id] || null : null,
        teamName: okr.team_id ? teamsMap[okr.team_id]?.name || null : null,
        teamColor: okr.team_id ? teamsMap[okr.team_id]?.color || null : null,
        keyResultsCount: krCountsMap[okr.id]?.total || 0,
        keyResultsCompleted: krCountsMap[okr.id]?.completed || 0,
      }));
    },
    enabled: !!profileId && !!tenantId,
  });
};

// Get Key Results assigned to the user
export const useMemberKeyResults = (profileId: string | undefined) => {
  const { getTenantId } = useAuth();
  const tenantId = getTenantId();

  return useQuery({
    queryKey: ['member-key-results', profileId, tenantId],
    queryFn: async (): Promise<MemberKeyResult[]> => {
      if (!profileId || !tenantId) return [];

      // Get key results where user is owner
      const { data: keyResults, error } = await supabase
        .from('key_results')
        .select(`
          id,
          okr_id,
          title,
          description,
          target_value,
          current_value,
          unit,
          progress,
          updated_at
        `)
        .eq('owner_id', profileId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      if (!keyResults || keyResults.length === 0) return [];

      // Get OKR titles
      const okrIds = [...new Set(keyResults.map(kr => kr.okr_id))];
      const { data: okrs } = await supabase
        .from('okrs')
        .select('id, title, tenant_id')
        .in('id', okrIds)
        .eq('tenant_id', tenantId);

      const okrsMap = (okrs || []).reduce((acc, o) => ({ ...acc, [o.id]: o.title }), {} as Record<string, string>);

      // Filter to only include key results from the current tenant's OKRs
      const validOkrIds = new Set((okrs || []).map(o => o.id));

      return keyResults
        .filter(kr => validOkrIds.has(kr.okr_id))
        .map(kr => ({
          id: kr.id,
          okrId: kr.okr_id,
          okrTitle: okrsMap[kr.okr_id] || '',
          title: kr.title,
          description: kr.description,
          targetValue: kr.target_value,
          currentValue: kr.current_value,
          unit: kr.unit || '%',
          progress: kr.progress,
          updatedAt: kr.updated_at,
        }));
    },
    enabled: !!profileId && !!tenantId,
  });
};

// Get current sprint for the member's team
export const useMemberSprint = (teamId: string | null) => {
  return useQuery({
    queryKey: ['member-sprint', teamId],
    queryFn: async (): Promise<MemberSprint | null> => {
      if (!teamId) return null;

      // Get team info first
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('name, color')
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;

      // Get active sprint
      const { data: sprint, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('team_id', teamId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      if (!sprint) return null;

      const startDate = new Date(sprint.start_date);
      const endDate = new Date(sprint.end_date);
      const now = new Date();
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      const daysElapsed = totalDays - daysRemaining;
      const progress = totalDays > 0 ? Math.round((daysElapsed / totalDays) * 100) : 0;

      return {
        id: sprint.id,
        name: sprint.name,
        status: sprint.status,
        startDate: sprint.start_date,
        endDate: sprint.end_date,
        plannedPoints: sprint.planned_points || 0,
        completedPoints: sprint.completed_points || 0,
        capacity: sprint.capacity || 100,
        teamName: team.name,
        teamColor: team.color,
        daysRemaining,
        progress: Math.min(100, progress),
      };
    },
    enabled: !!teamId,
  });
};

// Update Key Result progress
export const useUpdateKeyResultProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, currentValue }: { id: string; currentValue: number }) => {
      const { data, error } = await supabase
        .from('key_results')
        .update({ current_value: currentValue })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-key-results'] });
      queryClient.invalidateQueries({ queryKey: ['member-okrs'] });
      queryClient.invalidateQueries({ queryKey: ['okrs'] });
      toast.success('Progresso atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating Key Result:', error);
      toast.error('Erro ao atualizar progresso');
    },
  });
};

// Combined hook for all dashboard data
export const useMemberDashboard = () => {
  const { profile } = useAuth();
  
  const { data: team, isLoading: teamLoading, error: teamError } = useMemberTeam();
  const { data: okrs, isLoading: okrsLoading, error: okrsError } = useMemberOKRs(profile?.id);
  const { data: keyResults, isLoading: krLoading, error: krError } = useMemberKeyResults(profile?.id);
  const { data: sprint, isLoading: sprintLoading, error: sprintError } = useMemberSprint(team?.id || null);

  return {
    team,
    okrs: okrs || [],
    keyResults: keyResults || [],
    sprint,
    isLoading: teamLoading || okrsLoading || krLoading || sprintLoading,
    error: teamError || okrsError || krError || sprintError,
  };
};
