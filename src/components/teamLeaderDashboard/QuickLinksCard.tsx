import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, BarChart3, BookOpen, Users, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

interface QuickLinksCardProps {
  teamId: string | null;
  teamName: string | null;
}

export const QuickLinksCard: React.FC<QuickLinksCardProps> = ({ teamId, teamName }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const quickLinks = [
    {
      icon: Target,
      label: t('teamLeaderDashboard.manageOkrs'),
      description: t('teamLeaderDashboard.manageOkrsDesc'),
      path: `/okrs${teamId ? `?team=${teamId}` : ''}`,
      color: 'text-primary',
      bgColor: 'bg-primary/10 hover:bg-primary/20',
    },
    {
      icon: BarChart3,
      label: t('teamLeaderDashboard.viewMetrics'),
      description: t('teamLeaderDashboard.viewMetricsDesc'),
      path: '/indicators',
      color: 'text-success',
      bgColor: 'bg-success/10 hover:bg-success/20',
    },
    {
      icon: BookOpen,
      label: t('teamLeaderDashboard.accessWiki'),
      description: t('teamLeaderDashboard.accessWikiDesc'),
      path: '/wiki',
      color: 'text-warning',
      bgColor: 'bg-warning/10 hover:bg-warning/20',
    },
    {
      icon: Users,
      label: t('teamLeaderDashboard.manageTeam'),
      description: t('teamLeaderDashboard.manageTeamDesc'),
      path: '/teams',
      color: 'text-muted-foreground',
      bgColor: 'bg-muted hover:bg-muted/80',
    },
  ];

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground">
          {t('teamLeaderDashboard.quickLinks')}
        </CardTitle>
        {teamName && (
          <p className="text-sm text-muted-foreground">
            {t('teamLeaderDashboard.actionsFor')} {teamName}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {quickLinks.map((link, index) => {
            const Icon = link.icon;
            return (
              <motion.div
                key={link.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Button
                  variant="ghost"
                  className={`w-full h-auto p-4 flex flex-col items-start gap-2 ${link.bgColor} transition-colors`}
                  onClick={() => navigate(link.path)}
                >
                  <div className="flex items-center justify-between w-full">
                    <Icon className={`h-5 w-5 ${link.color}`} />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm text-foreground">{link.label}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{link.description}</p>
                  </div>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
