import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Edit2, Trash2, Users, Shield, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OrganizationalRole } from '@/hooks/useOrganizationalRoles';

interface OrganizationalRoleCardProps {
  role: OrganizationalRole;
  usersCount?: number;
  onEdit: (role: OrganizationalRole) => void;
  onDelete: (role: OrganizationalRole) => void;
  onManageUsers: (role: OrganizationalRole) => void;
  canEdit: boolean;
}

export function OrganizationalRoleCard({
  role,
  usersCount = 0,
  onEdit,
  onDelete,
  onManageUsers,
  canEdit,
}: OrganizationalRoleCardProps) {
  const { t } = useTranslation();

  const getRoleIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('owner') || lowerName.includes('manager')) {
      return <Shield className="h-5 w-5" />;
    }
    if (lowerName.includes('lead') || lowerName.includes('coach')) {
      return <Star className="h-5 w-5" />;
    }
    return <Users className="h-5 w-5" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card className={`h-full transition-all hover:shadow-md ${!role.is_active ? 'opacity-60' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                {getRoleIcon(role.name)}
              </div>
              <div>
                <CardTitle className="text-lg">{role.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={role.type === 'default' ? 'secondary' : 'outline'}>
                    {role.type === 'default' ? t('organizationalRoles.typeDefault') : t('organizationalRoles.typeCustom')}
                  </Badge>
                  {!role.is_active && (
                    <Badge variant="destructive">
                      {t('organizationalRoles.inactive')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {role.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {role.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {usersCount} {usersCount === 1 ? t('common.user') : t('common.users')}
              </span>
            </div>

            {canEdit && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onManageUsers(role)}
                  title={t('organizationalRoles.manageUsers')}
                >
                  <Users className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(role)}
                  title={t('common.edit')}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                {role.type === 'custom' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(role)}
                    className="text-destructive hover:text-destructive"
                    title={t('common.delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
