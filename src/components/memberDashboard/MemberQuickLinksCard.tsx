import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Activity, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export const MemberQuickLinksCard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const links = [
    {
      id: 'wiki',
      icon: BookOpen,
      label: t('memberDashboard.quickLinks.wiki'),
      description: t('memberDashboard.quickLinks.wikiDesc'),
      path: '/wiki',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      id: 'feed',
      icon: Activity,
      label: t('memberDashboard.quickLinks.feed'),
      description: t('memberDashboard.quickLinks.feedDesc'),
      path: '/feed',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-foreground">
          {t('memberDashboard.quickLinks.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {links.map((link, index) => (
            <motion.div
              key={link.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                variant="outline"
                className="w-full h-auto p-4 flex items-center gap-4 justify-start hover:bg-muted/50 transition-all group"
                onClick={() => navigate(link.path)}
              >
                <div className={`p-3 rounded-lg ${link.bgColor}`}>
                  <link.icon className={`h-5 w-5 ${link.color}`} />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-medium text-foreground">{link.label}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{link.description}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
