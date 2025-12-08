import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface TeamProgressCardProps {
  name: string;
  initial: string;
  color: string;
  objectives: number;
  keyResults: number;
  progress: number;
  status: 'on-track' | 'at-risk' | 'behind';
}

export const TeamProgressCard: React.FC<TeamProgressCardProps> = ({
  name,
  initial,
  color,
  objectives,
  keyResults,
  progress,
  status,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'on-track':
        return 'bg-success';
      case 'at-risk':
        return 'bg-warning';
      case 'behind':
        return 'bg-destructive';
      default:
        return 'bg-muted';
    }
  };

  const getProgressIndicatorColor = () => {
    switch (status) {
      case 'on-track':
        return 'bg-success';
      case 'at-risk':
        return 'bg-warning';
      case 'behind':
        return 'bg-destructive';
      default:
        return 'bg-primary';
    }
  };

  return (
    <div className="group rounded-xl bg-muted/30 p-4 hover:bg-muted/50 transition-colors cursor-pointer">
      <div className="flex items-center gap-4">
        {/* Team Avatar */}
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white font-semibold text-sm',
            color
          )}
        >
          {initial}
        </div>

        {/* Team Info & Progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-foreground truncate">{name}</h4>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-lg font-bold text-foreground">{progress}%</span>
              <div className={cn('h-2.5 w-2.5 rounded-full', getStatusColor())} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {objectives} objetivos • {keyResults} resultados-chave
          </p>
          <Progress 
            value={progress} 
            className="h-2"
            indicatorClassName={getProgressIndicatorColor()}
          />
        </div>
      </div>
    </div>
  );
};
