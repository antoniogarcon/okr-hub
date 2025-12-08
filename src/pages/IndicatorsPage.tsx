import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const IndicatorsPage: React.FC = () => {
  const { t } = useTranslation();

  const sprintData = {
    velocity: 42,
    plannedPoints: 48,
    completedPoints: 42,
    stories: { completed: 8, total: 10 },
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
            <BarChart3 className="h-8 w-8 text-primary" />
            {t('indicators.title')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Acompanhe métricas de performance da equipe
          </p>
        </div>
        <Select defaultValue="sprint-24">
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('indicators.selectSprint')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sprint-24">Sprint 24</SelectItem>
            <SelectItem value="sprint-23">Sprint 23</SelectItem>
            <SelectItem value="sprint-22">Sprint 22</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Metrics */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-3">
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {t('indicators.velocity')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-foreground">{sprintData.velocity}</p>
            <p className="text-sm text-success mt-1">+5 vs média</p>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-info" />
              {t('indicators.completedStories')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-foreground">
              {sprintData.stories.completed}/{sprintData.stories.total}
            </p>
            <p className="text-sm text-muted-foreground mt-1">80% concluído</p>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-warning" />
              Story Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-foreground">
              {sprintData.completedPoints}/{sprintData.plannedPoints}
            </p>
            <p className="text-sm text-muted-foreground mt-1">87.5% entregue</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts placeholder */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground">{t('indicators.burndown')}</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">Gráfico de Burndown será implementado aqui</p>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground">{t('indicators.velocity')}</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">Histórico de Velocidade será implementado aqui</p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default IndicatorsPage;
