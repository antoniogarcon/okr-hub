import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Edit2, 
  Trash2,
  Users,
  Calendar,
  TrendingUp,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { OKR, KeyResult } from '@/hooks/useOKRs';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OKRCardProps {
  okr: OKR;
  onEdit?: (okr: OKR) => void;
  onDelete?: (okr: OKR) => void;
  onAddKeyResult?: (okr: OKR) => void;
  onEditKeyResult?: (kr: KeyResult) => void;
  onDeleteKeyResult?: (kr: KeyResult) => void;
  onUpdateKeyResultProgress?: (kr: KeyResult, newValue: number) => void;
  isReadOnly?: boolean;
  level?: number;
}

const statusColors: Record<string, string> = {
  active: 'bg-success/20 text-success border-success/30',
  at_risk: 'bg-warning/20 text-warning border-warning/30',
  behind: 'bg-destructive/20 text-destructive border-destructive/30',
  completed: 'bg-primary/20 text-primary border-primary/30',
};

const OKRCard: React.FC<OKRCardProps> = ({
  okr,
  onEdit,
  onDelete,
  onAddKeyResult,
  onEditKeyResult,
  onDeleteKeyResult,
  onUpdateKeyResultProgress,
  isReadOnly = false,
  level = 0,
}) => {
  const { t } = useTranslation();
  const { hasMinimumRole, profile } = useAuth();
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const [editingKrId, setEditingKrId] = useState<string | null>(null);

  const canManage = hasMinimumRole('leader');
  const canUpdateProgress = !isReadOnly && (canManage || hasMinimumRole('member'));

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: t('okrs.onTrack'),
      at_risk: t('okrs.atRisk'),
      behind: t('okrs.behind'),
      completed: t('okrs.completed'),
    };
    return labels[status] || status;
  };

  const handleProgressChange = (kr: KeyResult, value: number[]) => {
    if (onUpdateKeyResultProgress) {
      const newValue = Math.round((value[0] / 100) * kr.target_value);
      onUpdateKeyResultProgress(kr, newValue);
    }
    setEditingKrId(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ marginLeft: level > 0 ? `${level * 24}px` : 0 }}
    >
      <Card className="glass border-border/50 hover:border-primary/30 transition-colors">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 mt-0.5">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Target className="h-5 w-5 text-primary shrink-0" />
                      <h3 className="font-semibold text-foreground truncate">
                        {okr.title}
                      </h3>
                      <Badge 
                        variant="outline" 
                        className={`text-xs shrink-0 ${statusColors[okr.status]}`}
                      >
                        {getStatusLabel(okr.status)}
                      </Badge>
                      {okr.type === 'train' && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {t('okrs.trainOkr')}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      {okr.team_name && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {okr.team_name}
                        </span>
                      )}
                      {okr.owner_name && (
                        <span>{t('okrs.owner')}: {okr.owner_name}</span>
                      )}
                      {okr.end_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(okr.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      )}
                      {okr.parent_title && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                          ↳ {okr.parent_title}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <Progress value={okr.progress} className="w-24 h-2" />
                      <span className="text-sm font-semibold text-foreground min-w-[3rem] text-right">
                        {okr.progress}%
                      </span>
                    </div>

                    {canManage && !isReadOnly && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit?.(okr)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            {t('common.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onAddKeyResult?.(okr)}>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('okrs.addKeyResult')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => onDelete?.(okr)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('common.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              {okr.description && (
                <p className="text-sm text-muted-foreground pl-9">
                  {okr.description}
                </p>
              )}

              {/* Key Results */}
              {okr.key_results && okr.key_results.length > 0 && (
                <div className="pl-9 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('okrs.keyResults')} ({okr.key_results.length})
                  </p>
                  <AnimatePresence>
                    {okr.key_results.map((kr) => (
                      <motion.div
                        key={kr.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-3 rounded-lg bg-muted/30 p-3 group"
                      >
                        <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{kr.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {kr.current_value} / {kr.target_value} {kr.unit}
                          </p>
                        </div>

                        {editingKrId === kr.id ? (
                          <div className="w-32">
                            <Slider
                              defaultValue={[kr.progress]}
                              max={100}
                              step={1}
                              onValueCommit={(value) => handleProgressChange(kr, value)}
                              className="cursor-pointer"
                            />
                          </div>
                        ) : (
                          <div 
                            className={`flex items-center gap-2 ${canUpdateProgress ? 'cursor-pointer' : ''}`}
                            onClick={() => canUpdateProgress && setEditingKrId(kr.id)}
                          >
                            <Progress value={kr.progress} className="w-20 h-1.5" />
                            <span className="text-xs text-muted-foreground w-10 text-right">
                              {kr.progress}%
                            </span>
                          </div>
                        )}

                        {canManage && !isReadOnly && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => onEditKeyResult?.(kr)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive"
                              onClick={() => onDeleteKeyResult?.(kr)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Children OKRs */}
              {okr.children && okr.children.length > 0 && (
                <div className="pl-9 pt-2 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('okrs.childOkrs')} ({okr.children.length})
                  </p>
                  {okr.children.map((child) => (
                    <OKRCard
                      key={child.id}
                      okr={child}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onAddKeyResult={onAddKeyResult}
                      onEditKeyResult={onEditKeyResult}
                      onDeleteKeyResult={onDeleteKeyResult}
                      onUpdateKeyResultProgress={onUpdateKeyResultProgress}
                      isReadOnly={isReadOnly}
                      level={level + 1}
                    />
                  ))}
                </div>
              )}

              {/* Empty state for Key Results */}
              {(!okr.key_results || okr.key_results.length === 0) && canManage && !isReadOnly && (
                <div className="pl-9">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => onAddKeyResult?.(okr)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('okrs.addKeyResult')}
                  </Button>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </motion.div>
  );
};

export default OKRCard;
