-- Add delete policies for clients to delete their own comments and files

-- Allow clients to delete their own comments
create policy client_delete_own_comments on comments for delete using (
  is_client()
  and author_type = 'client'
  and created_by = auth.uid()
  and exists (
    select 1 from project_members pm
    where pm.project_id = comments.project_id
      and lower(pm.email) = lower(jwt_email())
  )
);

-- Allow clients to delete their own files/links
create policy client_delete_own_files on files for delete using (
  is_client()
  and uploader_type = 'client'
  and created_by = auth.uid()
  and exists (
    select 1 from project_members pm
    where pm.project_id = files.project_id
      and lower(pm.email) = lower(jwt_email())
  )
);