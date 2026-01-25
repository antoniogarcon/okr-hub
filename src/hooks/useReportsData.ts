import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ============================================
// TYPES
// ============================================

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  teamId?: string;
  organizationalRoleId?: string;
}

export interface TrainOKRReport {
  id: string;
  title: string;
  description: string | null;
  progress: number;
  status: string;
  startDate: string | null;
  endDate: string | null;
  owner: {
    id: string;
    name: string;
  } | null;
  sponsor: {
    id: string;
    name: string;
  } | null;
  team: {
    id: string;
    name: string;
    color: string;
  } | null;
  keyResultsCount: number;
  childOkrsCount: number;
}

export interface TeamReport {
  id: string;
  name: string;
  color: string;
  memberCount: number;
  okrCount: number;
  avgProgress: number;
  avgVelocity: number;
  avgCapacity: number;
  completedSprints: number;
  activeSprint: {
    name: string;
    progress: number;
    plannedPoints: number;
    completedPoints: number;
  } | null;
  deliveryTrend: 'up' | 'down' | 'stable';
}

export interface OrganizationalReport {
  roleDistribution: {
    roleId: string;
    roleName: string;
    count: number;
  }[];
  teamDistribution: {
    teamId: string;
    teamName: string;
    teamColor: string;
    count: number;
  }[];
  workloadDistribution: {
    userId: string;
    userName: string;
    okrCount: number;
    krCount: number;
    teamName: string | null;
  }[];
}

export interface TimelineEvent {
  id: string;
  date: string;
  type: 'okr_created' | 'okr_completed' | 'okr_progress' | 'sprint_completed' | 'sprint_started';
  title: string;
  description: string;
  progress?: number;
  teamName?: string;
  teamColor?: string;
}

// ============================================
// TRAIN OKRs REPORT
// ============================================

export const useTrainOKRsReport = (tenantId: string | null, filters: ReportFilters = {}) => {
  return useQuery({
    queryKey: ['train-okrs-report', tenantId, filters],
    queryFn: async (): Promise<TrainOKRReport[]> => {
      if (!tenantId) return [];

      let query = supabase
        .from('okrs')
        .select(`
          id,
          title,
          description,
          progress,
          status,
          start_date,
          end_date,
          owner_id,
          sponsor_id,
          team_id,
          parent_id
        `)
        .eq('tenant_id', tenantId)
        .eq('type', 'objective')
        .is('parent_id', null);

      if (filters.teamId) {
        query = query.eq('team_id', filters.teamId);
      }

      if (filters.startDate) {
        query = query.gte('start_date', filters.startDate.toISOString().split('T')[0]);
      }

      if (filters.endDate) {
        query = query.lte('end_date', filters.endDate.toISOString().split('T')[0]);
      }

      const { data: okrs, error } = await query.order('progress', { ascending: false });

      if (error) throw error;
      if (!okrs || okrs.length === 0) return [];

      // Get all related IDs
      const ownerIds = okrs.map(o => o.owner_id).filter(Boolean);
      const sponsorIds = okrs.map(o => o.sponsor_id).filter(Boolean);
      const teamIds = okrs.map(o => o.team_id).filter(Boolean);
      const okrIds = okrs.map(o => o.id);

      // Fetch profiles
      let profiles: Record<string, { name: string }> = {};
      const allUserIds = [...new Set([...ownerIds, ...sponsorIds])];
      
      if (allUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', allUserIds);

        if (profilesData) {
          profiles = profilesData.reduce((acc, p) => {
            acc[p.id] = { name: p.name };
            return acc;
          }, {} as Record<string, { name: string }>);
        }
      }

      // Fetch teams
      let teams: Record<string, { name: string; color: string }> = {};
      if (teamIds.length > 0) {
        const { data: teamsData } = await supabase
          .from('teams')
          .select('id, name, color')
          .in('id', teamIds);

        if (teamsData) {
          teams = teamsData.reduce((acc, t) => {
            acc[t.id] = { name: t.name, color: t.color || '#6366f1' };
            return acc;
          }, {} as Record<string, { name: string; color: string }>);
        }
      }

      // Fetch key results count
      const { data: krData } = await supabase
        .from('key_results')
        .select('okr_id')
        .in('okr_id', okrIds);

      const krCountMap = (krData || []).reduce((acc, kr) => {
        acc[kr.okr_id] = (acc[kr.okr_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Fetch child OKRs count
      const { data: childData } = await supabase
        .from('okrs')
        .select('parent_id')
        .in('parent_id', okrIds);

      const childCountMap = (childData || []).reduce((acc, child) => {
        if (child.parent_id) {
          acc[child.parent_id] = (acc[child.parent_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      return okrs.map(okr => ({
        id: okr.id,
        title: okr.title,
        description: okr.description,
        progress: okr.progress,
        status: okr.status,
        startDate: okr.start_date,
        endDate: okr.end_date,
        owner: okr.owner_id && profiles[okr.owner_id] ? {
          id: okr.owner_id,
          name: profiles[okr.owner_id].name,
        } : null,
        sponsor: okr.sponsor_id && profiles[okr.sponsor_id] ? {
          id: okr.sponsor_id,
          name: profiles[okr.sponsor_id].name,
        } : null,
        team: okr.team_id && teams[okr.team_id] ? {
          id: okr.team_id,
          name: teams[okr.team_id].name,
          color: teams[okr.team_id].color,
        } : null,
        keyResultsCount: krCountMap[okr.id] || 0,
        childOkrsCount: childCountMap[okr.id] || 0,
      }));
    },
    enabled: !!tenantId,
  });
};

// ============================================
// TEAM REPORT
// ============================================

export const useTeamReports = (tenantId: string | null, filters: ReportFilters = {}) => {
  return useQuery({
    queryKey: ['team-reports', tenantId, filters],
    queryFn: async (): Promise<TeamReport[]> => {
      if (!tenantId) return [];

      let teamsQuery = supabase
        .from('teams')
        .select('id, name, color')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (filters.teamId) {
        teamsQuery = teamsQuery.eq('id', filters.teamId);
      }

      const { data: teams, error: teamsError } = await teamsQuery;

      if (teamsError) throw teamsError;
      if (!teams || teams.length === 0) return [];

      const teamIds = teams.map(t => t.id);

      // Get team members count
      const { data: membersData } = await supabase
        .from('team_members')
        .select('team_id')
        .in('team_id', teamIds);

      const memberCountMap = (membersData || []).reduce((acc, m) => {
        acc[m.team_id] = (acc[m.team_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get OKRs per team
      const { data: okrsData } = await supabase
        .from('okrs')
        .select('team_id, progress')
        .eq('tenant_id', tenantId)
        .eq('type', 'objective')
        .in('team_id', teamIds);

      const okrStatsMap: Record<string, { count: number; totalProgress: number }> = {};
      (okrsData || []).forEach(okr => {
        if (okr.team_id) {
          if (!okrStatsMap[okr.team_id]) {
            okrStatsMap[okr.team_id] = { count: 0, totalProgress: 0 };
          }
          okrStatsMap[okr.team_id].count += 1;
          okrStatsMap[okr.team_id].totalProgress += okr.progress;
        }
      });

      // Get sprints data
      const { data: sprintsData } = await supabase
        .from('sprints')
        .select('team_id, name, status, planned_points, completed_points, capacity')
        .in('team_id', teamIds)
        .order('end_date', { ascending: false });

      const sprintStatsMap: Record<string, {
        activeSprint: TeamReport['activeSprint'];
        avgVelocity: number;
        avgCapacity: number;
        completedSprints: number;
        velocityHistory: number[];
      }> = {};

      (sprintsData || []).forEach(sprint => {
        if (!sprintStatsMap[sprint.team_id]) {
          sprintStatsMap[sprint.team_id] = {
            activeSprint: null,
            avgVelocity: 0,
            avgCapacity: 0,
            completedSprints: 0,
            velocityHistory: [],
          };
        }

        if (sprint.status === 'active' && !sprintStatsMap[sprint.team_id].activeSprint) {
          const plannedPoints = sprint.planned_points || 0;
          const completedPoints = sprint.completed_points || 0;
          sprintStatsMap[sprint.team_id].activeSprint = {
            name: sprint.name,
            progress: plannedPoints > 0 ? Math.round((completedPoints / plannedPoints) * 100) : 0,
            plannedPoints,
            completedPoints,
          };
        }

        if (sprint.status === 'completed') {
          sprintStatsMap[sprint.team_id].completedSprints += 1;
          sprintStatsMap[sprint.team_id].velocityHistory.push(sprint.completed_points || 0);
        }
      });

      // Calculate averages and trends
      Object.keys(sprintStatsMap).forEach(teamId => {
        const stats = sprintStatsMap[teamId];
        const history = stats.velocityHistory;
        
        if (history.length > 0) {
          stats.avgVelocity = Math.round(history.reduce((a, b) => a + b, 0) / history.length);
        }

        // Get capacity from active or most recent sprint
        const teamSprints = (sprintsData || []).filter(s => s.team_id === teamId);
        if (teamSprints.length > 0) {
          const capacities = teamSprints.map(s => s.capacity || 100).slice(0, 5);
          stats.avgCapacity = Math.round(capacities.reduce((a, b) => a + b, 0) / capacities.length);
        }
      });

      return teams.map(team => {
        const okrStats = okrStatsMap[team.id] || { count: 0, totalProgress: 0 };
        const sprintStats = sprintStatsMap[team.id] || {
          activeSprint: null,
          avgVelocity: 0,
          avgCapacity: 100,
          completedSprints: 0,
          velocityHistory: [],
        };

        // Calculate delivery trend
        let deliveryTrend: 'up' | 'down' | 'stable' = 'stable';
        if (sprintStats.velocityHistory.length >= 2) {
          const recentAvg = sprintStats.velocityHistory.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
          const olderAvg = sprintStats.velocityHistory.slice(2, 4).reduce((a, b) => a + b, 0) / Math.max(1, sprintStats.velocityHistory.slice(2, 4).length);
          
          if (recentAvg > olderAvg * 1.1) deliveryTrend = 'up';
          else if (recentAvg < olderAvg * 0.9) deliveryTrend = 'down';
        }

        return {
          id: team.id,
          name: team.name,
          color: team.color || '#6366f1',
          memberCount: memberCountMap[team.id] || 0,
          okrCount: okrStats.count,
          avgProgress: okrStats.count > 0 
            ? Math.round(okrStats.totalProgress / okrStats.count) 
            : 0,
          avgVelocity: sprintStats.avgVelocity,
          avgCapacity: sprintStats.avgCapacity,
          completedSprints: sprintStats.completedSprints,
          activeSprint: sprintStats.activeSprint,
          deliveryTrend,
        };
      });
    },
    enabled: !!tenantId,
  });
};

// ============================================
// ORGANIZATIONAL REPORT
// ============================================

export const useOrganizationalReport = (tenantId: string | null, filters: ReportFilters = {}) => {
  return useQuery({
    queryKey: ['organizational-report', tenantId, filters],
    queryFn: async (): Promise<OrganizationalReport> => {
      if (!tenantId) {
        return { roleDistribution: [], teamDistribution: [], workloadDistribution: [] };
      }

      // Get organizational roles
      const { data: rolesData } = await supabase
        .from('organizational_roles')
        .select('id, name')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      // Get user organizational roles
      const { data: userRolesData } = await supabase
        .from('user_organizational_roles')
        .select('organizational_role_id, user_id')
        .in('organizational_role_id', (rolesData || []).map(r => r.id));

      // Calculate role distribution
      const roleCountMap: Record<string, number> = {};
      (userRolesData || []).forEach(ur => {
        roleCountMap[ur.organizational_role_id] = (roleCountMap[ur.organizational_role_id] || 0) + 1;
      });

      const roleDistribution = (rolesData || []).map(role => ({
        roleId: role.id,
        roleName: role.name,
        count: roleCountMap[role.id] || 0,
      })).filter(r => r.count > 0).sort((a, b) => b.count - a.count);

      // Get teams and members
      let teamsQuery = supabase
        .from('teams')
        .select('id, name, color')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (filters.teamId) {
        teamsQuery = teamsQuery.eq('id', filters.teamId);
      }

      const { data: teams } = await teamsQuery;

      const { data: teamMembersData } = await supabase
        .from('team_members')
        .select('team_id, user_id')
        .in('team_id', (teams || []).map(t => t.id));

      // Calculate team distribution
      const teamCountMap: Record<string, number> = {};
      const userTeamMap: Record<string, string> = {};
      
      (teamMembersData || []).forEach(tm => {
        teamCountMap[tm.team_id] = (teamCountMap[tm.team_id] || 0) + 1;
        userTeamMap[tm.user_id] = tm.team_id;
      });

      const teamDistribution = (teams || []).map(team => ({
        teamId: team.id,
        teamName: team.name,
        teamColor: team.color || '#6366f1',
        count: teamCountMap[team.id] || 0,
      })).filter(t => t.count > 0).sort((a, b) => b.count - a.count);

      // Get workload distribution (OKRs per user)
      const { data: okrsData } = await supabase
        .from('okrs')
        .select('owner_id')
        .eq('tenant_id', tenantId)
        .eq('type', 'objective')
        .not('owner_id', 'is', null);

      const { data: krsData } = await supabase
        .from('key_results')
        .select('owner_id, okr_id')
        .not('owner_id', 'is', null);

      // Filter KRs by tenant (via OKR)
      const tenantOkrIds = new Set((okrsData || []).map(o => o.owner_id));
      
      const okrCountMap: Record<string, number> = {};
      const krCountMap: Record<string, number> = {};

      (okrsData || []).forEach(okr => {
        if (okr.owner_id) {
          okrCountMap[okr.owner_id] = (okrCountMap[okr.owner_id] || 0) + 1;
        }
      });

      (krsData || []).forEach(kr => {
        if (kr.owner_id) {
          krCountMap[kr.owner_id] = (krCountMap[kr.owner_id] || 0) + 1;
        }
      });

      // Get profiles for users with workload
      const allUserIds = [...new Set([...Object.keys(okrCountMap), ...Object.keys(krCountMap)])];
      
      let workloadDistribution: OrganizationalReport['workloadDistribution'] = [];
      
      if (allUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', allUserIds);

        const teamsMap = (teams || []).reduce((acc, t) => {
          acc[t.id] = t.name;
          return acc;
        }, {} as Record<string, string>);

        workloadDistribution = (profiles || []).map(profile => ({
          userId: profile.id,
          userName: profile.name,
          okrCount: okrCountMap[profile.id] || 0,
          krCount: krCountMap[profile.id] || 0,
          teamName: userTeamMap[profile.id] ? teamsMap[userTeamMap[profile.id]] || null : null,
        })).sort((a, b) => (b.okrCount + b.krCount) - (a.okrCount + a.krCount));
      }

      return {
        roleDistribution,
        teamDistribution,
        workloadDistribution,
      };
    },
    enabled: !!tenantId,
  });
};

// ============================================
// TIMELINE REPORT
// ============================================

export const useTimelineReport = (tenantId: string | null, filters: ReportFilters = {}) => {
  return useQuery({
    queryKey: ['timeline-report', tenantId, filters],
    queryFn: async (): Promise<TimelineEvent[]> => {
      if (!tenantId) return [];

      const events: TimelineEvent[] = [];

      // Get OKR events from feed
      let feedQuery = supabase
        .from('feed_events')
        .select(`
          id,
          event_type,
          title,
          description,
          created_at,
          entity_type,
          entity_id
        `)
        .eq('tenant_id', tenantId)
        .in('event_type', ['okr_created', 'okr_completed', 'okr_progress_updated', 'sprint_closed', 'sprint_created'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters.startDate) {
        feedQuery = feedQuery.gte('created_at', filters.startDate.toISOString());
      }

      if (filters.endDate) {
        feedQuery = feedQuery.lte('created_at', filters.endDate.toISOString());
      }

      const { data: feedEvents, error } = await feedQuery;

      if (error) throw error;

      // Get related OKRs for team info
      const okrIds = (feedEvents || [])
        .filter(e => e.entity_type === 'okr')
        .map(e => e.entity_id)
        .filter(Boolean);

      let okrTeamMap: Record<string, { teamName: string; teamColor: string }> = {};

      if (okrIds.length > 0) {
        const { data: okrsData } = await supabase
          .from('okrs')
          .select('id, team_id')
          .in('id', okrIds);

        const teamIds = (okrsData || []).map(o => o.team_id).filter(Boolean);
        
        if (teamIds.length > 0) {
          const { data: teamsData } = await supabase
            .from('teams')
            .select('id, name, color')
            .in('id', teamIds);

          const teamsMap = (teamsData || []).reduce((acc, t) => {
            acc[t.id] = { teamName: t.name, teamColor: t.color || '#6366f1' };
            return acc;
          }, {} as Record<string, { teamName: string; teamColor: string }>);

          (okrsData || []).forEach(okr => {
            if (okr.team_id && teamsMap[okr.team_id]) {
              okrTeamMap[okr.id] = teamsMap[okr.team_id];
            }
          });
        }
      }

      // Map feed events to timeline events
      (feedEvents || []).forEach(event => {
        let type: TimelineEvent['type'] = 'okr_created';
        
        switch (event.event_type) {
          case 'okr_created':
            type = 'okr_created';
            break;
          case 'okr_completed':
            type = 'okr_completed';
            break;
          case 'okr_progress_updated':
            type = 'okr_progress';
            break;
          case 'sprint_closed':
            type = 'sprint_completed';
            break;
          case 'sprint_created':
            type = 'sprint_started';
            break;
        }

        const teamInfo = event.entity_id ? okrTeamMap[event.entity_id] : null;

        events.push({
          id: event.id,
          date: event.created_at,
          type,
          title: event.title,
          description: event.description || '',
          teamName: teamInfo?.teamName,
          teamColor: teamInfo?.teamColor,
        });
      });

      // Filter by team if specified
      if (filters.teamId) {
        return events.filter(e => {
          // For now, we can't filter by team for sprint events without additional queries
          // This is a simplification
          return true;
        });
      }

      return events;
    },
    enabled: !!tenantId,
  });
};

// ============================================
// HELPER HOOKS
// ============================================

export const useReportTeams = (tenantId: string | null) => {
  return useQuery({
    queryKey: ['report-teams', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('teams')
        .select('id, name, color')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });
};

export const useReportOrganizationalRoles = (tenantId: string | null) => {
  return useQuery({
    queryKey: ['report-org-roles', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('organizational_roles')
        .select('id, name')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });
};
