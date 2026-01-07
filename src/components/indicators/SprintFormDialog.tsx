import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Button } from '@/components/ui/button';
import { Sprint } from '@/hooks/useSprintIndicators';

const sprintSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  team_id: z.string().min(1, 'Equipe é obrigatória'),
  status: z.enum(['planned', 'active', 'completed']),
  start_date: z.string().min(1, 'Data de início é obrigatória'),
  end_date: z.string().min(1, 'Data de fim é obrigatória'),
  planned_points: z.coerce.number().min(0).nullable(),
  completed_points: z.coerce.number().min(0).nullable(),
  capacity: z.coerce.number().min(0).max(100).nullable(),
});

type SprintFormData = z.infer<typeof sprintSchema>;

interface SprintFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprint?: Partial<Sprint> | null;
  teams: { id: string; name: string }[];
  onSubmit: (data: SprintFormData) => void;
  isLoading?: boolean;
}

export const SprintFormDialog: React.FC<SprintFormDialogProps> = ({
  open,
  onOpenChange,
  sprint,
  teams,
  onSubmit,
  isLoading,
}) => {
  const { t } = useTranslation();
  const isEditing = !!sprint?.id;

  const form = useForm<SprintFormData>({
    resolver: zodResolver(sprintSchema),
    defaultValues: {
      name: '',
      team_id: '',
      status: 'planned',
      start_date: '',
      end_date: '',
      planned_points: 0,
      completed_points: 0,
      capacity: 100,
    },
  });

  useEffect(() => {
    if (sprint) {
      form.reset({
        name: sprint.name || '',
        team_id: sprint.team_id || '',
        status: sprint.status || 'planned',
        start_date: sprint.start_date || '',
        end_date: sprint.end_date || '',
        planned_points: sprint.planned_points || 0,
        completed_points: sprint.completed_points || 0,
        capacity: sprint.capacity || 100,
      });
    } else {
      form.reset({
        name: '',
        team_id: '',
        status: 'planned',
        start_date: '',
        end_date: '',
        planned_points: 0,
        completed_points: 0,
        capacity: 100,
      });
    }
  }, [sprint, form]);

  const handleSubmit = (data: SprintFormData) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('indicators.editSprint', 'Editar Sprint') : t('indicators.createSprint', 'Configurar Sprint')}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? t('indicators.editSprintDesc', 'Atualize os dados da sprint.')
              : t('indicators.createSprintDesc', 'Configure uma nova sprint para a equipe.')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('indicators.sprintName', 'Nome da Sprint')}</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Sprint 24" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="team_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('indicators.team', 'Equipe')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('indicators.selectTeam', 'Selecione uma equipe')} />
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('indicators.startDate', 'Data Início')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <FormLabel>{t('indicators.endDate', 'Data Fim')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('indicators.status', 'Status')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="planned">{t('indicators.planned', 'Planejada')}</SelectItem>
                      <SelectItem value="active">{t('indicators.active', 'Ativa')}</SelectItem>
                      <SelectItem value="completed">{t('indicators.completed', 'Concluída')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="planned_points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('indicators.plannedPoints', 'Pontos Planejados')}</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="completed_points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('indicators.completedPoints', 'Pontos Entregues')}</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('indicators.capacity', 'Capacidade %')}</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={100} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isEditing ? t('common.save') : t('common.create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
