-- Corregir políticas RLS para project_links y project_minutes

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Project links are manageable by providers" ON project_links;
DROP POLICY IF EXISTS "Project minutes are manageable by providers" ON project_minutes;

-- Crear políticas corregidas para project_links
CREATE POLICY "Project links are manageable by providers" ON project_links
    FOR ALL USING (is_provider());

-- Crear políticas corregidas para project_minutes
CREATE POLICY "Project minutes are manageable by providers" ON project_minutes
    FOR ALL USING (is_provider());