import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ArrowUpDown, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FeedEvent } from '@/hooks/useFeedData';
import { FeedEventItem } from './FeedEventItem';

interface FeedListProps {
  events: FeedEvent[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOrder: 'recent' | 'oldest';
  onSortChange: (order: 'recent' | 'oldest') => void;
  hasMore: boolean;
  onLoadMore: () => void;
  isLoadingMore: boolean;
}

export const FeedList: React.FC<FeedListProps> = ({
  events,
  isLoading,
  searchQuery,
  onSearchChange,
  sortOrder,
  onSortChange,
  hasMore,
  onLoadMore,
  isLoadingMore,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* Search and Sort */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('feed.searchPlaceholder')}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('feed.sortBy')}</span>
          <Select value={sortOrder} onValueChange={(value) => onSortChange(value as 'recent' | 'oldest')}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">{t('feed.sortRecent')}</SelectItem>
              <SelectItem value="oldest">{t('feed.sortOldest')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 p-4 bg-card border border-border rounded-lg">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-12 w-16" />
            </div>
          ))
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">
              {t('feed.noUpdates')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('feed.noUpdatesDesc')}
            </p>
          </div>
        ) : (
          events.map((event) => (
            <FeedEventItem key={event.id} event={event} />
          ))
        )}
      </div>

      {/* Load More */}
      {hasMore && !isLoading && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? t('common.loading') : t('feed.loadMore')}
          </Button>
        </div>
      )}
    </div>
  );
};
