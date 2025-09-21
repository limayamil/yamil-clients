import { z } from 'zod';

// Helper to handle projectId that might come as string or array from FormData
const projectIdSchema = z.union([z.string(), z.array(z.string())]).transform((val) =>
  Array.isArray(val) ? val[0] : val
).pipe(z.string().uuid());

export const requestMaterialsSchema = z.object({
  projectId: projectIdSchema
});

export const requestApprovalSchema = z.object({
  projectId: projectIdSchema,
  stageId: z.string().uuid().optional()
});

export const completeStageSchema = z.object({
  stageId: z.string().uuid(),
  projectId: projectIdSchema
});

export const addStageComponentSchema = z.object({
  stageId: z.string().uuid(),
  projectId: projectIdSchema,
  componentType: z.enum([
    'upload_request',
    'checklist',
    'prototype',
    'approval',
    'text_block',
    'form',
    'link',
    'milestone',
    'tasklist'
  ]),
  config: z.string().transform((str, ctx) => {
    try {
      return JSON.parse(str);
    } catch (e) {
      ctx.addIssue({ code: 'custom', message: 'Config debe ser un JSON válido' });
      return z.NEVER;
    }
  }).pipe(z.record(z.unknown())).default('{}')
});

export const updateStageComponentSchema = z.object({
  componentId: z.string().uuid(),
  projectId: projectIdSchema,
  config: z.string().transform((str, ctx) => {
    try {
      return JSON.parse(str);
    } catch (e) {
      ctx.addIssue({ code: 'custom', message: 'Config debe ser un JSON válido' });
      return z.NEVER;
    }
  }).pipe(z.record(z.unknown())).optional(),
  status: z.enum(['todo', 'waiting_client', 'in_review', 'approved', 'blocked', 'done']).optional()
});

export const deleteStageComponentSchema = z.object({
  componentId: z.string().uuid(),
  projectId: projectIdSchema
});

export const updateStageSchema = z.object({
  stageId: z.string().uuid(),
  projectId: projectIdSchema,
  status: z.enum(['todo', 'waiting_client', 'in_review', 'approved', 'blocked', 'done']).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  planned_start: z.string().datetime().optional(),
  planned_end: z.string().datetime().optional(),
  deadline: z.string().datetime().optional()
});
