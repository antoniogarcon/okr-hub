import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FileText, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  ReportFilters,
  TrainOKRsReport,
  TeamReportsCard,
  OrganizationalReportCard,
  TimelineReportCard,
} from '@/components/reports';
import {
  useTrainOKRsReport,
  useTeamReports,
  useOrganizationalReport,
  useTimelineReport,
  useReportTeams,
  useReportOrganizationalRoles,
  ReportFilters as ReportFiltersType,
} from '@/hooks/useReportsData';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const ReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const { getTenantId, hasMinimumRole } = useAuth();
  const tenantId = getTenantId();

  // Filters state
  const [filters, setFilters] = useState<ReportFiltersType>({});
  const [activeTab, setActiveTab] = useState('train');

  // Fetch filter options
  const { data: teams = [] } = useReportTeams(tenantId);
  const { data: orgRoles = [] } = useReportOrganizationalRoles(tenantId);

  // Fetch report data
  const { data: trainOkrs = [], isLoading: isLoadingTrain } = useTrainOKRsReport(tenantId, filters);
  const { data: teamReports = [], isLoading: isLoadingTeams } = useTeamReports(tenantId, filters);
  const { data: orgReport = { roleDistribution: [], teamDistribution: [], workloadDistribution: [] }, isLoading: isLoadingOrg } = useOrganizationalReport(tenantId, filters);
  const { data: timelineEvents = [], isLoading: isLoadingTimeline } = useTimelineReport(tenantId, filters);

  // Check access
  const canAccess = hasMinimumRole('leader');

  // Filter handlers
  const handleStartDateChange = (date: Date | undefined) => {
    setFilters(prev => ({ ...prev, startDate: date }));
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setFilters(prev => ({ ...prev, endDate: date }));
  };

  const handleTeamChange = (teamId: string | undefined) => {
    setFilters(prev => ({ ...prev, teamId }));
  };

  const handleOrgRoleChange = (roleId: string | undefined) => {
    setFilters(prev => ({ ...prev, organizationalRoleId: roleId }));
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  // Export placeholder
  const handleExport = () => {
    toast.info(t('reports.exportComingSoon', 'Exportação em desenvolvimento'));
  };

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {t('common.accessDenied', 'Acesso Negado')}
        </h2>
        <p className="text-muted-foreground">
          {t('reports.accessDenied', 'Você não tem permissão para acessar os relatórios.')}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            {t('reports.title', 'Relatórios')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t('reports.subtitle', 'Visão executiva e análise organizacional do ART')}
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          {t('common.export', 'Exportar')}
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants}>
        <ReportFilters
          startDate={filters.startDate}
          endDate={filters.endDate}
          teamId={filters.teamId}
          organizationalRoleId={filters.organizationalRoleId}
          teams={teams}
          organizationalRoles={orgRoles}
          onStartDateChange={handleStartDateChange}
          onEndDateChange={handleEndDateChange}
          onTeamChange={handleTeamChange}
          onOrganizationalRoleChange={handleOrgRoleChange}
          onClearFilters={handleClearFilters}
        />
      </motion.div>

      {/* Report Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="train" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {t('reports.trainOkrs', 'OKRs do Trem')}
            </TabsTrigger>
            <TabsTrigger value="teams" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {t('reports.byTeam', 'Por Equipe')}
            </TabsTrigger>
            <TabsTrigger value="org" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {t('reports.organizational', 'Organizacional')}
            </TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {t('reports.timeline', 'Linha do Tempo')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="train" className="mt-6">
            <TrainOKRsReport data={trainOkrs} isLoading={isLoadingTrain} />
          </TabsContent>

          <TabsContent value="teams" className="mt-6">
            <TeamReportsCard data={teamReports} isLoading={isLoadingTeams} />
          </TabsContent>

          <TabsContent value="org" className="mt-6">
            <OrganizationalReportCard data={orgReport} isLoading={isLoadingOrg} />
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            <TimelineReportCard data={timelineEvents} isLoading={isLoadingTimeline} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
};

export default ReportsPage;
