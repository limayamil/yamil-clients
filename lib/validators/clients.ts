import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100, 'El nombre no puede exceder 100 caracteres'),
  email: z.string().email('Debe ser un email válido'),
  company: z.string().max(100, 'La empresa no puede exceder 100 caracteres').optional(),
  phone: z.string().max(20, 'El teléfono no puede exceder 20 caracteres').optional(),
  active: z.boolean().default(true)
});

export const updateClientSchema = createClientSchema.partial().extend({
  id: z.string().uuid('ID de cliente inválido')
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;