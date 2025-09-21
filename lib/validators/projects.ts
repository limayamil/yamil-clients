import { z } from 'zod';

export const updateProjectBasicInfoSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1, 'El título es requerido').max(200, 'El título es demasiado largo'),
  description: z.string().max(1000, 'La descripción es demasiado larga').optional()
});

export const updateProjectDatesSchema = z.object({
  projectId: z.string().uuid(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  deadline: z.string().optional()
});

export const updateProjectStatusSchema = z.object({
  projectId: z.string().uuid(),
  status: z.enum(['planned', 'in_progress', 'on_hold', 'done', 'archived'])
});

export const updateProjectBudgetSchema = z.object({
  projectId: z.string().uuid(),
  budget: z.number().positive('El presupuesto debe ser positivo').optional()
});

export const updateProjectStageSchema = z.object({
  projectId: z.string().uuid(),
  currentStageId: z.string().transform((val) => val === '' ? undefined : val).pipe(z.string().uuid().optional())
});

export const addProjectMemberSchema = z.object({
  projectId: z.string().uuid(),
  email: z.string().email('Email inválido'),
  role: z.enum(['client_viewer', 'client_editor'])
});

export const removeProjectMemberSchema = z.object({
  projectId: z.string().uuid(),
  email: z.string().email('Email inválido')
});

export const updateProjectMemberRoleSchema = z.object({
  projectId: z.string().uuid(),
  email: z.string().email('Email inválido'),
  role: z.enum(['client_viewer', 'client_editor'])
});