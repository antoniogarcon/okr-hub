import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface SprintData {
  id: string;
  name: string;
  status: 'planned' | 'active' | 'completed';
  completed: number;
  planned: number;
  burndown: number;
}

interface SprintComparisonProps {
  sprints: SprintData[];
  onViewDetails?: () => void;
}

export const SprintComparison: React.FC<SprintComparisonProps> = ({ 
  sprints,
  onViewDetails 
}) => {
  const { t } = useTranslation();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
            {t('indicators.current', 'Atual')}
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
            {t('indicators.completed', 'Concluída')}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-muted text-xs">
            {t('indicators.planned', 'Planejada')}
          </Badge>
        );
    }
  };

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">
            {t('indicators.sprintComparison', 'Comparativo de Sprints')}
          </CardTitle>
          {onViewDetails && (
            <Button variant="link" size="sm" className="text-primary p-0 h-auto" onClick={onViewDetails}>
              {t('indicators.viewDetails', 'Ver Detalhes')}
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sprints.map((sprint) => (
          <div 
            key={sprint.id} 
            className="p-3 rounded-lg border border-border/50 bg-muted/20 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{sprint.name}</span>
                {getStatusBadge(sprint.status)}
              </div>
              <span className="text-sm font-semibold text-foreground">
                {sprint.completed} pts
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                {t('indicators.delivered', 'Entregue')}: <span className="text-foreground">{sprint.completed}/{sprint.planned}</span>
              </span>
              <span>
                Burndown: <span className="text-foreground">{sprint.burndown}%</span>
              </span>
            </div>
          </div>
        ))}

        {sprints.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('indicators.noSprintsData', 'Nenhuma sprint encontrada')}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
