-- Fix type casting issue in log_activity trigger function
-- The function was trying to insert stage_owner enum values into actor_type enum column
-- This migration adds proper type casting to resolve the issue

CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS trigger
LANGUAGE plpgsql
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