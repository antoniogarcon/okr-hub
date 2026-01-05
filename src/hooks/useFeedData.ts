import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type FeedEventType = 
  | 'okr_created' 
  | 'okr_progress_updated' 
  | 'okr_completed' 
  | 'okr_linked'
  | 'okr_modified'
  | 'sprint_velocity_updated'
  | 'sprint_capacity_updated'
  | 'sprint_closed'
  | 'wiki_published'
  | 'wiki_updated'
  | 'team_member_added'
  | 'team_update';

export type FeedEntityType = 'okr' | 'sprint' | 'wiki' | 'team' | 'capacity';

export type FeedFilter = 'all' | 'okr_progress' | 'okr_changes' | 'teams' | 'capacity' | 'wiki';

export interface FeedEvent {
  id: string;
  event_type: FeedEventType;
  entity_type: FeedEntityType;
  title: string;
  description: string | null;
  author_id: string | null;
  author_name: string | null;
  author_avatar: string | null;
  team_name: string | null;
  team_color: string | null;
  entity_id: string | null;
  created_at: string;
  is_read: boolean;
  change_value: string | null;
  change_type: 'positive' | 'negative' | 'neutral' | null;
}

export interface FeedStats {
  updatesToday: number;
  okrsUpdated: number;
  activeTeams: number;
  avgProgress: number;
}

const getEntityTypesForFilter = (filter: FeedFilter): string[] => {
  switch (filter) {
    case 'okr_progress':
      return ['okr'];
    case 'okr_changes':
      return ['okr'];
    case 'teams':
      return ['team'];
    case 'capacity':
      return ['sprint', 'capacity'];
    case 'wiki':
      return ['wiki'];
    default:
      return [];
  }
};

const getEventTypesForFilter = (filter: FeedFilter): string[] => {
  switch (filter) {
    case 'okr_progress':
      return ['okr_progress_updated', 'okr_completed'];
    case 'okr_changes':
      return ['okr_created', 'okr_modified', 'okr_linked'];
    case 'teams':
      return ['team_member_added', 'team_update'];
    case 'capacity':
      return ['sprint_velocity_updated', 'sprint_capacity_updated', 'sprint_closed'];
    case 'wiki':
      return ['wiki_published', 'wiki_updated'];
    default:
      return [];
  }
};

export const useFeedEvents = (
  tenantId: string | undefined,
  filter: FeedFilter = 'all',
  searchQuery: string = '',
  page: number = 1,
  pageSize: number = 10
) => {
  return useQuery({
    queryKey: ['feed-events', tenantId, filter, searchQuery, page, pageSize],
    queryFn: async (): Promise<{ events: FeedEvent[]; totalCount: number }> => {
      if (!tenantId) return { events: [], totalCount: 0 };

      let query = supabase
        .from('feed_events')
        .select(`
          id,
          event_type,
          entity_type,
          title,
          description,
          author_id,
          entity_id,
          created_at,
          is_read
        `, { count: 'exact' })
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      // Apply filter
      if (filter !== 'all') {
        const eventTypes = getEventTypesForFilter(filter);
        if (eventTypes.length > 0) {
          query = query.in('event_type', eventTypes);
        }
      }

      // Apply search
      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data: events, error, count } = await query;

      if (error) throw error;

      // Fetch author profiles
      const authorIds = [...new Set(events?.map(e => e.author_id).filter(Boolean) as string[])];
      let authorProfiles: Record<string, { name: string; avatar_url: string | null }> = {};
      
      if (authorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name, avatar_url')
          .in('user_id', authorIds);
        
        if (profiles) {
          authorProfiles = profiles.reduce((acc, p) => {
            acc[p.user_id] = { name: p.name, avatar_url: p.avatar_url };
            return acc;
          }, {} as Record<string, { name: string; avatar_url: string | null }>);
        }
      }

      // Fetch team info from OKRs if applicable
      const okrIds = events?.filter(e => e.entity_type === 'okr' && e.entity_id).map(e => e.entity_id) || [];
      let teamsByOkr: Record<string, { name: string; color: string | null }> = {};
      
      if (okrIds.length > 0) {
        const { data: okrs } = await supabase
          .from('okrs')
          .select('id, team_id')
          .in('id', okrIds as string[]);
        
        if (okrs) {
          const teamIds = [...new Set(okrs.map(o => o.team_id).filter(Boolean) as string[])];
          if (teamIds.length > 0) {
            const { data: teams } = await supabase
              .from('teams')
              .select('id, name, color')
              .in('id', teamIds);
            
            if (teams) {
              const teamsById = teams.reduce((acc, t) => {
                acc[t.id] = { name: t.name, color: t.color };
                return acc;
              }, {} as Record<string, { name: string; color: string | null }>);
              
              okrs.forEach(okr => {
                if (okr.team_id && teamsById[okr.team_id]) {
                  teamsByOkr[okr.id] = teamsById[okr.team_id];
                }
              });
            }
          }
        }
      }

      const enrichedEvents: FeedEvent[] = (events || []).map(event => {
        const author = event.author_id ? authorProfiles[event.author_id] : null;
        const team = event.entity_id ? teamsByOkr[event.entity_id] : null;
        
        // Parse change value from description (format: "+X%" or "-X pts")
        let changeValue: string | null = null;
        let changeType: 'positive' | 'negative' | 'neutral' | null = null;
        
        if (event.description) {
          const progressMatch = event.description.match(/(\d+)%\s*[→>]\s*(\d+)%/);
          if (progressMatch) {
            const diff = parseInt(progressMatch[2]) - parseInt(progressMatch[1]);
            changeValue = diff > 0 ? `+${diff}%` : `${diff}%`;
            changeType = diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral';
          }
          
          const ptsMatch = event.description.match(/([+-]\d+)\s*pts/);
          if (ptsMatch) {
            changeValue = `${ptsMatch[1]} pts`;
            changeType = ptsMatch[1].startsWith('+') ? 'positive' : 'negative';
          }
        }

        return {
          id: event.id,
          event_type: event.event_type as FeedEventType,
          entity_type: event.entity_type as FeedEntityType,
          title: event.title,
          description: event.description,
          author_id: event.author_id,
          author_name: author?.name || null,
          author_avatar: author?.avatar_url || null,
          team_name: team?.name || null,
          team_color: team?.color || null,
          entity_id: event.entity_id,
          created_at: event.created_at,
          is_read: event.is_read,
          change_value: changeValue,
          change_type: changeType,
        };
      });

      return { events: enrichedEvents, totalCount: count || 0 };
    },
    enabled: !!tenantId,
  });
};

export const useFeedStats = (tenantId: string | undefined) => {
  return useQuery({
    queryKey: ['feed-stats', tenantId],
    queryFn: async (): Promise<FeedStats> => {
      if (!tenantId) {
        return { updatesToday: 0, okrsUpdated: 0, activeTeams: 0, avgProgress: 0 };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Count updates today
      const { count: updatesToday } = await supabase
        .from('feed_events')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('created_at', today.toISOString());

      // Count OKRs updated (unique OKRs in feed)
      const { data: okrEvents } = await supabase
        .from('feed_events')
        .select('entity_id')
        .eq('tenant_id', tenantId)
        .eq('entity_type', 'okr')
        .gte('created_at', today.toISOString());
      
      const uniqueOkrs = new Set(okrEvents?.map(e => e.entity_id).filter(Boolean));

      // Count active teams
      const { count: activeTeams } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      // Calculate average OKR progress
      const { data: okrs } = await supabase
        .from('okrs')
        .select('progress')
        .eq('tenant_id', tenantId)
        .eq('status', 'active');

      const avgProgress = okrs && okrs.length > 0
        ? Math.round(okrs.reduce((acc, okr) => acc + okr.progress, 0) / okrs.length)
        : 0;

      return {
        updatesToday: updatesToday || 0,
        okrsUpdated: uniqueOkrs.size,
        activeTeams: activeTeams || 0,
        avgProgress,
      };
    },
    enabled: !!tenantId,
  });
};
