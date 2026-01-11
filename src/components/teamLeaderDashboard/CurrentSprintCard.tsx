import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, ArrowRight, Clock, CheckSquare, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR, es, enUS } from 'date-fns/locale';
import type { CurrentSprint } from '@/hooks/useTeamLeaderDashboard';

interface CurrentSprintCardProps {
  sprint: CurrentSprint | null;
}

export const CurrentSprintCard: React.FC<CurrentSprintCardProps> = ({ sprint }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const getLocale = () => {
    switch (i18n.language) {
      case 'pt-BR':
        return ptBR;
      case 'es':
        return es;
      default:
        return enUS;
    }
  };

  const getSprintStatus = () => {
    if (!sprint) return { color: 'bg-muted text-muted-foreground', label: '' };
    
    const deliveryRate = sprint.plannedPoints > 0 
      ? (sprint.completedPoints / sprint.plannedPoints) * 100 
      : 0;
    
    if (deliveryRate >= 80) {
      return { color: 'bg-success/10 text-success border-success/20', label: t('dashboard.onTrack') };
    } else if (deliveryRate >= 50) {
      return { color: 'bg-warning/10 text-warning border-warning/20', label: t('dashboard.needsAttention') };
    }
    return { color: 'bg-destructive/10 text-destructive border-destructive/20', label: t('dashboard.critical') };
  };

  const statusConfig = getSprintStatus();

  if (!sprint) {
    return (
      <Card className="border-border/50 bg-card h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {t('teamLeaderDashboard.currentSprint')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('teamLeaderDashboard.noActiveSprint')}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => navigate('/indicators')}
            >
              {t('indicators.createSprint')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const deliveryPercentage = sprint.plannedPoints > 0
    ? Math.round((sprint.completedPoints / sprint.plannedPoints) * 100)
    : 0;

  return (
    <Card className="border-border/50 bg-card h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {t('teamLeaderDashboard.currentSprint')}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => navigate('/indicators')}
          >
            {t('teamLeaderDashboard.viewMetrics')}
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sprint Header */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-foreground">{sprint.name}</h4>
            <p className="text-xs text-muted-foreground">
              {format(new Date(sprint.startDate), 'dd MMM', { locale: getLocale() })} - {' '}
              {format(new Date(sprint.endDate), 'dd MMM', { locale: getLocale() })}
            </p>
          </div>
          <Badge variant="outline" className={statusConfig.color}>
            {statusConfig.label}
          </Badge>
        </div>

        {/* Sprint Progress */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {t('teamLeaderDashboard.timeProgress')}
            </span>
            <span className="font-medium text-foreground">
              {sprint.daysRemaining} {t('indicators.daysRemaining')}
            </span>
          </div>
          <Progress value={sprint.progress} className="h-2" />
        </motion.div>

        {/* Delivery Stats */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="p-3 rounded-lg bg-muted/30 border border-border/50"
          >
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t('indicators.plannedPoints')}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{sprint.plannedPoints}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="p-3 rounded-lg bg-muted/30 border border-border/50"
          >
            <div className="flex items-center gap-2 mb-1">
              <CheckSquare className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">{t('indicators.completedPoints')}</span>
            </div>
            <p className="text-xl font-bold text-success">{sprint.completedPoints}</p>
          </motion.div>
        </div>

        {/* Delivery Rate */}
        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">{t('teamLeaderDashboard.deliveryRate')}</span>
            <span className="font-semibold text-foreground">{deliveryPercentage}%</span>
          </div>
          <Progress 
            value={deliveryPercentage} 
            className="h-1.5"
            indicatorClassName={
              deliveryPercentage >= 80 ? 'bg-success' :
              deliveryPercentage >= 50 ? 'bg-warning' : 'bg-destructive'
            }
          />
        </div>
      </CardContent>
    </Card>
  );
};
