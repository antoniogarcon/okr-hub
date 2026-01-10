import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { TeamWithDetails, useAvailableUsers } from '@/hooks/useTeamManagement';
import { useAuth } from '@/contexts/AuthContext';

const teamSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  color: z.string().optional(),
  leaderId: z.string().optional(),
});

type TeamFormData = z.infer<typeof teamSchema>;

interface TeamFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team?: TeamWithDetails | null;
  onSubmit: (data: TeamFormData) => void;
  isLoading?: boolean;
}

const TEAM_COLORS = [
  { value: '#6366f1', label: 'Indigo' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#ef4444', label: 'Red' },
  { value: '#f97316', label: 'Orange' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#22c55e', label: 'Green' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#64748b', label: 'Slate' },
];

export const TeamFormDialog: React.FC<TeamFormDialogProps> = ({
  open,
  onOpenChange,
  team,
  onSubmit,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const { getTenantId } = useAuth();
  const tenantId = getTenantId();
  const isEditing = !!team;

  const { data: availableUsers = [] } = useAvailableUsers(tenantId, team?.id);

  const form = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: '',
      description: '',
      color: '#6366f1',
      leaderId: '',
    },
  });

  useEffect(() => {
    if (team) {
      form.reset({
        name: team.name,
        description: team.description || '',
        color: team.color || '#6366f1',
        leaderId: team.leaderId || '',
      });
    } else {
      form.reset({
        name: '',
        description: '',
        color: '#6366f1',
        leaderId: '',
      });
    }
  }, [team, form]);

  const handleSubmit = (data: TeamFormData) => {
    onSubmit({
      ...data,
      leaderId: data.leaderId || undefined,
    });
  };

  // Combine available users with current leader for editing
  const leaderOptions = React.useMemo(() => {
    const users = [...availableUsers];
    if (team?.leaderId && team.leaderName) {
      const existingLeader = users.find(u => u.id === team.leaderId);
      if (!existingLeader) {
        users.unshift({
          id: team.leaderId,
          userId: '',
          name: team.leaderName,
          email: team.leaderEmail || '',
          avatarUrl: null,
        });
      }
    }
    return users;
  }, [availableUsers, team]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('teams.editTeam') : t('teams.createTeam')}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t('teams.editTeamDescription')
              : t('teams.createTeamDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('teams.teamName')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('teams.teamNamePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('teams.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('teams.descriptionPlaceholder')}
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('teams.color')}</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {TEAM_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => field.onChange(color.value)}
                        className={`w-8 h-8 rounded-full transition-all ${
                          field.value === color.value
                            ? 'ring-2 ring-offset-2 ring-primary'
                            : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="leaderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('teams.leader')}</FormLabel>
                  <Select
                    value={field.value || 'none'}
                    onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('teams.selectLeader')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">{t('teams.noLeader')}</SelectItem>
                      {leaderOptions.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? t('common.save') : t('common.create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
