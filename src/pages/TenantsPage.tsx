import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Building2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const TenantsPage: React.FC = () => {
  const { t } = useTranslation();

  const tenants = [
    { id: '1', name: 'Empresa Alpha', admin: 'admin@alpha.com', status: 'active', users: 24 },
    { id: '2', name: 'Tech Solutions', admin: 'admin@techsol.com', status: 'active', users: 12 },
    { id: '3', name: 'StartupXYZ', admin: 'admin@xyz.com', status: 'suspended', users: 5 },
  ];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-success/20 text-success border-success/30',
      inactive: 'bg-muted text-muted-foreground border-border',
      suspended: 'bg-destructive/20 text-destructive border-destructive/30',
    };
    return styles[status] || styles.inactive;
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            {t('tenants.title')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Gerencie todos os tenants do sistema (somente Root)
          </p>
        </div>
        <Button size="sm" className="glow">
          <Plus className="mr-2 h-4 w-4" />
          {t('tenants.createTenant')}
        </Button>
      </motion.div>

      {/* Tenants List */}
      <motion.div variants={itemVariants}>
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground">Todos os Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between rounded-lg bg-muted/30 p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {tenant.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{tenant.name}</p>
                      <p className="text-sm text-muted-foreground">{tenant.admin}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{tenant.users} usuários</span>
                    <Badge variant="outline" className={getStatusBadge(tenant.status)}>
                      {t(`tenants.${tenant.status}`)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default TenantsPage;
