import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Zap, Users, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { AgileIndicators } from '@/hooks/useTeamLeaderDashboard';

interface AgileIndicatorsCardProps {
  indicators: AgileIndicators;
}

export const AgileIndicatorsCard: React.FC<AgileIndicatorsCardProps> = ({ indicators }) => {
  const { t } = useTranslation();

  const getTrendConfig = () => {
    switch (indicators.velocityTrend) {
      case 'up':
        return {
          icon: TrendingUp,
          color: 'text-success',
          bgColor: 'bg-success/10',
          label: t('teamLeaderDashboard.trendUp'),
        };
      case 'down':
        return {
          icon: TrendingDown,
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          label: t('teamLeaderDashboard.trendDown'),
        };
      default:
        return {
          icon: Minus,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          label: t('teamLeaderDashboard.trendStable'),
        };
    }
  };

  const trendConfig = getTrendConfig();
  const TrendIcon = trendConfig.icon;

  const metrics = [
    {
      label: t('teamLeaderDashboard.currentVelocity'),
      value: indicators.currentVelocity,
      subtitle: `${t('teamLeaderDashboard.avgLabel')}: ${indicators.avgVelocity}`,
      icon: Zap,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: t('teamLeaderDashboard.currentCapacity'),
      value: `${indicators.currentCapacity}%`,
      subtitle: `${t('teamLeaderDashboard.avgLabel')}: ${indicators.avgCapacity}%`,
      icon: Users,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  return (
    <Card className="border-border/50 bg-card h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {t('teamLeaderDashboard.agileIndicators')}
          </CardTitle>
          <Badge variant="outline" className={`${trendConfig.bgColor} ${trendConfig.color} border-transparent`}>
            <TrendIcon className="h-3 w-3 mr-1" />
            {trendConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 rounded-lg ${metric.bgColor}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                  <span className="text-xs text-muted-foreground">{metric.label}</span>
                </div>
                <p className={`text-xl font-bold ${metric.color}`}>{metric.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{metric.subtitle}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Velocity Chart */}
        {indicators.velocityHistory.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">
              {t('teamLeaderDashboard.velocityComparison')}
            </h4>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={indicators.velocityHistory} barGap={4}>
                  <XAxis
                    dataKey="sprint"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    width={25}
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
                    name={t('indicators.planned')}
                  />
                  <Bar
                    dataKey="completed"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    name={t('indicators.delivered')}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {indicators.velocityHistory.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('indicators.noVelocityData')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
