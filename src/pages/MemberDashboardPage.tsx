import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useMemberDashboard } from '@/hooks/useMemberDashboard';
import { motion } from 'framer-motion';
import { AlertTriangle, User, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  MemberOKRsCard,
  MemberKeyResultsCard,
  MemberSprintCard,
  MemberQuickLinksCard,
} from '@/components/memberDashboard';

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

const MemberDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { profile, hasRole, isRoot } = useAuth();
  
  const { team, okrs, keyResults, sprint, isLoading, error } = useMemberDashboard();

  // Access control: team_member, team_leader (view mode), tenant_admin (view mode), root
  const canAccessDashboard = hasRole(['member', 'leader', 'admin']) || isRoot();
  const isViewOnly = hasRole(['leader', 'admin']) || isRoot();

  if (!canAccessDashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <User className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">{t('common.accessDenied')}</h2>
        <p className="text-muted-foreground max-w-md">
          {t('memberDashboard.accessDeniedDescription')}
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
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[350px]" />
        </div>

        <Skeleton className="h-[120px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">{t('common.error')}</h2>
        <p className="text-muted-foreground max-w-md">
          {t('memberDashboard.loadError')}
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
              {t('memberDashboard.title')}
            </h1>
            {isViewOnly && (
              <Badge variant="outline" className="bg-muted text-muted-foreground">
                {t('memberDashboard.viewMode')}
              </Badge>
            )}
          </div>
          {team ? (
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <span 
                className="inline-block w-3 h-3 rounded-full" 
                style={{ backgroundColor: team.color || '#6366f1' }}
              />
              {team.name}
            </p>
          ) : (
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('memberDashboard.noTeamAssigned')}
            </p>
          )}
          {profile && (
            <p className="text-sm text-muted-foreground mt-1">
              {t('memberDashboard.welcomeBack', { name: profile.name.split(' ')[0] })}
            </p>
          )}
        </div>
      </motion.div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My OKRs - Left Column */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <MemberOKRsCard okrs={okrs} />
        </motion.div>

        {/* My Key Results - Middle Column */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <MemberKeyResultsCard keyResults={keyResults} />
        </motion.div>

        {/* Current Sprint - Right Column */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <MemberSprintCard sprint={sprint} />
        </motion.div>
      </div>

      {/* Quick Links */}
      <motion.div variants={itemVariants}>
        <MemberQuickLinksCard />
      </motion.div>
    </motion.div>
  );
};

export default MemberDashboardPage;
