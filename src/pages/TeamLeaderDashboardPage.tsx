import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamLeaderDashboard } from '@/hooks/useTeamLeaderDashboard';
import { motion } from 'framer-motion';
import { AlertTriangle, Users, ShieldX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  TeamOKRsCard,
  AgileIndicatorsCard,
  CurrentSprintCard,
  QuickLinksCard,
} from '@/components/teamLeaderDashboard';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

const TeamLeaderDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { profile, hasRole, isRoot } = useAuth();
  
  const { team, okrs, sprint, indicators, isLoading, error } = useTeamLeaderDashboard();

  // Access control: team_leader, tenant_admin (view mode), root
  const canAccessDashboard = hasRole(['leader', 'admin']) || isRoot();
  const isViewOnly = hasRole('admin') || isRoot();

  if (!canAccessDashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <ShieldX className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">{t('common.accessDenied')}</h2>
        <p className="text-muted-foreground max-w-md">
          {t('teamLeaderDashboard.accessDeniedDescription')}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[350px]" />
          <Skeleton className="h-[350px]" />
          <Skeleton className="h-[350px]" />
        </div>

        <Skeleton className="h-[200px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">{t('common.error')}</h2>
        <p className="text-muted-foreground max-w-md">
          {t('teamLeaderDashboard.loadError')}
        </p>
      </div>
    );
  }

  // If user is leader but has no team assigned
  if (!team && hasRole('leader') && !isRoot() && !hasRole('admin')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <Users className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {t('teamLeaderDashboard.noTeamAssigned')}
        </h2>
        <p className="text-muted-foreground max-w-md">
          {t('teamLeaderDashboard.noTeamAssignedDescription')}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">
              {t('teamLeaderDashboard.title')}
            </h1>
            {isViewOnly && (
              <Badge variant="outline" className="bg-muted text-muted-foreground">
                {t('teamLeaderDashboard.viewMode')}
              </Badge>
            )}
          </div>
          {team && (
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <span 
                className="inline-block w-3 h-3 rounded-full" 
                style={{ backgroundColor: team.color || '#6366f1' }}
              />
              {team.name} • {team.memberCount} {t('teams.members').toLowerCase()}
            </p>
          )}
          {!team && (isRoot() || hasRole('admin')) && (
            <p className="text-muted-foreground mt-1">
              {t('teamLeaderDashboard.adminViewDescription')}
            </p>
          )}
        </div>
      </motion.div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team OKRs - Left Column */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <TeamOKRsCard okrs={okrs} teamId={team?.id || null} />
        </motion.div>

        {/* Agile Indicators - Middle Column */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <AgileIndicatorsCard indicators={indicators} />
        </motion.div>

        {/* Current Sprint - Right Column */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <CurrentSprintCard sprint={sprint} />
        </motion.div>
      </div>

      {/* Quick Links */}
      <motion.div variants={itemVariants}>
        <QuickLinksCard teamId={team?.id || null} teamName={team?.name || null} />
      </motion.div>
    </motion.div>
  );
};

export default TeamLeaderDashboardPage;
