import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus, UserMinus, Search, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  TeamWithDetails,
  useAvailableUsers,
  useAddTeamMember,
  useRemoveTeamMember,
} from '@/hooks/useTeamManagement';
import { useAuth } from '@/contexts/AuthContext';

interface TeamMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: TeamWithDetails | null;
}

export const TeamMembersDialog: React.FC<TeamMembersDialogProps> = ({
  open,
  onOpenChange,
  team,
}) => {
  const { t } = useTranslation();
  const { getTenantId } = useAuth();
  const tenantId = getTenantId();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);

  const { data: availableUsers = [], isLoading: isLoadingUsers } = useAvailableUsers(tenantId, team?.id);
  const addMember = useAddTeamMember();
  const removeMember = useRemoveTeamMember();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const filteredAvailableUsers = availableUsers.filter(
    user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMember = async (userId: string) => {
    if (!team) return;
    await addMember.mutateAsync({ teamId: team.id, userId });
  };

  const handleRemoveMember = async () => {
    if (!team || !memberToRemove) return;
    await removeMember.mutateAsync({ teamId: team.id, memberId: memberToRemove.id });
    setMemberToRemove(null);
  };

  if (!team) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('teams.manageMembers')}</DialogTitle>
            <DialogDescription>
              {t('teams.manageMembersDescription', { team: team.name })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Members */}
            <div>
              <h4 className="text-sm font-medium mb-3">
                {t('teams.currentMembers')} ({team.members.length})
              </h4>
              <ScrollArea className="h-[200px] rounded-md border p-2">
                {team.members.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t('teams.noMembers')}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {team.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary/20 text-primary">
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setMemberToRemove({ id: member.id, name: member.name })}
                          disabled={removeMember.isPending}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            <Separator />

            {/* Add Members */}
            <div>
              <h4 className="text-sm font-medium mb-3">{t('teams.addMembers')}</h4>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('teams.searchUsers')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <ScrollArea className="h-[200px] rounded-md border p-2">
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredAvailableUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {searchQuery ? t('teams.noUsersFound') : t('teams.noAvailableUsers')}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredAvailableUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => handleAddMember(user.id)}
                          disabled={addMember.isPending}
                        >
                          {addMember.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserPlus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('teams.removeMemberTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('teams.removeMemberDescription', { name: memberToRemove?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMember.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
