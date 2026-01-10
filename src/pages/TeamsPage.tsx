import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Users, Plus, Loader2, Search, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useAuth } from '@/contexts/AuthContext';
import { TeamCard, TeamFormDialog, TeamMembersDialog } from '@/components/teams';
import {
  useTeams,
  useCreateTeam,
  useUpdateTeam,
  useDeleteTeam,
  useCanEditTeams,
  TeamWithDetails,
} from '@/hooks/useTeamManagement';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const TeamsPage: React.FC = () => {
  const { t } = useTranslation();
  const { getTenantId, hasMinimumRole, profile, isRoot } = useAuth();
  const tenantId = getTenantId();
  const canEdit = useCanEditTeams();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamWithDetails | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<TeamWithDetails | null>(null);

  // Data
  const { data: teams = [], isLoading, isError } = useTeams(tenantId);

  // Mutations
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();

  // Filter teams based on role
  const filteredTeams = React.useMemo(() => {
    let result = teams;

    // Leaders can only see their own team
    if (!isRoot() && !hasMinimumRole('admin') && hasMinimumRole('leader')) {
      result = teams.filter(team => team.leaderId === profile?.id);
    }

    // Filter by search query
    if (searchQuery) {
      result = result.filter(
        team =>
          team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          team.leaderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          team.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Only show active teams
    return result.filter(team => team.isActive);
  }, [teams, searchQuery, isRoot, hasMinimumRole, profile?.id]);

  // Handlers
  const handleCreateTeam = () => {
    setSelectedTeam(null);
    setIsFormOpen(true);
  };

  const handleEditTeam = (team: TeamWithDetails) => {
    setSelectedTeam(team);
    setIsFormOpen(true);
  };

  const handleManageMembers = (team: TeamWithDetails) => {
    setSelectedTeam(team);
    setIsMembersOpen(true);
  };

  const handleDeleteTeam = (team: TeamWithDetails) => {
    setTeamToDelete(team);
  };

  const handleFormSubmit = async (data: { name: string; description?: string; color?: string; leaderId?: string }) => {
    if (selectedTeam) {
      await updateTeam.mutateAsync({
        teamId: selectedTeam.id,
        data: {
          name: data.name,
          description: data.description,
          color: data.color,
          leaderId: data.leaderId || null,
        },
      });
    } else {
      await createTeam.mutateAsync(data);
    }
    setIsFormOpen(false);
    setSelectedTeam(null);
  };

  const handleConfirmDelete = async () => {
    if (!teamToDelete) return;
    await deleteTeam.mutateAsync(teamToDelete.id);
    setTeamToDelete(null);
  };

  // Check access
  if (!isRoot() && !hasMinimumRole('leader')) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium text-foreground">
          {t('common.accessDenied')}
        </h3>
        <p className="text-muted-foreground mt-1">
          {t('teams.accessDeniedDescription')}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            {t('teams.title')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t('teams.subtitle')}
          </p>
        </div>
        {canEdit && (
          <Button onClick={handleCreateTeam} className="glow">
            <Plus className="mr-2 h-4 w-4" />
            {t('teams.createTeam')}
          </Button>
        )}
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('teams.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-4 p-6 border rounded-lg">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, j) => (
                  <Skeleton key={j} className="h-8 w-8 rounded-full" />
                ))}
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 flex-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-medium text-foreground">
            {t('common.error')}
          </h3>
          <p className="text-muted-foreground mt-1">
            {t('teams.loadError')}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filteredTeams.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">
            {searchQuery ? t('teams.noTeamsFound') : t('teams.noTeams')}
          </h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery ? t('teams.noTeamsFoundDescription') : t('teams.noTeamsDescription')}
          </p>
          {canEdit && !searchQuery && (
            <Button onClick={handleCreateTeam} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              {t('teams.createFirstTeam')}
            </Button>
          )}
        </div>
      )}

      {/* Teams Grid */}
      {!isLoading && !isError && filteredTeams.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeams.map((team) => (
            <motion.div key={team.id} variants={itemVariants}>
              <TeamCard
                team={team}
                canEdit={canEdit}
                onEdit={handleEditTeam}
                onDelete={handleDeleteTeam}
                onManageMembers={handleManageMembers}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <TeamFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        team={selectedTeam}
        onSubmit={handleFormSubmit}
        isLoading={createTeam.isPending || updateTeam.isPending}
      />

      {/* Members Dialog */}
      <TeamMembersDialog
        open={isMembersOpen}
        onOpenChange={setIsMembersOpen}
        team={selectedTeam}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!teamToDelete} onOpenChange={() => setTeamToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('teams.deleteTeamTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('teams.deleteTeamDescription', { name: teamToDelete?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTeam.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default TeamsPage;
