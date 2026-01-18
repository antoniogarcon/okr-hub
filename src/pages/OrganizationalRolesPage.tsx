import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Plus, Search, RefreshCw, AlertTriangle, Shield } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import {
  useOrganizationalRoles,
  useCreateOrganizationalRole,
  useUpdateOrganizationalRole,
  useDeleteOrganizationalRole,
  useInitializeDefaultRoles,
  OrganizationalRole,
} from '@/hooks/useOrganizationalRoles';
import {
  OrganizationalRoleFormDialog,
  OrganizationalRoleCard,
  UserRolesDialog,
} from '@/components/organizationalRoles';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function OrganizationalRolesPage() {
  const { profile, getTenantId } = useAuth();
  const userRole = profile?.role;
  const tenantId = getTenantId();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUsersDialogOpen, setIsUsersDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<OrganizationalRole | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<OrganizationalRole | null>(null);

  const { data: roles = [], isLoading, error, refetch } = useOrganizationalRoles();
  const createRole = useCreateOrganizationalRole();
  const updateRole = useUpdateOrganizationalRole();
  const deleteRole = useDeleteOrganizationalRole();
  const initializeDefaults = useInitializeDefaultRoles();

  // Fetch user counts for each role
  const { data: userCounts = {} } = useQuery({
    queryKey: ['organizational-role-user-counts', tenantId],
    queryFn: async () => {
      if (!tenantId) return {};

      const { data, error } = await supabase
        .from('user_organizational_roles')
        .select('organizational_role_id');

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((item) => {
        counts[item.organizational_role_id] = (counts[item.organizational_role_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!tenantId,
  });

  const canEdit = userRole === 'admin' || userRole === 'root';

  // Initialize default roles if none exist
  useEffect(() => {
    if (!isLoading && roles.length === 0 && canEdit) {
      initializeDefaults.mutate();
    }
  }, [isLoading, roles.length, canEdit]);

  const filteredRoles = useMemo(() => {
    if (!searchQuery) return roles;
    const query = searchQuery.toLowerCase();
    return roles.filter(
      (role) =>
        role.name.toLowerCase().includes(query) ||
        role.description?.toLowerCase().includes(query)
    );
  }, [roles, searchQuery]);

  const handleCreate = () => {
    setSelectedRole(null);
    setIsFormOpen(true);
  };

  const handleEdit = (role: OrganizationalRole) => {
    setSelectedRole(role);
    setIsFormOpen(true);
  };

  const handleManageUsers = (role: OrganizationalRole) => {
    setSelectedRole(role);
    setIsUsersDialogOpen(true);
  };

  const handleDelete = (role: OrganizationalRole) => {
    setRoleToDelete(role);
  };

  const confirmDelete = async () => {
    if (roleToDelete) {
      await deleteRole.mutateAsync(roleToDelete.id);
      setRoleToDelete(null);
    }
  };

  const handleFormSubmit = async (data: any) => {
    if (selectedRole) {
      await updateRole.mutateAsync({ id: selectedRole.id, data });
    } else {
      await createRole.mutateAsync(data);
    }
    setIsFormOpen(false);
    setSelectedRole(null);
  };

  // Access control
  if (userRole !== 'admin' && userRole !== 'root') {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t('common.accessDenied')}</h2>
            <p className="text-muted-foreground">{t('organizationalRoles.adminOnly')}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('organizationalRoles.title')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('organizationalRoles.subtitle')}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('common.refresh')}
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              {t('organizationalRoles.create')}
            </Button>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div variants={itemVariants} className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('organizationalRoles.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </motion.div>

        {/* Content */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('common.error')}</h3>
            <p className="text-muted-foreground mb-4">{t('common.errorLoading')}</p>
            <Button variant="outline" onClick={() => refetch()}>
              {t('common.tryAgain')}
            </Button>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery
                ? t('organizationalRoles.noResults')
                : t('organizationalRoles.empty')}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? t('organizationalRoles.tryDifferentSearch')
                : t('organizationalRoles.createFirst')}
            </p>
            {!searchQuery && (
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                {t('organizationalRoles.create')}
              </Button>
            )}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {filteredRoles.map((role) => (
              <OrganizationalRoleCard
                key={role.id}
                role={role}
                usersCount={userCounts[role.id] || 0}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onManageUsers={handleManageUsers}
                canEdit={canEdit}
              />
            ))}
          </motion.div>
        )}

        {/* Form Dialog */}
        <OrganizationalRoleFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          role={selectedRole}
          onSubmit={handleFormSubmit}
          isLoading={createRole.isPending || updateRole.isPending}
        />

        {/* Users Dialog */}
        <UserRolesDialog
          open={isUsersDialogOpen}
          onOpenChange={setIsUsersDialogOpen}
          role={selectedRole}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={!!roleToDelete} onOpenChange={() => setRoleToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('organizationalRoles.deleteConfirmTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('organizationalRoles.deleteConfirmDescription', { name: roleToDelete?.name })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </MainLayout>
  );
}
