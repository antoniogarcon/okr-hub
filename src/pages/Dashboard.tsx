import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
import { SprintChartsCard } from '@/components/dashboard/SprintChartsCard';
import { FeedNotificationsCard } from '@/components/dashboard/FeedNotificationsCard';

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

const mockVelocityData = [
  { sprint: 'S18', planned: 45, completed: 42 },
  { sprint: 'S19', planned: 48, completed: 45 },
  { sprint: 'S20', planned: 50, completed: 48 },
  { sprint: 'S21', planned: 46, completed: 44 },
  { sprint: 'S22', planned: 52, completed: 42 },
];

const mockCapacityData = [
  { name: 'Frontend', value: 85 },
  { name: 'Backend', value: 72 },
  { name: 'QA', value: 90 },
  { name: 'DevOps', value: 65 },
];

const mockSprintStatus = {
  name: 'Sprint 22',
  daysRemaining: 5,
  progress: 68,
  status: 'on-track' as const,
};

const mockNotifications = [
  {
    id: '1',
    type: 'okr_update' as const,
    title: 'OKR "Aumentar receita" atualizado',
    description: 'Progresso atualizado de 65% para 72%',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    read: false,
    author: { name: 'Maria S.', initial: 'M', color: 'bg-violet-500' },
  },
  {
    id: '2',
    type: 'wiki_update' as const,
    title: 'Wiki "Processos de Deploy" editada',
    description: 'Adicionada nova seção sobre rollback',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    read: false,
    author: { name: 'João P.', initial: 'J', color: 'bg-emerald-500' },
  },
  {
    id: '3',
    type: 'milestone' as const,
    title: 'Meta atingida: 100 novos clientes',
    description: 'Equipe de Vendas completou o objetivo Q4',
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    read: true,
    author: { name: 'Carlos R.', initial: 'C', color: 'bg-orange-500' },
  },
  {
    id: '4',
    type: 'comment' as const,
    title: 'Novo comentário em "Reduzir churn"',
    description: 'Ana comentou sobre a estratégia de retenção',
    timestamp: new Date(Date.now() - 1000 * 60 * 180),
    read: true,
    author: { name: 'Ana L.', initial: 'A', color: 'bg-blue-500' },
  },
];

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

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

      {/* Main Content - Three Columns */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Team Progress - Left Column */}
        <motion.div variants={itemVariants} className="lg:col-span-4">
          <Card className="border-border/50 bg-card h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">
                Progresso por Equipe
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

        {/* Sprint Charts - Middle Column */}
        <motion.div variants={itemVariants} className="lg:col-span-4">
          <SprintChartsCard
            velocityData={mockVelocityData}
            capacityData={mockCapacityData}
            sprintStatus={mockSprintStatus}
          />
        </motion.div>

        {/* Right Column - Delayed Goals + Feed */}
        <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6">
          {/* Delayed Goals */}
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

          {/* Feed Notifications */}
          <FeedNotificationsCard
            notifications={mockNotifications}
            onViewAll={() => navigate('/feed')}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
