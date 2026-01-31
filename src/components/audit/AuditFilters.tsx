import React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { AuditFilters } from '@/hooks/useAuditData';
import { useAuditActions, useAuditEntityTypes, useAuditUsers } from '@/hooks/useAuditData';

interface AuditFiltersProps {
  filters: AuditFilters;
  onFiltersChange: (filters: AuditFilters) => void;
}

export const AuditFiltersComponent: React.FC<AuditFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const { t } = useTranslation();
  const { data: actions = [] } = useAuditActions();
  const { data: entityTypes = [] } = useAuditEntityTypes();
  const { data: users = [] } = useAuditUsers();

  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(v => v);

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-lg border border-border">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span className="text-sm font-medium">{t('audit.filters')}</span>
      </div>

      {/* User filter */}
      <Select
        value={filters.userId || 'all'}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, userId: value === 'all' ? undefined : value })
        }
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={t('audit.filterByUser')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('audit.allUsers')}</SelectItem>
          {users.map((user) => (
            <SelectItem key={user.user_id} value={user.user_id}>
              {user.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Action filter */}
      <Select
        value={filters.action || 'all'}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, action: value === 'all' ? undefined : value })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={t('audit.filterByAction')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('audit.allActions')}</SelectItem>
          {actions.map((action) => (
            <SelectItem key={action} value={action}>
              {t(`audit.actions.${action}`, action)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Entity type filter */}
      <Select
        value={filters.entityType || 'all'}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, entityType: value === 'all' ? undefined : value })
        }
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder={t('audit.filterByEntity')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('audit.allEntities')}</SelectItem>
          {entityTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {t(`audit.entities.${type}`, type)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date range - Start */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-[150px] justify-start text-left font-normal',
              !filters.startDate && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.startDate ? format(new Date(filters.startDate), 'dd/MM/yyyy') : t('audit.startDate')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={filters.startDate ? new Date(filters.startDate) : undefined}
            onSelect={(date) =>
              onFiltersChange({ ...filters, startDate: date?.toISOString() })
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Date range - End */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-[150px] justify-start text-left font-normal',
              !filters.endDate && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.endDate ? format(new Date(filters.endDate), 'dd/MM/yyyy') : t('audit.endDate')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={filters.endDate ? new Date(filters.endDate) : undefined}
            onSelect={(date) =>
              onFiltersChange({ ...filters, endDate: date?.toISOString() })
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
          <X className="h-4 w-4 mr-1" />
          {t('audit.clearFilters')}
        </Button>
      )}
    </div>
  );
};
