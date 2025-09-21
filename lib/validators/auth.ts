import { z } from 'zod';

export const passwordSignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const magicLinkSchema = z.object({
  email: z.string().email()
});

export type PasswordSignInInput = z.infer<typeof passwordSignInSchema>;
export type MagicLinkInput = z.infer<typeof magicLinkSchema>;
