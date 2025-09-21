-- Fix circular dependency between projects and project_members RLS policies
-- The issue: projects policy checks project_members, project_members policy checks projects
-- Solution: Use direct client relationship for projects policy instead of project_members

-- Drop the problematic client_read_projects policy
DROP POLICY IF EXISTS "client_read_projects" ON projects;

-- Create a new policy for clients to read projects that doesn't cause circular dependency
-- Instead of checking project_members, directly check if the client owns the project
CREATE POLICY "client_read_projects" ON projects FOR SELECT TO public
USING (
  is_client()
  AND (
    -- Check if the authenticated user is the client for this project
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = projects.client_id
      AND lower(c.email) = lower(jwt_email())
    )
  )
);

-- Also update the project_members policy to be simpler and avoid the circular reference
DROP POLICY IF EXISTS "client_read_members" ON project_members;

-- Create a simplified policy for project_members that doesn't check projects table
CREATE POLICY "client_read_members" ON project_members FOR SELECT TO public
USING (
  is_client()
  AND (
    -- Only allow if the user is directly listed in this project_members record
    lower(email::text) = lower(jwt_email())
  )
);