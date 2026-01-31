import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: unknown;
  ip_address: string | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export interface AuditFilters {
  userId?: string;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
}

// Fetch audit logs with filters
export const useAuditLogs = (filters: AuditFilters = {}) => {
  const { getTenantId, isRoot } = useAuth();
  const tenantId = getTenantId();

  return useQuery({
    queryKey: ['audit-logs', tenantId, filters],
    queryFn: async (): Promise<AuditLogEntry[]> => {
      if (!tenantId && !isRoot()) return [];

      // First get the profiles for the tenant to filter audit logs
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .eq('tenant_id', tenantId);

      if (profilesError) throw profilesError;
      if (!profiles || profiles.length === 0) return [];

      const userIds = profiles.map(p => p.user_id);
      const userMap = new Map(profiles.map(p => [p.user_id, { name: p.name, email: p.email }]));

      // Build query for audit logs
      let query = supabase
        .from('audit_logs')
        .select('*')
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
        .limit(500);

      // Apply filters
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.entityType) {
        query = query.eq('entity_type', filters.entityType);
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data: logs, error } = await query;
      if (error) throw error;

      // Enrich logs with user info
      return (logs || []).map(log => ({
        ...log,
        user_name: userMap.get(log.user_id)?.name || 'Usuário desconhecido',
        user_email: userMap.get(log.user_id)?.email || '',
      }));
    },
    enabled: !!tenantId || isRoot(),
  });
};

// Get unique actions from audit logs
export const useAuditActions = () => {
  const { getTenantId } = useAuth();
  const tenantId = getTenantId();

  return useQuery({
    queryKey: ['audit-actions', tenantId],
    queryFn: async (): Promise<string[]> => {
      // Return predefined list of actions
      return [
        'login',
        'logout',
        'password_reset',
        'user_created',
        'user_updated',
        'user_deactivated',
        'okr_created',
        'okr_updated',
        'okr_deleted',
        'key_result_created',
        'key_result_updated',
        'key_result_deleted',
        'team_created',
        'team_updated',
        'team_deleted',
        'sprint_created',
        'sprint_updated',
        'sprint_completed',
        'wiki_created',
        'wiki_updated',
        'wiki_deleted',
        'tenant_created',
        'tenant_updated',
        'role_changed',
        'org_role_assigned',
        'org_role_removed',
      ];
    },
    enabled: !!tenantId,
  });
};

// Get unique entity types
export const useAuditEntityTypes = () => {
  return useQuery({
    queryKey: ['audit-entity-types'],
    queryFn: async (): Promise<string[]> => {
      return [
        'auth',
        'user',
        'okr',
        'key_result',
        'team',
        'sprint',
        'wiki',
        'tenant',
        'organizational_role',
      ];
    },
  });
};

// Get users for filter dropdown
export const useAuditUsers = () => {
  const { getTenantId } = useAuth();
  const tenantId = getTenantId();

  return useQuery({
    queryKey: ['audit-users', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .eq('tenant_id', tenantId)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
  });
};
