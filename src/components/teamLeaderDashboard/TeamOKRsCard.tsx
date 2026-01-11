import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, ArrowRight, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import type { TeamOKR } from '@/hooks/useTeamLeaderDashboard';

interface TeamOKRsCardProps {
  okrs: TeamOKR[];
  teamId: string | null;
}

export const TeamOKRsCard: React.FC<TeamOKRsCardProps> = ({ okrs, teamId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const getStatusConfig = (status: TeamOKR['status']) => {
    switch (status) {
      case 'completed':
        return {
          color: 'bg-success/10 text-success border-success/20',
          icon: CheckCircle,
          label: t('okrs.completed'),
        };
      case 'at-risk':
        return {
          color: 'bg-warning/10 text-warning border-warning/20',
          icon: AlertTriangle,
          label: t('okrs.atRisk'),
        };
      case 'behind':
        return {
          color: 'bg-destructive/10 text-destructive border-destructive/20',
          icon: AlertTriangle,
          label: t('okrs.behind'),
        };
      default:
        return {
          color: 'bg-primary/10 text-primary border-primary/20',
          icon: Clock,
          label: t('okrs.onTrack'),
        };
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 70) return 'bg-success';
    if (progress >= 40) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <Card className="border-border/50 bg-card h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {t('teamLeaderDashboard.teamOkrs')}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => navigate(`/okrs${teamId ? `?team=${teamId}` : ''}`)}
          >
            {t('common.viewAll')}
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('teamLeaderDashboard.activeOkrs', { count: okrs.length })}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {okrs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('teamLeaderDashboard.noTeamOkrs')}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => navigate('/okrs')}
            >
              {t('okrs.createOkr')}
            </Button>
          </div>
        ) : (
          okrs.slice(0, 4).map((okr, index) => {
            const statusConfig = getStatusConfig(okr.status);
            const StatusIcon = statusConfig.icon;

            return (
              <motion.div
                key={okr.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/okrs`)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm font-medium text-foreground line-clamp-1 flex-1">
                    {okr.title}
                  </h4>
                  <Badge variant="outline" className={`text-xs ${statusConfig.color}`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {okr.keyResultsCompleted}/{okr.keyResultsCount} KRs
                    </span>
                    <span className="font-medium text-foreground">{okr.progress}%</span>
                  </div>
                  <Progress 
                    value={okr.progress} 
                    className="h-1.5" 
                    indicatorClassName={getProgressColor(okr.progress)}
                  />
                </div>
              </motion.div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
