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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WikiDocument, WikiCategory } from '@/hooks/useWiki';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  category_id: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface WikiDocumentEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document?: WikiDocument | null;
  categories: WikiCategory[];
  onSave: (data: { title: string; content: string; category_id?: string | null }) => void;
  isLoading?: boolean;
}

export const WikiDocumentEditor: React.FC<WikiDocumentEditorProps> = ({
  open,
  onOpenChange,
  document,
  categories,
  onSave,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const isEditing = !!document;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: document?.title || '',
      content: document?.content || '',
      category_id: document?.category_id || undefined,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        title: document?.title || '',
        content: document?.content || '',
        category_id: document?.category_id || undefined,
      });
    }
  }, [open, document, form]);

  const handleSubmit = (data: FormData) => {
    onSave({
      title: data.title,
      content: data.content,
      category_id: data.category_id === 'none' ? null : data.category_id || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('wiki.editPage') : t('wiki.createPage')}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t('wiki.editPageDesc') : t('wiki.createPageDesc')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('wiki.documentTitle')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('wiki.documentTitlePlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('wiki.category')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('wiki.selectCategory')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">{t('wiki.noCategory')}</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('wiki.content')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('wiki.contentPlaceholder')}
                      className="min-h-[300px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('wiki.markdownSupported')}
                  </p>
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
