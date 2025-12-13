import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Search, Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, type SupportedLanguage } from '@/hooks/useLanguage';

export const Header: React.FC = () => {
  const { t } = useTranslation();
  const { tenant } = useAuth();
  const { currentLanguage, setLanguage, supportedLanguages } = useLanguage();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-lg">
      {/* Left side - Tenant info & Search */}
      <div className="flex items-center gap-4">
        {tenant && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {tenant.name.charAt(0)}
              </span>
            </div>
            <span className="text-sm font-medium text-foreground">
              {tenant.name}
            </span>
          </div>
        )}
        
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('common.search')}
            className="w-64 pl-9 bg-muted/50 border-border focus:bg-background"
          />
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Language Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <Globe className="h-4 w-4" />
              <span className="text-xs font-medium">
                {supportedLanguages.find(l => l.code === currentLanguage)?.label || 'PT'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {supportedLanguages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => setLanguage(lang.code as SupportedLanguage)}
                className="flex items-center justify-between"
              >
                <span>{lang.name}</span>
                {currentLanguage === lang.code && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative text-muted-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
        </Button>
      </div>
    </header>
  );
};
