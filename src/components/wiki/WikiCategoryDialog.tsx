import React from 'react';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers and hyphens'),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface WikiCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; slug: string; description?: string }) => void;
  isLoading?: boolean;
}

export const WikiCategoryDialog: React.FC<WikiCategoryDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({ name: '', slug: '', description: '' });
    }
  }, [open, form]);

  const handleNameChange = (name: string) => {
    form.setValue('name', name);
    // Auto-generate slug from name
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    form.setValue('slug', slug);
  };

  const handleSubmit = (data: FormData) => {
    onSave({
      name: data.name,
      slug: data.slug,
      description: data.description,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('wiki.createCategory')}</DialogTitle>
          <DialogDescription>{t('wiki.createCategoryDesc')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('wiki.categoryName')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('wiki.categoryNamePlaceholder')}
                      {...field}
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('wiki.categorySlug')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('wiki.categorySlugPlaceholder')}
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
                  <FormLabel>{t('wiki.categoryDescription')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('wiki.categoryDescPlaceholder')}
                      {...field}
                    />
                  </FormControl>
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
                {isLoading ? t('common.loading') : t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
