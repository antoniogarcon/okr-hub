import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Target, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { OKR } from '@/hooks/useOKRs';

interface OKRStatsProps {
  okrs: OKR[];
}

const OKRStats: React.FC<OKRStatsProps> = ({ okrs }) => {
  const { t } = useTranslation();

  const stats = React.useMemo(() => {
    const total = okrs.length;
    const completed = okrs.filter((o) => o.status === 'completed').length;
    const atRisk = okrs.filter((o) => o.status === 'at_risk').length;
    const behind = okrs.filter((o) => o.status === 'behind').length;
    const avgProgress = total > 0 
      ? Math.round(okrs.reduce((acc, o) => acc + o.progress, 0) / total)
      : 0;

    return { total, completed, atRisk, behind, avgProgress };
  }, [okrs]);

  const statItems = [
    {
      label: t('okrs.totalOkrs'),
      value: stats.total,
      icon: Target,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: t('okrs.avgProgress'),
      value: `${stats.avgProgress}%`,
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: t('okrs.atRisk'),
      value: stats.atRisk + stats.behind,
      icon: AlertTriangle,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: t('okrs.completed'),
      value: stats.completed,
      icon: CheckCircle,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.bgColor}`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default OKRStats;
