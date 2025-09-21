'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, UserCheck, UserX, Mail } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { addProjectMember, removeProjectMember, updateProjectMemberRole } from '@/actions/project-members';
import type { ProjectMember } from '@/types/project';

interface ProjectMembersManagerProps {
  projectId: string;
  members: ProjectMember[];
}

const roleLabels = {
  client_viewer: 'Visualización',
  client_editor: 'Editor'
};

const roleDescriptions = {
  client_viewer: 'Puede ver el proyecto pero no editarlo',
  client_editor: 'Puede ver y editar elementos del proyecto'
};

export function ProjectMembersManager({ projectId, members }: ProjectMembersManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'client_viewer' | 'client_editor'>('client_viewer');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) {
      toast.error('Por favor ingresa un email válido');
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append('projectId', projectId);
      formData.append('email', newMemberEmail.trim().toLowerCase());
      formData.append('role', newMemberRole);

      const result = await addProjectMember(formData);

      if (result.error) {
        const errorMessage = Object.values(result.error).flat().join(', ');
        toast.error(`Error al agregar miembro: ${errorMessage}`);
      } else {
        toast.success('Miembro agregado exitosamente');
        setNewMemberEmail('');
        setNewMemberRole('client_viewer');
        setShowAddForm(false);
      }
    });
  };

  const handleRemoveMember = async (email: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('projectId', projectId);
      formData.append('email', email);

      const result = await removeProjectMember(formData);

      if (result.error) {
        const errorMessage = Object.values(result.error).flat().join(', ');
        toast.error(`Error al remover miembro: ${errorMessage}`);
      } else {
        toast.success('Miembro removido exitosamente');
      }
    });
  };

  const handleUpdateRole = async (email: string, role: 'client_viewer' | 'client_editor') => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('projectId', projectId);
      formData.append('email', email);
      formData.append('role', role);

      const result = await updateProjectMemberRole(formData);

      if (result.error) {
        const errorMessage = Object.values(result.error).flat().join(', ');
        toast.error(`Error al actualizar rol: ${errorMessage}`);
      } else {
        toast.success('Rol actualizado exitosamente');
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Miembros del Proyecto
            </CardTitle>
            <CardDescription>
              Gestiona quién puede acceder a este proyecto y sus permisos
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Agregar Miembro
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulario para agregar nuevo miembro */}
        {showAddForm && (
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email del Cliente</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="cliente@ejemplo.com"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Rol</Label>
                    <Select value={newMemberRole} onValueChange={(value: 'client_viewer' | 'client_editor') => setNewMemberRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client_viewer">
                          <div className="flex flex-col items-start">
                            <span>Visualización</span>
                            <span className="text-xs text-muted-foreground">Solo puede ver el proyecto</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="client_editor">
                          <div className="flex flex-col items-start">
                            <span>Editor</span>
                            <span className="text-xs text-muted-foreground">Puede ver y editar</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddMember}
                    disabled={isPending || !newMemberEmail.trim()}
                    size="sm"
                  >
                    {isPending ? 'Agregando...' : 'Agregar Miembro'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewMemberEmail('');
                      setNewMemberRole('client_viewer');
                    }}
                    size="sm"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de miembros existentes */}
        <div className="space-y-3">
          {members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserX className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay miembros asignados</p>
              <p className="text-sm">Agrega clientes para que puedan acceder a este proyecto</p>
            </div>
          ) : (
            members.map((member) => (
              <Card key={member.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{member.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={member.role === 'client_editor' ? 'default' : 'secondary'}>
                          {roleLabels[member.role]}
                        </Badge>
                        {member.accepted_at ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            Pendiente
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {roleDescriptions[member.role]}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={member.role}
                      onValueChange={(value: 'client_viewer' | 'client_editor') =>
                        handleUpdateRole(member.email, value)
                      }
                      disabled={isPending}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client_viewer">Visualización</SelectItem>
                        <SelectItem value="client_editor">Editor</SelectItem>
                      </SelectContent>
                    </Select>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>¿Remover miembro?</DialogTitle>
                          <DialogDescription>
                            Esto removerá a <strong>{member.email}</strong> del proyecto.
                            El usuario ya no podrá acceder a este proyecto.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end gap-3 mt-6">
                          <DialogClose asChild>
                            <Button variant="outline">Cancelar</Button>
                          </DialogClose>
                          <DialogClose asChild>
                            <Button
                              onClick={() => handleRemoveMember(member.email)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remover
                            </Button>
                          </DialogClose>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}