import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Users, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const stats = [
    { 
      icon: Target, 
      label: 'OKRs Ativos', 
      value: '12', 
      change: '+2 este mês',
      color: 'text-primary' 
    },
    { 
      icon: TrendingUp, 
      label: 'Progresso Médio', 
      value: '67%', 
      change: '+8% vs última sprint',
      color: 'text-success' 
    },
    { 
      icon: Users, 
      label: 'Equipes', 
      value: '4', 
      change: '24 membros',
      color: 'text-info' 
    },
    { 
      icon: CheckCircle2, 
      label: 'Concluídos', 
      value: '8', 
      change: 'Este trimestre',
      color: 'text-warning' 
    },
  ];

  const recentOkrs = [
    { name: 'Aumentar NPS em 20 pontos', progress: 75, status: 'on-track' },
    { name: 'Reduzir tempo de deploy', progress: 45, status: 'at-risk' },
    { name: 'Implementar CI/CD completo', progress: 90, status: 'on-track' },
    { name: 'Migrar para nova arquitetura', progress: 30, status: 'behind' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'bg-success';
      case 'at-risk': return 'bg-warning';
      case 'behind': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-foreground">
          {t('dashboard.welcome')}, {user?.name}!
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t('dashboard.overview')} - Aqui está o resumo das suas atividades
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="glass border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
                </div>
                <div className={`rounded-xl bg-muted p-3 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent OKRs */}
        <motion.div variants={itemVariants}>
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Target className="h-5 w-5 text-primary" />
                {t('dashboard.okrProgress')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentOkrs.map((okr, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{okr.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{okr.progress}%</span>
                      <div className={`h-2 w-2 rounded-full ${getStatusColor(okr.status)}`} />
                    </div>
                  </div>
                  <Progress value={okr.progress} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants}>
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-foreground">{t('dashboard.recentActivity')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: 'OKR atualizado', target: 'Aumentar NPS', time: '2 min atrás', user: 'Maria' },
                  { action: 'Wiki editada', target: 'Guia de Deploy', time: '15 min atrás', user: 'João' },
                  { action: 'Sprint concluída', target: 'Sprint 23', time: '1h atrás', user: 'Sistema' },
                  { action: 'Novo membro', target: 'Equipe Alpha', time: '3h atrás', user: 'Admin' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {activity.action}: <span className="text-primary">{activity.target}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.user} • {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
