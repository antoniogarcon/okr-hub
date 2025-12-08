import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Download, 
  Plus, 
  ChevronDown,
  Target,
  TrendingUp,
  Zap,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { StatsCard } from '@/components/dashboard/StatsCard';
import { TeamProgressCard } from '@/components/dashboard/TeamProgressCard';
import { DelayedGoalCard } from '@/components/dashboard/DelayedGoalCard';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Mock data - will be replaced with real data later
const mockStats = {
  activeOkrs: {
    total: 12,
    completed: 8,
    inProgress: 4,
    delayed: 3,
  },
  overallProgress: {
    percentage: 79,
    change: '+5% desde o último mês',
  },
  velocity: {
    value: 42,
    storyPoints: 1240,
    stories: 156,
  },
  cycleTime: {
    value: '4.2d',
    defectRate: '2.1%',
    burndown: 'Positivo',
  },
};

const mockTeams = [
  {
    id: '1',
    name: 'Produto',
    initial: 'P',
    color: 'bg-violet-500',
    objectives: 4,
    keyResults: 12,
    progress: 85,
    status: 'on-track' as const,
  },
  {
    id: '2',
    name: 'Engenharia',
    initial: 'E',
    color: 'bg-emerald-500',
    objectives: 3,
    keyResults: 9,
    progress: 72,
    status: 'at-risk' as const,
  },
  {
    id: '3',
    name: 'Marketing',
    initial: 'M',
    color: 'bg-blue-500',
    objectives: 2,
    keyResults: 6,
    progress: 91,
    status: 'on-track' as const,
  },
  {
    id: '4',
    name: 'Vendas',
    initial: 'V',
    color: 'bg-orange-500',
    objectives: 3,
    keyResults: 8,
    progress: 68,
    status: 'at-risk' as const,
  },
];

const mockDelayedGoals = [
  {
    id: '1',
    name: 'Aumentar conversão em 15%',
    team: 'Marketing',
    daysDelayed: 5,
    priority: 'high' as const,
  },
  {
    id: '2',
    name: 'Reduzir bugs críticos',
    team: 'Engenharia',
    daysDelayed: 3,
    priority: 'medium' as const,
  },
  {
    id: '3',
    name: 'Implementar novo CRM',
    team: 'Vendas',
    daysDelayed: 8,
    priority: 'high' as const,
  },
];

const Dashboard: React.FC = () => {
  const { t } = useTranslation();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard OKRs</h1>
            <p className="text-sm text-muted-foreground">
              Visão geral do progresso organizacional
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select defaultValue="q4-2024">
            <SelectTrigger className="w-32 bg-card border-border">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="q4-2024">Q4 2024</SelectItem>
              <SelectItem value="q3-2024">Q3 2024</SelectItem>
              <SelectItem value="q2-2024">Q2 2024</SelectItem>
              <SelectItem value="q1-2024">Q1 2024</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>

          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo OKR
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* OKRs Ativos */}
        <StatsCard
          title="OKRs Ativos"
          value={mockStats.activeOkrs.total}
          icon={Target}
        >
          <div className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Concluídos</span>
              <span className="font-medium text-foreground">{mockStats.activeOkrs.completed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Em andamento</span>
              <span className="font-medium text-foreground">{mockStats.activeOkrs.inProgress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Atrasados</span>
              <span className="font-medium text-destructive">{mockStats.activeOkrs.delayed}</span>
            </div>
          </div>
        </StatsCard>

        {/* Progresso Geral */}
        <StatsCard
          title="Progresso Geral"
          value={`${mockStats.overallProgress.percentage}%`}
          valueClassName="text-primary"
          icon={TrendingUp}
        >
          <div className="mt-3 space-y-2">
            <Progress value={mockStats.overallProgress.percentage} className="h-2" />
            <p className="text-xs text-success">{mockStats.overallProgress.change}</p>
          </div>
        </StatsCard>

        {/* Velocity */}
        <StatsCard
          title="Velocity"
          value={mockStats.velocity.value}
          icon={Zap}
        >
          <div className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Story Points</span>
              <span className="font-medium text-foreground">{mockStats.velocity.storyPoints}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Histórias</span>
              <span className="font-medium text-foreground">{mockStats.velocity.stories}</span>
            </div>
          </div>
        </StatsCard>

        {/* Cycle Time */}
        <StatsCard
          title="Cycle Time"
          value={mockStats.cycleTime.value}
          icon={Clock}
        >
          <div className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxa de Defeitos</span>
              <span className="font-medium text-foreground">{mockStats.cycleTime.defectRate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Burndown</span>
              <span className="font-medium text-success">{mockStats.cycleTime.burndown}</span>
            </div>
          </div>
        </StatsCard>
      </motion.div>

      {/* Main Content - Two Columns */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Team Progress - Left Column (3/5) */}
        <motion.div variants={itemVariants} className="lg:col-span-3">
          <Card className="border-border/50 bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">
                Progresso dos OKRs por Equipe
              </CardTitle>
              <Button variant="link" className="text-primary p-0 h-auto font-medium">
                Ver todos
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockTeams.map((team) => (
                <TeamProgressCard
                  key={team.id}
                  name={team.name}
                  initial={team.initial}
                  color={team.color}
                  objectives={team.objectives}
                  keyResults={team.keyResults}
                  progress={team.progress}
                  status={team.status}
                />
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Delayed Goals - Right Column (2/5) */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="border-border/50 bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">
                Metas Atrasadas
              </CardTitle>
              <Button variant="link" className="text-primary p-0 h-auto font-medium">
                Gerenciar
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockDelayedGoals.map((goal) => (
                <DelayedGoalCard
                  key={goal.id}
                  name={goal.name}
                  team={goal.team}
                  daysDelayed={goal.daysDelayed}
                  priority={goal.priority}
                />
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
