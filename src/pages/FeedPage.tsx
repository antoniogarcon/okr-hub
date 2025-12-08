import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Bell, Target, BookOpen, Users, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const FeedPage: React.FC = () => {
  const { t } = useTranslation();

  const feedItems = [
    {
      id: '1',
      type: 'okr',
      action: 'OKR atualizado',
      target: 'Aumentar NPS em 20 pontos',
      user: 'Maria Silva',
      time: '5 min atrás',
      icon: Target,
    },
    {
      id: '2',
      type: 'wiki',
      action: 'Página editada',
      target: 'Guia de Onboarding',
      user: 'João Costa',
      time: '15 min atrás',
      icon: BookOpen,
    },
    {
      id: '3',
      type: 'team',
      action: 'Novo membro adicionado',
      target: 'Equipe Alpha',
      user: 'Admin',
      time: '1h atrás',
      icon: Users,
    },
    {
      id: '4',
      type: 'okr',
      action: 'Key Result concluído',
      target: 'Automatizar 80% dos deploys',
      user: 'Carlos Mendes',
      time: '2h atrás',
      icon: CheckCircle,
    },
  ];

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      okr: 'text-primary bg-primary/10',
      wiki: 'text-info bg-info/10',
      team: 'text-success bg-success/10',
    };
    return colors[type] || 'text-muted-foreground bg-muted';
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Bell className="h-8 w-8 text-primary" />
          {t('feed.title')}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Acompanhe todas as atualizações em tempo real
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="all">{t('feed.allUpdates')}</TabsTrigger>
            <TabsTrigger value="okrs">{t('feed.okrUpdates')}</TabsTrigger>
            <TabsTrigger value="wiki">{t('feed.wikiUpdates')}</TabsTrigger>
            <TabsTrigger value="teams">{t('feed.teamUpdates')}</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="text-foreground">Atividades Recentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {feedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 rounded-lg bg-muted/30 p-4"
                  >
                    <div className={`rounded-lg p-2 ${getTypeColor(item.type)}`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {item.action}: <span className="text-primary">{item.target}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs bg-primary/20 text-primary">
                            {item.user.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          {item.user} • {item.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="okrs" className="mt-6">
            <Card className="glass border-border/50 p-8 text-center">
              <p className="text-muted-foreground">{t('feed.okrUpdates')}</p>
            </Card>
          </TabsContent>

          <TabsContent value="wiki" className="mt-6">
            <Card className="glass border-border/50 p-8 text-center">
              <p className="text-muted-foreground">{t('feed.wikiUpdates')}</p>
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="mt-6">
            <Card className="glass border-border/50 p-8 text-center">
              <p className="text-muted-foreground">{t('feed.teamUpdates')}</p>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
};

export default FeedPage;
