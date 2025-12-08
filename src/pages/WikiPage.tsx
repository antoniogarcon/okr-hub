import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Search, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const WikiPage: React.FC = () => {
  const { t } = useTranslation();

  const wikiPages = [
    {
      id: '1',
      title: 'Guia de Onboarding',
      excerpt: 'Processo completo de integração de novos membros na equipe...',
      lastUpdated: '2h atrás',
      author: 'Maria Silva',
    },
    {
      id: '2',
      title: 'Padrões de Código',
      excerpt: 'Convenções e boas práticas de desenvolvimento adotadas...',
      lastUpdated: '1 dia atrás',
      author: 'João Costa',
    },
    {
      id: '3',
      title: 'Arquitetura do Sistema',
      excerpt: 'Visão geral da arquitetura e componentes principais...',
      lastUpdated: '3 dias atrás',
      author: 'Carlos Mendes',
    },
    {
      id: '4',
      title: 'Processos de Deploy',
      excerpt: 'Documentação dos pipelines de CI/CD e procedimentos...',
      lastUpdated: '1 semana atrás',
      author: 'Ana Santos',
    },
  ];

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
            <BookOpen className="h-8 w-8 text-primary" />
            {t('wiki.title')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Base de conhecimento da equipe
          </p>
        </div>
        <Button size="sm" className="glow">
          <Plus className="mr-2 h-4 w-4" />
          {t('wiki.createPage')}
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants} className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('wiki.searchPages')}
          className="pl-10 bg-muted/50"
        />
      </motion.div>

      {/* Wiki Pages */}
      <div className="grid gap-4 md:grid-cols-2">
        {wikiPages.map((page) => (
          <motion.div key={page.id} variants={itemVariants}>
            <Card className="glass border-border/50 hover:border-primary/30 transition-colors cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">{page.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">{page.excerpt}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {page.lastUpdated}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {page.author}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default WikiPage;
