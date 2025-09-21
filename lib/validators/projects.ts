import { z } from 'zod';

// Helper to handle projectId that might come as string or array from FormData
const projectIdSchema = z.union([z.string(), z.array(z.string())]).transform((val) =>
  Array.isArray(val) ? val[0] : val
).pipe(z.string().uuid());

export const updateProjectBasicInfoSchema = z.object({
  projectId: projectIdSchema,
  title: z.string().min(1, 'El título es requerido').max(200, 'El título es demasiado largo'),
  description: z.string().max(1000, 'La descripción es demasiado larga').optional()
});

export const updateProjectDatesSchema = z.object({
  projectId: projectIdSchema,
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  deadline: z.string().optional()
});

export const updateProjectStatusSchema = z.object({
  projectId: projectIdSchema,
  status: z.enum(['planned', 'in_progress', 'on_hold', 'done', 'archived'])
});

export const updateProjectBudgetSchema = z.object({
  projectId: projectIdSchema,
  budget: z.number().positive('El presupuesto debe ser positivo').optional()
});

export const updateProjectStageSchema = z.object({
  projectId: projectIdSchema,
  currentStageId: z.string().transform((val) => val === '' ? undefined : val).pipe(z.string().uuid().optional())
});

export const addProjectMemberSchema = z.object({
  projectId: projectIdSchema,
  email: z.string().email('Email inválido'),
  role: z.enum(['client_viewer', 'client_editor'])
});

export const removeProjectMemberSchema = z.object({
  projectId: projectIdSchema,
  email: z.string().email('Email inválido')
});

export const updateProjectMemberRoleSchema = z.object({
  projectId: projectIdSchema,
  email: z.string().email('Email inválido'),
  role: z.enum(['client_viewer', 'client_editor'])
});