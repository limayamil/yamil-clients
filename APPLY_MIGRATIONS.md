# Aplicar Migraciones para Corregir Vinculación de Cliente

## Problema Resuelto
Cliente `luma.desarrollo@gmail.com` no puede ver el proyecto "Web Pablo Besson" porque falta la entrada en `project_members`.

## Migraciones Creadas

### 1. `0023_fix_missing_project_member_web_pablo_besson.sql`
Corrige el problema específico insertando la entrada faltante en `project_members`.

### 2. `0024_auto_sync_client_id_to_project_members.sql`
Crea un trigger automático para prevenir este problema en el futuro + backfill de cualquier otro proyecto afectado.

## Cómo Aplicar las Migraciones

### Opción 1: Supabase Dashboard (Recomendado)

1. Ir a https://supabase.com/dashboard/project/YOUR_PROJECT_ID/editor
2. Abrir el **SQL Editor**
3. Copiar y pegar el contenido de `supabase/migrations/0023_fix_missing_project_member_web_pablo_besson.sql`
4. Ejecutar (Run)
5. Copiar y pegar el contenido de `supabase/migrations/0024_auto_sync_client_id_to_project_members.sql`
6. Ejecutar (Run)

### Opción 2: Supabase CLI

Si tienes el CLI de Supabase instalado:

```bash
# Aplicar todas las migraciones pendientes
supabase db push

# O aplicar manualmente
supabase db execute -f supabase/migrations/0023_fix_missing_project_member_web_pablo_besson.sql
supabase db execute -f supabase/migrations/0024_auto_sync_client_id_to_project_members.sql
```

### Opción 3: Comando SQL Directo (Más Rápido)

Si prefieres ejecutar directamente en el SQL Editor:

```sql
-- PASO 1: Corregir el proyecto "Web Pablo Besson"
INSERT INTO project_members (project_id, email, role, invited_at, accepted_at)
VALUES (
  'f7cd80cf-4abd-4478-a1eb-9927ee7c126b',
  'luma.desarrollo@gmail.com',
  'client_viewer',
  NOW(),
  NOW()
)
ON CONFLICT (project_id, email) DO NOTHING;

-- Verificar
SELECT pm.email, p.title, pm.role
FROM project_members pm
JOIN projects p ON p.id = pm.project_id
WHERE LOWER(pm.email) = 'luma.desarrollo@gmail.com';
```

## Verificación

Después de aplicar las migraciones:

1. **Login como cliente**: Ingresar con `luma.desarrollo@gmail.com`
2. **Navegar a proyectos**: `/c/luma/projects`
3. **Verificar visibilidad**: Deberían aparecer ambos proyectos:
   - "Sitio web institucional de Luma"
   - "Web Pablo Besson" ← **Este es el que faltaba**

## Resultado Esperado

```sql
-- Query de verificación
SELECT pm.id, pm.email, p.title, pm.role, pm.created_at
FROM project_members pm
JOIN projects p ON p.id = pm.project_id
WHERE LOWER(pm.email) = 'luma.desarrollo@gmail.com'
ORDER BY pm.created_at DESC;
```

**Resultado esperado:**
| email | title | role |
|---|---|---|
| luma.desarrollo@gmail.com | Sitio web institucional de Luma | client_viewer |
| luma.desarrollo@gmail.com | Web Pablo Besson | client_viewer |

## Prevención Futura

La migración `0024` crea un trigger que automáticamente:
- ✅ Sincroniza `projects.client_id` → `project_members` cuando se asigna un cliente
- ✅ Hace backfill de cualquier proyecto existente con este problema
- ✅ Previene que vuelva a ocurrir en futuros proyectos

## Notas Técnicas

- **Sistema dual**: El proyecto usa tanto `client_id` (legacy) como `project_members` (moderno)
- **RPCs afectados**: `client_projects_overview` y `client_project_detail` buscan en `project_members`
- **Seguridad**: RLS policies verifican tanto `clients.email` como `project_members.email`
- **Trigger**: `SECURITY DEFINER` para bypass de RLS durante sincronización
