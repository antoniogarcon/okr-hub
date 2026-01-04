import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Settings, Users, Shield, FileText, Plus, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { UserFormDialog, UserTable } from '@/components/admin';
import {
  useUsers,
  useTeamsForSelect,
  useCreateUser,
  useUpdateUser,
  UserWithDetails,
  CreateUserData,
  UpdateUserData,
} from '@/hooks/useUserManagement';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const AdminPage: React.FC = () => {
  const { t } = useTranslation();
  const { getTenantId, isRoot, profile } = useAuth();
  const tenantId = getTenantId();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);

  // Queries
  const { data: users = [], isLoading: isLoadingUsers } = useUsers(tenantId);
  const { data: teams = [] } = useTeamsForSelect(tenantId);

  // Mutations
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();

  // Filter users by search
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  // Handlers
  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: UserWithDetails) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleToggleStatus = (user: UserWithDetails) => {
    updateUserMutation.mutate({
      userId: user.userId,
      isActive: !user.isActive,
    });
  };

  const handleFormSubmit = (data: CreateUserData | Omit<UpdateUserData, 'userId'>) => {
    if (selectedUser) {
      // Editing
      updateUserMutation.mutate(
        {
          userId: selectedUser.userId,
          ...data,
        } as UpdateUserData,
        {
          onSuccess: () => setIsFormOpen(false),
        }
      );
    } else {
      // Creating
      createUserMutation.mutate(data as CreateUserData, {
        onSuccess: () => setIsFormOpen(false),
      });
    }
  };

  // Check if no tenant selected (for root users)
  if (isRoot() && !tenantId) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            {t('admin.title')}
          </h1>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="glass border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Settings className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground">
                {t('auth.selectTenant')}
              </h3>
              <p className="text-muted-foreground mt-1">
                {t('auth.selectTenantMessage')}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          {t('admin.title')}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t('admin.subtitle')}
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('admin.users')}
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {t('admin.roles')}
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('admin.auditLog')}
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-6">
            <Card className="glass border-border/50">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-foreground">
                      {t('admin.userManagement.title')}
                    </CardTitle>
                    <CardDescription>
                      {t('admin.userManagement.description')}
                    </CardDescription>
                  </div>
                  <Button onClick={handleCreateUser} className="shrink-0">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('admin.userManagement.createUser')}
                  </Button>
                </div>

                {/* Search */}
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('admin.userManagement.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <UserTable
                  users={filteredUsers}
                  isLoading={isLoadingUsers}
                  onEdit={handleEditUser}
                  onToggleStatus={handleToggleStatus}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles" className="mt-6">
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="text-foreground">{t('admin.roles')}</CardTitle>
                <CardDescription>{t('admin.rolesDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Admin Role */}
                  <div className="p-4 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">
                          {t('admin.userManagement.roles.admin')}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {t('admin.roleDescriptions.admin')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Leader Role */}
                  <div className="p-4 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">
                          {t('admin.userManagement.roles.leader')}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {t('admin.roleDescriptions.leader')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Member Role */}
                  <div className="p-4 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Users className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">
                          {t('admin.userManagement.roles.member')}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {t('admin.roleDescriptions.member')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit" className="mt-6">
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="text-foreground">{t('admin.auditLog')}</CardTitle>
                <CardDescription>{t('admin.auditLogDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">
                  {t('admin.auditLogPlaceholder')}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* User Form Dialog */}
      <UserFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        user={selectedUser}
        teams={teams}
        onSubmit={handleFormSubmit}
        isLoading={createUserMutation.isPending || updateUserMutation.isPending}
      />
    </motion.div>
  );
};

export default AdminPage;
