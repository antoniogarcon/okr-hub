import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Target, ArrowRight, GitBranch, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import type { MemberOKR } from '@/hooks/useMemberDashboard';

interface MemberOKRsCardProps {
  okrs: MemberOKR[];
}

const statusColors = {
  active: 'bg-success/10 text-success border-success/20',
  at_risk: 'bg-warning/10 text-warning border-warning/20',
  behind: 'bg-destructive/10 text-destructive border-destructive/20',
  completed: 'bg-primary/10 text-primary border-primary/20',
};

const statusLabels = {
  active: 'okrs.onTrack',
  at_risk: 'okrs.atRisk',
  behind: 'okrs.behind',
  completed: 'okrs.completed',
};

const progressColors = {
  active: 'bg-success',
  at_risk: 'bg-warning',
  behind: 'bg-destructive',
  completed: 'bg-primary',
};

export const MemberOKRsCard: React.FC<MemberOKRsCardProps> = ({ okrs }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card className="border-border/50 bg-card h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold text-foreground">
            {t('memberDashboard.myOkrs')}
          </CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary hover:text-primary/80"
          onClick={() => navigate('/okrs')}
        >
          {t('common.viewAll')}
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {okrs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">{t('memberDashboard.noOkrsAssigned')}</p>
          </div>
        ) : (
          okrs.slice(0, 5).map((okr, index) => (
            <motion.div
              key={okr.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate('/okrs')}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground truncate">{okr.title}</h4>
                  {okr.parentTitle && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <GitBranch className="h-3 w-3" />
                      <span className="truncate">{okr.parentTitle}</span>
                    </div>
                  )}
                  {okr.teamName && (
                    <div className="flex items-center gap-1 mt-1">
                      <span 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: okr.teamColor || '#6366f1' }} 
                      />
                      <span className="text-xs text-muted-foreground">{okr.teamName}</span>
                    </div>
                  )}
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs shrink-0 ${statusColors[okr.status]}`}
                >
                  {t(statusLabels[okr.status])}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {okr.keyResultsCompleted}/{okr.keyResultsCount} KRs
                  </span>
                  <span className="font-medium text-foreground">{okr.progress}%</span>
                </div>
                <Progress 
                  value={okr.progress} 
                  className="h-2" 
                  indicatorClassName={progressColors[okr.status]}
                />
              </div>
            </motion.div>
          ))
        )}

        {okrs.length > 5 && (
          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/okrs')}
          >
            {t('memberDashboard.viewMoreOkrs', { count: okrs.length - 5 })}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
