import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  badge?: string | number;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  valueClassName?: string;
  children?: React.ReactNode;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  badge,
  badgeVariant = 'secondary',
  valueClassName,
  children,
}) => {
  return (
    <Card className="border-border/50 bg-card hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {badge !== undefined && (
            <Badge variant={badgeVariant} className="text-xs font-semibold">
              {badge}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className={cn('text-3xl font-bold text-foreground', valueClassName)}>
            {value}
          </span>
        </div>
        {children}
      </CardContent>
    </Card>
  );
};
