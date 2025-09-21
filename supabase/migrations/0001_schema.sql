create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- Enums
create type project_status as enum ('planned', 'in_progress', 'on_hold', 'done', 'archived');
create type stage_type as enum ('intake', 'materials', 'design', 'development', 'review', 'handoff', 'custom');
create type stage_status as enum ('todo', 'waiting_client', 'in_review', 'approved', 'blocked', 'done');
create type stage_owner as enum ('provider', 'client');
create type component_type as enum (
  'upload_request',
  'checklist',
  'prototype',
  'approval',
  'text_block',
  'form',
  'link',
  'milestone',
  'tasklist'
);
create type assignee_type as enum ('provider', 'client');
create type approval_status as enum ('requested', 'approved', 'changes_requested');
create type member_role as enum ('client_viewer', 'client_editor');
create type notification_type as enum ('material_request', 'comment', 'approval', 'stage_completed', 'deadline');
create type actor_type as enum ('provider', 'client', 'system');

-- Base tables
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  created_at timestamptz not null default now()
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete set null,
  name text not null,
  email citext unique not null,
  company text,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete set null,
  client_id uuid references clients(id) on delete cascade,
  title text not null,
  description text,
  status project_status not null default 'planned',
  start_date date,
  end_date date,
  deadline date,
  budget_amount numeric(12,2),
  visibility_settings jsonb default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  email citext not null,
  role member_role not null default 'client_viewer',
  invited_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (project_id, email)
);

create table if not exists stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  description text,
  "order" integer not null,
  type stage_type not null,
  status stage_status not null default 'todo',
  planned_start date,
  planned_end date,
  deadline date,
  completion_at timestamptz,
  owner stage_owner not null default 'provider',
  created_at timestamptz not null default now()
);

create table if not exists stage_components (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid references stages(id) on delete cascade,
  component_type component_type not null,
  config jsonb not null default '{}'::jsonb,
  status stage_status not null default 'todo',
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid references stages(id) on delete cascade,
  title text not null,
  description text,
  assignee_type assignee_type not null,
  status stage_status not null default 'todo',
  due_date date,
  created_at timestamptz not null default now()
);

create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  stage_id uuid references stages(id) on delete set null,
  uploader_type stage_owner not null,
  storage_path text not null,
  file_name text not null,
  mime text,
  size bigint,
  uploaded_at timestamptz not null default now(),
  created_by uuid
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  stage_id uuid references stages(id) on delete set null,
  component_id uuid references stage_components(id) on delete set null,
  author_type stage_owner not null,
  body text not null,
  created_at timestamptz not null default now(),
  mentions jsonb default '[]'::jsonb,
  created_by uuid
);

create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  stage_id uuid references stages(id) on delete set null,
  component_id uuid references stage_components(id) on delete set null,
  requested_by stage_owner not null,
  requested_at timestamptz not null default now(),
  approved_by uuid,
  approved_at timestamptz,
  status approval_status not null default 'requested'
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_email citext not null,
  project_id uuid references projects(id) on delete cascade,
  type notification_type not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  actor_type actor_type not null,
  action text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  value jsonb not null,
  created_at timestamptz not null default now(),
  unique (key)
);

-- Triggers
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_project_updated_at
before update on projects
for each row
execute function set_updated_at();

-- Utility views
create view project_member_emails as
select pm.project_id, pm.email
from project_members pm;

-- Helper function to check if jwt role is provider
create or replace function is_provider() returns boolean language sql stable as $$
  select coalesce(auth.jwt() ->> 'role', '') = 'provider';
$$;

create or replace function is_client() returns boolean language sql stable as $$
  select coalesce(auth.jwt() ->> 'role', '') = 'client';
$$;

create or replace function jwt_email() returns text language sql stable as $$
  select coalesce(auth.jwt() ->> 'email', auth.jwt() ->> 'sub');
$$;

-- Row Level Security
alter table organizations enable row level security;
alter table clients enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table stages enable row level security;
alter table stage_components enable row level security;
alter table tasks enable row level security;
alter table files enable row level security;
alter table comments enable row level security;
alter table approvals enable row level security;
alter table notifications enable row level security;
alter table activity_log enable row level security;
alter table settings enable row level security;

-- Provider full access policies
create policy provider_full_access_projects on projects
  for all
  using (is_provider())
  with check (is_provider());

create policy provider_full_access_stages on stages for all using (is_provider()) with check (is_provider());
create policy provider_full_access_components on stage_components for all using (is_provider()) with check (is_provider());
create policy provider_full_access_tasks on tasks for all using (is_provider()) with check (is_provider());
create policy provider_full_access_files on files for all using (is_provider()) with check (is_provider());
create policy provider_full_access_comments on comments for all using (is_provider()) with check (is_provider());
create policy provider_full_access_approvals on approvals for all using (is_provider()) with check (is_provider());
create policy provider_full_access_notifications on notifications for select using (is_provider());
create policy provider_full_access_activity on activity_log for all using (is_provider()) with check (is_provider());
create policy provider_full_access_settings on settings for all using (is_provider()) with check (is_provider());
create policy provider_full_access_clients on clients for all using (is_provider()) with check (is_provider());
create policy provider_full_access_members on project_members for all using (is_provider()) with check (is_provider());

-- Client read-only policies
create policy client_read_members on project_members
  for select
  using (
    is_client() and exists (
      select 1 from project_members pm2
      where pm2.project_id = project_members.project_id
        and lower(pm2.email) = lower(jwt_email())
    )
  );

create policy client_read_projects on projects
  for select
  using (
    is_client() and exists (
      select 1 from project_members pm
      where pm.project_id = projects.id
        and lower(pm.email) = lower(jwt_email())
    )
  );

create policy client_read_stages on stages
  for select
  using (
    is_client() and exists (
      select 1 from project_members pm
      where pm.project_id = stages.project_id
        and lower(pm.email) = lower(jwt_email())
    )
  );

create policy client_read_components on stage_components
  for select
  using (
    is_client() and exists (
      select 1 from stages s
      join project_members pm on pm.project_id = s.project_id
      where s.id = stage_components.stage_id
        and lower(pm.email) = lower(jwt_email())
    )
  );

create policy client_update_components on stage_components
  for update
  using (
    is_client() and exists (
      select 1 from stages s
      join project_members pm on pm.project_id = s.project_id
      where s.id = stage_components.stage_id
        and lower(pm.email) = lower(jwt_email())
        and (stage_components.component_type in ('upload_request', 'checklist', 'approval', 'tasklist'))
    )
  )
  with check (true);

create policy client_read_files on files for select using (
  is_client() and exists (
    select 1 from project_members pm
    where pm.project_id = files.project_id
      and lower(pm.email) = lower(jwt_email())
  )
);

create policy client_insert_files on files for insert with check (
  is_client() and exists (
    select 1 from project_members pm
    where pm.project_id = files.project_id
      and lower(pm.email) = lower(jwt_email())
  )
);

create policy client_read_comments on comments for select using (
  is_client() and exists (
    select 1 from project_members pm
    where pm.project_id = comments.project_id
      and lower(pm.email) = lower(jwt_email())
  )
);

create policy client_insert_comments on comments for insert with check (
  is_client() and exists (
    select 1 from project_members pm
    where pm.project_id = comments.project_id
      and lower(pm.email) = lower(jwt_email())
  )
);

create policy client_read_approvals on approvals for select using (
  is_client() and exists (
    select 1 from project_members pm
    where pm.project_id = approvals.project_id
      and lower(pm.email) = lower(jwt_email())
  )
);

create policy client_read_notifications on notifications for select
  using (is_client() and lower(notifications.user_email) = lower(jwt_email()));

create policy client_read_activity on activity_log for select using (
  is_client() and exists (
    select 1 from project_members pm
    where pm.project_id = activity_log.project_id
      and lower(pm.email) = lower(jwt_email())
  )
);

-- Functions for dashboards
create or replace function provider_dashboard_projects(provider_id uuid)
returns table (
  id uuid,
  title text,
  description text,
  status project_status,
  client_name text,
  deadline date,
  start_date date,
  end_date date,
  progress numeric,
  stages jsonb,
  overdue boolean,
  waiting_on_client boolean
) language sql stable as $$
  select
    p.id,
    p.title,
    p.description,
    p.status,
    c.name as client_name,
    p.deadline,
    p.start_date,
    p.end_date,
    coalesce(avg(case when s.status = 'done' then 100 else 0 end), 0) as progress,
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'title', s.title,
        'status', s.status,
        'order', s."order"
      )
      order by s."order"
    ) filter (where s.id is not null) as stages,
    coalesce(p.deadline < current_date and p.status != 'done', false) as overdue,
    bool_or(s.status = 'waiting_client') as waiting_on_client
  from projects p
  left join clients c on c.id = p.client_id
  left join stages s on s.project_id = p.id
  where p.created_by = provider_id or is_provider()
  group by p.id, c.name;
$$;

create or replace function provider_project_detail(project_id_input uuid)
returns jsonb language plpgsql stable as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'id', p.id,
    'title', p.title,
    'description', p.description,
    'status', p.status,
    'client_name', c.name,
    'deadline', p.deadline,
    'start_date', p.start_date,
    'end_date', p.end_date,
    'progress', coalesce((
      select avg(case when s.status = 'done' then 100 else 0 end) from stages s where s.project_id = p.id
    ), 0),
    'stages', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', s.id,
        'title', s.title,
        'description', s.description,
        'order', s."order",
        'type', s.type,
        'status', s.status,
        'planned_start', s.planned_start,
        'planned_end', s.planned_end,
        'deadline', s.deadline,
        'completion_at', s.completion_at,
        'owner', s.owner,
        'components', (
          select coalesce(jsonb_agg(jsonb_build_object(
            'id', sc.id,
            'stage_id', sc.stage_id,
            'component_type', sc.component_type,
            'config', sc.config,
            'status', sc.status,
            'metadata', sc.metadata
          ) order by sc.created_at), '[]'::jsonb)
          from stage_components sc where sc.stage_id = s.id
        )
      ) order by s."order"), '[]'::jsonb)
      from stages s where s.project_id = p.id
    ),
    'members', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'email', pm.email,
        'role', pm.role,
        'invited_at', pm.invited_at,
        'accepted_at', pm.accepted_at
      ) order by pm.created_at), '[]'::jsonb)
      from project_members pm where pm.project_id = p.id
    ),
    'files', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', f.id,
        'project_id', f.project_id,
        'stage_id', f.stage_id,
        'uploader_type', f.uploader_type,
        'storage_path', f.storage_path,
        'file_name', f.file_name,
        'mime', f.mime,
        'size', f.size,
        'uploaded_at', f.uploaded_at
      ) order by f.uploaded_at desc), '[]'::jsonb)
      from files f where f.project_id = p.id
    ),
    'comments', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', cmt.id,
        'project_id', cmt.project_id,
        'stage_id', cmt.stage_id,
        'component_id', cmt.component_id,
        'author_type', cmt.author_type,
        'body', cmt.body,
        'created_at', cmt.created_at,
        'mentions', cmt.mentions
      ) order by cmt.created_at desc), '[]'::jsonb)
      from comments cmt where cmt.project_id = p.id
    ),
    'approvals', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', ap.id,
        'stage_id', ap.stage_id,
        'component_id', ap.component_id,
        'requested_by', ap.requested_by,
        'requested_at', ap.requested_at,
        'approved_by', ap.approved_by,
        'approved_at', ap.approved_at,
        'status', ap.status
      ) order by ap.requested_at desc), '[]'::jsonb)
      from approvals ap where ap.project_id = p.id
    ),
    'activity', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', al.id,
        'project_id', al.project_id,
        'actor_type', al.actor_type,
        'action', al.action,
        'details', al.details,
        'created_at', al.created_at
      ) order by al.created_at desc), '[]'::jsonb)
      from activity_log al where al.project_id = p.id
    )
  ) into result
  from projects p
  left join clients c on c.id = p.client_id
  where p.id = project_id_input;

  return result;
end;
$$;

create or replace function client_projects_overview(client_email text)
returns table (
  id uuid,
  title text,
  status project_status,
  next_action text,
  pending_items integer,
  deadline date,
  progress numeric
) language sql stable as $$
  select
    p.id,
    p.title,
    p.status,
    (
      select string_agg(sc.component_type::text, ', ')
      from stage_components sc
      join stages s2 on s2.id = sc.stage_id
      where s2.project_id = p.id and sc.status != 'done'
    ) as next_action,
    (
      select count(*)
      from stage_components sc
      join stages s2 on s2.id = sc.stage_id
      where s2.project_id = p.id and sc.status != 'done'
    ) as pending_items,
    p.deadline,
    coalesce(avg(case when s.status = 'done' then 100 else 0 end), 0) as progress
  from projects p
  join project_members pm on pm.project_id = p.id
  left join stages s on s.project_id = p.id
  where lower(pm.email) = lower(client_email)
  group by p.id;
$$;

create or replace function client_project_detail(project_id_input uuid, client_email text)
returns jsonb language plpgsql stable as $$
declare
  result jsonb;
begin
  select provider_project_detail(project_id_input)
  into result
  where exists (
    select 1 from project_members pm
    where pm.project_id = project_id_input and lower(pm.email) = lower(client_email)
  );
  return result;
end;
$$;

-- Stage workflow helpers
create or replace function request_materials_for_project(project_id_input uuid)
returns void language plpgsql as $$
begin
  update stages
    set status = 'waiting_client'
  where project_id = project_id_input
    and type = 'materials';

  insert into notifications(user_email, project_id, type, payload)
  select pm.email, project_id_input, 'material_request', jsonb_build_object('projectId', project_id_input)
  from project_members pm
  where pm.project_id = project_id_input;
end;
$$;

create or replace function request_stage_approval(project_id_input uuid, stage_id_input uuid)
returns void language plpgsql as $$
begin
  insert into approvals (project_id, stage_id, requested_by, status)
  values (project_id_input, stage_id_input, 'provider', 'requested');

  insert into notifications(user_email, project_id, type, payload)
  select pm.email, project_id_input, 'approval', jsonb_build_object('stageId', stage_id_input)
  from project_members pm
  where pm.project_id = project_id_input;
end;
$$;

create or replace function complete_stage_and_move_next(stage_id_input uuid)
returns void language plpgsql as $$
declare
  project uuid;
  next_stage uuid;
  current_order integer;
begin
  select project_id, "order" into project, current_order from stages where id = stage_id_input;
  update stages set status = 'done', completion_at = now() where id = stage_id_input;
  select id into next_stage from stages where project_id = project and "order" > current_order order by "order" asc limit 1;
  if next_stage is not null then
    update stages set status = 'todo' where id = next_stage;
  else
    update projects set status = 'done', end_date = current_date where id = project;
  end if;
end;
$$;

create or replace function create_project_from_template(
  template_slug text,
  client_id_input uuid,
  title_input text,
  description_input text,
  deadline_input date,
  created_by_input uuid
) returns uuid language plpgsql as $$
declare
  project_id uuid := gen_random_uuid();
  order_index integer := 1;
  template jsonb;
  stage_record jsonb;
  component_record jsonb;
  stage_id uuid;
  stages_array jsonb;
begin
  select value into template from settings where key = template_slug;
  if template is null then
    raise exception 'Template % not found', template_slug;
  end if;

  insert into projects(id, client_id, title, description, deadline, status, created_by)
  values (project_id, client_id_input, title_input, description_input, deadline_input, 'planned', created_by_input);

  stages_array := template -> 'stages';
  for stage_record in select value from jsonb_array_elements(stages_array) as stage(value)
  loop
    stage_id := gen_random_uuid();
    insert into stages(id, project_id, title, description, "order", type, status, planned_start, planned_end, deadline, owner)
    values (
      stage_id,
      project_id,
      stage_record ->> 'title',
      stage_record ->> 'description',
      order_index,
      coalesce((stage_record ->> 'type')::stage_type, 'custom'),
      coalesce((stage_record ->> 'status')::stage_status, 'todo'),
      (stage_record ->> 'planned_start')::date,
      (stage_record ->> 'planned_end')::date,
      (stage_record ->> 'deadline')::date,
      coalesce((stage_record ->> 'owner')::stage_owner, 'provider')
    );
    order_index := order_index + 1;

    if stage_record ? 'components' then
      for component_record in select value from jsonb_array_elements(stage_record -> 'components') as component(value)
      loop
        insert into stage_components(stage_id, component_type, config, status)
        values (
          stage_id,
          coalesce((component_record ->> 'type')::component_type, 'text_block'),
          coalesce(component_record -> 'config', '{}'::jsonb),
          coalesce((component_record ->> 'status')::stage_status, 'todo')
        );
      end loop;
    end if;
  end loop;

  return project_id;
end;
$$;

-- Audit trigger convenience
create or replace function log_activity()
returns trigger language plpgsql as $$
begin
  if tg_table_name = 'files' then
    insert into activity_log(project_id, actor_type, action, details)
    values (new.project_id, new.uploader_type, 'files.uploaded', jsonb_build_object('file_name', new.file_name));
  elsif tg_table_name = 'comments' then
    insert into activity_log(project_id, actor_type, action, details)
    values (new.project_id, new.author_type, 'comment.created', jsonb_build_object('comment_id', new.id));
  end if;
  return new;
end;
$$;

create trigger log_file_activity after insert on files for each row execute function log_activity();
create trigger log_comment_activity after insert on comments for each row execute function log_activity();
