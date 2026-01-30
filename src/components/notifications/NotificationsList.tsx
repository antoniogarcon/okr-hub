import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Check, Loader2, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  useNotifications, 
  useUnreadNotificationsCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead 
} from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { useNavigate } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

type FilterType = 'all' | 'unread' | 'okr' | 'wiki' | 'team' | 'role';

export const NotificationsList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>('all');
  
  const { data: notifications, isLoading } = useNotifications(100);
  const { data: unreadCount } = useUnreadNotificationsCount();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const filteredNotifications = React.useMemo(() => {
    if (!notifications) return [];
    
    return notifications.filter((n) => {
      if (filter === 'all') return true;
      if (filter === 'unread') return !n.is_read;
      if (filter === 'okr') return n.event_type.startsWith('okr_');
      if (filter === 'wiki') return n.event_type.startsWith('wiki_');
      if (filter === 'team') return n.event_type.includes('team');
      if (filter === 'role') return n.event_type.includes('role');
      return true;
    });
  }, [notifications, filter]);

  const handleNotificationClick = (notification: { id: string; is_read: boolean; entity_type: string | null }) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
    
    if (notification.entity_type === 'okr') {
      navigate('/okrs');
    } else if (notification.entity_type === 'wiki') {
      navigate('/wiki');
    } else if (notification.entity_type === 'team') {
      navigate('/teams');
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <CardTitle className="text-lg font-semibold text-foreground">
            {t('notifications.allNotifications', 'Todas as Notificações')}
          </CardTitle>
          {unreadCount && unreadCount > 0 && (
            <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
              {unreadCount} {t('notifications.unread', 'não lidas')}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('notifications.filters.all', 'Todas')}</SelectItem>
              <SelectItem value="unread">{t('notifications.filters.unread', 'Não lidas')}</SelectItem>
              <SelectItem value="okr">{t('notifications.filters.okr', 'OKRs')}</SelectItem>
              <SelectItem value="wiki">{t('notifications.filters.wiki', 'Wiki')}</SelectItem>
              <SelectItem value="team">{t('notifications.filters.team', 'Equipes')}</SelectItem>
              <SelectItem value="role">{t('notifications.filters.role', 'Papéis')}</SelectItem>
            </SelectContent>
          </Select>
          
          {unreadCount && unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
            >
              {markAllAsRead.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {t('notifications.markAllRead', 'Marcar todas como lidas')}
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredNotifications.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-1"
          >
            {filteredNotifications.map((notification) => (
              <motion.div key={notification.id} variants={itemVariants}>
                <NotificationItem
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm font-medium text-foreground">
              {t('notifications.empty', 'Nenhuma notificação')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {filter !== 'all' 
                ? t('notifications.noMatchingNotifications', 'Nenhuma notificação corresponde ao filtro selecionado')
                : t('notifications.emptyDescription', 'Você será notificado sobre atualizações importantes')
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
