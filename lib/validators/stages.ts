import { z } from 'zod';
import { validateRichTextContent, htmlToText } from '@/lib/utils/rich-text';

// Helper to handle projectId that might come as string or array from FormData
const projectIdSchema = z.union([z.string(), z.array(z.string())]).transform((val) =>
  Array.isArray(val) ? val[0] : val
).pipe(z.string().uuid());

// Schema helper para validar contenido de texto enriquecido
const richTextSchema = (maxLength: number = 5000) => z.string()
  .max(maxLength * 2, `El contenido HTML es muy largo`) // HTML puede ser hasta 2x más largo que el texto
  .refine((content) => {
    if (!content) return true;
    const validation = validateRichTextContent(content, maxLength);
    return validation.isValid;
  }, (content) => {
    const validation = validateRichTextContent(content, 5000);
    return { message: validation.error || 'Contenido inválido' };
  });

// Schema helper para texto plano simple
const simpleTextSchema = (maxLength: number = 1000) => z.string()
  .max(maxLength, `El texto no puede exceder ${maxLength} caracteres`);

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
  title: z.string().max(200, 'El título es muy largo').optional(),
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
  title: z.string().max(200, 'El título es muy largo').optional(),
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

export const createStageSchema = z.object({
  projectId: projectIdSchema,
  title: z.string().min(1, 'El título es requerido').max(200, 'El título es muy largo'),
  description: z.string().optional(),
  type: z.enum(['intake', 'materials', 'design', 'development', 'review', 'handoff', 'custom']).default('custom'),
  status: z.enum(['todo', 'waiting_client', 'in_review', 'approved', 'blocked', 'done']).default('todo'),
  planned_start: z.string().transform((val) => val || null).pipe(z.string().datetime().nullable()).optional(),
  planned_end: z.string().transform((val) => val || null).pipe(z.string().datetime().nullable()).optional(),
  deadline: z.string().transform((val) => val || null).pipe(z.string().datetime().nullable()).optional(),
  owner: z.enum(['provider', 'client']).default('provider'),
  insertAfterStageId: z.string().uuid().optional()
});

export const deleteStageSchema = z.object({
  stageId: z.string().uuid(),
  projectId: projectIdSchema,
  confirmDeletion: z.boolean().refine((val) => val === true, {
    message: 'Debe confirmar la eliminación'
  })
});

export const reorderStagesSchema = z.object({
  projectId: projectIdSchema,
  stageIds: z.array(z.string().uuid()).min(1, 'Debe proporcionar al menos un ID de etapa')
});

// Esquemas específicos para componentes con texto enriquecido
export const updateTextBlockSchema = z.object({
  componentId: z.string().uuid(),
  projectId: projectIdSchema,
  title: simpleTextSchema(200).optional(),
  content: richTextSchema(5000).optional()
});

export const updateUploadRequestSchema = z.object({
  componentId: z.string().uuid(),
  projectId: projectIdSchema,
  title: simpleTextSchema(200).optional(),
  description: richTextSchema(3000).optional(),
  instructions: simpleTextSchema(500).optional()
});

export const updateApprovalSchema = z.object({
  componentId: z.string().uuid(),
  projectId: projectIdSchema,
  title: simpleTextSchema(200).optional(),
  instructions: richTextSchema(3000).optional()
});

export const updateMilestoneSchema = z.object({
  componentId: z.string().uuid(),
  projectId: projectIdSchema,
  title: simpleTextSchema(200).optional(),
  description: richTextSchema(2000).optional()
});

export const updatePrototypeSchema = z.object({
  componentId: z.string().uuid(),
  projectId: projectIdSchema,
  title: simpleTextSchema(200).optional(),
  description: richTextSchema(2000).optional(),
  url: z.string().url('URL inválida').optional()
});

export const updateChecklistSchema = z.object({
  componentId: z.string().uuid(),
  projectId: projectIdSchema,
  title: simpleTextSchema(200).optional(),
  items: z.array(richTextSchema(500)).optional()
});
