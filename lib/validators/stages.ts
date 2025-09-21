import { z } from 'zod';

export const requestMaterialsSchema = z.object({
  projectId: z.string().uuid()
});

export const requestApprovalSchema = z.object({
  projectId: z.string().uuid(),
  stageId: z.string().uuid().optional()
});

export const completeStageSchema = z.object({
  stageId: z.string().uuid(),
  projectId: z.string().uuid()
});

export const addStageComponentSchema = z.object({
  stageId: z.string().uuid(),
  projectId: z.string().uuid(),
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
  projectId: z.string().uuid(),
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
  projectId: z.string().uuid()
});

export const updateStageSchema = z.object({
  stageId: z.string().uuid(),
  projectId: z.string().uuid(),
  status: z.enum(['todo', 'waiting_client', 'in_review', 'approved', 'blocked', 'done']).optional(),
  title: z.string().optional(),
  description: z.string().optional()
});
