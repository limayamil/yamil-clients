import { z } from 'zod';

export const addProjectMemberSchema = z.object({
  projectId: z.string().uuid('ID del proyecto debe ser un UUID válido'),
  email: z.string().email('Debe ser un email válido'),
  role: z.enum(['client_viewer', 'client_editor'], {
    errorMap: () => ({ message: 'El rol debe ser client_viewer o client_editor' })
  }).default('client_viewer')
});

export const removeProjectMemberSchema = z.object({
  projectId: z.string().uuid('ID del proyecto debe ser un UUID válido'),
  email: z.string().email('Debe ser un email válido')
});

export const updateProjectMemberRoleSchema = z.object({
  projectId: z.string().uuid('ID del proyecto debe ser un UUID válido'),
  email: z.string().email('Debe ser un email válido'),
  role: z.enum(['client_viewer', 'client_editor'], {
    errorMap: () => ({ message: 'El rol debe ser client_viewer o client_editor' })
  })
});

export type AddProjectMemberData = z.infer<typeof addProjectMemberSchema>;
export type RemoveProjectMemberData = z.infer<typeof removeProjectMemberSchema>;
export type UpdateProjectMemberRoleData = z.infer<typeof updateProjectMemberRoleSchema>;