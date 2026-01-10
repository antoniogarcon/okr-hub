import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Users, Target, BarChart3, Edit, Trash2, MoreHorizontal, UserMinus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TeamWithDetails } from '@/hooks/useTeamManagement';

interface TeamCardProps {
  team: TeamWithDetails;
  canEdit: boolean;
  onEdit: (team: TeamWithDetails) => void;
  onDelete: (team: TeamWithDetails) => void;
  onManageMembers: (team: TeamWithDetails) => void;
}

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  canEdit,
  onEdit,
  onDelete,
  onManageMembers,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const teamColor = team.color || '#6366f1';

  return (
    <Card className="glass border-border/50 hover:border-primary/30 transition-all duration-300 h-full group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: teamColor }}
            >
              {getInitials(team.name)}
            </div>
            <div>
              <CardTitle className="text-lg text-foreground">{team.name}</CardTitle>
              {team.currentSprintName && (
                <Badge variant="outline" className="mt-1 text-xs">
                  {team.currentSprintName}
                </Badge>
              )}
            </div>
          </div>
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(team)}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onManageMembers(team)}>
                  <Users className="mr-2 h-4 w-4" />
                  {t('teams.manageMembers')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(team)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {team.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {team.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Leader */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('teams.leader')}:</span>
          {team.leaderName ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-primary/20 text-primary">
                  {getInitials(team.leaderName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{team.leaderName}</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground italic">
              {t('teams.noLeader')}
            </span>
          )}
        </div>

        {/* Members */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {t('teams.members')} ({team.memberCount})
            </span>
          </div>
          <div className="flex -space-x-2">
            <TooltipProvider>
              {team.members.slice(0, 5).map((member) => (
                <Tooltip key={member.id}>
                  <TooltipTrigger asChild>
                    <Avatar className="h-8 w-8 border-2 border-background cursor-pointer hover:z-10 transition-transform hover:scale-110">
                      <AvatarFallback className="text-xs bg-primary/20 text-primary">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
            {team.memberCount > 5 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                +{team.memberCount - 5}
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => navigate(`/okrs?team=${team.id}`)}
          >
            <Target className="mr-2 h-4 w-4" />
            {team.activeOkrsCount} OKRs
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => navigate(`/indicators?team=${team.id}`)}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            {t('teams.metrics')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
