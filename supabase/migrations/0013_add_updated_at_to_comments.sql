-- Add updated_at column to comments table for edit functionality
ALTER TABLE comments
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create trigger to automatically update updated_at on row changes
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Set initial values for existing comments (same as created_at)
UPDATE comments SET updated_at = created_at WHERE updated_at IS NULL;

-- Update the provider_project_detail function to include updated_at in comments
CREATE OR REPLACE FUNCTION provider_project_detail(project_id_input uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', p.id,
    'title', p.title,
    'description', p.description,
    'status', p.status,
    'client_name', c.name,
    'deadline', p.deadline,
    'start_date', p.start_date,
    'end_date', p.end_date,
    'progress', coalesce((
      SELECT avg(case when s.status = 'done' then 100 else 0 end) FROM stages s WHERE s.project_id = p.id
    ), 0),
    'stages', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', s.id,
        'title', s.title,
        'description', s.description,
        'order', s."order",
        'type', s.type,
        'status', s.status,
        'planned_start', s.planned_start,
        'planned_end', s.planned_end,
        'deadline', s.deadline,
        'completion_at', s.completion_at,
        'owner', s.owner,
        'project_id', s.project_id,
        'components', (
          SELECT coalesce(jsonb_agg(jsonb_build_object(
            'id', sc.id,
            'stage_id', sc.stage_id,
            'component_type', sc.component_type,
            'config', sc.config,
            'status', sc.status,
            'metadata', sc.metadata,
            'title', COALESCE(sc.metadata->>'title', NULL)
          ) ORDER BY sc.created_at), '[]'::jsonb)
          FROM stage_components sc WHERE sc.stage_id = s.id
        )
      ) ORDER BY s."order"), '[]'::jsonb)
      FROM stages s WHERE s.project_id = p.id
    ),
    'members', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'email', pm.email,
        'role', pm.role,
        'invited_at', pm.invited_at,
        'accepted_at', pm.accepted_at
      ) ORDER BY pm.created_at), '[]'::jsonb)
      FROM project_members pm WHERE pm.project_id = p.id
    ),
    'files', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', f.id,
        'project_id', f.project_id,
        'stage_id', f.stage_id,
        'uploader_type', f.uploader_type,
        'storage_path', f.storage_path,
        'file_name', f.file_name,
        'mime', f.mime,
        'size', f.size,
        'uploaded_at', f.uploaded_at
      ) ORDER BY f.uploaded_at DESC), '[]'::jsonb)
      FROM files f WHERE f.project_id = p.id
    ),
    'comments', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', cmt.id,
        'project_id', cmt.project_id,
        'stage_id', cmt.stage_id,
        'component_id', cmt.component_id,
        'author_type', cmt.author_type,
        'body', cmt.body,
        'created_at', cmt.created_at,
        'updated_at', cmt.updated_at,
        'mentions', cmt.mentions,
        'created_by', cmt.created_by
      ) ORDER BY cmt.created_at DESC), '[]'::jsonb)
      FROM comments cmt WHERE cmt.project_id = p.id
    ),
    'approvals', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', ap.id,
        'stage_id', ap.stage_id,
        'component_id', ap.component_id,
        'requested_by', ap.requested_by,
        'requested_at', ap.requested_at,
        'approved_by', ap.approved_by,
        'approved_at', ap.approved_at,
        'status', ap.status
      ) ORDER BY ap.requested_at DESC), '[]'::jsonb)
      FROM approvals ap WHERE ap.project_id = p.id
    ),
    'activity', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', al.id,
        'project_id', al.project_id,
        'actor_type', al.actor_type,
        'action', al.action,
        'details', al.details,
        'created_at', al.created_at
      ) ORDER BY al.created_at DESC), '[]'::jsonb)
      FROM activity_log al WHERE al.project_id = p.id
    )
  ) INTO result
  FROM projects p
  LEFT JOIN clients c ON c.id = p.client_id
  WHERE p.id = project_id_input;

  RETURN result;
END;
$$;

-- Add update policy for comments to allow clients to edit their own comments
CREATE POLICY client_update_own_comments ON comments
  FOR UPDATE
  USING (
    is_client() AND
    author_type = 'client' AND
    created_by::text = (auth.jwt()->>'sub') AND
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = comments.project_id
        AND lower(pm.email) = lower(jwt_email())
    )
  )
  WITH CHECK (
    is_client() AND
    author_type = 'client' AND
    created_by::text = (auth.jwt()->>'sub')
  );