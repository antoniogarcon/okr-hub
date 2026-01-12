import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, Zap, Gauge, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR, es, enUS } from 'date-fns/locale';
import { useLanguage } from '@/hooks/useLanguage';
import type { MemberSprint } from '@/hooks/useMemberDashboard';

interface MemberSprintCardProps {
  sprint: MemberSprint | null;
}

const getLocale = (lang: string) => {
  switch (lang) {
    case 'pt-BR': return ptBR;
    case 'es': return es;
    default: return enUS;
  }
};

export const MemberSprintCard: React.FC<MemberSprintCardProps> = ({ sprint }) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const locale = getLocale(currentLanguage);

  if (!sprint) {
    return (
      <Card className="border-border/50 bg-card h-full">
        <CardHeader className="flex flex-row items-center gap-2 pb-4">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold text-foreground">
            {t('memberDashboard.currentSprint')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">{t('memberDashboard.noActiveSprint')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const velocity = sprint.completedPoints;
  const velocityPercentage = sprint.plannedPoints > 0 
    ? Math.round((sprint.completedPoints / sprint.plannedPoints) * 100) 
    : 0;

  return (
    <Card className="border-border/50 bg-card h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold text-foreground">
            {t('memberDashboard.currentSprint')}
          </CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary hover:text-primary/80"
          onClick={() => navigate('/indicators')}
        >
          {t('memberDashboard.viewMetrics')}
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sprint Header */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: sprint.teamColor || '#6366f1' }} 
              />
              <h4 className="font-semibold text-foreground">{sprint.name}</h4>
            </div>
            <Badge variant="secondary" className="bg-success/10 text-success">
              {t('indicators.activeSprint')}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{sprint.teamName}</p>
        </div>

        {/* Sprint Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" />
              {sprint.daysRemaining} {t('indicators.daysRemaining')}
            </div>
            <span className="font-medium text-foreground">{sprint.progress}%</span>
          </div>
          <Progress value={sprint.progress} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{format(new Date(sprint.startDate), 'dd MMM', { locale })}</span>
            <span>{format(new Date(sprint.endDate), 'dd MMM', { locale })}</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Velocity */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-warning" />
              <span className="text-xs text-muted-foreground">{t('indicators.velocity')}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-foreground">{velocity}</span>
              <span className="text-xs text-muted-foreground">/ {sprint.plannedPoints} pts</span>
            </div>
            <Progress 
              value={velocityPercentage} 
              className="h-1.5 mt-2" 
              indicatorClassName={velocityPercentage >= 80 ? 'bg-success' : velocityPercentage >= 50 ? 'bg-warning' : 'bg-destructive'}
            />
          </div>

          {/* Capacity */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Gauge className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">{t('indicators.capacityLabel')}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-foreground">{sprint.capacity}</span>
              <span className="text-xs text-muted-foreground">%</span>
            </div>
            <Progress 
              value={sprint.capacity} 
              className="h-1.5 mt-2" 
              indicatorClassName="bg-primary"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
