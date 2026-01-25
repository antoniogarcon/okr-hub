import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Users, TrendingUp, TrendingDown, Minus, Activity, Target, Gauge } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { TeamReport } from '@/hooks/useReportsData';

interface TeamReportsCardProps {
  data: TeamReport[];
  isLoading: boolean;
}

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

const trendColors = {
  up: 'text-success',
  down: 'text-destructive',
  stable: 'text-muted-foreground',
};

export const TeamReportsCard: React.FC<TeamReportsCardProps> = ({ data, isLoading }) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="glass border-border/50">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-1/2 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="glass border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            {t('reports.noTeams', 'Nenhuma equipe encontrada')}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate aggregated stats
  const totalMembers = data.reduce((sum, t) => sum + t.memberCount, 0);
  const avgVelocity = Math.round(data.reduce((sum, t) => sum + t.avgVelocity, 0) / data.length);
  const avgCapacity = Math.round(data.reduce((sum, t) => sum + t.avgCapacity, 0) / data.length);
  const totalOkrs = data.reduce((sum, t) => sum + t.okrCount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{data.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('reports.teams', 'Equipes')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <Activity className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{avgVelocity}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('reports.avgVelocity', 'Velocity médio')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Gauge className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{avgCapacity}%</p>
                  <p className="text-xs text-muted-foreground">
                    {t('reports.avgCapacity', 'Capacidade média')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalOkrs}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('reports.totalOkrs', 'Total OKRs')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Teams Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {data.map((team, index) => {
          const TrendIcon = trendIcons[team.deliveryTrend];

          return (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="glass border-border/50 h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: team.color }}
                      />
                      <CardTitle className="text-base font-semibold text-foreground">
                        {team.name}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendIcon className={`h-4 w-4 ${trendColors[team.deliveryTrend]}`} />
                      <Badge variant="secondary" className="text-xs">
                        {team.memberCount} {t('reports.members', 'membros')}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* OKR Progress */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">
                        {t('reports.okrProgress', 'Progresso OKRs')} ({team.okrCount})
                      </span>
                      <span className="font-medium text-foreground">{team.avgProgress}%</span>
                    </div>
                    <Progress value={team.avgProgress} className="h-2" />
                  </div>

                  {/* Sprint Info */}
                  {team.activeSprint && (
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-medium text-foreground">
                          {team.activeSprint.name}
                        </span>
                        <Badge className="bg-primary/20 text-primary border-primary/30">
                          {t('reports.activeSprint', 'Ativa')}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">
                          {team.activeSprint.completedPoints}/{team.activeSprint.plannedPoints} pts
                        </span>
                        <span className="font-medium text-foreground">
                          {team.activeSprint.progress}%
                        </span>
                      </div>
                      <Progress value={team.activeSprint.progress} className="h-1.5" />
                    </div>
                  )}

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="text-center">
                      <p className="text-lg font-semibold text-foreground">{team.avgVelocity}</p>
                      <p className="text-xs text-muted-foreground">Velocity</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-foreground">{team.avgCapacity}%</p>
                      <p className="text-xs text-muted-foreground">Capacity</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-foreground">{team.completedSprints}</p>
                      <p className="text-xs text-muted-foreground">Sprints</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
