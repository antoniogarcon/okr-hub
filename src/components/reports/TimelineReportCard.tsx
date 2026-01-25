import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Target, 
  CheckCircle, 
  TrendingUp, 
  Play, 
  Flag,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TimelineEvent } from '@/hooks/useReportsData';

interface TimelineReportCardProps {
  data: TimelineEvent[];
  isLoading: boolean;
}

const eventConfig: Record<TimelineEvent['type'], {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  label: string;
}> = {
  okr_created: {
    icon: Target,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    label: 'OKR Criado',
  },
  okr_completed: {
    icon: CheckCircle,
    color: 'text-success',
    bgColor: 'bg-success/10',
    label: 'OKR Concluído',
  },
  okr_progress: {
    icon: TrendingUp,
    color: 'text-info',
    bgColor: 'bg-info/10',
    label: 'Progresso Atualizado',
  },
  sprint_started: {
    icon: Play,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    label: 'Sprint Iniciada',
  },
  sprint_completed: {
    icon: Flag,
    color: 'text-success',
    bgColor: 'bg-success/10',
    label: 'Sprint Concluída',
  },
};

export const TimelineReportCard: React.FC<TimelineReportCardProps> = ({ data, isLoading }) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Card className="glass border-border/50">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="glass border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            {t('reports.noTimelineEvents', 'Nenhum evento encontrado')}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group events by date
  const groupedEvents: Record<string, TimelineEvent[]> = {};
  data.forEach((event) => {
    const dateKey = format(parseISO(event.date), 'yyyy-MM-dd');
    if (!groupedEvents[dateKey]) {
      groupedEvents[dateKey] = [];
    }
    groupedEvents[dateKey].push(event);
  });

  const sortedDates = Object.keys(groupedEvents).sort((a, b) => b.localeCompare(a));

  return (
    <Card className="glass border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          {t('reports.timeline', 'Linha do Tempo')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {sortedDates.map((dateKey, dateIndex) => {
              const events = groupedEvents[dateKey];
              const date = parseISO(dateKey);

              return (
                <motion.div
                  key={dateKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: dateIndex * 0.05 }}
                >
                  {/* Date Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="outline" className="text-xs font-medium">
                      {format(date, "dd 'de' MMMM", { locale: ptBR })}
                    </Badge>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Events for this date */}
                  <div className="space-y-3 ml-4">
                    {events.map((event, eventIndex) => {
                      const config = eventConfig[event.type];
                      const EventIcon = config.icon;

                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (dateIndex * 0.05) + (eventIndex * 0.02) }}
                          className="flex gap-3"
                        >
                          {/* Timeline indicator */}
                          <div className="flex flex-col items-center">
                            <div className={`p-2 rounded-full ${config.bgColor}`}>
                              <EventIcon className={`h-4 w-4 ${config.color}`} />
                            </div>
                            {eventIndex < events.length - 1 && (
                              <div className="w-px h-full bg-border mt-2" />
                            )}
                          </div>

                          {/* Event content */}
                          <div className="flex-1 pb-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">
                                  {event.title}
                                </p>
                                {event.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                    {event.description}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {format(parseISO(event.date), 'HH:mm')}
                              </span>
                            </div>

                            {/* Meta info */}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {config.label}
                              </Badge>
                              {event.teamName && (
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: event.teamColor || '#6366f1' }}
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    {event.teamName}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
