import React from 'react';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DelayedGoalCardProps {
  name: string;
  team: string;
  daysDelayed: number;
  priority: 'high' | 'medium' | 'low';
}

export const DelayedGoalCard: React.FC<DelayedGoalCardProps> = ({
  name,
  team,
  daysDelayed,
  priority,
}) => {
  const getPriorityBadge = () => {
    switch (priority) {
      case 'high':
        return (
          <Badge className="bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30">
            Alta
          </Badge>
        );
      case 'medium':
        return (
          <Badge className="bg-warning/20 text-warning border-warning/30 hover:bg-warning/30">
            Média
          </Badge>
        );
      case 'low':
        return (
          <Badge className="bg-info/20 text-info border-info/30 hover:bg-info/30">
            Baixa
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 p-4 hover:bg-muted/30 transition-colors cursor-pointer">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground mb-1 line-clamp-1">{name}</h4>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{team}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{daysDelayed} dias atrasado</span>
            </div>
          </div>
        </div>
        <div className="shrink-0">
          {getPriorityBadge()}
        </div>
      </div>
    </div>
  );
};
