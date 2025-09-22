-- Fix RLS policy issue for log_activity trigger function
-- The trigger function needs to bypass RLS when inserting into activity_log
-- This can be done by making the function SECURITY DEFINER and granting necessary permissions

-- First, make the function run with definer's rights (bypasses RLS)
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
begin
  if tg_table_name = 'files' then
    insert into activity_log(project_id, actor_type, action, details)
    values (new.project_id, new.uploader_type::text::actor_type, 'files.uploaded', jsonb_build_object('file_name', new.file_name));
  elsif tg_table_name = 'comments' then
    insert into activity_log(project_id, actor_type, action, details)
    values (new.project_id, new.author_type::text::actor_type, 'comment.created', jsonb_build_object('comment_id', new.id));
  end if;
  return new;
end;
$function$;