import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Star, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  OrganizationalRole,
  useAssignUserRole,
  useRemoveUserRole,
} from '@/hooks/useOrganizationalRoles';

interface UserRolesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: OrganizationalRole | null;
}

interface UserWithRole {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  hasRole: boolean;
  isPrimary: boolean;
}

export function UserRolesDialog({
  open,
  onOpenChange,
  role,
}: UserRolesDialogProps) {
  const { getTenantId } = useAuth();
  const tenantId = getTenantId();
  const { t } = useTranslation();
  const assignRole = useAssignUserRole();
  const removeRole = useRemoveUserRole();
  const [pendingChanges, setPendingChanges] = useState<Map<string, { hasRole: boolean; isPrimary: boolean }>>(new Map());

  // Fetch all users in tenant with their role assignments
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users-with-role', tenantId, role?.id],
    queryFn: async () => {
      if (!tenantId || !role) return [];

      // Fetch all users in tenant
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, name, email, avatar_url')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (profilesError) throw profilesError;

      // Fetch role assignments for this role
      const { data: assignments, error: assignmentsError } = await supabase
        .from('user_organizational_roles')
        .select('user_id, is_primary')
        .eq('organizational_role_id', role.id);

      if (assignmentsError) throw assignmentsError;

      const assignmentMap = new Map(
        assignments?.map((a) => [a.user_id, a.is_primary]) || []
      );

      return profiles?.map((p) => ({
        id: p.id,
        user_id: p.user_id,
        name: p.name,
        email: p.email,
        avatar_url: p.avatar_url,
        hasRole: assignmentMap.has(p.user_id),
        isPrimary: assignmentMap.get(p.user_id) || false,
      })) as UserWithRole[];
    },
    enabled: open && !!tenantId && !!role,
  });

  useEffect(() => {
    if (open) {
      setPendingChanges(new Map());
    }
  }, [open]);

  const handleToggleRole = (user: UserWithRole) => {
    const current = pendingChanges.get(user.user_id) || {
      hasRole: user.hasRole,
      isPrimary: user.isPrimary,
    };

    setPendingChanges(new Map(pendingChanges).set(user.user_id, {
      ...current,
      hasRole: !current.hasRole,
      isPrimary: !current.hasRole ? current.isPrimary : false,
    }));
  };

  const handleTogglePrimary = (user: UserWithRole) => {
    const current = pendingChanges.get(user.user_id) || {
      hasRole: user.hasRole,
      isPrimary: user.isPrimary,
    };

    if (!current.hasRole) return;

    setPendingChanges(new Map(pendingChanges).set(user.user_id, {
      ...current,
      isPrimary: !current.isPrimary,
    }));
  };

  const getUserState = (user: UserWithRole) => {
    return pendingChanges.get(user.user_id) || {
      hasRole: user.hasRole,
      isPrimary: user.isPrimary,
    };
  };

  const hasChanges = () => {
    for (const [userId, state] of pendingChanges) {
      const user = users.find((u) => u.user_id === userId);
      if (user && (state.hasRole !== user.hasRole || state.isPrimary !== user.isPrimary)) {
        return true;
      }
    }
    return false;
  };

  const handleSave = async () => {
    if (!role) return;

    for (const [userId, state] of pendingChanges) {
      const user = users.find((u) => u.user_id === userId);
      if (!user) continue;

      if (state.hasRole !== user.hasRole) {
        if (state.hasRole) {
          await assignRole.mutateAsync({
            user_id: userId,
            organizational_role_id: role.id,
            is_primary: state.isPrimary,
          });
        } else {
          await removeRole.mutateAsync({
            userId,
            roleId: role.id,
          });
        }
      } else if (state.isPrimary !== user.isPrimary && state.hasRole) {
        await assignRole.mutateAsync({
          user_id: userId,
          organizational_role_id: role.id,
          is_primary: state.isPrimary,
        });
      }
    }

    onOpenChange(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t('organizationalRoles.manageUsersFor')} {role?.name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('organizationalRoles.noUsersFound')}
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => {
                const state = getUserState(user);
                return (
                  <div
                    key={user.user_id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      state.hasRole ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={state.hasRole}
                        onCheckedChange={() => handleToggleRole(user)}
                      />
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {state.hasRole && (
                        <Button
                          variant={state.isPrimary ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleTogglePrimary(user)}
                          className="gap-1"
                        >
                          <Star className={`h-4 w-4 ${state.isPrimary ? 'fill-current' : ''}`} />
                          {t('organizationalRoles.primary')}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges() || assignRole.isPending || removeRole.isPending}
          >
            {t('common.save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
