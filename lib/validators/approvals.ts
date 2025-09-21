import { z } from 'zod';

export const respondApprovalSchema = z.object({
  approvalId: z.string().uuid(),
  status: z.enum(['approved', 'changes_requested']),
  feedback: z.string().optional()
});

export type RespondApprovalInput = z.infer<typeof respondApprovalSchema>;
