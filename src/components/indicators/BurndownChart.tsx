import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface BurndownChartProps {
  sprintDays: number;
  completedPoints: number;
  plannedPoints: number;
}

export const BurndownChart: React.FC<BurndownChartProps> = ({
  sprintDays,
  completedPoints,
  plannedPoints,
}) => {
  const { t } = useTranslation();

  // Generate burndown data - ideal line + actual progress simulation
  const data = Array.from({ length: sprintDays + 1 }, (_, i) => {
    const day = i;
    const idealRemaining = plannedPoints - (plannedPoints / sprintDays) * day;
    
    // Simulate actual burndown (for demo purposes)
    const progressRatio = completedPoints / plannedPoints;
    const actualRemaining = Math.max(
      0,
      plannedPoints - (progressRatio * plannedPoints * (day / sprintDays)) * (1 + Math.random() * 0.2 - 0.1)
    );
    
    return {
      day: `D${day}`,
      ideal: Math.round(idealRemaining),
      actual: day <= Math.ceil(sprintDays * progressRatio) ? Math.round(actualRemaining) : null,
    };
  });

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">
            {t('indicators.burndownChart', 'Gráfico Burndown')}
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {t('indicators.lastDays', 'Últimos {{days}} dias', { days: sprintDays })}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <XAxis 
                dataKey="day" 
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
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value) => (
                  <span className="text-muted-foreground">
                    {value === 'ideal' ? t('indicators.ideal', 'Ideal') : t('indicators.actual', 'Real')}
                  </span>
                )}
              />
              <Line 
                type="monotone" 
                dataKey="ideal" 
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="ideal"
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
                name="actual"
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
