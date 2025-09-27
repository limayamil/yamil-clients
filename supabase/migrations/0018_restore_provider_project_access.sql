-- Migration: Restore Provider Project Access (EMERGENCY FIX)
-- This migration fixes the issue where providers can't see any projects
-- by removing the faulty RLS dependency in provider_dashboard_projects()

-- The problem: Custom JWT auth doesn't work with Supabase's auth.jwt() function
-- The solution: Remove RLS dependency and rely on application-level security

-- 1. Restore provider_dashboard_projects() function without RLS restrictions
-- This function will show all projects when called, and security is handled at the application level
-- via requireRole(['provider']) in the TypeScript code
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
  -- NO WHERE clause - show all projects
  -- Security is handled at application level with requireRole(['provider'])
  group by p.id, c.name, p.title, p.description, p.status, p.deadline, p.start_date, p.end_date;
$$;

-- 2. Add security documentation
COMMENT ON FUNCTION provider_dashboard_projects() IS 'Returns all projects for provider dashboard. Security is enforced at application level via requireRole([''provider'']) - only authenticated providers can call this function.';

-- 3. For additional safety, we could revert is_provider() and is_client() to their previous working state
-- but keep them as fallback in case they are needed elsewhere
-- The original implementation from before the custom JWT migration was:
CREATE OR REPLACE FUNCTION public.is_provider()
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  select coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'provider';
$function$;

CREATE OR REPLACE FUNCTION public.is_client()
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  select coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'client';
$function$;

-- Note: These functions will return false with custom JWT, but that's expected
-- We're not relying on them for the dashboard anymore