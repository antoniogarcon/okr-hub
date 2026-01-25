import React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface ReportFiltersProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  teamId: string | undefined;
  organizationalRoleId: string | undefined;
  teams: { id: string; name: string; color: string }[];
  organizationalRoles: { id: string; name: string }[];
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onTeamChange: (teamId: string | undefined) => void;
  onOrganizationalRoleChange: (roleId: string | undefined) => void;
  onClearFilters: () => void;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  startDate,
  endDate,
  teamId,
  organizationalRoleId,
  teams,
  organizationalRoles,
  onStartDateChange,
  onEndDateChange,
  onTeamChange,
  onOrganizationalRoleChange,
  onClearFilters,
}) => {
  const { t } = useTranslation();

  const hasActiveFilters = startDate || endDate || teamId || organizationalRoleId;

  const activeFilterCount = [startDate, endDate, teamId, organizationalRoleId].filter(Boolean).length;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          {t('reports.filters', 'Filtros')}
        </span>
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="px-2 py-0.5">
            {activeFilterCount}
          </Badge>
        )}
      </div>

      {/* Date Range */}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-9 justify-start text-left font-normal',
                !startDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate 
                ? format(startDate, 'dd MMM yyyy', { locale: ptBR })
                : t('reports.startDate', 'Data início')
              }
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={onStartDateChange}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <span className="text-muted-foreground">→</span>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-9 justify-start text-left font-normal',
                !endDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate 
                ? format(endDate, 'dd MMM yyyy', { locale: ptBR })
                : t('reports.endDate', 'Data fim')
              }
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={onEndDateChange}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Team Filter */}
      <Select
        value={teamId || 'all'}
        onValueChange={(value) => onTeamChange(value === 'all' ? undefined : value)}
      >
        <SelectTrigger className="h-9 w-[180px]">
          <SelectValue placeholder={t('reports.allTeams', 'Todas as equipes')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('reports.allTeams', 'Todas as equipes')}</SelectItem>
          {teams.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: team.color }}
                />
                {team.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Organizational Role Filter */}
      {organizationalRoles.length > 0 && (
        <Select
          value={organizationalRoleId || 'all'}
          onValueChange={(value) => onOrganizationalRoleChange(value === 'all' ? undefined : value)}
        >
          <SelectTrigger className="h-9 w-[200px]">
            <SelectValue placeholder={t('reports.allRoles', 'Todos os papéis')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('reports.allRoles', 'Todos os papéis')}</SelectItem>
            {organizationalRoles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="h-9 text-muted-foreground hover:text-foreground"
        >
          <X className="mr-1 h-4 w-4" />
          {t('reports.clearFilters', 'Limpar')}
        </Button>
      )}
    </div>
  );
};
