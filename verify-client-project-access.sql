-- Script de Verificación: Acceso de Cliente a Proyectos
-- Ejecutar después de aplicar las migraciones 0023 y 0024
-- Cliente: luma.desarrollo@gmail.com
-- Proyecto: Web Pablo Besson

-- ============================================
-- 1. Verificar entrada en project_members
-- ============================================
SELECT
  '1. Verificación project_members' as test_name,
  CASE
    WHEN COUNT(*) = 2 THEN '✅ PASS - Cliente tiene 2 proyectos'
    WHEN COUNT(*) = 1 THEN '⚠️ WARN - Cliente solo tiene 1 proyecto (debería tener 2)'
    ELSE '❌ FAIL - Cliente no tiene proyectos'
  END as result,
  COUNT(*) as project_count
FROM project_members
WHERE LOWER(email) = 'luma.desarrollo@gmail.com';

-- ============================================
-- 2. Listar todos los proyectos del cliente
-- ============================================
SELECT
  '2. Proyectos asignados' as test_name,
  p.title,
  p.status,
  pm.role,
  pm.created_at as member_since
FROM project_members pm
JOIN projects p ON p.id = pm.project_id
WHERE LOWER(pm.email) = 'luma.desarrollo@gmail.com'
ORDER BY pm.created_at DESC;

-- ============================================
-- 3. Verificar proyecto específico "Web Pablo Besson"
-- ============================================
SELECT
  '3. Verificar Web Pablo Besson' as test_name,
  CASE
    WHEN COUNT(*) = 1 THEN '✅ PASS - Proyecto vinculado correctamente'
    ELSE '❌ FAIL - Proyecto NO vinculado'
  END as result,
  MAX(p.title) as project_title,
  MAX(pm.role) as client_role
FROM project_members pm
JOIN projects p ON p.id = pm.project_id
WHERE pm.project_id = 'f7cd80cf-4abd-4478-a1eb-9927ee7c126b'
  AND LOWER(pm.email) = 'luma.desarrollo@gmail.com';

-- ============================================
-- 4. Verificar trigger existe
-- ============================================
SELECT
  '4. Verificar trigger instalado' as test_name,
  CASE
    WHEN COUNT(*) = 1 THEN '✅ PASS - Trigger instalado'
    ELSE '❌ FAIL - Trigger NO instalado'
  END as result,
  MAX(trigger_name) as trigger_name
FROM information_schema.triggers
WHERE trigger_name = 'trigger_sync_project_client_members'
  AND event_object_table = 'projects';

-- ============================================
-- 5. Verificar función del trigger existe
-- ============================================
SELECT
  '5. Verificar función de trigger' as test_name,
  CASE
    WHEN COUNT(*) = 1 THEN '✅ PASS - Función creada'
    ELSE '❌ FAIL - Función NO creada'
  END as result,
  MAX(routine_name) as function_name
FROM information_schema.routines
WHERE routine_name = 'sync_project_client_to_members'
  AND routine_schema = 'public';

-- ============================================
-- 6. Buscar proyectos con problemas similares (audit)
-- ============================================
SELECT
  '6. Audit: Proyectos con problemas similares' as test_name,
  COUNT(*) as affected_projects,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ PASS - No hay otros proyectos con este problema'
    ELSE '⚠️ WARN - Hay proyectos adicionales que necesitan corrección'
  END as result
FROM projects p
LEFT JOIN clients c ON c.id = p.client_id
LEFT JOIN project_members pm ON pm.project_id = p.id AND LOWER(pm.email) = LOWER(c.email)
WHERE p.client_id IS NOT NULL
  AND pm.id IS NULL;

-- ============================================
-- 7. Listar proyectos afectados (si los hay)
-- ============================================
SELECT
  '7. Lista de proyectos afectados' as info,
  p.id as project_id,
  p.title as project_title,
  c.email as client_email,
  'MISSING in project_members' as issue
FROM projects p
JOIN clients c ON c.id = p.client_id
LEFT JOIN project_members pm ON pm.project_id = p.id AND LOWER(pm.email) = LOWER(c.email)
WHERE p.client_id IS NOT NULL
  AND pm.id IS NULL;

-- ============================================
-- 8. Test RPC: client_projects_overview
-- ============================================
-- Este RPC es el que usa la app para listar proyectos del cliente
SELECT
  '8. Test RPC client_projects_overview' as test_name,
  COUNT(*) as projects_returned,
  CASE
    WHEN COUNT(*) >= 2 THEN '✅ PASS - RPC retorna proyectos correctamente'
    WHEN COUNT(*) = 1 THEN '⚠️ WARN - RPC retorna solo 1 proyecto'
    ELSE '❌ FAIL - RPC no retorna proyectos'
  END as result
FROM client_projects_overview('luma.desarrollo@gmail.com');

-- ============================================
-- 9. Listar proyectos retornados por RPC
-- ============================================
SELECT
  '9. Proyectos retornados por RPC' as info,
  id,
  title,
  status,
  pending_items,
  progress
FROM client_projects_overview('luma.desarrollo@gmail.com')
ORDER BY title;

-- ============================================
-- 10. Test RPC: client_project_detail
-- ============================================
SELECT
  '10. Test RPC client_project_detail' as test_name,
  CASE
    WHEN (client_project_detail('f7cd80cf-4abd-4478-a1eb-9927ee7c126b', 'luma.desarrollo@gmail.com')->>'id') IS NOT NULL
      THEN '✅ PASS - Cliente puede acceder al proyecto Web Pablo Besson'
    ELSE '❌ FAIL - Cliente NO puede acceder al proyecto'
  END as result;

-- ============================================
-- RESUMEN DE VERIFICACIÓN
-- ============================================
SELECT
  '═══════════════════════════════════════' as separator,
  'RESUMEN DE VERIFICACIÓN' as title,
  '═══════════════════════════════════════' as separator2;

-- Conteo final
SELECT
  'Total de proyectos en project_members' as metric,
  COUNT(*) as value,
  CASE
    WHEN COUNT(*) >= 2 THEN '✅'
    ELSE '❌'
  END as status
FROM project_members
WHERE LOWER(email) = 'luma.desarrollo@gmail.com'

UNION ALL

SELECT
  'Proyectos retornados por RPC',
  COUNT(*),
  CASE
    WHEN COUNT(*) >= 2 THEN '✅'
    ELSE '❌'
  END
FROM client_projects_overview('luma.desarrollo@gmail.com')

UNION ALL

SELECT
  'Proyectos con problemas similares',
  COUNT(*),
  CASE
    WHEN COUNT(*) = 0 THEN '✅'
    ELSE '⚠️'
  END
FROM projects p
LEFT JOIN clients c ON c.id = p.client_id
LEFT JOIN project_members pm ON pm.project_id = p.id AND LOWER(pm.email) = LOWER(c.email)
WHERE p.client_id IS NOT NULL
  AND pm.id IS NULL;

-- ============================================
-- NOTA FINAL
-- ============================================
SELECT
  '═══════════════════════════════════════' as separator,
  'Si todos los tests muestran ✅ PASS, el problema está resuelto' as note,
  'El cliente luma.desarrollo@gmail.com debería poder ver ambos proyectos' as note2;
