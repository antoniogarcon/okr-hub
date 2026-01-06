import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface OKRFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  teamFilter: string;
  onTeamChange: (value: string) => void;
  teams: { id: string; name: string }[];
  onClearFilters: () => void;
}

const OKRFilters: React.FC<OKRFiltersProps> = ({
  search,
  onSearchChange,
  typeFilter,
  onTypeChange,
  statusFilter,
  onStatusChange,
  teamFilter,
  onTeamChange,
  teams,
  onClearFilters,
}) => {
  const { t } = useTranslation();

  const hasActiveFilters = typeFilter !== 'all' || statusFilter !== 'all' || teamFilter !== 'all' || search;
  const activeFilterCount = [
    typeFilter !== 'all',
    statusFilter !== 'all',
    teamFilter !== 'all',
    search.length > 0,
  ].filter(Boolean).length;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-[300px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('okrs.searchPlaceholder')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Type Filter */}
      <Select value={typeFilter} onValueChange={onTypeChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder={t('okrs.type')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('okrs.allTypes')}</SelectItem>
          <SelectItem value="train">{t('okrs.trainOkr')}</SelectItem>
          <SelectItem value="team">{t('okrs.teamOkr')}</SelectItem>
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder={t('okrs.status')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('okrs.allStatus')}</SelectItem>
          <SelectItem value="active">{t('okrs.onTrack')}</SelectItem>
          <SelectItem value="at_risk">{t('okrs.atRisk')}</SelectItem>
          <SelectItem value="behind">{t('okrs.behind')}</SelectItem>
          <SelectItem value="completed">{t('okrs.completed')}</SelectItem>
        </SelectContent>
      </Select>

      {/* Team Filter */}
      {teams.length > 0 && (
        <Select value={teamFilter} onValueChange={onTeamChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t('okrs.selectTeam')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('okrs.allTeams')}</SelectItem>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
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
          className="text-muted-foreground"
        >
          <X className="mr-1 h-4 w-4" />
          {t('okrs.clearFilters')}
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      )}
    </div>
  );
};

export default OKRFilters;
