import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Users, Plus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const TeamsPage: React.FC = () => {
  const { t } = useTranslation();

  const teams = [
    {
      id: '1',
      name: 'Equipe Alpha',
      leader: 'Maria Silva',
      members: ['João Costa', 'Ana Santos', 'Pedro Lima', 'Carla Oliveira'],
      activeOkrs: 3,
    },
    {
      id: '2',
      name: 'Equipe Beta',
      leader: 'Carlos Mendes',
      members: ['Lucas Ferreira', 'Julia Souza', 'Rafael Alves'],
      activeOkrs: 2,
    },
    {
      id: '3',
      name: 'Equipe Gamma',
      leader: 'Fernanda Rocha',
      members: ['Bruno Costa', 'Mariana Lima', 'Diego Santos', 'Camila Pereira', 'Thiago Almeida'],
      activeOkrs: 4,
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
            <Users className="h-8 w-8 text-primary" />
            {t('teams.title')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Gerencie as equipes da sua organização
          </p>
        </div>
        <Button size="sm" className="glow">
          <Plus className="mr-2 h-4 w-4" />
          {t('teams.createTeam')}
        </Button>
      </motion.div>

      {/* Teams Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <motion.div key={team.id} variants={itemVariants}>
            <Card className="glass border-border/50 hover:border-primary/30 transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-foreground">{team.name}</CardTitle>
                  <Badge variant="secondary">{team.activeOkrs} OKRs</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('teams.leader')}: {team.leader}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {t('teams.members')} ({team.members.length})
                  </p>
                  <div className="flex -space-x-2">
                    {team.members.slice(0, 4).map((member, index) => (
                      <Avatar key={index} className="h-8 w-8 border-2 border-background">
                        <AvatarFallback className="text-xs bg-primary/20 text-primary">
                          {member.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {team.members.length > 4 && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                        +{team.members.length - 4}
                      </div>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <UserPlus className="mr-2 h-4 w-4" />
                  {t('teams.addMember')}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default TeamsPage;
