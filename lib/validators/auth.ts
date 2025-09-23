import { z } from 'zod';

export const passwordSignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  rememberMe: z
    .union([z.boolean(), z.string()])
    .transform((value) => {
      if (typeof value === 'boolean') return value;
      return value === 'true' || value === 'on';
    })
    .optional()
    .default(false)
});

export const magicLinkSchema = z.object({
  email: z.string().email()
});

export type PasswordSignInInput = z.infer<typeof passwordSignInSchema>;
export type MagicLinkInput = z.infer<typeof magicLinkSchema>;
