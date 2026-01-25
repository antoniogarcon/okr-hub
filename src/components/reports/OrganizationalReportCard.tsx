import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Users, Shield, Briefcase, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { OrganizationalReport } from '@/hooks/useReportsData';

interface OrganizationalReportCardProps {
  data: OrganizationalReport;
  isLoading: boolean;
}

export const OrganizationalReportCard: React.FC<OrganizationalReportCardProps> = ({ 
  data, 
  isLoading 
}) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="glass border-border/50">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-1/2 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalPeopleInRoles = data.roleDistribution.reduce((sum, r) => sum + r.count, 0);
  const totalPeopleInTeams = data.teamDistribution.reduce((sum, t) => sum + t.count, 0);
  const maxWorkload = Math.max(...data.workloadDistribution.map(w => w.okrCount + w.krCount), 1);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{data.roleDistribution.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('reports.activeRoles', 'Papéis ativos')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <Users className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalPeopleInTeams}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('reports.peopleInTeams', 'Pessoas em equipes')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Briefcase className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{data.workloadDistribution.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('reports.peopleWithOkrs', 'Com responsabilidades')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Distribution Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Role Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass border-border/50 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                {t('reports.roleDistribution', 'Distribuição por Papel')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.roleDistribution.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('reports.noRoleData', 'Nenhum papel atribuído')}
                </p>
              ) : (
                data.roleDistribution.slice(0, 6).map((role, index) => (
                  <div key={role.roleId} className="flex items-center justify-between">
                    <span className="text-sm text-foreground truncate flex-1">
                      {role.roleName}
                    </span>
                    <Badge variant="secondary" className="ml-2">
                      {role.count}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Team Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass border-border/50 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                {t('reports.teamDistribution', 'Distribuição por Equipe')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.teamDistribution.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('reports.noTeamData', 'Nenhuma equipe com membros')}
                </p>
              ) : (
                data.teamDistribution.slice(0, 6).map((team) => (
                  <div key={team.teamId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: team.teamColor }}
                      />
                      <span className="text-sm text-foreground truncate">
                        {team.teamName}
                      </span>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {team.count}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Workload Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass border-border/50 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                {t('reports.workloadDistribution', 'Distribuição de Carga')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.workloadDistribution.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('reports.noWorkloadData', 'Nenhum OKR atribuído')}
                </p>
              ) : (
                data.workloadDistribution.slice(0, 6).map((person) => {
                  const totalWork = person.okrCount + person.krCount;
                  const workloadPercent = (totalWork / maxWorkload) * 100;

                  return (
                    <div key={person.userId} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs bg-primary/20 text-primary">
                              {person.userName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-foreground truncate">
                            {person.userName}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">
                          {person.okrCount} OKRs, {person.krCount} KRs
                        </span>
                      </div>
                      <Progress value={workloadPercent} className="h-1" />
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
