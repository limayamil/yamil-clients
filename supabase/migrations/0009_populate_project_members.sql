-- Migration: Populate project_members from existing projects.client_id
-- This migration ensures backward compatibility by copying existing client assignments

-- First, insert all clients from projects.client_id into project_members
-- Only insert if the client_id is not null and there's a corresponding client record
INSERT INTO project_members (project_id, email, role, invited_at, accepted_at)
SELECT
    p.id as project_id,
    c.email,
    'client_viewer' as role,  -- Default role for existing clients
    p.created_at as invited_at,
    p.created_at as accepted_at  -- Assume existing clients are already "accepted"
FROM projects p
INNER JOIN clients c ON c.id = p.client_id
WHERE p.client_id IS NOT NULL
  AND NOT EXISTS (
    -- Avoid duplicates if this migration runs multiple times
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = p.id
    AND lower(pm.email) = lower(c.email)
  );

-- Add a comment to track this migration
COMMENT ON TABLE project_members IS 'Project members table - populated from projects.client_id on 2025-01-21';