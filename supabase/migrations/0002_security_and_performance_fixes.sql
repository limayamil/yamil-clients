-- Security and Performance Fixes Migration
-- Addresses critical security vulnerabilities and performance issues

-- 1. Fix Organizations RLS Policies (CRITICAL SECURITY FIX)
-- Currently organizations table has RLS enabled but no policies
DROP POLICY IF EXISTS "Providers can view all organizations" ON organizations;
DROP POLICY IF EXISTS "Providers can manage organizations" ON organizations;

CREATE POLICY "Providers can view all organizations" ON organizations
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'user_metadata' ->> 'role' = 'provider');

CREATE POLICY "Providers can manage organizations" ON organizations
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'user_metadata' ->> 'role' = 'provider');

-- 2. Fix Security Definer View (CRITICAL SECURITY FIX)
-- Replace SECURITY DEFINER with SECURITY INVOKER
DROP VIEW IF EXISTS project_member_emails;

CREATE VIEW project_member_emails
WITH (security_invoker = on) AS
SELECT
  pm.project_id,
  c.email,
  c.name,
  pm.role
FROM project_members pm
JOIN clients c ON c.id = pm.client_id
WHERE pm.active = true;

-- 3. Add Missing Indexes for Performance (HIGH PRIORITY)
-- All foreign keys need indexes for optimal query performance

-- Activity log indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_project_id ON activity_log(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);

-- Approvals indexes
CREATE INDEX IF NOT EXISTS idx_approvals_component_id ON approvals(component_id);
CREATE INDEX IF NOT EXISTS idx_approvals_project_id ON approvals(project_id);
CREATE INDEX IF NOT EXISTS idx_approvals_stage_id ON approvals(stage_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);

-- Clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(active);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_component_id ON comments(component_id);
CREATE INDEX IF NOT EXISTS idx_comments_project_id ON comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_stage_id ON comments(stage_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Files indexes
CREATE INDEX IF NOT EXISTS idx_files_project_id ON files(project_id);
CREATE INDEX IF NOT EXISTS idx_files_stage_id ON files(stage_id);
CREATE INDEX IF NOT EXISTS idx_files_uploader_type ON files(uploader_type);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_project_id ON notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_deadline ON projects(deadline);

-- Project members indexes
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_client_id ON project_members(client_id);
CREATE INDEX IF NOT EXISTS idx_project_members_active ON project_members(active);

-- Stage components indexes
CREATE INDEX IF NOT EXISTS idx_stage_components_stage_id ON stage_components(stage_id);
CREATE INDEX IF NOT EXISTS idx_stage_components_type ON stage_components(type);

-- Stages indexes
CREATE INDEX IF NOT EXISTS idx_stages_project_id ON stages(project_id);
CREATE INDEX IF NOT EXISTS idx_stages_status ON stages(status);
CREATE INDEX IF NOT EXISTS idx_stages_order ON stages("order");

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_stage_id ON tasks(stage_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);

-- 4. Add Unique Constraint for Stage Ordering (DATA INTEGRITY)
-- Prevent duplicate stage ordering within a project
ALTER TABLE stages
DROP CONSTRAINT IF EXISTS unique_stage_order_per_project;

ALTER TABLE stages
ADD CONSTRAINT unique_stage_order_per_project
UNIQUE (project_id, "order");

-- 5. Fix Function Security Issues (HIGH SECURITY PRIORITY)
-- Add immutable search_path to all functions to prevent security vulnerabilities

-- Helper functions
CREATE OR REPLACE FUNCTION is_provider()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT auth.jwt() ->> 'user_metadata' ->> 'role' = 'provider';
$$;

CREATE OR REPLACE FUNCTION is_client()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT auth.jwt() ->> 'user_metadata' ->> 'role' = 'client';
$$;

CREATE OR REPLACE FUNCTION jwt_email()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT auth.jwt() ->> 'email';
$$;

-- Dashboard functions with secure search_path
CREATE OR REPLACE FUNCTION provider_dashboard_projects()
RETURNS TABLE (
  id uuid,
  title text,
  client_name text,
  status project_status,
  deadline timestamptz,
  progress numeric,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    p.id,
    p.title,
    c.name as client_name,
    p.status,
    p.deadline,
    COALESCE(
      (SELECT COUNT(*) FILTER (WHERE s.status = 'done')::numeric / NULLIF(COUNT(*)::numeric, 0) * 100
       FROM stages s WHERE s.project_id = p.id),
      0
    ) as progress,
    p.created_at
  FROM projects p
  LEFT JOIN clients c ON c.id = p.client_id
  WHERE is_provider()
  ORDER BY p.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION client_projects_overview(client_email text)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  status project_status,
  deadline timestamptz,
  progress numeric,
  current_stage text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    p.id,
    p.title,
    p.description,
    p.status,
    p.deadline,
    COALESCE(
      (SELECT COUNT(*) FILTER (WHERE s.status = 'done')::numeric / NULLIF(COUNT(*)::numeric, 0) * 100
       FROM stages s WHERE s.project_id = p.id),
      0
    ) as progress,
    (SELECT s.title FROM stages s WHERE s.project_id = p.id AND s.status != 'done' ORDER BY s.order LIMIT 1) as current_stage,
    p.created_at
  FROM projects p
  JOIN clients c ON c.id = p.client_id
  WHERE c.email = client_email AND (is_client() OR is_provider())
  ORDER BY p.created_at DESC;
$$;

-- Workflow functions with secure search_path
CREATE OR REPLACE FUNCTION complete_stage_and_move_next(stage_id_input uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_stage stages%ROWTYPE;
  next_stage stages%ROWTYPE;
  project_record projects%ROWTYPE;
  result json;
BEGIN
  -- Get current stage
  SELECT * INTO current_stage FROM stages WHERE id = stage_id_input;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Stage not found');
  END IF;

  -- Security check
  IF NOT (is_provider() OR (is_client() AND current_stage.owner = 'client')) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Mark current stage as done
  UPDATE stages SET status = 'done', updated_at = now() WHERE id = stage_id_input;

  -- Get next stage
  SELECT * INTO next_stage
  FROM stages
  WHERE project_id = current_stage.project_id
    AND "order" > current_stage."order"
    AND status = 'todo'
  ORDER BY "order"
  LIMIT 1;

  -- If next stage exists, activate it
  IF FOUND THEN
    UPDATE stages
    SET status = CASE
      WHEN next_stage.owner = 'provider' THEN 'in_review'
      ELSE 'waiting_client'
    END,
    updated_at = now()
    WHERE id = next_stage.id;
  ELSE
    -- No more stages, complete project
    UPDATE projects
    SET status = 'done', updated_at = now()
    WHERE id = current_stage.project_id;
  END IF;

  -- Log activity
  INSERT INTO activity_log (project_id, actor_type, action, details)
  VALUES (
    current_stage.project_id,
    CASE WHEN is_provider() THEN 'provider' ELSE 'client' END,
    'stage_completed',
    json_build_object('stage_id', stage_id_input, 'stage_title', current_stage.title)
  );

  RETURN json_build_object('success', true, 'next_stage_id', next_stage.id);
END;
$$;

CREATE OR REPLACE FUNCTION create_project_from_template(
  template_slug text,
  client_id_input uuid,
  project_title text,
  project_description text DEFAULT NULL,
  project_deadline timestamptz DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_project_id uuid;
  template_data json;
  stage_data json;
  component_data json;
  new_stage_id uuid;
  result json;
BEGIN
  -- Security check
  IF NOT is_provider() THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Get template
  SELECT data INTO template_data
  FROM settings
  WHERE key = 'template.' || template_slug;

  IF template_data IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Template not found');
  END IF;

  -- Create project
  INSERT INTO projects (client_id, title, description, deadline, status)
  VALUES (client_id_input, project_title, project_description, project_deadline, 'planned')
  RETURNING id INTO new_project_id;

  -- Create stages from template
  FOR stage_data IN SELECT * FROM json_array_elements(template_data -> 'stages')
  LOOP
    INSERT INTO stages (
      project_id,
      title,
      description,
      type,
      "order",
      owner,
      status
    )
    VALUES (
      new_project_id,
      stage_data ->> 'title',
      stage_data ->> 'description',
      (stage_data ->> 'type')::stage_type,
      (stage_data ->> 'order')::integer,
      (stage_data ->> 'owner')::stage_owner,
      CASE
        WHEN (stage_data ->> 'order')::integer = 1 THEN 'waiting_client'::stage_status
        ELSE 'todo'::stage_status
      END
    )
    RETURNING id INTO new_stage_id;

    -- Create components for this stage
    IF stage_data ? 'components' THEN
      FOR component_data IN SELECT * FROM json_array_elements(stage_data -> 'components')
      LOOP
        INSERT INTO stage_components (
          stage_id,
          type,
          title,
          description,
          required,
          config
        )
        VALUES (
          new_stage_id,
          (component_data ->> 'type')::component_type,
          component_data ->> 'title',
          component_data ->> 'description',
          COALESCE((component_data ->> 'required')::boolean, false),
          component_data -> 'config'
        );
      END LOOP;
    END IF;
  END LOOP;

  -- Log activity
  INSERT INTO activity_log (project_id, actor_type, action, details)
  VALUES (
    new_project_id,
    'provider',
    'project_created',
    json_build_object('template', template_slug, 'title', project_title)
  );

  RETURN json_build_object('success', true, 'project_id', new_project_id);
END;
$$;

-- 6. Optimize RLS Policies for Better Performance
-- Consolidate overlapping policies to reduce evaluation overhead

-- Example for projects table - consolidate provider policies
DROP POLICY IF EXISTS "Providers can view all projects" ON projects;
DROP POLICY IF EXISTS "Providers can manage all projects" ON projects;

CREATE POLICY "Providers have full access to projects" ON projects
  FOR ALL TO authenticated
  USING (is_provider())
  WITH CHECK (is_provider());

-- Keep client policies separate for security
-- (Existing client policies remain as they handle specific client access patterns)

-- 7. Add Composite Indexes for Common Query Patterns
-- These improve performance for frequently used queries

-- Project dashboard queries
CREATE INDEX IF NOT EXISTS idx_projects_status_deadline ON projects(status, deadline);
CREATE INDEX IF NOT EXISTS idx_projects_client_status ON projects(client_id, status);

-- Stage workflow queries
CREATE INDEX IF NOT EXISTS idx_stages_project_status_order ON stages(project_id, status, "order");

-- Activity log queries
CREATE INDEX IF NOT EXISTS idx_activity_log_project_created_at ON activity_log(project_id, created_at DESC);

-- Comment threads
CREATE INDEX IF NOT EXISTS idx_comments_stage_created_at ON comments(stage_id, created_at);

-- File management
CREATE INDEX IF NOT EXISTS idx_files_project_uploader ON files(project_id, uploader_type);

-- 8. Add Function for Safe Type Casting
-- Replace unsafe (as any) patterns in the codebase
CREATE OR REPLACE FUNCTION safe_json_extract(
  json_data json,
  path text[]
)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
IMMUTABLE
AS $$
  SELECT json_data #>> path;
$$;

COMMENT ON MIGRATION IS 'Security and performance fixes: RLS policies, indexes, function security, data integrity constraints';