import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Train, Plus, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const TrainPage: React.FC = () => {
  const { t } = useTranslation();

  const arts = [
    {
      id: '1',
      name: 'Digital Products ART',
      currentPI: 'PI 24.4',
      teams: ['Alpha', 'Beta', 'Gamma'],
      features: 12,
      completedFeatures: 8,
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
            <Train className="h-8 w-8 text-primary" />
            {t('train.title')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Gerencie Agile Release Trains e Program Increments
          </p>
        </div>
        <Button size="sm" className="glow">
          <Plus className="mr-2 h-4 w-4" />
          Criar ART
        </Button>
      </motion.div>

      {/* ARTs */}
      {arts.map((art) => (
        <motion.div key={art.id} variants={itemVariants}>
          <Card className="glass border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-foreground">{art.name}</CardTitle>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      {art.currentPI}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {art.teams.length} equipes
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <GitBranch className="mr-2 h-4 w-4" />
                  {t('train.piPlanning')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* PI Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">
                    {t('train.features')} Progress
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {art.completedFeatures}/{art.features}
                  </span>
                </div>
                <Progress value={(art.completedFeatures / art.features) * 100} className="h-2" />
              </div>

              {/* Teams */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  {t('train.teams')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {art.teams.map((team) => (
                    <Badge key={team} variant="secondary" className="text-sm">
                      {team}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default TrainPage;
