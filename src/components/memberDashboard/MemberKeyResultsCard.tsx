import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Edit2, Check, X, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR, es, enUS } from 'date-fns/locale';
import { useLanguage } from '@/hooks/useLanguage';
import type { MemberKeyResult } from '@/hooks/useMemberDashboard';
import { useUpdateKeyResultProgress } from '@/hooks/useMemberDashboard';

interface MemberKeyResultsCardProps {
  keyResults: MemberKeyResult[];
}

const getLocale = (lang: string) => {
  switch (lang) {
    case 'pt-BR': return ptBR;
    case 'es': return es;
    default: return enUS;
  }
};

export const MemberKeyResultsCard: React.FC<MemberKeyResultsCardProps> = ({ keyResults }) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const locale = getLocale(currentLanguage);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  const updateProgress = useUpdateKeyResultProgress();

  const handleEdit = (kr: MemberKeyResult) => {
    setEditingId(kr.id);
    setEditValue(kr.currentValue.toString());
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleSave = async (kr: MemberKeyResult) => {
    const newValue = parseFloat(editValue);
    if (isNaN(newValue) || newValue < 0) {
      return;
    }

    await updateProgress.mutateAsync({
      id: kr.id,
      currentValue: newValue,
    });

    setEditingId(null);
    setEditValue('');
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-success';
    if (progress >= 70) return 'bg-primary';
    if (progress >= 30) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <Card className="border-border/50 bg-card h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold text-foreground">
            {t('memberDashboard.myKeyResults')}
          </CardTitle>
        </div>
        <Badge variant="secondary" className="text-xs">
          {keyResults.length} {t('memberDashboard.assigned')}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {keyResults.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">{t('memberDashboard.noKeyResultsAssigned')}</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {keyResults.map((kr, index) => (
              <motion.div
                key={kr.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-lg bg-muted/30 border border-border/50"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground text-sm truncate">{kr.title}</h4>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {kr.okrTitle}
                    </p>
                  </div>
                  {editingId !== kr.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => handleEdit(kr)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {editingId === kr.id ? (
                    <motion.div
                      key="editing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-8 w-24"
                          min={0}
                          max={kr.targetValue * 2}
                          autoFocus
                        />
                        <span className="text-sm text-muted-foreground">
                          / {kr.targetValue} {kr.unit}
                        </span>
                        <div className="flex gap-1 ml-auto">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={handleCancel}
                            disabled={updateProgress.isPending}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="default"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleSave(kr)}
                            disabled={updateProgress.isPending}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="display"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {kr.currentValue} / {kr.targetValue} {kr.unit}
                        </span>
                        <span className="font-medium text-foreground">{kr.progress}%</span>
                      </div>
                      <Progress 
                        value={kr.progress} 
                        className="h-2" 
                        indicatorClassName={getProgressColor(kr.progress)}
                      />
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <History className="h-3 w-3" />
                        {t('memberDashboard.lastUpdated')}: {formatDistanceToNow(new Date(kr.updatedAt), { addSuffix: true, locale })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
