import React from 'react';
import { formatDistanceToNow, type Locale } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { 
  Target, 
  CheckCircle2, 
  TrendingUp, 
  Link, 
  FileText, 
  FilePen,
  UserPlus,
  UserMinus,
  Shield,
  BadgeCheck,
  BadgeX,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Notification, notificationTypeConfig } from '@/hooks/useNotifications';

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  Target,
  CheckCircle2,
  TrendingUp,
  Link,
  FileText,
  FilePen,
  UserPlus,
  UserMinus,
  Shield,
  BadgeCheck,
  BadgeX,
};

const localeMap: Record<string, Locale> = {
  'pt-BR': ptBR,
  'en': enUS,
  'es': es,
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
}) => {
  const { i18n } = useTranslation();
  const config = notificationTypeConfig[notification.event_type] || {
    icon: 'Bell',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  };

  const IconComponent = iconComponents[config.icon] || Bell;
  const locale = localeMap[i18n.language] || ptBR;

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer',
        'hover:bg-muted/50',
        !notification.is_read && 'bg-primary/5'
      )}
    >
      <div className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
        config.bgColor
      )}>
        <IconComponent className={cn('h-4 w-4', config.color)} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            'text-sm text-foreground',
            !notification.is_read && 'font-medium'
          )}>
            {notification.title}
          </p>
          {!notification.is_read && (
            <div className="h-2 w-2 shrink-0 rounded-full bg-primary mt-1.5" />
          )}
        </div>
        
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        
        <p className="text-xs text-muted-foreground/70 mt-1.5">
          {formatDistanceToNow(new Date(notification.created_at), { 
            addSuffix: true,
            locale 
          })}
        </p>
      </div>
    </div>
  );
};
