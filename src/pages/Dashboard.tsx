import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Download, 
  Plus, 
  Target,
  TrendingUp,
  Zap,
  Clock,
  Users,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useAuth } from '@/contexts/AuthContext';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { TeamProgressCard } from '@/components/dashboard/TeamProgressCard';
import { DelayedGoalCard } from '@/components/dashboard/DelayedGoalCard';
import { SprintChartsCard } from '@/components/dashboard/SprintChartsCard';
import { FeedNotificationsCard } from '@/components/dashboard/FeedNotificationsCard';
import {
  useDashboardStats,
  useTeamsWithStats,
  useSprintStats,
  useFeedEvents,
  useDelayedOkrs,
} from '@/hooks/useDashboardData';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getTenantId, hasMinimumRole } = useAuth();
  
  const tenantId = getTenantId();
  
  // Check access - admin or root only
  const hasAccess = hasMinimumRole('admin');

  // Fetch all dashboard data
  const { data: stats, isLoading: statsLoading } = useDashboardStats(tenantId);
  const { data: teams, isLoading: teamsLoading } = useTeamsWithStats(tenantId);
  const { data: sprintStats, isLoading: sprintLoading } = useSprintStats(tenantId);
  const { data: feedEvents, isLoading: feedLoading } = useFeedEvents(tenantId, 5);
  const { data: delayedOkrs, isLoading: delayedLoading } = useDelayedOkrs(tenantId);

  const isLoading = statsLoading || teamsLoading || sprintLoading || feedLoading || delayedLoading;

  // Transform feed events for component
  const notifications = feedEvents?.map(event => ({
    id: event.id,
    type: event.event_type,
    title: event.title,
    description: event.description || '',
    timestamp: new Date(event.created_at),
    read: event.is_read,
    author: event.author,
  })) || [];

  // Calculate velocity data for chart
  const velocityData = sprintStats?.velocityTrend || [];

  // Default capacity breakdown
  const capacityData = [
    { name: 'Frontend', value: 85 },
    { name: 'Backend', value: 72 },
    { name: 'QA', value: 90 },
    { name: 'DevOps', value: 65 },
  ];

  // Current sprint status
  const currentSprint = {
    name: teams && teams.length > 0 && teams[0].currentSprint 
      ? teams[0].currentSprint 
      : t('dashboard.noActiveSprint', 'No active sprint'),
    daysRemaining: 5,
    progress: sprintStats?.averageVelocity ? Math.min(100, Math.round((sprintStats.averageVelocity / 50) * 100)) : 0,
    status: 'on-track' as const,
  };

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-warning mx-auto" />
          <h2 className="text-xl font-semibold text-foreground">
            {t('common.accessDenied', 'Acesso Negado')}
          </h2>
          <p className="text-muted-foreground">
            {t('dashboard.adminOnly', 'Este dashboard é exclusivo para administradores.')}
          </p>
        </div>
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
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('dashboard.title', 'Dashboard OKRs')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.subtitle', 'Visão geral do progresso organizacional')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select defaultValue="q4-2024">
            <SelectTrigger className="w-32 bg-card border-border">
              <SelectValue placeholder={t('common.period', 'Período')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="q4-2024">Q4 2024</SelectItem>
              <SelectItem value="q3-2024">Q3 2024</SelectItem>
              <SelectItem value="q2-2024">Q2 2024</SelectItem>
              <SelectItem value="q1-2024">Q1 2024</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>

          <Button className="gap-2" onClick={() => navigate('/okrs')}>
            <Plus className="h-4 w-4" />
            {t('dashboard.newOkr', 'Novo OKR')}
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="border-border/50 bg-card">
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16 mb-4" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            {/* OKRs Ativos */}
            <StatsCard
              title={t('dashboard.activeOkrs', 'OKRs Ativos')}
              value={stats?.activeOkrs || 0}
              icon={Target}
            >
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('dashboard.completed', 'Concluídos')}</span>
                  <span className="font-medium text-foreground">{stats?.completedOkrs || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('dashboard.atRisk', 'Em risco')}</span>
                  <span className="font-medium text-warning">{stats?.atRiskOkrs || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('dashboard.delayed', 'Atrasados')}</span>
                  <span className="font-medium text-destructive">{stats?.delayedOkrs || 0}</span>
                </div>
              </div>
            </StatsCard>

            {/* Progresso Geral */}
            <StatsCard
              title={t('dashboard.overallProgress', 'Progresso Geral')}
              value={`${stats?.averageProgress || 0}%`}
              valueClassName="text-primary"
              icon={TrendingUp}
            >
              <div className="mt-3 space-y-2">
                <Progress value={stats?.averageProgress || 0} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {t('dashboard.progressDescription', 'Média de todos os OKRs ativos')}
                </p>
              </div>
            </StatsCard>

            {/* Velocity */}
            <StatsCard
              title={t('dashboard.velocity', 'Velocity')}
              value={sprintStats?.averageVelocity || 0}
              icon={Zap}
            >
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('dashboard.avgVelocity', 'Média do Trem')}</span>
                  <span className="font-medium text-foreground">{sprintStats?.averageVelocity || 0} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('dashboard.sprintsAnalyzed', 'Sprints analisadas')}</span>
                  <span className="font-medium text-foreground">{velocityData.length}</span>
                </div>
              </div>
            </StatsCard>

            {/* Teams Count */}
            <StatsCard
              title={t('dashboard.teams', 'Equipes')}
              value={teams?.length || 0}
              icon={Users}
            >
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('dashboard.onTrack', 'No prazo')}</span>
                  <span className="font-medium text-success">
                    {teams?.filter(t => t.healthStatus === 'on-track').length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('dashboard.needsAttention', 'Atenção')}</span>
                  <span className="font-medium text-warning">
                    {teams?.filter(t => t.healthStatus === 'at-risk').length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('dashboard.critical', 'Crítico')}</span>
                  <span className="font-medium text-destructive">
                    {teams?.filter(t => t.healthStatus === 'delayed').length || 0}
                  </span>
                </div>
              </div>
            </StatsCard>
          </>
        )}
      </motion.div>

      {/* Main Content - Three Columns */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Team Progress - Left Column */}
        <motion.div variants={itemVariants} className="lg:col-span-4">
          <Card className="border-border/50 bg-card h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">
                {t('dashboard.teamProgress', 'Progresso por Equipe')}
              </CardTitle>
              <Button 
                variant="link" 
                className="text-primary p-0 h-auto font-medium"
                onClick={() => navigate('/teams')}
              >
                {t('common.viewAll', 'Ver todos')}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {teamsLoading ? (
                <>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-2 w-full" />
                      </div>
                    </div>
                  ))}
                </>
              ) : teams && teams.length > 0 ? (
                teams.slice(0, 5).map((team) => (
                  <TeamProgressCard
                    key={team.id}
                    name={team.name}
                    initial={team.name.charAt(0).toUpperCase()}
                    color={`bg-[${team.color}]`}
                    objectives={team.okrCount}
                    keyResults={team.keyResultCount}
                    progress={team.averageProgress}
                    status={team.healthStatus}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('dashboard.noTeams', 'Nenhuma equipe cadastrada')}</p>
                  <Button 
                    variant="link" 
                    className="mt-2"
                    onClick={() => navigate('/teams')}
                  >
                    {t('dashboard.createTeam', 'Criar equipe')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Sprint Charts - Middle Column */}
        <motion.div variants={itemVariants} className="lg:col-span-4">
          {sprintLoading ? (
            <Card className="border-border/50 bg-card h-full">
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          ) : (
            <SprintChartsCard
              velocityData={velocityData.length > 0 ? velocityData : [
                { sprint: 'S1', planned: 0, completed: 0 },
              ]}
              capacityData={capacityData}
              sprintStatus={currentSprint}
            />
          )}
        </motion.div>

        {/* Right Column - Delayed Goals + Feed */}
        <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6">
          {/* Delayed Goals */}
          <Card className="border-border/50 bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">
                {t('dashboard.delayedGoals', 'Metas Atrasadas')}
              </CardTitle>
              <Button 
                variant="link" 
                className="text-primary p-0 h-auto font-medium"
                onClick={() => navigate('/okrs')}
              >
                {t('common.manage', 'Gerenciar')}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {delayedLoading ? (
                <>
                  {[1, 2].map(i => (
                    <div key={i} className="p-3 rounded-lg bg-muted/30">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  ))}
                </>
              ) : delayedOkrs && delayedOkrs.length > 0 ? (
                delayedOkrs.map((goal) => (
                  <DelayedGoalCard
                    key={goal.id}
                    name={goal.name}
                    team={goal.team}
                    daysDelayed={goal.daysDelayed}
                    priority={goal.priority}
                  />
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">{t('dashboard.noDelayedGoals', 'Nenhuma meta atrasada')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feed Notifications */}
          {feedLoading ? (
            <Card className="border-border/50 bg-card">
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                {[1, 2, 3].map(i => (
                  <div key={i} className="py-3 border-b border-border/50 last:border-0">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <FeedNotificationsCard
              notifications={notifications}
              onViewAll={() => navigate('/feed')}
            />
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
