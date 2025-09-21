-- Fix is_provider() function to check correct JWT path
-- The role is stored in user_metadata.role, not at the root level

CREATE OR REPLACE FUNCTION public.is_provider()
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  select coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'provider';
$function$;