/**
 * Data validation hook for frontend validation before API calls
 * Integrates with the validate-data edge function for server-side validation
 */

import { useCallback } from 'react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import i18next from 'i18next';

/**
 * Common validation schemas using Zod
 */
export const schemas = {
  okr: z.object({
    title: z.string().min(3, 'Mínimo 3 caracteres').max(200, 'Máximo 200 caracteres'),
    description: z.string().max(1000, 'Máximo 1000 caracteres').optional().nullable(),
    type: z.enum(['objective', 'team']),
    status: z.enum(['active', 'at_risk', 'behind', 'completed']).optional(),
    progress: z.number().min(0).max(100).optional(),
    team_id: z.string().uuid().optional().nullable(),
    parent_id: z.string().uuid().optional().nullable(),
    owner_id: z.string().uuid().optional().nullable(),
    start_date: z.string().optional().nullable(),
    end_date: z.string().optional().nullable(),
  }),

  keyResult: z.object({
    title: z.string().min(3, 'Mínimo 3 caracteres').max(200, 'Máximo 200 caracteres'),
    description: z.string().max(500, 'Máximo 500 caracteres').optional().nullable(),
    target_value: z.number().min(0),
    current_value: z.number().min(0).optional(),
    unit: z.string().max(20, 'Máximo 20 caracteres').optional().nullable(),
    owner_id: z.string().uuid().optional().nullable(),
  }),

  team: z.object({
    name: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
    description: z.string().max(500, 'Máximo 500 caracteres').optional().nullable(),
    slug: z.string().regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens').max(50),
    color: z.string().optional().nullable(),
    leader_id: z.string().uuid().optional().nullable(),
  }),

  sprint: z.object({
    name: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
    start_date: z.string(),
    end_date: z.string(),
    status: z.enum(['planned', 'active', 'completed']).optional(),
    capacity: z.number().min(0).max(100).optional(),
    planned_points: z.number().min(0).optional(),
    completed_points: z.number().min(0).optional(),
  }),

  wikiDocument: z.object({
    title: z.string().min(2, 'Mínimo 2 caracteres').max(200, 'Máximo 200 caracteres'),
    content: z.string().max(100000, 'Máximo 100000 caracteres').optional(),
    category_id: z.string().uuid().optional().nullable(),
  }),

  wikiCategory: z.object({
    name: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
    slug: z.string().regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens').max(50),
    description: z.string().max(500, 'Máximo 500 caracteres').optional().nullable(),
    sort_order: z.number().min(0).optional(),
  }),

  user: z.object({
    name: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
    email: z.string().email('E-mail inválido'),
    role: z.enum(['admin', 'leader', 'member']),
    team_id: z.string().uuid().optional().nullable(),
  }),
};

/**
 * Validate data against a Zod schema
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { valid: boolean; data?: T; errors?: Record<string, string> } {
  try {
    const validData = schema.parse(data);
    return { valid: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      for (const issue of error.issues) {
        const path = issue.path.join('.');
        errors[path] = issue.message;
      }
      return { valid: false, errors };
    }
    return { valid: false, errors: { _general: 'Validation failed' } };
  }
}

/**
 * Hook for data validation with optional server-side validation
 */
export function useDataValidation() {
  const { toast } = useToast();

  /**
   * Validate data client-side with Zod
   */
  const validateClient = useCallback(<T>(
    schema: z.ZodSchema<T>,
    data: unknown
  ): { valid: boolean; data?: T; errors?: Record<string, string> } => {
    return validateWithSchema(schema, data);
  }, []);

  /**
   * Validate data server-side via edge function
   */
  const validateServer = useCallback(async (
    entity: string,
    data: Record<string, unknown>
  ): Promise<{ valid: boolean; errors?: { field: string; code: string; message: string }[] }> => {
    try {
      const { data: result, error } = await supabase.functions.invoke('validate-data', {
        body: { entity, data },
      });

      if (error) {
        console.error('Server validation error:', error);
        return { valid: false, errors: [{ field: '_server', code: 'SERVER_ERROR', message: error.message }] };
      }

      return result;
    } catch (error) {
      console.error('Validation request failed:', error);
      return { valid: false, errors: [{ field: '_server', code: 'NETWORK_ERROR', message: 'Validation request failed' }] };
    }
  }, []);

  /**
   * Full validation: client + server
   */
  const validateFull = useCallback(async <T>(
    schema: z.ZodSchema<T>,
    entity: string,
    data: unknown
  ): Promise<{ valid: boolean; data?: T; errors?: Record<string, string> }> => {
    // Client-side validation first (faster)
    const clientResult = validateWithSchema(schema, data);
    if (!clientResult.valid) {
      return clientResult;
    }

    // Server-side validation for security
    const serverResult = await validateServer(entity, data as Record<string, unknown>);
    if (!serverResult.valid && serverResult.errors) {
      const errors: Record<string, string> = {};
      for (const err of serverResult.errors) {
        errors[err.field] = err.message;
      }
      return { valid: false, errors };
    }

    return { valid: true, data: clientResult.data };
  }, [validateServer]);

  /**
   * Show validation errors as toast
   */
  const showValidationErrors = useCallback((errors: Record<string, string>) => {
    const firstError = Object.values(errors)[0];
    toast({
      variant: 'destructive',
      title: i18next.t('common.error'),
      description: firstError,
    });
  }, [toast]);

  return {
    schemas,
    validateClient,
    validateServer,
    validateFull,
    showValidationErrors,
  };
}

export default useDataValidation;
