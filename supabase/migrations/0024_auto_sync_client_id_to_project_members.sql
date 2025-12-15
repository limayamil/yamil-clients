-- Migration: Auto-sync client_id to project_members
-- Purpose: Automatically maintain project_members when client_id is assigned/changed
-- Prevents: Missing project_members entries that cause clients to not see their projects
-- Date: 2025-12-15

-- Create trigger function to sync client_id changes to project_members
CREATE OR REPLACE FUNCTION sync_project_client_to_members()
RETURNS TRIGGER AS $$
BEGIN
  -- When a client_id is assigned or changed
  IF NEW.client_id IS NOT NULL AND (OLD.client_id IS NULL OR OLD.client_id != NEW.client_id) THEN

    -- Insert into project_members if client email exists
    INSERT INTO project_members (project_id, email, role, invited_at, accepted_at)
    SELECT
      NEW.id,           -- project_id
      c.email,          -- email from clients table
      'client_viewer',  -- default role
      NOW(),            -- invited_at
      NOW()             -- accepted_at (auto-accept for direct assignments)
    FROM clients c
    WHERE c.id = NEW.client_id
    ON CONFLICT (project_id, email) DO NOTHING;  -- Avoid duplicates

    RAISE NOTICE 'Synced client_id % to project_members for project %', NEW.client_id, NEW.id;

  -- When a client_id is removed
  ELSIF NEW.client_id IS NULL AND OLD.client_id IS NOT NULL THEN

    -- Optionally remove from project_members (commented out for safety)
    -- DELETE FROM project_members
    -- WHERE project_id = NEW.id
    --   AND email IN (SELECT email FROM clients WHERE id = OLD.client_id);

    RAISE NOTICE 'Client removed from project % (client_id set to NULL)', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on projects table
DROP TRIGGER IF EXISTS trigger_sync_project_client_members ON projects;
CREATE TRIGGER trigger_sync_project_client_members
  AFTER INSERT OR UPDATE OF client_id ON projects
  FOR EACH ROW
  EXECUTE FUNCTION sync_project_client_to_members();

-- Backfill: Fix any existing projects with client_id but missing project_members
DO $$
DECLARE
  fixed_count integer := 0;
  total_count integer := 0;
BEGIN
  -- Count projects that need fixing
  SELECT COUNT(*) INTO total_count
  FROM projects p
  INNER JOIN clients c ON c.id = p.client_id
  WHERE p.client_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = p.id
        AND LOWER(pm.email) = LOWER(c.email)
    );

  -- Fix them
  INSERT INTO project_members (project_id, email, role, invited_at, accepted_at)
  SELECT
    p.id,
    c.email,
    'client_viewer',
    p.created_at,  -- Use project creation time
    p.created_at   -- Auto-accepted
  FROM projects p
  INNER JOIN clients c ON c.id = p.client_id
  WHERE p.client_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = p.id
        AND LOWER(pm.email) = LOWER(c.email)
    )
  ON CONFLICT (project_id, email) DO NOTHING;

  GET DIAGNOSTICS fixed_count = ROW_COUNT;

  RAISE NOTICE 'Backfill complete: Fixed % out of % projects with missing project_members',
    fixed_count, total_count;
END $$;

COMMENT ON FUNCTION sync_project_client_to_members() IS
  'Automatically syncs projects.client_id changes to project_members table';
COMMENT ON TRIGGER trigger_sync_project_client_members ON projects IS
  'Maintains project_members when client_id is assigned or changed';
