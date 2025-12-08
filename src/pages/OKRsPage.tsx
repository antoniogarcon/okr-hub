import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Target, Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const OKRsPage: React.FC = () => {
  const { t } = useTranslation();

  const mockOkrs = [
    {
      id: '1',
      objective: 'Aumentar satisfação do cliente',
      progress: 72,
      status: 'on-track',
      keyResults: [
        { name: 'NPS acima de 50', progress: 80 },
        { name: 'Taxa de churn < 5%', progress: 65 },
        { name: 'Tempo de resposta < 2h', progress: 70 },
      ],
      owner: 'Maria Silva',
      dueDate: '2024-Q4',
    },
    {
      id: '2',
      objective: 'Melhorar eficiência operacional',
      progress: 45,
      status: 'at-risk',
      keyResults: [
        { name: 'Automatizar 80% dos deploys', progress: 60 },
        { name: 'Reduzir bugs críticos em 50%', progress: 30 },
      ],
      owner: 'João Costa',
      dueDate: '2024-Q4',
    },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      'on-track': 'bg-success/20 text-success border-success/30',
      'at-risk': 'bg-warning/20 text-warning border-warning/30',
      'behind': 'bg-destructive/20 text-destructive border-destructive/30',
    };
    const labels = {
      'on-track': t('okrs.onTrack'),
      'at-risk': t('okrs.atRisk'),
      'behind': t('okrs.behind'),
    };
    return (
      <Badge variant="outline" className={styles[status as keyof typeof styles]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Target className="h-8 w-8 text-primary" />
            {t('okrs.title')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Gerencie objetivos e resultados-chave da sua organização
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            {t('common.filter')}
          </Button>
          <Button size="sm" className="glow">
            <Plus className="mr-2 h-4 w-4" />
            {t('okrs.createOkr')}
          </Button>
        </div>
      </motion.div>

      {/* OKRs List */}
      <div className="space-y-4">
        {mockOkrs.map((okr) => (
          <motion.div key={okr.id} variants={itemVariants}>
            <Card className="glass border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-foreground">{okr.objective}</CardTitle>
                    <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{t('okrs.owner')}: {okr.owner}</span>
                      <span>{t('okrs.dueDate')}: {okr.dueDate}</span>
                    </div>
                  </div>
                  {getStatusBadge(okr.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Progress value={okr.progress} className="flex-1 h-2" />
                  <span className="text-sm font-semibold text-foreground">{okr.progress}%</span>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{t('okrs.keyResults')}</p>
                  {okr.keyResults.map((kr, index) => (
                    <div key={index} className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{kr.name}</p>
                      </div>
                      <Progress value={kr.progress} className="w-24 h-1.5" />
                      <span className="text-xs text-muted-foreground w-10">{kr.progress}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default OKRsPage;
