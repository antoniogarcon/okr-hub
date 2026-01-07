import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Sprint {
  id: string;
  name: string;
  team_id: string;
  status: 'planned' | 'active' | 'completed';
  start_date: string;
  end_date: string;
  planned_points: number | null;
  completed_points: number | null;
  capacity: number | null;
  created_at: string;
  updated_at: string;
}

export interface SprintWithTeam extends Sprint {
  team: {
    id: string;
    name: string;
    color: string;
  };
}

export interface SprintMetrics {
  velocity: number;
  capacity: number;
  burndownProgress: number;
  adherence: number;
  storiesCompleted: number;
  storiesTotal: number;
}

export const useTeams = (tenantId: string | null) => {
  return useQuery({
    queryKey: ['teams', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, color, slug')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });
};

export const useSprints = (tenantId: string | null, teamId?: string) => {
  return useQuery({
    queryKey: ['sprints', tenantId, teamId],
    queryFn: async (): Promise<SprintWithTeam[]> => {
      if (!tenantId) return [];

      // Get teams for tenant first
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, color')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (teamsError) throw teamsError;
      if (!teams || teams.length === 0) return [];

      const teamIds = teamId ? [teamId] : teams.map(t => t.id);
      const teamsMap = teams.reduce((acc, t) => {
        acc[t.id] = { id: t.id, name: t.name, color: t.color || '#6366f1' };
        return acc;
      }, {} as Record<string, { id: string; name: string; color: string }>);

      const { data: sprints, error } = await supabase
        .from('sprints')
        .select('*')
        .in('team_id', teamIds)
        .order('end_date', { ascending: false });

      if (error) throw error;
      
      return (sprints || []).map(sprint => ({
        ...sprint,
        status: sprint.status as 'planned' | 'active' | 'completed',
        team: teamsMap[sprint.team_id],
      }));
    },
    enabled: !!tenantId,
  });
};

export const useSprintDetails = (sprintId: string | null) => {
  return useQuery({
    queryKey: ['sprint-details', sprintId],
    queryFn: async () => {
      if (!sprintId) return null;

      const { data, error } = await supabase
        .from('sprints')
        .select(`
          *,
          teams (
            id,
            name,
            color
          )
        `)
        .eq('id', sprintId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!sprintId,
  });
};

export const useVelocityHistory = (teamId: string | null, limit = 5) => {
  return useQuery({
    queryKey: ['velocity-history', teamId, limit],
    queryFn: async () => {
      if (!teamId) return [];

      const { data, error } = await supabase
        .from('sprints')
        .select('id, name, planned_points, completed_points, status')
        .eq('team_id', teamId)
        .in('status', ['completed', 'active'])
        .order('end_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return (data || []).reverse().map(s => ({
        sprint: s.name,
        planned: s.planned_points || 0,
        completed: s.completed_points || 0,
        isActive: s.status === 'active',
      }));
    },
    enabled: !!teamId,
  });
};

export const useSprintComparison = (teamId: string | null, limit = 3) => {
  return useQuery({
    queryKey: ['sprint-comparison', teamId, limit],
    queryFn: async () => {
      if (!teamId) return [];

      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('team_id', teamId)
        .order('end_date', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(sprint => {
        const planned = sprint.planned_points || 0;
        const completed = sprint.completed_points || 0;
        const burndown = planned > 0 ? Math.round((completed / planned) * 100) : 0;
        
        return {
          id: sprint.id,
          name: sprint.name,
          status: sprint.status as 'planned' | 'active' | 'completed',
          completed: completed,
          planned: planned,
          burndown: burndown,
          startDate: sprint.start_date,
          endDate: sprint.end_date,
        };
      });
    },
    enabled: !!teamId,
  });
};

export const useUpdateSprint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<Sprint> & { id: string }) => {
      const { error } = await supabase
        .from('sprints')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      queryClient.invalidateQueries({ queryKey: ['sprint-details'] });
      queryClient.invalidateQueries({ queryKey: ['velocity-history'] });
      queryClient.invalidateQueries({ queryKey: ['sprint-comparison'] });
      toast.success('Sprint atualizada com sucesso');
    },
    onError: (error) => {
      console.error('Error updating sprint:', error);
      toast.error('Erro ao atualizar sprint');
    },
  });
};

export const useCreateSprint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Sprint, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('sprints')
        .insert(data);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      toast.success('Sprint criada com sucesso');
    },
    onError: (error) => {
      console.error('Error creating sprint:', error);
      toast.error('Erro ao criar sprint');
    },
  });
};
