-- Migration: Fix Provider Project Access for JWT Authentication
-- This migration updates RLS functions to work with the new custom JWT system
-- and allows providers to see all projects (not just the ones they created)

-- 1. Update is_provider() function for custom JWT structure
-- The custom JWT stores role directly in the payload, not in user_metadata
CREATE OR REPLACE FUNCTION public.is_provider()
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  -- Custom JWT stores role directly in payload
  select coalesce(auth.jwt() ->> 'role', '') = 'provider';
$function$;

-- 2. Update is_client() function for consistency
CREATE OR REPLACE FUNCTION public.is_client()
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  -- Custom JWT stores role directly in payload
  select coalesce(auth.jwt() ->> 'role', '') = 'client';
$function$;

-- 3. Update provider_dashboard_projects() to show ALL projects to providers
-- Remove the provider_id parameter since providers should see everything
CREATE OR REPLACE FUNCTION provider_dashboard_projects()
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
  waiting_on_client boolean,
  members jsonb,
  files jsonb,
  comments jsonb,
  approvals jsonb,
  activity jsonb
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
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', s.id,
          'title', s.title,
          'status', s.status,
          'order', s."order"
        )
        order by s."order"
      ) filter (where s.id is not null),
      '[]'::jsonb
    ) as stages,
    coalesce(p.deadline < current_date and p.status != 'done', false) as overdue,
    coalesce(bool_or(s.status = 'waiting_client'), false) as waiting_on_client,
    -- Add additional fields for compatibility
    '[]'::jsonb as members,
    '[]'::jsonb as files,
    '[]'::jsonb as comments,
    '[]'::jsonb as approvals,
    '[]'::jsonb as activity
  from projects p
  left join clients c on c.id = p.client_id
  left join stages s on s.project_id = p.id
  -- Only show projects if user is a provider (no individual filtering)
  where is_provider()
  group by p.id, c.name, p.title, p.description, p.status, p.deadline, p.start_date, p.end_date;
$$;

-- 4. Add comment for documentation
COMMENT ON FUNCTION provider_dashboard_projects() IS 'Returns all projects for provider dashboard. Providers can see all projects in the system.';

-- 5. Verify the function works by testing it (this will be logged)
-- Note: This is just for verification, the actual function will be called by the application
-- SELECT COUNT(*) as total_projects_for_providers FROM provider_dashboard_projects();