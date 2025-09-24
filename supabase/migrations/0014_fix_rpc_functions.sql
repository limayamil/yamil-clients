-- Fix both RPC functions to properly return stage_components with title field
-- This addresses the issue where stage components were not showing in provider view
-- and ensures consistent data structure between provider and client views

-- Update provider_project_detail function to use actual title column instead of metadata
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
            'title', sc.title,  -- FIX: Use actual title column instead of metadata->>'title'
            'config', sc.config,
            'status', sc.status,
            'metadata', sc.metadata,
            'created_at', sc.created_at
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

-- Update client_project_detail function to match provider function structure
-- and ensure it returns the same stage_components data format
CREATE OR REPLACE FUNCTION client_project_detail(project_id_input uuid, client_email text)
RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE
  result jsonb;
BEGIN
  -- First check if client has access to project
  IF NOT EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = project_id_input
      AND lower(pm.email) = lower(client_email)
  ) THEN
    RETURN NULL;
  END IF;

  -- Return same structure as provider_project_detail
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
            'title', sc.title,  -- Use actual title column
            'config', sc.config,
            'status', sc.status,
            'metadata', sc.metadata,
            'created_at', sc.created_at
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