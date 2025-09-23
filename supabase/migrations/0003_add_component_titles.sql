-- Add title column to stage_components table
alter table stage_components add column title text;

-- Add an index for better performance on title searches
create index if not exists idx_stage_components_title on stage_components(title);

-- Update existing components with default titles based on component_type
update stage_components set title = case
  when component_type = 'upload_request' then 'Solicitud de Enlaces'
  when component_type = 'checklist' then 'Lista de Verificación'
  when component_type = 'approval' then 'Solicitud de Aprobación'
  when component_type = 'text_block' then 'Nota'
  when component_type = 'link' then 'Enlace'
  when component_type = 'milestone' then 'Hito'
  when component_type = 'tasklist' then 'Lista de Tareas'
  when component_type = 'prototype' then 'Prototipo'
  else 'Componente'
end where title is null;