import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface OrganizationalRole {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  type: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface UserOrganizationalRole {
  id: string;
  user_id: string;
  organizational_role_id: string;
  is_primary: boolean;
  assigned_at: string;
  assigned_by: string | null;
  organizational_role?: OrganizationalRole;
}

export interface CreateOrganizationalRoleData {
  name: string;
  description?: string;
  type?: string;
  sort_order?: number;
}

export interface UpdateOrganizationalRoleData {
  name?: string;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface AssignUserRoleData {
  user_id: string;
  organizational_role_id: string;
  is_primary: boolean;
}

// Fetch all organizational roles for tenant
export function useOrganizationalRoles() {
  const { getTenantId } = useAuth();
  const tenantId = getTenantId();

  return useQuery({
    queryKey: ['organizational-roles', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('organizational_roles')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as OrganizationalRole[];
    },
    enabled: !!tenantId,
  });
}

// Fetch active organizational roles only
export function useActiveOrganizationalRoles() {
  const { getTenantId } = useAuth();
  const tenantId = getTenantId();

  return useQuery({
    queryKey: ['organizational-roles', tenantId, 'active'],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('organizational_roles')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as OrganizationalRole[];
    },
    enabled: !!tenantId,
  });
}

// Fetch user's organizational roles
export function useUserOrganizationalRoles(userId?: string) {
  const { getTenantId } = useAuth();
  const tenantId = getTenantId();

  return useQuery({
    queryKey: ['user-organizational-roles', userId, tenantId],
    queryFn: async () => {
      if (!userId || !tenantId) return [];

      const { data, error } = await supabase
        .from('user_organizational_roles')
        .select(`
          *,
          organizational_role:organizational_roles(*)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      
      return data.map(item => ({
        ...item,
        organizational_role: item.organizational_role as unknown as OrganizationalRole
      })) as UserOrganizationalRole[];
    },
    enabled: !!userId && !!tenantId,
  });
}

// Create organizational role
export function useCreateOrganizationalRole() {
  const queryClient = useQueryClient();
  const { getTenantId } = useAuth();
  const { t } = useTranslation();
  const tenantId = getTenantId();

  return useMutation({
    mutationFn: async (data: CreateOrganizationalRoleData) => {
      if (!tenantId) throw new Error('Tenant not found');

      const { data: result, error } = await supabase
        .from('organizational_roles')
        .insert({
          tenant_id: tenantId,
          name: data.name,
          description: data.description || null,
          type: data.type || 'custom',
          sort_order: data.sort_order || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizational-roles', tenantId] });
      toast.success(t('organizationalRoles.created'));
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Update organizational role
export function useUpdateOrganizationalRole() {
  const queryClient = useQueryClient();
  const { getTenantId } = useAuth();
  const { t } = useTranslation();
  const tenantId = getTenantId();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateOrganizationalRoleData }) => {
      const { data: result, error } = await supabase
        .from('organizational_roles')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizational-roles', tenantId] });
      toast.success(t('organizationalRoles.updated'));
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Delete organizational role
export function useDeleteOrganizationalRole() {
  const queryClient = useQueryClient();
  const { getTenantId } = useAuth();
  const { t } = useTranslation();
  const tenantId = getTenantId();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('organizational_roles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizational-roles', tenantId] });
      toast.success(t('organizationalRoles.deleted'));
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Assign user to organizational role
export function useAssignUserRole() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (data: AssignUserRoleData) => {
      // If setting as primary, first unset other primary roles for this user
      if (data.is_primary) {
        await supabase
          .from('user_organizational_roles')
          .update({ is_primary: false })
          .eq('user_id', data.user_id)
          .eq('is_primary', true);
      }

      const { data: result, error } = await supabase
        .from('user_organizational_roles')
        .upsert({
          user_id: data.user_id,
          organizational_role_id: data.organizational_role_id,
          is_primary: data.is_primary,
          assigned_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-organizational-roles', variables.user_id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('organizationalRoles.assigned'));
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Remove user from organizational role
export function useRemoveUserRole() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const { error } = await supabase
        .from('user_organizational_roles')
        .delete()
        .eq('user_id', userId)
        .eq('organizational_role_id', roleId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-organizational-roles', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('organizationalRoles.removed'));
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Initialize default roles for tenant
export function useInitializeDefaultRoles() {
  const queryClient = useQueryClient();
  const { getTenantId } = useAuth();
  const tenantId = getTenantId();

  return useMutation({
    mutationFn: async () => {
      if (!tenantId) throw new Error('Tenant not found');

      const { error } = await supabase.rpc('create_default_organizational_roles', {
        p_tenant_id: tenantId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizational-roles', tenantId] });
    },
  });
}
