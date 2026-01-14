import { z } from 'zod';

// Password validation: min 10 chars, uppercase, lowercase, number, special char
export const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
  .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos um caractere especial');

export const emailSchema = z
  .string()
  .trim()
  .email('Email inválido')
  .max(255, 'Email deve ter no máximo 255 caracteres');

export const nameSchema = z
  .string()
  .trim()
  .min(2, 'Nome deve ter no mínimo 2 caracteres')
  .max(100, 'Nome deve ter no máximo 100 caracteres');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;

// Password strength indicator
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  if (score <= 2) return { score, label: 'Fraca', color: 'bg-destructive' };
  if (score <= 4) return { score, label: 'Média', color: 'bg-warning' };
  return { score, label: 'Forte', color: 'bg-success' };
}
