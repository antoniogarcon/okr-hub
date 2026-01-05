import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Bell, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useFeedEvents, useFeedStats, FeedFilter } from '@/hooks/useFeedData';
import { FeedFilters, FeedStats, FeedList } from '@/components/feed';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const PAGE_SIZE = 10;

const FeedPage: React.FC = () => {
  const { t } = useTranslation();
  const { getTenantId, hasMinimumRole } = useAuth();
  const tenantId = getTenantId();

  const [activeFilter, setActiveFilter] = useState<FeedFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent');
  const [page, setPage] = useState(1);

  // Debounce search
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1);
    const timer = setTimeout(() => {
      setDebouncedSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleFilterChange = useCallback((filter: FeedFilter) => {
    setActiveFilter(filter);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((order: 'recent' | 'oldest') => {
    setSortOrder(order);
    setPage(1);
  }, []);

  const { data: feedData, isLoading: isLoadingEvents } = useFeedEvents(
    tenantId,
    activeFilter,
    debouncedSearch,
    page,
    PAGE_SIZE
  );

  const { data: stats, isLoading: isLoadingStats } = useFeedStats(tenantId);

  // Handle pagination - accumulate events for "load more"
  const [allEvents, setAllEvents] = useState<typeof feedData['events']>([]);
  
  React.useEffect(() => {
    if (feedData?.events) {
      if (page === 1) {
        setAllEvents(feedData.events);
      } else {
        setAllEvents(prev => [...prev, ...feedData.events]);
      }
    }
  }, [feedData, page]);

  // Reset events when filter/search changes
  React.useEffect(() => {
    setAllEvents([]);
  }, [activeFilter, debouncedSearch]);

  const sortedEvents = useMemo(() => {
    if (sortOrder === 'oldest') {
      return [...allEvents].reverse();
    }
    return allEvents;
  }, [allEvents, sortOrder]);

  const hasMore = feedData ? allEvents.length < feedData.totalCount : false;

  const handleLoadMore = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  // Check access
  if (!hasMinimumRole('member')) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8 text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            {t('common.accessDenied')}
          </h2>
        </Card>
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
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t('feed.pageTitle')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('feed.pageSubtitle')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            {t('feed.settings')}
          </Button>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-4 space-y-6 sticky top-6">
            <FeedFilters
              activeFilter={activeFilter}
              onFilterChange={handleFilterChange}
            />
            <Separator />
            <FeedStats stats={stats} isLoading={isLoadingStats} />
          </Card>
        </div>

        {/* Feed List */}
        <div className="lg:col-span-3">
          <FeedList
            events={sortedEvents}
            isLoading={isLoadingEvents && page === 1}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            isLoadingMore={isLoadingEvents && page > 1}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FeedPage;
