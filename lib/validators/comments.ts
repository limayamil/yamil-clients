import { z } from 'zod';

export const createCommentSchema = z.object({
  projectId: z.string().uuid(),
  stageId: z.string().uuid().optional(),
  componentId: z.string().uuid().optional(),
  body: z.string().min(3)
});

export const updateCommentSchema = z.object({
  projectId: z.string().uuid(),
  commentId: z.string().uuid(),
  body: z.string().min(3)
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
