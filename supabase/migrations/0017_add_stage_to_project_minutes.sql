-- Agregar campo stage_id a la tabla project_minutes para vincular minutas con etapas específicas
ALTER TABLE project_minutes
ADD COLUMN stage_id UUID REFERENCES stages(id) ON DELETE SET NULL;

-- Crear índice para optimizar consultas por etapa
CREATE INDEX idx_project_minutes_stage_id ON project_minutes(project_id, stage_id) WHERE stage_id IS NOT NULL;

-- Crear índice compuesto para consultas que filtren por proyecto y etapa
CREATE INDEX idx_project_minutes_project_stage ON project_minutes(project_id, stage_id, meeting_date);