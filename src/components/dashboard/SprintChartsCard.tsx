import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
} from 'recharts';

interface SprintChartsCardProps {
  velocityData: { sprint: string; planned: number; completed: number }[];
  capacityData: { name: string; value: number }[];
  sprintStatus: {
    name: string;
    daysRemaining: number;
    progress: number;
    status: 'on-track' | 'at-risk' | 'behind';
  };
}

export const SprintChartsCard: React.FC<SprintChartsCardProps> = ({
  velocityData,
  capacityData,
  sprintStatus,
}) => {
  const statusColors = {
    'on-track': 'bg-success/10 text-success border-success/20',
    'at-risk': 'bg-warning/10 text-warning border-warning/20',
    'behind': 'bg-destructive/10 text-destructive border-destructive/20',
  };

  const statusLabels = {
    'on-track': 'No Prazo',
    'at-risk': 'Em Risco',
    'behind': 'Atrasada',
  };

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            Indicadores de Sprint
          </CardTitle>
          <Badge variant="outline" className={statusColors[sprintStatus.status]}>
            {statusLabels[sprintStatus.status]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {sprintStatus.name} • {sprintStatus.daysRemaining} dias restantes
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sprint Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso da Sprint</span>
            <span className="font-medium text-foreground">{sprintStatus.progress}%</span>
          </div>
          <Progress value={sprintStatus.progress} className="h-2" />
        </div>

        {/* Velocity Chart */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Velocity (últimas sprints)</h4>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={velocityData} barGap={4}>
                <XAxis 
                  dataKey="sprint" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar 
                  dataKey="planned" 
                  fill="hsl(var(--muted-foreground) / 0.3)" 
                  radius={[4, 4, 0, 0]} 
                  name="Planejado"
                />
                <Bar 
                  dataKey="completed" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]} 
                  name="Concluído"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Capacity Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Capacidade por Área</h4>
          <div className="space-y-2">
            {capacityData.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="w-20 text-xs text-muted-foreground truncate">{item.name}</span>
                <div className="flex-1">
                  <Progress 
                    value={item.value} 
                    className="h-2" 
                    indicatorClassName={
                      item.value > 80 
                        ? 'bg-success' 
                        : item.value > 50 
                        ? 'bg-primary' 
                        : 'bg-warning'
                    }
                  />
                </div>
                <span className="w-10 text-xs font-medium text-foreground text-right">
                  {item.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
