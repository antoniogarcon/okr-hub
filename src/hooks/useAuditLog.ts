import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AuditAction = 
  | 'login'
  | 'logout'
  | 'password_reset'
  | 'okr_created'
  | 'okr_updated'
  | 'okr_deleted'
  | 'key_result_created'
  | 'key_result_updated'
  | 'key_result_deleted'
  | 'team_created'
  | 'team_updated'
  | 'team_deleted'
  | 'user_created'
  | 'user_updated'
  | 'user_deactivated'
  | 'sprint_created'
  | 'sprint_updated'
  | 'sprint_completed'
  | 'wiki_created'
  | 'wiki_updated'
  | 'wiki_deleted'
  | 'tenant_created'
  | 'tenant_updated'
  | 'role_changed'
  | 'org_role_assigned'
  | 'org_role_removed';

export type AuditEntityType = 
  | 'auth'
  | 'okr'
  | 'key_result'
  | 'team'
  | 'user'
  | 'sprint'
  | 'wiki'
  | 'tenant';

interface AuditLogParams {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  details?: Record<string, unknown>;
}

export const useAuditLog = () => {
  const { isAuthenticated } = useAuth();

  const logAction = useCallback(async ({
    action,
    entityType,
    entityId,
    details,
  }: AuditLogParams): Promise<void> => {
    // Only log if user is authenticated
    if (!isAuthenticated) {
      console.warn('Cannot log audit action: user not authenticated');
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('audit-log', {
        body: {
          action,
          entity_type: entityType,
          entity_id: entityId,
          details,
        },
      });

      if (error) {
        console.error('Failed to log audit action:', error);
      }
    } catch (error) {
      // Don't throw - audit logging should not break main flow
      console.error('Audit log error:', error);
    }
  }, [isAuthenticated]);

  // Convenience methods for common actions
  const logLogin = useCallback(() => {
    logAction({
      action: 'login',
      entityType: 'auth',
      details: { timestamp: new Date().toISOString() },
    });
  }, [logAction]);

  const logLogout = useCallback(() => {
    logAction({
      action: 'logout',
      entityType: 'auth',
      details: { timestamp: new Date().toISOString() },
    });
  }, [logAction]);

  const logPasswordReset = useCallback(() => {
    logAction({
      action: 'password_reset',
      entityType: 'auth',
      details: { timestamp: new Date().toISOString() },
    });
  }, [logAction]);

  const logOkrChange = useCallback((
    action: 'okr_created' | 'okr_updated' | 'okr_deleted',
    okrId: string,
    details?: Record<string, unknown>
  ) => {
    logAction({
      action,
      entityType: 'okr',
      entityId: okrId,
      details,
    });
  }, [logAction]);

  const logKeyResultChange = useCallback((
    action: 'key_result_created' | 'key_result_updated' | 'key_result_deleted',
    krId: string,
    details?: Record<string, unknown>
  ) => {
    logAction({
      action,
      entityType: 'key_result',
      entityId: krId,
      details,
    });
  }, [logAction]);

  const logTeamChange = useCallback((
    action: 'team_created' | 'team_updated' | 'team_deleted',
    teamId: string,
    details?: Record<string, unknown>
  ) => {
    logAction({
      action,
      entityType: 'team',
      entityId: teamId,
      details,
    });
  }, [logAction]);

  const logUserChange = useCallback((
    action: 'user_created' | 'user_updated' | 'user_deactivated',
    userId: string,
    details?: Record<string, unknown>
  ) => {
    logAction({
      action,
      entityType: 'user',
      entityId: userId,
      details,
    });
  }, [logAction]);

  const logSprintChange = useCallback((
    action: 'sprint_created' | 'sprint_updated' | 'sprint_completed',
    sprintId: string,
    details?: Record<string, unknown>
  ) => {
    logAction({
      action,
      entityType: 'sprint',
      entityId: sprintId,
      details,
    });
  }, [logAction]);

  const logWikiChange = useCallback((
    action: 'wiki_created' | 'wiki_updated' | 'wiki_deleted',
    docId: string,
    details?: Record<string, unknown>
  ) => {
    logAction({
      action,
      entityType: 'wiki',
      entityId: docId,
      details,
    });
  }, [logAction]);

  return {
    logAction,
    logLogin,
    logLogout,
    logPasswordReset,
    logOkrChange,
    logKeyResultChange,
    logTeamChange,
    logUserChange,
    logSprintChange,
    logWikiChange,
  };
};
