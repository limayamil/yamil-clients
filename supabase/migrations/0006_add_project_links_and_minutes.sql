-- Crear tabla para links de interés del proyecto
CREATE TABLE project_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla para minutas del proyecto
CREATE TABLE project_minutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    meeting_date DATE NOT NULL,
    content_markdown TEXT NOT NULL DEFAULT '',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para mejorar performance
CREATE INDEX idx_project_links_project_id ON project_links(project_id);
CREATE INDEX idx_project_minutes_project_id ON project_minutes(project_id);
CREATE INDEX idx_project_minutes_meeting_date ON project_minutes(project_id, meeting_date);

-- Habilitar RLS en las nuevas tablas
ALTER TABLE project_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_minutes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para project_links
CREATE POLICY "Project links are viewable by project members" ON project_links
    FOR SELECT USING (
        project_id IN (
            SELECT p.id FROM projects p
            LEFT JOIN clients c ON p.client_id = c.id
            WHERE p.organization_id = (
                SELECT organization_id FROM clients
                WHERE email = auth.jwt() ->> 'email'
            )
            OR c.email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Project links are manageable by providers" ON project_links
    FOR ALL USING (is_provider());

-- Políticas RLS para project_minutes
CREATE POLICY "Project minutes are viewable by project members" ON project_minutes
    FOR SELECT USING (
        project_id IN (
            SELECT p.id FROM projects p
            LEFT JOIN clients c ON p.client_id = c.id
            WHERE p.organization_id = (
                SELECT organization_id FROM clients
                WHERE email = auth.jwt() ->> 'email'
            )
            OR c.email = auth.jwt() ->> 'email'
        )
    );

CREATE POLICY "Project minutes are manageable by providers" ON project_minutes
    FOR ALL USING (is_provider());

-- Función para actualizar updated_at en project_minutes
CREATE OR REPLACE FUNCTION update_project_minutes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_minutes_updated_at
    BEFORE UPDATE ON project_minutes
    FOR EACH ROW
    EXECUTE FUNCTION update_project_minutes_updated_at();