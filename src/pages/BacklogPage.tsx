import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ListTodo, Plus, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const BacklogPage: React.FC = () => {
  const { t } = useTranslation();

  const backlogItems = [
    { id: '1', title: 'Implementar autenticação OAuth', type: 'story', priority: 'high', estimate: 8 },
    { id: '2', title: 'Corrigir bug no dashboard', type: 'bug', priority: 'urgent', estimate: 3 },
    { id: '3', title: 'Adicionar suporte a notificações push', type: 'feature', priority: 'medium', estimate: 13 },
    { id: '4', title: 'Refatorar módulo de relatórios', type: 'task', priority: 'low', estimate: 5 },
  ];

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      story: 'bg-info/20 text-info border-info/30',
      bug: 'bg-destructive/20 text-destructive border-destructive/30',
      feature: 'bg-success/20 text-success border-success/30',
      task: 'bg-muted text-muted-foreground border-border',
    };
    return styles[type] || styles.task;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-destructive',
      high: 'bg-warning',
      medium: 'bg-info',
      low: 'bg-muted-foreground',
    };
    return colors[priority] || colors.low;
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
            <ListTodo className="h-8 w-8 text-primary" />
            {t('backlog.title')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Organize e priorize itens do backlog
          </p>
        </div>
        <Button size="sm" className="glow">
          <Plus className="mr-2 h-4 w-4" />
          {t('backlog.createItem')}
        </Button>
      </motion.div>

      {/* Backlog Items */}
      <motion.div variants={itemVariants}>
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground">Product Backlog</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {backlogItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-lg bg-muted/30 p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
              >
                <GripVertical className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                <div className={`h-2 w-2 rounded-full ${getPriorityColor(item.priority)}`} />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.title}</p>
                </div>
                <Badge variant="outline" className={getTypeBadge(item.type)}>
                  {t(`backlog.${item.type}`)}
                </Badge>
                <Badge variant="secondary">{item.estimate} pts</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default BacklogPage;
