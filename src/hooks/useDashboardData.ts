import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardStats {
  activeOkrs: number;
  completedOkrs: number;
  atRiskOkrs: number;
  delayedOkrs: number;
  averageProgress: number;
}

export interface TeamWithStats {
  id: string;
  name: string;
  slug: string;
  color: string;
  currentSprint: string | null;
  sprintProgress: number;
  okrCount: number;
  keyResultCount: number;
  averageProgress: number;
  healthStatus: 'on-track' | 'at-risk' | 'delayed';
}

export interface SprintStats {
  averageVelocity: number;
  averageCapacity: number;
  velocityTrend: { sprint: string; planned: number; completed: number }[];
}

export interface FeedEvent {
  id: string;
  event_type: 'okr_update' | 'wiki_update' | 'milestone' | 'comment' | 'team_update' | 'sprint_update';
  title: string;
  description: string | null;
  created_at: string;
  is_read: boolean;
  author: {
    name: string;
    initial: string;
    color: string;
  } | null;
}

export const useDashboardStats = (tenantId: string | null) => {
  return useQuery({
    queryKey: ['dashboard-stats', tenantId],
    queryFn: async (): Promise<DashboardStats> => {
      if (!tenantId) {
        return {
          activeOkrs: 0,
          completedOkrs: 0,
          atRiskOkrs: 0,
          delayedOkrs: 0,
          averageProgress: 0,
        };
      }

      const { data: okrs, error } = await supabase
        .from('okrs')
        .select('id, status, progress, type')
        .eq('tenant_id', tenantId)
        .eq('type', 'objective');

      if (error) throw error;

      const objectives = okrs || [];
      const active = objectives.filter(o => o.status === 'active').length;
      const completed = objectives.filter(o => o.status === 'completed').length;
      const atRisk = objectives.filter(o => o.status === 'at_risk').length;
      const delayed = objectives.filter(o => o.status === 'delayed').length;
      const avgProgress = objectives.length > 0
        ? Math.round(objectives.reduce((sum, o) => sum + o.progress, 0) / objectives.length)
        : 0;

      return {
        activeOkrs: active + atRisk + delayed,
        completedOkrs: completed,
        atRiskOkrs: atRisk,
        delayedOkrs: delayed,
        averageProgress: avgProgress,
      };
    },
    enabled: !!tenantId,
  });
};

export const useTeamsWithStats = (tenantId: string | null) => {
  return useQuery({
    queryKey: ['teams-with-stats', tenantId],
    queryFn: async (): Promise<TeamWithStats[]> => {
      if (!tenantId) return [];

      // Get teams
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, slug, color')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (teamsError) throw teamsError;
      if (!teams || teams.length === 0) return [];

      // Get active sprints for each team
      const teamIds = teams.map(t => t.id);
      const { data: sprints } = await supabase
        .from('sprints')
        .select('id, team_id, name, planned_points, completed_points, status')
        .in('team_id', teamIds)
        .eq('status', 'active');

      // Get OKRs for each team
      const { data: okrs } = await supabase
        .from('okrs')
        .select('id, team_id, type, progress, status')
        .eq('tenant_id', tenantId)
        .in('team_id', teamIds);

      return teams.map(team => {
        const teamSprint = sprints?.find(s => s.team_id === team.id);
        const teamOkrs = okrs?.filter(o => o.team_id === team.id) || [];
        const objectives = teamOkrs.filter(o => o.type === 'objective');
        const keyResults = teamOkrs.filter(o => o.type === 'key_result');
        
        const avgProgress = objectives.length > 0
          ? Math.round(objectives.reduce((sum, o) => sum + o.progress, 0) / objectives.length)
          : 0;

        const sprintProgress = teamSprint && teamSprint.planned_points > 0
          ? Math.round((teamSprint.completed_points / teamSprint.planned_points) * 100)
          : 0;

        let healthStatus: 'on-track' | 'at-risk' | 'delayed' = 'on-track';
        if (avgProgress < 50) healthStatus = 'delayed';
        else if (avgProgress < 70) healthStatus = 'at-risk';

        return {
          id: team.id,
          name: team.name,
          slug: team.slug,
          color: team.color || '#6366f1',
          currentSprint: teamSprint?.name || null,
          sprintProgress,
          okrCount: objectives.length,
          keyResultCount: keyResults.length,
          averageProgress: avgProgress,
          healthStatus,
        };
      });
    },
    enabled: !!tenantId,
  });
};

export const useSprintStats = (tenantId: string | null) => {
  return useQuery({
    queryKey: ['sprint-stats', tenantId],
    queryFn: async (): Promise<SprintStats> => {
      if (!tenantId) {
        return { averageVelocity: 0, averageCapacity: 0, velocityTrend: [] };
      }

      // Get teams for tenant
      const { data: teams } = await supabase
        .from('teams')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (!teams || teams.length === 0) {
        return { averageVelocity: 0, averageCapacity: 0, velocityTrend: [] };
      }

      const teamIds = teams.map(t => t.id);

      // Get completed sprints for velocity calculation
      const { data: sprints } = await supabase
        .from('sprints')
        .select('name, planned_points, completed_points, capacity, status')
        .in('team_id', teamIds)
        .order('end_date', { ascending: false })
        .limit(10);

      if (!sprints || sprints.length === 0) {
        return { averageVelocity: 0, averageCapacity: 0, velocityTrend: [] };
      }

      const completedSprints = sprints.filter(s => s.status === 'completed');
      const avgVelocity = completedSprints.length > 0
        ? Math.round(completedSprints.reduce((sum, s) => sum + s.completed_points, 0) / completedSprints.length)
        : 0;

      const avgCapacity = sprints.length > 0
        ? Math.round(sprints.reduce((sum, s) => sum + s.capacity, 0) / sprints.length)
        : 0;

      const velocityTrend = sprints.slice(0, 5).reverse().map(s => ({
        sprint: s.name,
        planned: s.planned_points,
        completed: s.completed_points,
      }));

      return {
        averageVelocity: avgVelocity,
        averageCapacity: avgCapacity,
        velocityTrend,
      };
    },
    enabled: !!tenantId,
  });
};

export const useFeedEvents = (tenantId: string | null, limit = 10) => {
  return useQuery({
    queryKey: ['feed-events', tenantId, limit],
    queryFn: async (): Promise<FeedEvent[]> => {
      if (!tenantId) return [];

      const { data: events, error } = await supabase
        .from('feed_events')
        .select(`
          id,
          event_type,
          title,
          description,
          created_at,
          is_read,
          author_id
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (!events || events.length === 0) return [];

      // Get author profiles
      const authorIds = events.map(e => e.author_id).filter(Boolean);
      let profiles: Record<string, { name: string; avatar_url: string | null }> = {};

      if (authorIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', authorIds);

        if (profilesData) {
          profiles = profilesData.reduce((acc, p) => {
            acc[p.id] = { name: p.name, avatar_url: p.avatar_url };
            return acc;
          }, {} as Record<string, { name: string; avatar_url: string | null }>);
        }
      }

      const colors = ['bg-violet-500', 'bg-emerald-500', 'bg-blue-500', 'bg-orange-500', 'bg-pink-500'];

      return events.map((event, index) => {
        const author = event.author_id && profiles[event.author_id];
        return {
          id: event.id,
          event_type: event.event_type as FeedEvent['event_type'],
          title: event.title,
          description: event.description,
          created_at: event.created_at,
          is_read: event.is_read,
          author: author ? {
            name: author.name,
            initial: author.name.charAt(0).toUpperCase(),
            color: colors[index % colors.length],
          } : null,
        };
      });
    },
    enabled: !!tenantId,
  });
};

export const useDelayedOkrs = (tenantId: string | null) => {
  return useQuery({
    queryKey: ['delayed-okrs', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data: okrs, error } = await supabase
        .from('okrs')
        .select(`
          id,
          title,
          end_date,
          status,
          team_id
        `)
        .eq('tenant_id', tenantId)
        .eq('type', 'objective')
        .in('status', ['delayed', 'at_risk'])
        .order('end_date', { ascending: true })
        .limit(5);

      if (error) throw error;
      if (!okrs || okrs.length === 0) return [];

      // Get team names
      const teamIds = okrs.map(o => o.team_id).filter(Boolean);
      let teams: Record<string, string> = {};

      if (teamIds.length > 0) {
        const { data: teamsData } = await supabase
          .from('teams')
          .select('id, name')
          .in('id', teamIds);

        if (teamsData) {
          teams = teamsData.reduce((acc, t) => {
            acc[t.id] = t.name;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      return okrs.map(okr => {
        const endDate = okr.end_date ? new Date(okr.end_date) : null;
        const today = new Date();
        const daysDelayed = endDate && endDate < today
          ? Math.floor((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        return {
          id: okr.id,
          name: okr.title,
          team: okr.team_id ? teams[okr.team_id] || 'Sem equipe' : 'Sem equipe',
          daysDelayed,
          priority: okr.status === 'delayed' ? 'high' as const : 'medium' as const,
        };
      });
    },
    enabled: !!tenantId,
  });
};
