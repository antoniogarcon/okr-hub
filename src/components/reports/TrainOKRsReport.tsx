import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Target, Users, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { TrainOKRReport } from '@/hooks/useReportsData';

interface TrainOKRsReportProps {
  data: TrainOKRReport[];
  isLoading: boolean;
}

const statusConfig: Record<string, { 
  label: string; 
  icon: React.ElementType;
  className: string;
  badgeClass: string;
}> = {
  active: {
    label: 'Ativo',
    icon: TrendingUp,
    className: 'text-primary',
    badgeClass: 'bg-primary/20 text-primary border-primary/30',
  },
  at_risk: {
    label: 'Em Risco',
    icon: AlertTriangle,
    className: 'text-warning',
    badgeClass: 'bg-warning/20 text-warning border-warning/30',
  },
  behind: {
    label: 'Atrasado',
    icon: Clock,
    className: 'text-destructive',
    badgeClass: 'bg-destructive/20 text-destructive border-destructive/30',
  },
  completed: {
    label: 'Concluído',
    icon: CheckCircle,
    className: 'text-success',
    badgeClass: 'bg-success/20 text-success border-success/30',
  },
};

export const TrainOKRsReport: React.FC<TrainOKRsReportProps> = ({ data, isLoading }) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="glass border-border/50">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-2 w-full" />
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
          <Target className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            {t('reports.noOkrs', 'Nenhum OKR encontrado')}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate summary stats
  const totalOkrs = data.length;
  const completedOkrs = data.filter(o => o.status === 'completed').length;
  const atRiskOkrs = data.filter(o => o.status === 'at_risk' || o.status === 'behind').length;
  const avgProgress = Math.round(data.reduce((sum, o) => sum + o.progress, 0) / totalOkrs);

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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{avgProgress}%</p>
                  <p className="text-xs text-muted-foreground">
                    {t('reports.avgProgress', 'Progresso médio')}
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
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{completedOkrs}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('reports.completed', 'Concluídos')}
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
                <div className="p-2 rounded-lg bg-warning/10">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{atRiskOkrs}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('reports.atRisk', 'Em risco')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* OKRs List */}
      <Card className="glass border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {t('reports.trainOkrsList', 'OKRs do Trem')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.map((okr, index) => {
            const status = statusConfig[okr.status] || statusConfig.active;
            const StatusIcon = status.icon;

            return (
              <motion.div
                key={okr.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-lg bg-muted/30 border border-border/30"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">
                      {okr.title}
                    </h4>
                    {okr.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {okr.description}
                      </p>
                    )}
                  </div>
                  <Badge className={status.badgeClass}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">
                      {t('reports.progress', 'Progresso')}
                    </span>
                    <span className="font-medium text-foreground">{okr.progress}%</span>
                  </div>
                  <Progress value={okr.progress} className="h-2" />
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {okr.team && (
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: okr.team.color }}
                      />
                      <span className="text-muted-foreground">{okr.team.name}</span>
                    </div>
                  )}

                  {okr.owner && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-xs bg-primary/20 text-primary">
                          {okr.owner.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-muted-foreground">
                        {t('reports.owner', 'Responsável')}: {okr.owner.name}
                      </span>
                    </div>
                  )}

                  {okr.sponsor && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {t('reports.sponsor', 'Sponsor')}: {okr.sponsor.name}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 ml-auto text-muted-foreground">
                    <span>{okr.keyResultsCount} KRs</span>
                    {okr.childOkrsCount > 0 && (
                      <span>{okr.childOkrsCount} {t('reports.childOkrs', 'filhos')}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};
