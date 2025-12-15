import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/simple-auth';
import { getAllProjectsForAssignment } from '@/lib/queries/provider';

export async function GET() {
  try {
    // Verificar autenticación
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener todos los proyectos
    const projects = await getAllProjectsForAssignment();

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching available projects:', error);
    return NextResponse.json(
      { error: 'Error al obtener proyectos' },
      { status: 500 }
    );
  }
}
