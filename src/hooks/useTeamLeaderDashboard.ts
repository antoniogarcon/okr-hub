import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Types for the Team Leader Dashboard
export interface TeamOKR {
  id: string;
  title: string;
  description: string | null;
  progress: number;
  status: 'active' | 'at-risk' | 'behind' | 'completed';
  startDate: string | null;
  endDate: string | null;
  keyResultsCount: number;
  keyResultsCompleted: number;
}

export interface CurrentSprint {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  plannedPoints: number;
  completedPoints: number;
  capacity: number;
  daysRemaining: number;
  progress: number;
}

export interface AgileIndicators {
  currentVelocity: number;
  avgVelocity: number;
  currentCapacity: number;
  avgCapacity: number;
  velocityTrend: 'up' | 'down' | 'stable';
  velocityHistory: {
    sprint: string;
    planned: number;
    completed: number;
  }[];
}

export interface LeaderTeam {
  id: string;
  name: string;
  color: string | null;
  memberCount: number;
}

// Get the team where the current user is a leader
export const useLeaderTeam = () => {
  const { profile, getTenantId } = useAuth();
  const tenantId = getTenantId();

  return useQuery({
    queryKey: ['leader-team', profile?.id, tenantId],
    queryFn: async (): Promise<LeaderTeam | null> => {
      if (!profile?.id || !tenantId) return null;

      // Find team where current user is the leader
      const { data: team, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          color
        `)
        .eq('tenant_id', tenantId)
        .eq('leader_id', profile.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!team) return null;

      // Get member count
      const { count, error: countError } = await supabase
        .from('team_members')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', team.id);

      if (countError) throw countError;

      return {
        id: team.id,
        name: team.name,
        color: team.color,
        memberCount: count || 0,
      };
    },
    enabled: !!profile?.id && !!tenantId,
  });
};

// Get OKRs for the leader's team
export const useTeamOKRs = (teamId: string | null) => {
  const { getTenantId } = useAuth();
  const tenantId = getTenantId();

  return useQuery({
    queryKey: ['team-okrs', teamId, tenantId],
    queryFn: async (): Promise<TeamOKR[]> => {
      if (!teamId || !tenantId) return [];

      const { data: okrs, error } = await supabase
        .from('okrs')
        .select(`
          id,
          title,
          description,
          progress,
          status,
          start_date,
          end_date
        `)
        .eq('team_id', teamId)
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get key results for each OKR
      const okrIds = okrs?.map(o => o.id) || [];
      const { data: keyResults, error: krError } = await supabase
        .from('key_results')
        .select('id, okr_id, progress')
        .in('okr_id', okrIds.length > 0 ? okrIds : ['00000000-0000-0000-0000-000000000000']);

      if (krError) throw krError;

      return (okrs || []).map(okr => {
        const okrKRs = keyResults?.filter(kr => kr.okr_id === okr.id) || [];
        const completedKRs = okrKRs.filter(kr => kr.progress >= 100).length;
        
        // Determine status based on progress and date
        let status: TeamOKR['status'] = 'active';
        if (okr.progress >= 100) {
          status = 'completed';
        } else if (okr.progress < 30 && okr.end_date) {
          const endDate = new Date(okr.end_date);
          const now = new Date();
          const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysLeft < 7) status = 'behind';
          else if (daysLeft < 14) status = 'at-risk';
        }

        return {
          id: okr.id,
          title: okr.title,
          description: okr.description,
          progress: okr.progress,
          status,
          startDate: okr.start_date,
          endDate: okr.end_date,
          keyResultsCount: okrKRs.length,
          keyResultsCompleted: completedKRs,
        };
      });
    },
    enabled: !!teamId && !!tenantId,
  });
};

// Get current sprint for the team
export const useCurrentSprint = (teamId: string | null) => {
  return useQuery({
    queryKey: ['current-sprint', teamId],
    queryFn: async (): Promise<CurrentSprint | null> => {
      if (!teamId) return null;

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
        daysRemaining,
        progress: Math.min(100, progress),
      };
    },
    enabled: !!teamId,
  });
};

// Get agile indicators for the team
export const useAgileIndicators = (teamId: string | null) => {
  return useQuery({
    queryKey: ['agile-indicators', teamId],
    queryFn: async (): Promise<AgileIndicators> => {
      if (!teamId) {
        return {
          currentVelocity: 0,
          avgVelocity: 0,
          currentCapacity: 0,
          avgCapacity: 0,
          velocityTrend: 'stable',
          velocityHistory: [],
        };
      }

      // Get last 5 sprints for history
      const { data: sprints, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('team_id', teamId)
        .in('status', ['completed', 'active'])
        .order('end_date', { ascending: false })
        .limit(5);

      if (error) throw error;

      if (!sprints || sprints.length === 0) {
        return {
          currentVelocity: 0,
          avgVelocity: 0,
          currentCapacity: 0,
          avgCapacity: 0,
          velocityTrend: 'stable',
          velocityHistory: [],
        };
      }

      const activeSprint = sprints.find(s => s.status === 'active');
      const completedSprints = sprints.filter(s => s.status === 'completed');

      // Calculate averages from completed sprints
      const avgVelocity = completedSprints.length > 0
        ? Math.round(completedSprints.reduce((sum, s) => sum + (s.completed_points || 0), 0) / completedSprints.length)
        : 0;

      const avgCapacity = completedSprints.length > 0
        ? Math.round(completedSprints.reduce((sum, s) => sum + (s.capacity || 100), 0) / completedSprints.length)
        : 100;

      // Calculate velocity trend
      let velocityTrend: 'up' | 'down' | 'stable' = 'stable';
      if (completedSprints.length >= 2) {
        const [latest, previous] = completedSprints;
        const diff = (latest.completed_points || 0) - (previous.completed_points || 0);
        if (diff > 2) velocityTrend = 'up';
        else if (diff < -2) velocityTrend = 'down';
      }

      // Build velocity history (reversed for chronological order)
      const velocityHistory = sprints
        .slice()
        .reverse()
        .map(s => ({
          sprint: s.name,
          planned: s.planned_points || 0,
          completed: s.completed_points || 0,
        }));

      return {
        currentVelocity: activeSprint?.completed_points || 0,
        avgVelocity,
        currentCapacity: activeSprint?.capacity || 100,
        avgCapacity,
        velocityTrend,
        velocityHistory,
      };
    },
    enabled: !!teamId,
  });
};

// Combined hook for all dashboard data
export const useTeamLeaderDashboard = () => {
  const { data: team, isLoading: teamLoading, error: teamError } = useLeaderTeam();
  const { data: okrs, isLoading: okrsLoading, error: okrsError } = useTeamOKRs(team?.id || null);
  const { data: sprint, isLoading: sprintLoading, error: sprintError } = useCurrentSprint(team?.id || null);
  const { data: indicators, isLoading: indicatorsLoading, error: indicatorsError } = useAgileIndicators(team?.id || null);

  return {
    team,
    okrs: okrs || [],
    sprint,
    indicators: indicators || {
      currentVelocity: 0,
      avgVelocity: 0,
      currentCapacity: 0,
      avgCapacity: 0,
      velocityTrend: 'stable' as const,
      velocityHistory: [],
    },
    isLoading: teamLoading || okrsLoading || sprintLoading || indicatorsLoading,
    error: teamError || okrsError || sprintError || indicatorsError,
  };
};
