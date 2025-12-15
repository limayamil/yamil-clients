-- Migration: Fix missing project_members entry for "Web Pablo Besson"
-- Issue: Client luma.desarrollo@gmail.com has project assigned via client_id
--        but missing entry in project_members table
-- Impact: Client cannot see the project in their dashboard
-- Date: 2025-12-15

-- Insert the missing project_members entry
INSERT INTO project_members (project_id, email, role, invited_at, accepted_at)
VALUES (
  'f7cd80cf-4abd-4478-a1eb-9927ee7c126b',  -- Web Pablo Besson project ID
  'luma.desarrollo@gmail.com',              -- Client email
  'client_viewer',                          -- Role
  NOW(),                                    -- invited_at
  NOW()                                     -- accepted_at (immediately accepted)
)
ON CONFLICT (project_id, email) DO NOTHING;

-- Verify the fix
DO $$
DECLARE
  member_count integer;
BEGIN
  SELECT COUNT(*) INTO member_count
  FROM project_members
  WHERE project_id = 'f7cd80cf-4abd-4478-a1eb-9927ee7c126b'
    AND LOWER(email) = 'luma.desarrollo@gmail.com';

  IF member_count = 0 THEN
    RAISE EXCEPTION 'Failed to insert project_members entry';
  ELSE
    RAISE NOTICE 'Successfully fixed project_members for Web Pablo Besson (% entries)', member_count;
  END IF;
END $$;
