import React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Shield, Clock, User, FileText, Info } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AuditLogEntry } from '@/hooks/useAuditData';

interface AuditLogTableProps {
  logs: AuditLogEntry[];
  isLoading: boolean;
}

const getActionBadgeVariant = (action: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (action.includes('created')) return 'default';
  if (action.includes('updated') || action.includes('changed')) return 'secondary';
  if (action.includes('deleted') || action.includes('deactivated')) return 'destructive';
  if (action.includes('login') || action.includes('logout')) return 'outline';
  return 'secondary';
};

const getEntityIcon = (entityType: string) => {
  switch (entityType) {
    case 'auth':
      return Shield;
    case 'user':
      return User;
    default:
      return FileText;
  }
};

export const AuditLogTable: React.FC<AuditLogTableProps> = ({
  logs,
  isLoading,
}) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-foreground">{t('audit.noLogs')}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t('audit.noLogsDescription')}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[180px]">{t('audit.columns.timestamp')}</TableHead>
            <TableHead className="w-[180px]">{t('audit.columns.user')}</TableHead>
            <TableHead className="w-[150px]">{t('audit.columns.action')}</TableHead>
            <TableHead className="w-[120px]">{t('audit.columns.entity')}</TableHead>
            <TableHead className="w-[200px]">{t('audit.columns.entityId')}</TableHead>
            <TableHead>{t('audit.columns.details')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const EntityIcon = getEntityIcon(log.entity_type);
            
            return (
              <TableRow key={log.id} className="hover:bg-muted/30">
                <TableCell className="font-mono text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{log.user_name}</span>
                    <span className="text-xs text-muted-foreground">{log.user_email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getActionBadgeVariant(log.action)}>
                    {t(`audit.actions.${log.action}`, log.action)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <EntityIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {t(`audit.entities.${log.entity_type}`, log.entity_type)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {log.entity_id ? (
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                      {log.entity_id.substring(0, 8)}...
                    </code>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {log.details && typeof log.details === 'object' ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 cursor-help">
                          <Info className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {Object.keys(log.details as object).length} {t('audit.fields')}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-[300px]">
                        <pre className="text-xs whitespace-pre-wrap">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
