import React from 'react';
import { useTranslation } from 'react-i18next';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR, es, enUS } from 'date-fns/locale';
import { 
  TrendingUp, 
  Target, 
  RefreshCw, 
  Users, 
  Gauge, 
  BookOpen,
  Link2,
  CheckCircle,
  PlayCircle,
  UserPlus
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FeedEvent, FeedEventType, FeedEntityType } from '@/hooks/useFeedData';
import { cn } from '@/lib/utils';

interface FeedEventItemProps {
  event: FeedEvent;
}

const getEventIcon = (eventType: FeedEventType, entityType: FeedEntityType) => {
  switch (eventType) {
    case 'okr_created':
      return Target;
    case 'okr_progress_updated':
      return TrendingUp;
    case 'okr_completed':
      return CheckCircle;
    case 'okr_linked':
      return Link2;
    case 'okr_modified':
      return RefreshCw;
    case 'sprint_velocity_updated':
    case 'sprint_capacity_updated':
      return Gauge;
    case 'sprint_closed':
      return PlayCircle;
    case 'wiki_published':
    case 'wiki_updated':
      return BookOpen;
    case 'team_member_added':
      return UserPlus;
    case 'team_update':
      return Users;
    default:
      return Target;
  }
};

const getEventBadgeConfig = (eventType: FeedEventType, entityType: FeedEntityType) => {
  if (entityType === 'okr') {
    if (eventType === 'okr_progress_updated' || eventType === 'okr_completed') {
      return { labelKey: 'feed.badges.okrProgress', className: 'bg-primary/10 text-primary border-primary/20' };
    }
    return { labelKey: 'feed.badges.okrChange', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
  }
  if (entityType === 'sprint' || entityType === 'capacity') {
    return { labelKey: 'feed.badges.capacity', className: 'bg-purple-500/10 text-purple-600 border-purple-500/20' };
  }
  if (entityType === 'wiki') {
    return { labelKey: 'feed.badges.wiki', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
  }
  if (entityType === 'team') {
    return { labelKey: 'feed.badges.team', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
  }
  return { labelKey: 'feed.badges.update', className: 'bg-muted text-muted-foreground border-border' };
};

const getLocale = (lang: string) => {
  switch (lang) {
    case 'pt-BR':
      return ptBR;
    case 'es':
      return es;
    default:
      return enUS;
  }
};

export const FeedEventItem: React.FC<FeedEventItemProps> = ({ event }) => {
  const { t, i18n } = useTranslation();
  const locale = getLocale(i18n.language);

  const Icon = getEventIcon(event.event_type, event.entity_type);
  const badgeConfig = getEventBadgeConfig(event.event_type, event.entity_type);
  
  const eventDate = new Date(event.created_at);
  const formattedDate = format(eventDate, 'dd/MM', { locale });
  const formattedTime = format(eventDate, 'HH:mm', { locale });

  return (
    <div className="flex items-start gap-4 p-4 bg-card border border-border rounded-lg hover:shadow-sm transition-shadow">
      {/* Icon */}
      <div className={cn(
        'flex-shrink-0 p-2.5 rounded-lg',
        event.entity_type === 'okr' && 'bg-primary/10 text-primary',
        event.entity_type === 'sprint' && 'bg-purple-500/10 text-purple-600',
        event.entity_type === 'capacity' && 'bg-purple-500/10 text-purple-600',
        event.entity_type === 'wiki' && 'bg-blue-500/10 text-blue-600',
        event.entity_type === 'team' && 'bg-emerald-500/10 text-emerald-600'
      )}>
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Badge and Title */}
        <div className="flex items-start gap-2 mb-1">
          <Badge variant="outline" className={cn('text-xs font-medium', badgeConfig.className)}>
            {t(badgeConfig.labelKey)}
          </Badge>
          {event.is_read === false && (
            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
          )}
        </div>
        
        <h4 className="font-semibold text-foreground text-sm mb-1 line-clamp-1">
          {event.title}
        </h4>
        
        {event.description && (
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {event.description}
          </p>
        )}

        {/* Author and Team */}
        <div className="flex items-center gap-3 flex-wrap">
          {event.author_name && (
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                  {event.author_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{event.author_name}</span>
            </div>
          )}
          {event.team_name && (
            <Badge 
              variant="outline" 
              className="text-xs"
              style={{ 
                borderColor: event.team_color || undefined,
                color: event.team_color || undefined 
              }}
            >
              {event.team_name}
            </Badge>
          )}
        </div>
      </div>

      {/* Date and Change Value */}
      <div className="flex-shrink-0 text-right">
        <div className="text-xs text-muted-foreground mb-1">
          {formattedDate}
        </div>
        <div className="text-xs text-muted-foreground mb-2">
          {formattedTime}
        </div>
        
        {event.change_value && (
          <span className={cn(
            'text-xs font-medium',
            event.change_type === 'positive' && 'text-emerald-600',
            event.change_type === 'negative' && 'text-destructive',
            event.change_type === 'neutral' && 'text-muted-foreground'
          )}>
            {event.change_value}
          </span>
        )}
        
        <button className="block text-xs text-primary hover:underline mt-1">
          {t('feed.viewDetails')}
        </button>
      </div>
    </div>
  );
};
