import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { BarChart3, Settings, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import {
  SprintMetricsCards,
  BurndownChart,
  VelocityHistoryChart,
  SprintComparison,
  SprintFormDialog,
} from '@/components/indicators';
import {
  useTeams,
  useSprints,
  useVelocityHistory,
  useSprintComparison,
  useUpdateSprint,
  useCreateSprint,
  Sprint,
} from '@/hooks/useSprintIndicators';
import { format, differenceInDays, parseISO } from 'date-fns';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const IndicatorsPage: React.FC = () => {
  const { t } = useTranslation();
  const { profile, getTenantId, hasMinimumRole } = useAuth();
  const tenantId = getTenantId();
  
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [isSprintDialogOpen, setIsSprintDialogOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Partial<Sprint> | null>(null);

  const canEdit = hasMinimumRole('leader');

  const { data: teams = [], isLoading: teamsLoading } = useTeams(tenantId);
  const { data: sprints = [], isLoading: sprintsLoading } = useSprints(
    tenantId,
    selectedTeamId !== 'all' ? selectedTeamId : undefined
  );

  const activeSprints = useMemo(() => 
    sprints.filter(s => s.status === 'active'), 
    [sprints]
  );
  
  const currentSprint = useMemo(() => {
    if (selectedSprintId) {
      return sprints.find(s => s.id === selectedSprintId);
    }
    return activeSprints[0] || sprints[0];
  }, [selectedSprintId, sprints, activeSprints]);

  const teamForVelocity = selectedTeamId !== 'all' 
    ? selectedTeamId 
    : currentSprint?.team_id || null;

  const { data: velocityHistory = [] } = useVelocityHistory(teamForVelocity, 5);
  const { data: sprintComparison = [] } = useSprintComparison(teamForVelocity, 3);

  const updateSprint = useUpdateSprint();
  const createSprint = useCreateSprint();

  // Calculate metrics for current sprint
  const metrics = useMemo(() => {
    if (!currentSprint) {
      return {
        velocity: 0,
        capacity: 0,
        burndownProgress: 0,
        storiesCompleted: 0,
        storiesTotal: 0,
        isOnTrack: false,
        daysRemaining: 0,
        sprintDays: 14,
      };
    }

    const planned = currentSprint.planned_points || 0;
    const completed = currentSprint.completed_points || 0;
    const capacity = currentSprint.capacity || 100;
    const burndownProgress = planned > 0 ? Math.round((completed / planned) * 100) : 0;

    const startDate = parseISO(currentSprint.start_date);
    const endDate = parseISO(currentSprint.end_date);
    const today = new Date();
    const sprintDays = differenceInDays(endDate, startDate);
    const daysRemaining = Math.max(0, differenceInDays(endDate, today));

    // Estimate stories based on average of 5 points per story
    const estimatedTotal = Math.ceil(planned / 5);
    const estimatedCompleted = Math.ceil(completed / 5);

    return {
      velocity: completed,
      capacity: planned,
      burndownProgress,
      storiesCompleted: estimatedCompleted,
      storiesTotal: estimatedTotal,
      isOnTrack: burndownProgress >= (((sprintDays - daysRemaining) / sprintDays) * 100) - 10,
      daysRemaining,
      sprintDays: Math.max(sprintDays, 1),
    };
  }, [currentSprint]);

  const handleSprintSubmit = (data: any) => {
    if (editingSprint?.id) {
      updateSprint.mutate({ id: editingSprint.id, ...data });
    } else {
      createSprint.mutate(data);
    }
    setEditingSprint(null);
  };

  const handleConfigureSprint = () => {
    if (currentSprint) {
      setEditingSprint(currentSprint);
    } else {
      setEditingSprint(null);
    }
    setIsSprintDialogOpen(true);
  };

  const recentSprintTabs = useMemo(() => {
    return sprints
      .filter(s => s.status === 'active' || s.status === 'completed')
      .slice(0, 3);
  }, [sprints]);

  const isLoading = teamsLoading || sprintsLoading;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-primary" />
            {t('indicators.pageTitle', 'Métricas Scrum - Sprint')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('indicators.pageSubtitle', 'Acompanhamento detalhado de performance e progresso')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            {t('indicators.exportData', 'Exportar Dados')}
          </Button>
          {canEdit && (
            <Button size="sm" className="gap-2" onClick={handleConfigureSprint}>
              <Settings className="h-4 w-4" />
              {t('indicators.configureSprint', 'Configurar Sprint')}
            </Button>
          )}
        </div>
      </motion.div>

      {/* Filters Row */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {/* Sprint Tabs */}
          {recentSprintTabs.length > 0 && (
            <Tabs 
              value={selectedSprintId || currentSprint?.id || ''} 
              onValueChange={(value) => setSelectedSprintId(value)}
            >
              <TabsList>
                {recentSprintTabs.map((sprint) => (
                  <TabsTrigger key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </div>
        
        {/* Team Filter */}
        <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('indicators.allTeams', 'Todas as equipes')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('indicators.allTeams', 'Todas as equipes')}</SelectItem>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Sprint Info Banner */}
      {currentSprint && (
        <motion.div variants={itemVariants} className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${currentSprint.status === 'active' ? 'bg-success' : 'bg-muted-foreground'}`} />
          <span className="text-muted-foreground">
            {currentSprint.status === 'active' 
              ? t('indicators.activeSprint', 'Sprint ativa')
              : t('indicators.completedSprint', 'Sprint concluída')}
            : {format(parseISO(currentSprint.start_date), 'yyyy-MM-dd')} - {format(parseISO(currentSprint.end_date), 'yyyy-MM-dd')}
          </span>
          {currentSprint.status === 'active' && (
            <Badge variant="outline" className="text-xs">
              {metrics.daysRemaining} {t('indicators.daysRemaining', 'dias restantes')}
            </Badge>
          )}
        </motion.div>
      )}

      {/* Metrics Cards */}
      <motion.div variants={itemVariants}>
        <SprintMetricsCards
          velocity={metrics.velocity}
          capacity={metrics.capacity}
          burndownProgress={metrics.burndownProgress}
          storiesCompleted={metrics.storiesCompleted}
          storiesTotal={metrics.storiesTotal}
          isOnTrack={metrics.isOnTrack}
        />
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
        <BurndownChart
          sprintDays={metrics.sprintDays}
          completedPoints={metrics.velocity}
          plannedPoints={metrics.capacity}
        />
        <VelocityHistoryChart data={velocityHistory} />
      </motion.div>

      {/* Bottom Row */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
        {/* Impediments placeholder */}
        <div className="rounded-lg border border-border/50 bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground">
              {t('indicators.activeImpediments', 'Impedimentos Ativos')}
            </h3>
            {canEdit && (
              <Button variant="link" size="sm" className="text-primary p-0 h-auto">
                {t('indicators.addImpediment', 'Adicionar')}
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('indicators.noImpediments', 'Nenhum impedimento ativo')}
          </p>
        </div>

        <SprintComparison sprints={sprintComparison} />
      </motion.div>

      {/* Sprint Form Dialog */}
      <SprintFormDialog
        open={isSprintDialogOpen}
        onOpenChange={setIsSprintDialogOpen}
        sprint={editingSprint}
        teams={teams}
        onSubmit={handleSprintSubmit}
        isLoading={updateSprint.isPending || createSprint.isPending}
      />
    </motion.div>
  );
};

export default IndicatorsPage;
