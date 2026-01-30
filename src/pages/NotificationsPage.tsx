import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Bell, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationsList } from '@/components/notifications';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t('notifications.pageTitle', 'Notificações')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('notifications.pageSubtitle', 'Acompanhe todas as atualizações importantes')}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" disabled>
          <Settings className="h-4 w-4 mr-2" />
          {t('notifications.preferences', 'Preferências')}
        </Button>
      </motion.div>

      {/* Notifications List */}
      <motion.div variants={itemVariants}>
        <NotificationsList />
      </motion.div>
    </motion.div>
  );
};

export default NotificationsPage;
