import React from 'react';
import { useTranslation } from 'react-i18next';
import { FeedStats as FeedStatsType } from '@/hooks/useFeedData';
import { Skeleton } from '@/components/ui/skeleton';

interface FeedStatsProps {
  stats: FeedStatsType | undefined;
  isLoading: boolean;
}

export const FeedStats: React.FC<FeedStatsProps> = ({ stats, isLoading }) => {
  const { t } = useTranslation();

  const statItems = [
    { labelKey: 'feed.stats.updatesToday', value: stats?.updatesToday ?? 0 },
    { labelKey: 'feed.stats.okrsUpdated', value: stats?.okrsUpdated ?? 0 },
    { labelKey: 'feed.stats.activeTeams', value: stats?.activeTeams ?? 0 },
    { labelKey: 'feed.stats.avgProgress', value: `${stats?.avgProgress ?? 0}%` },
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-foreground mb-3">{t('feed.stats.title')}</h3>
      <div className="space-y-3">
        {statItems.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t(item.labelKey)}</span>
            {isLoading ? (
              <Skeleton className="h-5 w-10" />
            ) : (
              <span className="text-sm font-semibold text-foreground">
                {item.value}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
