insert into organizations (id, name, slug)
values
  ('11111111-1111-1111-1111-111111111111', 'Luma Estudio', 'luma')
on conflict (id) do nothing;

insert into clients (id, organization_id, name, email, company, phone)
values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Carolina Pérez', 'carolina@cliente.com', 'Cliente Demo', '+5491100000000')
on conflict (id) do nothing;

insert into settings (key, value)
values
  ('template.landing', jsonb_build_object(
    'name', 'Landing rápida',
    'stages', jsonb_build_array(
      jsonb_build_object('title', 'Kickoff', 'type', 'intake', 'status', 'done', 'owner', 'provider', 'components', jsonb_build_array(
        jsonb_build_object('type', 'text_block', 'config', jsonb_build_object('content', 'Resumen + objetivos del proyecto'))
      )),
      jsonb_build_object('title', 'Materiales', 'type', 'materials', 'status', 'waiting_client', 'owner', 'client', 'components', jsonb_build_array(
        jsonb_build_object('type', 'upload_request', 'config', jsonb_build_object('description', 'Subí logo, paleta y referencias')), 
        jsonb_build_object('type', 'checklist', 'config', jsonb_build_object('items', jsonb_build_array('Logo vectorial', 'Manual de marca', 'Acceso a hosting')))
      )),
      jsonb_build_object('title', 'Diseño', 'type', 'design', 'status', 'in_review', 'owner', 'provider', 'components', jsonb_build_array(
        jsonb_build_object('type', 'prototype', 'config', jsonb_build_object('url', 'https://www.figma.com', 'description', 'Prototipo navegable')),
        jsonb_build_object('type', 'approval', 'config', jsonb_build_object('instructions', 'Revisá el prototipo y aprobá'))
      )),
      jsonb_build_object('title', 'Implementación', 'type', 'development', 'status', 'todo', 'owner', 'provider', 'components', jsonb_build_array(
        jsonb_build_object('type', 'tasklist', 'config', jsonb_build_object('items', jsonb_build_array('Montaje CMS', 'Integrar analytics', 'QA final')))
      )),
      jsonb_build_object('title', 'Entrega', 'type', 'handoff', 'status', 'todo', 'owner', 'provider', 'components', jsonb_build_array(
        jsonb_build_object('type', 'milestone', 'config', jsonb_build_object('title', 'Entrega final', 'description', 'Sitio publicado + manual de uso'))
      ))
    )
  ))
  on conflict (key) do update set value = excluded.value;

insert into settings (key, value)
values
  ('template.custom', jsonb_build_object(
    'name', 'Proyecto a medida',
    'stages', jsonb_build_array(
      jsonb_build_object('title', 'Descubrimiento', 'type', 'intake', 'status', 'done', 'owner', 'provider', 'components', jsonb_build_array(
        jsonb_build_object('type', 'form', 'config', jsonb_build_object('fields', jsonb_build_array('Objetivos', 'Stakeholders', 'KPIs'))) 
      )),
      jsonb_build_object('title', 'Estrategia', 'type', 'materials', 'status', 'waiting_client', 'owner', 'client', 'components', jsonb_build_array(
        jsonb_build_object('type', 'upload_request', 'config', jsonb_build_object('description', 'Material estratégico, benchmarks, campañas vigentes'))
      )),
      jsonb_build_object('title', 'UX/UI', 'type', 'design', 'status', 'in_review', 'owner', 'provider', 'components', jsonb_build_array(
        jsonb_build_object('type', 'prototype', 'config', jsonb_build_object('url', 'https://www.figma.com', 'description', 'Flujos + pantallas clave')),
        jsonb_build_object('type', 'approval', 'config', jsonb_build_object('instructions', 'Validar flujo completo antes de pasar a dev'))
      )),
      jsonb_build_object('title', 'Desarrollo', 'type', 'development', 'status', 'todo', 'owner', 'provider'),
      jsonb_build_object('title', 'QA + UAT', 'type', 'review', 'status', 'todo', 'owner', 'client', 'components', jsonb_build_array(
        jsonb_build_object('type', 'checklist', 'config', jsonb_build_object('items', jsonb_build_array('Testing funcional', 'Validación contenido', 'Aprobación legal')))
      )),
      jsonb_build_object('title', 'Handoff', 'type', 'handoff', 'status', 'todo', 'owner', 'provider', 'components', jsonb_build_array(
        jsonb_build_object('type', 'milestone', 'config', jsonb_build_object('title', 'Go live', 'description', 'Deploy + capacitación'))
      ))
    )
  ))
  on conflict (key) do update set value = excluded.value;

-- Create demo projects using template (assuming function exists)
select create_project_from_template('template.landing', '22222222-2222-2222-2222-222222222222', 'Luma landing express', 'Sitio one-page orientado a captación', current_date + 21, '33333333-3333-3333-3333-333333333333');
select create_project_from_template('template.custom', '22222222-2222-2222-2222-222222222222', 'Luma proyecto integral', 'Website institucional + onboarding digital', current_date + 60, '33333333-3333-3333-3333-333333333333');

insert into project_members (project_id, email, role, invited_at, accepted_at)
select id, 'carolina@cliente.com', 'client_editor', now(), now()
from projects
where client_id = '22222222-2222-2222-2222-222222222222'
on conflict do nothing;
