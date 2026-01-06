import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface KeyResult {
  id: string;
  okr_id: string;
  title: string;
  description: string | null;
  target_value: number;
  current_value: number;
  unit: string;
  progress: number;
  owner_id: string | null;
  owner_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OKR {
  id: string;
  tenant_id: string;
  team_id: string | null;
  parent_id: string | null;
  title: string;
  description: string | null;
  type: 'objective' | 'key_result' | 'train' | 'team';
  status: 'active' | 'at_risk' | 'behind' | 'completed';
  progress: number;
  start_date: string | null;
  end_date: string | null;
  owner_id: string | null;
  owner_name?: string | null;
  team_name?: string | null;
  team_color?: string | null;
  parent_title?: string | null;
  key_results?: KeyResult[];
  children?: OKR[];
  created_at: string;
  updated_at: string;
}

export interface OKRFormData {
  title: string;
  description?: string;
  type: 'train' | 'team';
  team_id?: string | null;
  parent_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  owner_id?: string | null;
}

export interface KeyResultFormData {
  title: string;
  description?: string;
  target_value: number;
  current_value?: number;
  unit?: string;
  owner_id?: string | null;
}

// Fetch all OKRs for the tenant
export const useOKRs = (tenantId: string | undefined, filter?: {
  type?: string;
  status?: string;
  teamId?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['okrs', tenantId, filter],
    queryFn: async (): Promise<OKR[]> => {
      if (!tenantId) return [];

      let query = supabase
        .from('okrs')
        .select(`
          id,
          tenant_id,
          team_id,
          parent_id,
          title,
          description,
          type,
          status,
          progress,
          start_date,
          end_date,
          owner_id,
          created_at,
          updated_at
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filter?.type && filter.type !== 'all') {
        query = query.eq('type', filter.type);
      }
      if (filter?.status && filter.status !== 'all') {
        query = query.eq('status', filter.status);
      }
      if (filter?.teamId) {
        query = query.eq('team_id', filter.teamId);
      }
      if (filter?.search) {
        query = query.or(`title.ilike.%${filter.search}%,description.ilike.%${filter.search}%`);
      }

      const { data: okrs, error } = await query;
      if (error) throw error;

      // Fetch related data
      const ownerIds = [...new Set(okrs?.map(o => o.owner_id).filter(Boolean) as string[])];
      const teamIds = [...new Set(okrs?.map(o => o.team_id).filter(Boolean) as string[])];
      const parentIds = [...new Set(okrs?.map(o => o.parent_id).filter(Boolean) as string[])];

      // Fetch owners
      let ownersMap: Record<string, string> = {};
      if (ownerIds.length > 0) {
        const { data: owners } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', ownerIds);
        if (owners) {
          ownersMap = owners.reduce((acc, o) => ({ ...acc, [o.id]: o.name }), {});
        }
      }

      // Fetch teams
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

      // Fetch parent titles
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

      // Fetch key results for all OKRs
      const okrIds = okrs?.map(o => o.id) || [];
      let keyResultsMap: Record<string, KeyResult[]> = {};
      if (okrIds.length > 0) {
        const { data: keyResults } = await supabase
          .from('key_results')
          .select('*')
          .in('okr_id', okrIds)
          .order('created_at', { ascending: true });
        
        if (keyResults) {
          keyResultsMap = keyResults.reduce((acc, kr) => {
            if (!acc[kr.okr_id]) acc[kr.okr_id] = [];
            acc[kr.okr_id].push(kr as KeyResult);
            return acc;
          }, {} as Record<string, KeyResult[]>);
        }
      }

      return (okrs || []).map(okr => ({
        ...okr,
        type: okr.type as OKR['type'],
        status: okr.status as OKR['status'],
        owner_name: okr.owner_id ? ownersMap[okr.owner_id] : null,
        team_name: okr.team_id ? teamsMap[okr.team_id]?.name : null,
        team_color: okr.team_id ? teamsMap[okr.team_id]?.color : null,
        parent_title: okr.parent_id ? parentsMap[okr.parent_id] : null,
        key_results: keyResultsMap[okr.id] || [],
      }));
    },
    enabled: !!tenantId,
  });
};

// Fetch single OKR with children
export const useOKR = (okrId: string | undefined) => {
  return useQuery({
    queryKey: ['okr', okrId],
    queryFn: async (): Promise<OKR | null> => {
      if (!okrId) return null;

      const { data: okr, error } = await supabase
        .from('okrs')
        .select('*')
        .eq('id', okrId)
        .maybeSingle();

      if (error) throw error;
      if (!okr) return null;

      // Fetch key results
      const { data: keyResults } = await supabase
        .from('key_results')
        .select('*')
        .eq('okr_id', okrId)
        .order('created_at', { ascending: true });

      // Fetch children OKRs
      const { data: children } = await supabase
        .from('okrs')
        .select('*')
        .eq('parent_id', okrId)
        .order('created_at', { ascending: true });

      return {
        ...okr,
        type: okr.type as OKR['type'],
        status: okr.status as OKR['status'],
        key_results: (keyResults || []) as KeyResult[],
        children: (children || []).map(c => ({
          ...c,
          type: c.type as OKR['type'],
          status: c.status as OKR['status'],
        })) as OKR[],
      };
    },
    enabled: !!okrId,
  });
};

// Fetch parent OKRs for selection
export const useParentOKRs = (tenantId: string | undefined, excludeId?: string) => {
  return useQuery({
    queryKey: ['parent-okrs', tenantId, excludeId],
    queryFn: async () => {
      if (!tenantId) return [];

      let query = supabase
        .from('okrs')
        .select('id, title, type')
        .eq('tenant_id', tenantId)
        .eq('type', 'train')
        .order('title', { ascending: true });

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });
};

// Create OKR
export const useCreateOKR = () => {
  const queryClient = useQueryClient();
  const { getTenantId } = useAuth();

  return useMutation({
    mutationFn: async (data: OKRFormData) => {
      const tenantId = getTenantId();
      if (!tenantId) throw new Error('Tenant não encontrado');

      const { data: okr, error } = await supabase
        .from('okrs')
        .insert({
          tenant_id: tenantId,
          title: data.title,
          description: data.description || null,
          type: data.type,
          team_id: data.team_id || null,
          parent_id: data.parent_id || null,
          start_date: data.start_date || null,
          end_date: data.end_date || null,
          owner_id: data.owner_id || null,
          status: 'active',
          progress: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return okr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['okrs'] });
      queryClient.invalidateQueries({ queryKey: ['parent-okrs'] });
      toast.success('OKR criado com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating OKR:', error);
      toast.error('Erro ao criar OKR');
    },
  });
};

// Update OKR
export const useUpdateOKR = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<OKRFormData> }) => {
      const { data: okr, error } = await supabase
        .from('okrs')
        .update({
          title: data.title,
          description: data.description,
          type: data.type,
          team_id: data.team_id,
          parent_id: data.parent_id,
          start_date: data.start_date,
          end_date: data.end_date,
          owner_id: data.owner_id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return okr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['okrs'] });
      queryClient.invalidateQueries({ queryKey: ['okr'] });
      toast.success('OKR atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating OKR:', error);
      toast.error('Erro ao atualizar OKR');
    },
  });
};

// Delete OKR
export const useDeleteOKR = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('okrs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['okrs'] });
      queryClient.invalidateQueries({ queryKey: ['parent-okrs'] });
      toast.success('OKR excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting OKR:', error);
      toast.error('Erro ao excluir OKR');
    },
  });
};

// Create Key Result
export const useCreateKeyResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ okrId, data }: { okrId: string; data: KeyResultFormData }) => {
      const { data: kr, error } = await supabase
        .from('key_results')
        .insert({
          okr_id: okrId,
          title: data.title,
          description: data.description || null,
          target_value: data.target_value,
          current_value: data.current_value || 0,
          unit: data.unit || '%',
          owner_id: data.owner_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return kr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['okrs'] });
      queryClient.invalidateQueries({ queryKey: ['okr'] });
      toast.success('Key Result criado com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating Key Result:', error);
      toast.error('Erro ao criar Key Result');
    },
  });
};

// Update Key Result progress
export const useUpdateKeyResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<KeyResultFormData & { current_value: number }> }) => {
      const { data: kr, error } = await supabase
        .from('key_results')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return kr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['okrs'] });
      queryClient.invalidateQueries({ queryKey: ['okr'] });
      toast.success('Key Result atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Error updating Key Result:', error);
      toast.error('Erro ao atualizar Key Result');
    },
  });
};

// Delete Key Result
export const useDeleteKeyResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('key_results')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['okrs'] });
      queryClient.invalidateQueries({ queryKey: ['okr'] });
      toast.success('Key Result excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Error deleting Key Result:', error);
      toast.error('Erro ao excluir Key Result');
    },
  });
};

// Fetch teams for selection
export const useTeams = (tenantId: string | undefined) => {
  return useQuery({
    queryKey: ['teams', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('teams')
        .select('id, name, color')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });
};

// Fetch profiles for owner selection
export const useProfiles = (tenantId: string | undefined) => {
  return useQuery({
    queryKey: ['profiles-select', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });
};
