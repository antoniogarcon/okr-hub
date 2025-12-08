import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Target,
  BarChart3,
  Users,
  Train,
  ListTodo,
  BookOpen,
  Bell,
  Settings,
  Building2,
  ChevronLeft,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  roles?: ('root' | 'admin' | 'team_lead' | 'member')[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();

  const mainNavItems: NavItem[] = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), href: '/dashboard' },
    { icon: Target, label: t('nav.okrs'), href: '/okrs' },
    { icon: BarChart3, label: t('nav.indicators'), href: '/indicators' },
    { icon: Users, label: t('nav.teams'), href: '/teams' },
    { icon: Train, label: t('nav.train'), href: '/train' },
    { icon: ListTodo, label: t('nav.backlog'), href: '/backlog' },
    { icon: BookOpen, label: t('nav.wiki'), href: '/wiki' },
    { icon: Bell, label: t('nav.feed'), href: '/feed' },
  ];

  const adminNavItems: NavItem[] = [
    { 
      icon: Settings, 
      label: t('nav.admin'), 
      href: '/admin',
      roles: ['admin', 'root'],
    },
    { 
      icon: Building2, 
      label: t('nav.tenants'), 
      href: '/tenants',
      roles: ['root'],
    },
  ];

  const filteredAdminItems = adminNavItems.filter(
    item => !item.roles || (user && item.roles.includes(user.role))
  );

  const renderNavItem = (item: NavItem) => {
    const isActive = location.pathname === item.href || 
                     location.pathname.startsWith(item.href + '/');
    
    const content = (
      <NavLink
        to={item.href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
          'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          isActive && 'bg-primary/10 text-primary',
          isCollapsed && 'justify-center px-2'
        )}
      >
        <item.icon className={cn('h-5 w-5 shrink-0', isActive && 'text-primary')} />
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="truncate"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </NavLink>
    );

    if (isCollapsed) {
      return (
        <Tooltip key={item.href} delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.href}>{content}</div>;
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar"
      style={{ background: 'var(--gradient-sidebar)' }}
    >
      {/* Header */}
      <div className={cn(
        'flex h-16 items-center border-b border-sidebar-border px-4',
        isCollapsed ? 'justify-center' : 'justify-between'
      )}>
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Target className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-sidebar-foreground">
                OKRs View
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 shrink-0 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <ChevronLeft className={cn(
            'h-4 w-4 transition-transform duration-200',
            isCollapsed && 'rotate-180'
          )} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {mainNavItems.map(renderNavItem)}
        
        {filteredAdminItems.length > 0 && (
          <>
            <Separator className="my-3 bg-sidebar-border" />
            {filteredAdminItems.map(renderNavItem)}
          </>
        )}
      </nav>

      {/* Footer - User */}
      <div className="border-t border-sidebar-border p-3">
        <div className={cn(
          'flex items-center gap-3 rounded-lg p-2',
          isCollapsed && 'justify-center'
        )}>
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-primary/20 text-primary">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex flex-1 items-center justify-between overflow-hidden"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-sidebar-foreground">
                    {user?.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t(`roles.${user?.role?.replace('_', '')}`)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
};
