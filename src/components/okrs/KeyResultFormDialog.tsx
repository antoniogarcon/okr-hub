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
import { KeyResult, KeyResultFormData, useProfiles } from '@/hooks/useOKRs';
import { useAuth } from '@/contexts/AuthContext';

const keyResultSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  target_value: z.number().min(1, 'Meta deve ser maior que 0'),
  current_value: z.number().min(0).optional(),
  unit: z.string().optional(),
  owner_id: z.string().optional().nullable(),
});

interface KeyResultFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyResult?: KeyResult | null;
  onSubmit: (data: KeyResultFormData) => void;
  isLoading?: boolean;
}

const KeyResultFormDialog: React.FC<KeyResultFormDialogProps> = ({
  open,
  onOpenChange,
  keyResult,
  onSubmit,
  isLoading,
}) => {
  const { t } = useTranslation();
  const { getTenantId } = useAuth();
  const tenantId = getTenantId();
  
  const { data: profiles = [] } = useProfiles(tenantId || undefined);

  const form = useForm<KeyResultFormData>({
    resolver: zodResolver(keyResultSchema),
    defaultValues: {
      title: '',
      description: '',
      target_value: 100,
      current_value: 0,
      unit: '%',
      owner_id: null,
    },
  });

  useEffect(() => {
    if (keyResult) {
      form.reset({
        title: keyResult.title,
        description: keyResult.description || '',
        target_value: keyResult.target_value,
        current_value: keyResult.current_value,
        unit: keyResult.unit,
        owner_id: keyResult.owner_id,
      });
    } else {
      form.reset({
        title: '',
        description: '',
        target_value: 100,
        current_value: 0,
        unit: '%',
        owner_id: null,
      });
    }
  }, [keyResult, form]);

  const handleSubmit = (data: KeyResultFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            {keyResult ? t('okrs.editKeyResult') : t('okrs.createKeyResult')}
          </DialogTitle>
          <DialogDescription>
            {keyResult 
              ? t('okrs.editKeyResultDesc') 
              : t('okrs.createKeyResultDesc')
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
                  <FormLabel>{t('okrs.keyResultTitle')}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('okrs.keyResultPlaceholder')} 
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
                      placeholder={t('okrs.keyResultDescPlaceholder')} 
                      className="resize-none"
                      rows={2}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="target_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('okrs.targetValue')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="current_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('okrs.currentValue')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('okrs.unit')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || '%'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="%">%</SelectItem>
                        <SelectItem value="pts">pts</SelectItem>
                        <SelectItem value="un">un</SelectItem>
                        <SelectItem value="R$">R$</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                {keyResult ? t('common.save') : t('common.create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default KeyResultFormDialog;
