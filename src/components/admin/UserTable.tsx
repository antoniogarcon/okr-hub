import React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { MoreHorizontal, Pencil, UserCheck, UserX, Users } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UserWithDetails } from '@/hooks/useUserManagement';
import { useLanguage } from '@/hooks/useLanguage';

interface UserTableProps {
  users: UserWithDetails[];
  isLoading?: boolean;
  onEdit: (user: UserWithDetails) => void;
  onToggleStatus: (user: UserWithDetails) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  isLoading = false,
  onEdit,
  onToggleStatus,
}) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();

  const getLocale = () => {
    switch (currentLanguage) {
      case 'pt-BR':
        return ptBR;
      case 'es':
        return es;
      default:
        return enUS;
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { variant: 'default' | 'secondary' | 'outline'; label: string }> = {
      root: { variant: 'default', label: t('admin.userManagement.roles.root') },
      admin: { variant: 'default', label: t('admin.userManagement.roles.admin') },
      leader: { variant: 'secondary', label: t('admin.userManagement.roles.leader') },
      member: { variant: 'outline', label: t('admin.userManagement.roles.member') },
    };

    const config = roleConfig[role] || roleConfig.member;
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? 'default' : 'destructive'} className={isActive ? 'bg-green-600' : ''}>
        {isActive ? t('admin.userManagement.active') : t('admin.userManagement.inactive')}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground">
          {t('admin.userManagement.noUsers')}
        </h3>
        <p className="text-muted-foreground mt-1">
          {t('admin.userManagement.noUsersDesc')}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('admin.userManagement.name')}</TableHead>
            <TableHead>{t('admin.userManagement.email')}</TableHead>
            <TableHead>{t('admin.userManagement.role')}</TableHead>
            <TableHead>{t('admin.userManagement.team')}</TableHead>
            <TableHead>{t('admin.userManagement.status')}</TableHead>
            <TableHead className="text-right">{t('admin.userManagement.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell>{getRoleBadge(user.role)}</TableCell>
              <TableCell>
                {user.teamName || (
                  <span className="text-muted-foreground italic">
                    {t('admin.userManagement.noTeam')}
                  </span>
                )}
              </TableCell>
              <TableCell>{getStatusBadge(user.isActive)}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Ações</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(user)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      {t('common.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onToggleStatus(user)}
                      className={user.isActive ? 'text-destructive' : 'text-green-600'}
                    >
                      {user.isActive ? (
                        <>
                          <UserX className="mr-2 h-4 w-4" />
                          {t('admin.userManagement.deactivate')}
                        </>
                      ) : (
                        <>
                          <UserCheck className="mr-2 h-4 w-4" />
                          {t('admin.userManagement.activate')}
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
