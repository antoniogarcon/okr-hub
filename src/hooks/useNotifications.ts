import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  user_id: string;
  tenant_id: string;
  event_type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  tenant_id: string;
  okr_created: boolean;
  okr_completed: boolean;
  okr_progress: boolean;
  okr_linked: boolean;
  team_changes: boolean;
  wiki_updates: boolean;
  role_changes: boolean;
  email_enabled: boolean;
  email_digest: string;
}

// Event type icons and colors mapping
export const notificationTypeConfig: Record<string, { icon: string; color: string; bgColor: string }> = {
  okr_created: { icon: 'Target', color: 'text-primary', bgColor: 'bg-primary/10' },
  okr_completed: { icon: 'CheckCircle2', color: 'text-success', bgColor: 'bg-success/10' },
  okr_progress: { icon: 'TrendingUp', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  okr_linked: { icon: 'Link', color: 'text-violet-500', bgColor: 'bg-violet-500/10' },
  wiki_created: { icon: 'FileText', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  wiki_updated: { icon: 'FilePen', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  team_member_added: { icon: 'UserPlus', color: 'text-green-500', bgColor: 'bg-green-500/10' },
  team_member_removed: { icon: 'UserMinus', color: 'text-red-500', bgColor: 'bg-red-500/10' },
  role_changed: { icon: 'Shield', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  org_role_assigned: { icon: 'BadgeCheck', color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
  org_role_removed: { icon: 'BadgeX', color: 'text-rose-500', bgColor: 'bg-rose-500/10' },
};

export function useNotifications(limit = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useUnreadNotificationsCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications-unread-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
}

export function useNotificationPreferences() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as NotificationPreferences | null;
    },
    enabled: !!user?.id,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  const { user, getTenantId } = useAuth();

  return useMutation({
    mutationFn: async (preferences: Partial<NotificationPreferences>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const tenantId = getTenantId();
      if (!tenantId) throw new Error('Tenant not found');

      const { data: existing } = await supabase
        .from('notification_preferences')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('notification_preferences')
          .update({ ...preferences, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: user.id,
            tenant_id: tenantId,
            ...preferences,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });
}
