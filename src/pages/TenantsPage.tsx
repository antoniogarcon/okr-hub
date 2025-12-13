import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Plus, Edit2, Power, PowerOff, Search, Calendar, User, MoreVertical, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TenantWithAdmin extends Tenant {
  admin?: {
    name: string;
    email: string;
  } | null;
}

interface TenantFormData {
  name: string;
  slug: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const TenantsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantWithAdmin | null>(null);
  const [formData, setFormData] = useState<TenantFormData>({ name: '', slug: '' });

  // Get date-fns locale
  const getLocale = () => {
    switch (i18n.language) {
      case 'pt-BR': return ptBR;
      case 'es': return es;
      default: return enUS;
    }
  };

  // Fetch tenants with admin info
  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      // Fetch tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (tenantsError) throw tenantsError;

      // Fetch admin profiles for each tenant
      const tenantsWithAdmins: TenantWithAdmin[] = await Promise.all(
        (tenantsData || []).map(async (tenant) => {
          const { data: adminProfile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('tenant_id', tenant.id)
            .limit(1)
            .maybeSingle();

          return {
            ...tenant,
            admin: adminProfile,
          };
        })
      );

      return tenantsWithAdmins;
    },
  });

  // Create audit log
  const logAudit = async (action: string, entityId: string | null, details: Record<string, unknown>) => {
    if (!user) return;
    
    try {
      // Use type casting since audit_logs table was just created
      const { error } = await (supabase.from('audit_logs' as never) as ReturnType<typeof supabase.from>).insert({
        user_id: user.id,
        action,
        entity_type: 'tenant',
        entity_id: entityId,
        details,
      });
      if (error) console.error('Audit log error:', error);
    } catch (error) {
      console.error('Failed to log audit:', error);
    }
  };

  // Create tenant mutation
  const createTenantMutation = useMutation({
    mutationFn: async (data: TenantFormData) => {
      const { data: newTenant, error } = await supabase
        .from('tenants')
        .insert({
          name: data.name.trim(),
          slug: data.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        })
        .select()
        .single();

      if (error) throw error;
      return newTenant;
    },
    onSuccess: async (newTenant) => {
      await logAudit('CREATE', newTenant.id, { 
        name: newTenant.name, 
        slug: newTenant.slug 
      });
      
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setIsCreateDialogOpen(false);
      setFormData({ name: '', slug: '' });
      
      toast({
        title: t('tenants.createSuccess', 'Tenant criado'),
        description: t('tenants.createSuccessDesc', 'O tenant foi criado com sucesso.'),
      });
    },
    onError: (error: Error) => {
      console.error('Create tenant error:', error);
      toast({
        title: t('common.error', 'Erro'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update tenant mutation
  const updateTenantMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TenantFormData> }) => {
      const { data: updated, error } = await supabase
        .from('tenants')
        .update({
          name: data.name?.trim(),
          slug: data.slug?.trim().toLowerCase().replace(/\s+/g, '-'),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: async (updated) => {
      await logAudit('UPDATE', updated.id, { 
        name: updated.name, 
        slug: updated.slug 
      });
      
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setIsEditDialogOpen(false);
      setSelectedTenant(null);
      
      toast({
        title: t('tenants.updateSuccess', 'Tenant atualizado'),
        description: t('tenants.updateSuccessDesc', 'O tenant foi atualizado com sucesso.'),
      });
    },
    onError: (error: Error) => {
      console.error('Update tenant error:', error);
      toast({
        title: t('common.error', 'Erro'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Toggle tenant status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data: updated, error } = await supabase
        .from('tenants')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: async (updated) => {
      await logAudit(
        updated.is_active ? 'ACTIVATE' : 'DEACTIVATE', 
        updated.id, 
        { name: updated.name, is_active: updated.is_active }
      );
      
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      
      toast({
        title: updated.is_active 
          ? t('tenants.activateSuccess', 'Tenant ativado')
          : t('tenants.deactivateSuccess', 'Tenant desativado'),
        description: updated.is_active
          ? t('tenants.activateSuccessDesc', 'O tenant foi ativado com sucesso.')
          : t('tenants.deactivateSuccessDesc', 'O tenant foi desativado com sucesso.'),
      });
    },
    onError: (error: Error) => {
      console.error('Toggle status error:', error);
      toast({
        title: t('common.error', 'Erro'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Filter tenants by search term
  const filteredTenants = tenants.filter((tenant) =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.admin?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Auto-generate slug from name
  const handleNameChange = (name: string, isCreate: boolean = true) => {
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    if (isCreate) {
      setFormData({ name, slug });
    } else if (selectedTenant) {
      setSelectedTenant({ ...selectedTenant, name, slug });
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) return;
    createTenantMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant || !selectedTenant.name.trim() || !selectedTenant.slug.trim()) return;
    updateTenantMutation.mutate({
      id: selectedTenant.id,
      data: { name: selectedTenant.name, slug: selectedTenant.slug },
    });
  };

  const openEditDialog = (tenant: TenantWithAdmin) => {
    setSelectedTenant(tenant);
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive
      ? 'bg-success/20 text-success border-success/30'
      : 'bg-muted text-muted-foreground border-border';
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            {t('tenants.title')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t('tenants.subtitle', 'Gerencie todos os tenants do sistema (somente Root)')}
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="glow">
          <Plus className="mr-2 h-4 w-4" />
          {t('tenants.createTenant')}
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants}>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('tenants.searchPlaceholder', 'Buscar tenants...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-muted/50 border-border"
          />
        </div>
      </motion.div>

      {/* Tenants Table */}
      <motion.div variants={itemVariants}>
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center justify-between">
              <span>{t('tenants.allTenants', 'Todos os Tenants')}</span>
              <Badge variant="secondary" className="ml-2">
                {filteredTenants.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredTenants.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchTerm 
                  ? t('tenants.noResults', 'Nenhum tenant encontrado')
                  : t('tenants.empty', 'Nenhum tenant cadastrado')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('tenants.tenantName')}</TableHead>
                      <TableHead>{t('tenants.tenantAdmin')}</TableHead>
                      <TableHead>{t('tenants.createdAt', 'Criado em')}</TableHead>
                      <TableHead>{t('tenants.status')}</TableHead>
                      <TableHead className="text-right">{t('common.actions', 'Ações')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filteredTenants.map((tenant) => (
                        <motion.tr
                          key={tenant.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                                <span className="text-lg font-semibold text-primary">
                                  {tenant.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{tenant.name}</p>
                                <p className="text-xs text-muted-foreground">/{tenant.slug}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {tenant.admin ? (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm text-foreground">{tenant.admin.name}</p>
                                  <p className="text-xs text-muted-foreground">{tenant.admin.email}</p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                {t('tenants.noAdmin', 'Sem administrador')}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(tenant.created_at), 'dd/MM/yyyy', { locale: getLocale() })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusBadge(tenant.is_active)}>
                              {tenant.is_active ? t('tenants.active') : t('tenants.inactive')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(tenant)}>
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  {t('common.edit')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => toggleStatusMutation.mutate({
                                    id: tenant.id,
                                    isActive: !tenant.is_active,
                                  })}
                                >
                                  {tenant.is_active ? (
                                    <>
                                      <PowerOff className="mr-2 h-4 w-4" />
                                      {t('tenants.deactivate', 'Desativar')}
                                    </>
                                  ) : (
                                    <>
                                      <Power className="mr-2 h-4 w-4" />
                                      {t('tenants.activate', 'Ativar')}
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Create Tenant Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {t('tenants.createTenant')}
            </DialogTitle>
            <DialogDescription>
              {t('tenants.createDesc', 'Preencha os dados para criar um novo tenant.')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('tenants.tenantName')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value, true)}
                  placeholder={t('tenants.namePlaceholder', 'Ex: Minha Empresa')}
                  className="bg-muted/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">{t('tenants.slug', 'Identificador (slug)')}</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder={t('tenants.slugPlaceholder', 'ex: minha-empresa')}
                  className="bg-muted/50"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {t('tenants.slugHint', 'Identificador único usado em URLs')}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={createTenantMutation.isPending}>
                {createTenantMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('common.create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Tenant Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-primary" />
              {t('tenants.editTenant', 'Editar Tenant')}
            </DialogTitle>
            <DialogDescription>
              {t('tenants.editDesc', 'Atualize os dados do tenant.')}
            </DialogDescription>
          </DialogHeader>
          {selectedTenant && (
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">{t('tenants.tenantName')}</Label>
                  <Input
                    id="edit-name"
                    value={selectedTenant.name}
                    onChange={(e) => handleNameChange(e.target.value, false)}
                    placeholder={t('tenants.namePlaceholder', 'Ex: Minha Empresa')}
                    className="bg-muted/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-slug">{t('tenants.slug', 'Identificador (slug)')}</Label>
                  <Input
                    id="edit-slug"
                    value={selectedTenant.slug}
                    onChange={(e) => setSelectedTenant({ ...selectedTenant, slug: e.target.value })}
                    placeholder={t('tenants.slugPlaceholder', 'ex: minha-empresa')}
                    className="bg-muted/50"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={updateTenantMutation.isPending}>
                  {updateTenantMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t('common.save')}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default TenantsPage;