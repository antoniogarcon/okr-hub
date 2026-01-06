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
import { OKR, OKRFormData, useTeams, useParentOKRs, useProfiles } from '@/hooks/useOKRs';
import { useAuth } from '@/contexts/AuthContext';

const okrSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  type: z.enum(['train', 'team']),
  team_id: z.string().optional().nullable(),
  parent_id: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  owner_id: z.string().optional().nullable(),
});

interface OKRFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  okr?: OKR | null;
  onSubmit: (data: OKRFormData) => void;
  isLoading?: boolean;
}

const OKRFormDialog: React.FC<OKRFormDialogProps> = ({
  open,
  onOpenChange,
  okr,
  onSubmit,
  isLoading,
}) => {
  const { t } = useTranslation();
  const { getTenantId } = useAuth();
  const tenantId = getTenantId();
  
  const { data: teams = [] } = useTeams(tenantId || undefined);
  const { data: parentOKRs = [] } = useParentOKRs(tenantId || undefined, okr?.id);
  const { data: profiles = [] } = useProfiles(tenantId || undefined);

  const form = useForm<OKRFormData>({
    resolver: zodResolver(okrSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'team',
      team_id: null,
      parent_id: null,
      start_date: null,
      end_date: null,
      owner_id: null,
    },
  });

  const watchType = form.watch('type');

  useEffect(() => {
    if (okr) {
      form.reset({
        title: okr.title,
        description: okr.description || '',
        type: okr.type === 'train' ? 'train' : 'team',
        team_id: okr.team_id,
        parent_id: okr.parent_id,
        start_date: okr.start_date,
        end_date: okr.end_date,
        owner_id: okr.owner_id,
      });
    } else {
      form.reset({
        title: '',
        description: '',
        type: 'team',
        team_id: null,
        parent_id: null,
        start_date: null,
        end_date: null,
        owner_id: null,
      });
    }
  }, [okr, form]);

  const handleSubmit = (data: OKRFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {okr ? t('okrs.editOkr') : t('okrs.createOkr')}
          </DialogTitle>
          <DialogDescription>
            {okr 
              ? t('okrs.editOkrDesc') 
              : t('okrs.createOkrDesc')
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('okrs.objectiveTitle')}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('okrs.objectivePlaceholder')} 
                      {...field} 
                    />
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
                  <FormLabel>{t('okrs.description')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('okrs.descriptionPlaceholder')} 
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
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('okrs.type')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('okrs.selectType')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="train">{t('okrs.trainOkr')}</SelectItem>
                      <SelectItem value="team">{t('okrs.teamOkr')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchType === 'team' && (
              <FormField
                control={form.control}
                name="team_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('okrs.team')}</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('okrs.selectTeam')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {watchType === 'team' && parentOKRs.length > 0 && (
              <FormField
                control={form.control}
                name="parent_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('okrs.parentOkr')}</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('okrs.selectParent')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">{t('okrs.noParent')}</SelectItem>
                        {parentOKRs.map((parent) => (
                          <SelectItem key={parent.id} value={parent.id}>
                            {parent.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="owner_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('okrs.owner')}</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('okrs.selectOwner')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('okrs.startDate')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('okrs.endDate')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {okr ? t('common.save') : t('common.create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default OKRFormDialog;
