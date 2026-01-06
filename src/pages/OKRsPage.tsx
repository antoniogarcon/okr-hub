import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Target, Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import {
  OKRCard,
  OKRFilters,
  OKRFormDialog,
  OKRStats,
  KeyResultFormDialog,
} from '@/components/okrs';
import {
  useOKRs,
  useTeams,
  useCreateOKR,
  useUpdateOKR,
  useDeleteOKR,
  useCreateKeyResult,
  useUpdateKeyResult,
  useDeleteKeyResult,
  OKR,
  KeyResult,
  OKRFormData,
  KeyResultFormData,
} from '@/hooks/useOKRs';
import { useAuth } from '@/contexts/AuthContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const OKRsPage: React.FC = () => {
  const { t } = useTranslation();
  const { getTenantId, hasMinimumRole, isRoot } = useAuth();
  const tenantId = getTenantId();

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');

  // Dialogs
  const [okrDialogOpen, setOkrDialogOpen] = useState(false);
  const [krDialogOpen, setKrDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteKrDialogOpen, setDeleteKrDialogOpen] = useState(false);

  // Selected items
  const [selectedOkr, setSelectedOkr] = useState<OKR | null>(null);
  const [selectedKr, setSelectedKr] = useState<KeyResult | null>(null);
  const [targetOkrId, setTargetOkrId] = useState<string | null>(null);

  // Queries
  const { data: okrs = [], isLoading } = useOKRs(tenantId || undefined, {
    type: typeFilter !== 'all' ? typeFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    teamId: teamFilter !== 'all' ? teamFilter : undefined,
    search: search || undefined,
  });
  const { data: teams = [] } = useTeams(tenantId || undefined);

  // Mutations
  const createOKR = useCreateOKR();
  const updateOKR = useUpdateOKR();
  const deleteOKR = useDeleteOKR();
  const createKR = useCreateKeyResult();
  const updateKR = useUpdateKeyResult();
  const deleteKR = useDeleteKeyResult();

  const canManage = hasMinimumRole('leader');
  const isReadOnly = !canManage;

  // Filter only top-level OKRs (no parent)
  const topLevelOkrs = okrs.filter((okr) => !okr.parent_id);

  // Build hierarchy
  const okrsWithChildren = topLevelOkrs.map((okr) => ({
    ...okr,
    children: okrs.filter((child) => child.parent_id === okr.id),
  }));

  // Handlers
  const handleCreateOkr = useCallback(() => {
    setSelectedOkr(null);
    setOkrDialogOpen(true);
  }, []);

  const handleEditOkr = useCallback((okr: OKR) => {
    setSelectedOkr(okr);
    setOkrDialogOpen(true);
  }, []);

  const handleDeleteOkr = useCallback((okr: OKR) => {
    setSelectedOkr(okr);
    setDeleteDialogOpen(true);
  }, []);

  const handleOkrSubmit = useCallback((data: OKRFormData) => {
    if (selectedOkr) {
      updateOKR.mutate(
        { id: selectedOkr.id, data },
        { onSuccess: () => setOkrDialogOpen(false) }
      );
    } else {
      createOKR.mutate(data, {
        onSuccess: () => setOkrDialogOpen(false),
      });
    }
  }, [selectedOkr, createOKR, updateOKR]);

  const handleConfirmDelete = useCallback(() => {
    if (selectedOkr) {
      deleteOKR.mutate(selectedOkr.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setSelectedOkr(null);
        },
      });
    }
  }, [selectedOkr, deleteOKR]);

  const handleAddKeyResult = useCallback((okr: OKR) => {
    setTargetOkrId(okr.id);
    setSelectedKr(null);
    setKrDialogOpen(true);
  }, []);

  const handleEditKeyResult = useCallback((kr: KeyResult) => {
    setTargetOkrId(kr.okr_id);
    setSelectedKr(kr);
    setKrDialogOpen(true);
  }, []);

  const handleDeleteKeyResult = useCallback((kr: KeyResult) => {
    setSelectedKr(kr);
    setDeleteKrDialogOpen(true);
  }, []);

  const handleKrSubmit = useCallback((data: KeyResultFormData) => {
    if (selectedKr) {
      updateKR.mutate(
        { id: selectedKr.id, data },
        { onSuccess: () => setKrDialogOpen(false) }
      );
    } else if (targetOkrId) {
      createKR.mutate(
        { okrId: targetOkrId, data },
        { onSuccess: () => setKrDialogOpen(false) }
      );
    }
  }, [selectedKr, targetOkrId, createKR, updateKR]);

  const handleConfirmDeleteKr = useCallback(() => {
    if (selectedKr) {
      deleteKR.mutate(selectedKr.id, {
        onSuccess: () => {
          setDeleteKrDialogOpen(false);
          setSelectedKr(null);
        },
      });
    }
  }, [selectedKr, deleteKR]);

  const handleUpdateKrProgress = useCallback((kr: KeyResult, newValue: number) => {
    updateKR.mutate({ id: kr.id, data: { current_value: newValue } });
  }, [updateKR]);

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setTypeFilter('all');
    setStatusFilter('all');
    setTeamFilter('all');
  }, []);

  // Root user without tenant
  if (isRoot() && !tenantId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {t('auth.selectTenant')}
        </h2>
        <p className="text-muted-foreground">
          {t('auth.selectTenantMessage')}
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
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Target className="h-8 w-8 text-primary" />
            {t('okrs.title')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t('okrs.pageSubtitle')}
          </p>
        </div>
        {canManage && (
          <Button onClick={handleCreateOkr} className="glow">
            <Plus className="mr-2 h-4 w-4" />
            {t('okrs.createOkr')}
          </Button>
        )}
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants}>
        <OKRStats okrs={okrs} />
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants}>
        <OKRFilters
          search={search}
          onSearchChange={setSearch}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          teamFilter={teamFilter}
          onTeamChange={setTeamFilter}
          teams={teams}
          onClearFilters={handleClearFilters}
        />
      </motion.div>

      {/* OKRs List */}
      <motion.div variants={itemVariants} className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))
        ) : okrsWithChildren.length === 0 ? (
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">
              {t('okrs.noOkrs')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('okrs.noOkrsDesc')}
            </p>
            {canManage && (
              <Button onClick={handleCreateOkr}>
                <Plus className="mr-2 h-4 w-4" />
                {t('okrs.createOkr')}
              </Button>
            )}
          </div>
        ) : (
          okrsWithChildren.map((okr) => (
            <OKRCard
              key={okr.id}
              okr={okr}
              onEdit={handleEditOkr}
              onDelete={handleDeleteOkr}
              onAddKeyResult={handleAddKeyResult}
              onEditKeyResult={handleEditKeyResult}
              onDeleteKeyResult={handleDeleteKeyResult}
              onUpdateKeyResultProgress={handleUpdateKrProgress}
              isReadOnly={isReadOnly}
            />
          ))
        )}
      </motion.div>

      {/* OKR Form Dialog */}
      <OKRFormDialog
        open={okrDialogOpen}
        onOpenChange={setOkrDialogOpen}
        okr={selectedOkr}
        onSubmit={handleOkrSubmit}
        isLoading={createOKR.isPending || updateOKR.isPending}
      />

      {/* Key Result Form Dialog */}
      <KeyResultFormDialog
        open={krDialogOpen}
        onOpenChange={setKrDialogOpen}
        keyResult={selectedKr}
        onSubmit={handleKrSubmit}
        isLoading={createKR.isPending || updateKR.isPending}
      />

      {/* Delete OKR Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('okrs.deleteOkrTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('okrs.deleteOkrDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Key Result Confirmation */}
      <AlertDialog open={deleteKrDialogOpen} onOpenChange={setDeleteKrDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('okrs.deleteKrTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('okrs.deleteKrDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteKr}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default OKRsPage;
