import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface VelocityHistoryChartProps {
  data: {
    sprint: string;
    planned: number;
    completed: number;
    isActive?: boolean;
  }[];
}

export const VelocityHistoryChart: React.FC<VelocityHistoryChartProps> = ({ data }) => {
  const { t } = useTranslation();
  
  const maxValue = Math.max(...data.map(d => Math.max(d.planned, d.completed)), 1);

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">
            {t('indicators.velocityHistory', 'Histórico de Velocity')}
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {t('indicators.lastSprints', 'Últimas {{count}} sprints', { count: data.length })}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${item.isActive ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
            <span className="w-20 text-sm text-muted-foreground truncate">{item.sprint}</span>
            <div className="flex-1">
              <Progress 
                value={(item.completed / maxValue) * 100} 
                className="h-2"
              />
            </div>
            <span className="w-16 text-sm font-medium text-foreground text-right">
              {item.completed} pts
            </span>
          </div>
        ))}
        
        {data.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('indicators.noVelocityData', 'Nenhum dado de velocity disponível')}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
