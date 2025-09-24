# Manual de Gestión de Usuarios - FlowSync

Este manual explica cómo gestionar usuarios en el sistema FlowSync después de la migración al sistema de autenticación personalizado basado en JWT.

## Arquitectura del Sistema

FlowSync utiliza un sistema de autenticación simplificado con dos tipos de usuarios:

- **Provider (Proveedor)**: Puede crear proyectos, gestionar clientes y acceder al dashboard completo
- **Client (Cliente)**: Solo puede ver los proyectos asignados a través de su email

## 1. Agregar Nuevos Usuarios

### Para agregar un Usuario Provider

```sql
-- Conectarse a la base de datos de Supabase y ejecutar:
INSERT INTO simple_users (email, role, name, active)
VALUES ('nuevo.provider@empresa.com', 'provider', 'Nombre del Provider', true);
```

### Para agregar un Usuario Cliente

```sql
-- 1. Primero crear el registro en la tabla de clientes
INSERT INTO clients (name, email, company, phone, active)
VALUES ('Nombre del Cliente', 'cliente@empresa.com', 'Empresa Cliente S.A.', '+54911234567', true);

-- 2. Luego crear el usuario con acceso al sistema
INSERT INTO simple_users (email, role, name, active)
VALUES ('cliente@empresa.com', 'client', 'Nombre del Cliente', true);
```

## 2. Asignar Proyectos a Clientes

### Método 1: Al crear un proyecto (desde el Dashboard)

1. Ingresa al dashboard como provider
2. Haz clic en "Crear Proyecto"
3. Selecciona el cliente de la lista desplegable
4. Completa los datos del proyecto
5. El proyecto se asignará automáticamente al cliente seleccionado

### Método 2: Asignar proyecto existente via SQL

```sql
-- Obtener el ID del cliente
SELECT id, email FROM clients WHERE email = 'cliente@empresa.com';

-- Asignar el proyecto al cliente
UPDATE projects
SET client_id = 'CLIENT_ID_AQUI'
WHERE id = 'PROJECT_ID_AQUI';
```

### Método 3: Agregar miembros específicos al proyecto

```sql
-- Para dar acceso granular a usuarios específicos dentro de un proyecto
INSERT INTO project_members (project_id, email, role, name)
VALUES (
    'PROJECT_ID_AQUI',
    'miembro@empresa.com',
    'client_viewer',  -- o 'client_editor'
    'Nombre del Miembro'
);
```

## 3. Tipos de Roles de Proyecto

### Roles de Sistema
- **provider**: Acceso completo al sistema
- **client**: Acceso solo a proyectos asignados

### Roles de Proyecto (project_members)
- **client_viewer**: Solo puede ver el proyecto y sus archivos
- **client_editor**: Puede interactuar con componentes y subir archivos
- **client_admin**: Control total sobre el proyecto (poco usado)

## 4. URLs de Acceso

### Para Providers
```
https://tu-dominio.com/login
-> Redirige a: https://tu-dominio.com/dashboard
```

### Para Clientes
```
https://tu-dominio.com/login
-> Redirige a: https://tu-dominio.com/c/[username]/projects
```

Donde `[username]` es la parte antes del @ del email del cliente.

## 5. Gestión de Usuarios Existentes

### Activar/Desactivar Usuario
```sql
-- Desactivar usuario
UPDATE simple_users SET active = false WHERE email = 'usuario@empresa.com';

-- Activar usuario
UPDATE simple_users SET active = true WHERE email = 'usuario@empresa.com';
```

### Cambiar Rol de Usuario
```sql
-- Cambiar de client a provider
UPDATE simple_users SET role = 'provider' WHERE email = 'usuario@empresa.com';

-- Cambiar de provider a client
UPDATE simple_users SET role = 'client' WHERE email = 'usuario@empresa.com';
```

### Actualizar Información del Usuario
```sql
UPDATE simple_users
SET name = 'Nuevo Nombre', active = true
WHERE email = 'usuario@empresa.com';
```

## 6. Ver Usuarios del Sistema

### Listar todos los usuarios
```sql
SELECT email, role, name, active, created_at
FROM simple_users
ORDER BY created_at DESC;
```

### Ver usuarios activos por rol
```sql
-- Solo providers activos
SELECT * FROM simple_users WHERE role = 'provider' AND active = true;

-- Solo clients activos
SELECT * FROM simple_users WHERE role = 'client' AND active = true;
```

### Ver proyectos asignados a un cliente
```sql
SELECT p.title, p.status, c.name as client_name, c.email as client_email
FROM projects p
JOIN clients c ON p.client_id = c.id
WHERE c.email = 'cliente@empresa.com';
```

## 7. Troubleshooting

### Usuario no puede acceder
1. Verificar que el usuario existe y está activo:
```sql
SELECT * FROM simple_users WHERE email = 'usuario@problema.com';
```

2. Si es cliente, verificar que existe en la tabla clients:
```sql
SELECT * FROM clients WHERE email = 'usuario@problema.com';
```

### Cliente no ve proyectos
1. Verificar asignación de proyectos:
```sql
SELECT p.title, p.status
FROM projects p
JOIN clients c ON p.client_id = c.id
WHERE c.email = 'cliente@empresa.com';
```

2. Verificar membresía específica:
```sql
SELECT * FROM project_members WHERE email = 'cliente@empresa.com';
```

### Limpiar cookies de desarrollo
Si hay problemas de autenticación en desarrollo, limpiar las cookies del navegador o usar:
```
http://localhost:3000/api/dev/clear-rate-limit
```

## 8. Variables de Entorno Necesarias

Asegurarse de que estén configuradas:

```env
# En .env.local (desarrollo)
JWT_SECRET=tu-clave-jwt-super-secreta
NEXT_PUBLIC_SUPABASE_URL=tu-supabase-url
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# En producción (Netlify/Vercel)
JWT_SECRET=clave-jwt-produccion-muy-segura
NEXT_PUBLIC_SUPABASE_URL=tu-supabase-url
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

## 9. Backup de Usuarios

### Exportar todos los usuarios
```sql
SELECT
    email,
    role,
    name,
    active,
    created_at
FROM simple_users
ORDER BY created_at;
```

### Exportar clientes con sus proyectos
```sql
SELECT
    c.email,
    c.name,
    c.company,
    COUNT(p.id) as total_projects,
    STRING_AGG(p.title, ', ') as project_titles
FROM clients c
LEFT JOIN projects p ON c.id = p.client_id
GROUP BY c.id, c.email, c.name, c.company
ORDER BY c.name;
```

---

## Notas Importantes

1. **Seguridad**: Nunca compartir el JWT_SECRET ni el SERVICE_ROLE_KEY
2. **Emails únicos**: Cada email debe ser único en el sistema
3. **Proyectos huérfanos**: Siempre asignar un client_id a los proyectos
4. **Testing**: Probar el acceso de nuevos usuarios en modo incógnito
5. **Logs**: Revisar los logs del servidor si hay problemas de autenticación

Para soporte técnico o dudas específicas, revisar los logs en:
- Desarrollo: Terminal donde corre `npm run dev`
- Producción: Panel de Netlify/Vercel → Functions → Logs