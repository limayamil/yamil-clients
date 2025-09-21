-- Fix infinite recursion in project_members RLS policy and JWT role checking
-- 1. The client_read_members policy was querying the same table causing infinite recursion
-- 2. Both is_provider() and is_client() functions were checking wrong JWT path for role

-- First, fix the is_client() function to check the correct JWT path
CREATE OR REPLACE FUNCTION public.is_client()
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  select coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'client';
$function$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "client_read_members" ON project_members;

-- Create a new policy that doesn't cause recursion
-- Instead of checking project_members table within the policy,
-- we use the project's client_id to match against the JWT email
CREATE POLICY "client_read_members" ON project_members FOR SELECT TO public
USING (
  is_client()
  AND (
    -- Check if the authenticated user is a client for this project by checking the project's client_id
    EXISTS (
      SELECT 1 FROM projects p
      JOIN clients c ON c.id = p.client_id
      WHERE p.id = project_members.project_id
      AND lower(c.email) = lower(jwt_email())
    )
    OR
    -- Allow if the user is directly listed in this project_members record
    lower(email::text) = lower(jwt_email())
  )
);