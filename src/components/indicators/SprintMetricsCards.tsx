import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Activity, Target, AlertTriangle } from 'lucide-react';

interface SprintMetricsCardsProps {
  velocity: number;
  capacity: number;
  burndownProgress: number;
  storiesCompleted: number;
  storiesTotal: number;
  isOnTrack: boolean;
}

export const SprintMetricsCards: React.FC<SprintMetricsCardsProps> = ({
  velocity,
  capacity,
  burndownProgress,
  storiesCompleted,
  storiesTotal,
  isOnTrack,
}) => {
  const { t } = useTranslation();
  
  const adherence = capacity > 0 ? Math.round((velocity / capacity) * 100) : 0;
  
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* Velocity */}
      <Card className="border-border/50 bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Velocity
            </span>
            {adherence > 80 && (
              <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
                ↑ {t('indicators.growing', 'Crescimento')}
              </Badge>
            )}
          </div>
          <p className="text-3xl font-bold text-foreground">
            {velocity} <span className="text-lg font-normal text-muted-foreground">pts</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t('indicators.capacityLabel', 'Capacidade')}: {capacity} pts
          </p>
          <Progress value={adherence} className="h-1.5 mt-2" />
        </CardContent>
      </Card>

      {/* Burndown */}
      <Card className="border-border/50 bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-info" />
              Burndown
            </span>
            <div className="w-2 h-2 rounded-full bg-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">{burndownProgress}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t('indicators.currentProgress', 'Progresso atual')}
          </p>
          <Progress value={burndownProgress} className="h-1.5 mt-2" />
        </CardContent>
      </Card>

      {/* Stories */}
      <Card className="border-border/50 bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-warning" />
              Stories
            </span>
            {isOnTrack && (
              <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
                {t('indicators.onTime', 'No prazo')}
              </Badge>
            )}
          </div>
          <p className="text-3xl font-bold text-foreground">
            {storiesCompleted}/{storiesTotal}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t('indicators.deliveredTotal', 'Entregues/Total')}
          </p>
          <Progress 
            value={storiesTotal > 0 ? (storiesCompleted / storiesTotal) * 100 : 0} 
            className="h-1.5 mt-2" 
          />
        </CardContent>
      </Card>

      {/* Impediments placeholder */}
      <Card className="border-border/50 bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              {t('indicators.impediments', 'Impedimentos')}
            </span>
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs">
              {t('indicators.attention', 'Atenção')}
            </Badge>
          </div>
          <p className="text-3xl font-bold text-foreground">0</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t('indicators.activeBlockers', 'Bloqueadores ativos')}
          </p>
          <Progress value={0} className="h-1.5 mt-2" />
        </CardContent>
      </Card>
    </div>
  );
};
