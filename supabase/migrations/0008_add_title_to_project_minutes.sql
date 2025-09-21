-- Agregar campo título a la tabla project_minutes
ALTER TABLE project_minutes
ADD COLUMN title TEXT;

-- Crear índice para optimizar búsquedas por título
CREATE INDEX idx_project_minutes_title ON project_minutes(project_id, title) WHERE title IS NOT NULL;

-- Actualizar minutas existentes para tener un título por defecto basado en la fecha
UPDATE project_minutes
SET title = 'Reunión ' || TO_CHAR(meeting_date, 'DD/MM/YYYY')
WHERE title IS NULL;