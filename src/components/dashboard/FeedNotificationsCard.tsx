import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  FileText, 
  Users, 
  Bell,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FeedNotification {
  id: string;
  type: 'okr_update' | 'wiki_update' | 'team_update' | 'comment' | 'milestone';
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  author?: {
    name: string;
    initial: string;
    color: string;
  };
}

interface FeedNotificationsCardProps {
  notifications: FeedNotification[];
  onViewAll?: () => void;
}

const typeIcons = {
  okr_update: Target,
  wiki_update: FileText,
  team_update: Users,
  comment: MessageSquare,
  milestone: CheckCircle2,
};

const typeColors = {
  okr_update: 'text-primary bg-primary/10',
  wiki_update: 'text-violet-500 bg-violet-500/10',
  team_update: 'text-emerald-500 bg-emerald-500/10',
  comment: 'text-blue-500 bg-blue-500/10',
  milestone: 'text-success bg-success/10',
};

export const FeedNotificationsCard: React.FC<FeedNotificationsCardProps> = ({
  notifications,
  onViewAll,
}) => {
  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-semibold text-foreground">
            Atualizações Recentes
          </CardTitle>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
            {notifications.filter(n => !n.read).length} novas
          </Badge>
        </div>
        <Button 
          variant="link" 
          className="text-primary p-0 h-auto font-medium"
          onClick={onViewAll}
        >
          Ver tudo
        </Button>
      </CardHeader>
      <CardContent className="space-y-1">
        {notifications.map((notification) => {
          const Icon = typeIcons[notification.type];
          const iconColorClass = typeColors[notification.type];

          return (
            <div
              key={notification.id}
              className={`
                flex items-start gap-3 p-3 rounded-lg transition-colors
                hover:bg-muted/50 cursor-pointer
                ${!notification.read ? 'bg-primary/5' : ''}
              `}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconColorClass}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${!notification.read ? 'font-medium' : ''} text-foreground truncate`}>
                    {notification.title}
                  </p>
                  {!notification.read && (
                    <div className="h-2 w-2 shrink-0 rounded-full bg-primary mt-1.5" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {notification.description}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  {notification.author && (
                    <div className="flex items-center gap-1.5">
                      <div className={`h-4 w-4 rounded-full ${notification.author.color} flex items-center justify-center`}>
                        <span className="text-[10px] font-medium text-white">
                          {notification.author.initial}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {notification.author.name}
                      </span>
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(notification.timestamp, { 
                      addSuffix: true,
                      locale: ptBR 
                    })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
