import React from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, RefreshCw, Users, Gauge, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeedFilter } from '@/hooks/useFeedData';

interface FeedFiltersProps {
  activeFilter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
}

interface FilterItem {
  id: FeedFilter;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
}

const filters: FilterItem[] = [
  { id: 'all', icon: TrendingUp, labelKey: 'feed.filters.all' },
  { id: 'okr_progress', icon: TrendingUp, labelKey: 'feed.filters.okrProgress' },
  { id: 'okr_changes', icon: RefreshCw, labelKey: 'feed.filters.okrChanges' },
  { id: 'teams', icon: Users, labelKey: 'feed.filters.teams' },
  { id: 'capacity', icon: Gauge, labelKey: 'feed.filters.capacity' },
  { id: 'wiki', icon: BookOpen, labelKey: 'feed.filters.wiki' },
];

export const FeedFilters: React.FC<FeedFiltersProps> = ({
  activeFilter,
  onFilterChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-foreground mb-3">{t('feed.filters.title')}</h3>
      <nav className="space-y-1">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeFilter === filter.id;

          return (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{t(filter.labelKey)}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
