import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuditFiltersComponent, AuditLogTable } from '@/components/audit';
import { useAuditLogs, AuditFilters } from '@/hooks/useAuditData';
import { useAuth } from '@/contexts/AuthContext';

const AuditPage: React.FC = () => {
  const { t } = useTranslation();
  const { getTenantId } = useAuth();
  const tenantId = getTenantId();
  const [filters, setFilters] = useState<AuditFilters>({});

  const { data: logs = [], isLoading, refetch, isFetching } = useAuditLogs(filters);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('audit.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('audit.description')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            {t('audit.refresh')}
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Download className="h-4 w-4 mr-2" />
            {t('audit.export')}
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('audit.stats.totalLogs')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('audit.stats.authEvents')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter(l => l.entity_type === 'auth').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('audit.stats.dataChanges')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter(l => ['okr', 'key_result', 'team', 'wiki'].includes(l.entity_type)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t('audit.stats.userChanges')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter(l => l.entity_type === 'user').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <AuditFiltersComponent filters={filters} onFiltersChange={setFilters} />

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('audit.logsTitle')}</CardTitle>
          <CardDescription>
            {t('audit.logsDescription', { count: logs.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditLogTable logs={logs} isLoading={isLoading} />
        </CardContent>
      </Card>

      {/* Info card */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">{t('audit.securityNote')}</p>
              <ul className="list-disc list-inside space-y-1">
                <li>{t('audit.securityNote1')}</li>
                <li>{t('audit.securityNote2')}</li>
                <li>{t('audit.securityNote3')}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditPage;
