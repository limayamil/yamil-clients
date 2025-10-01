-- Add completion_note field to stages table
ALTER TABLE stages ADD COLUMN IF NOT EXISTS completion_note TEXT;

-- Drop existing functions before recreating them (to avoid parameter name conflicts)
DROP FUNCTION IF EXISTS provider_project_detail(uuid);
DROP FUNCTION IF EXISTS client_project_detail(uuid, text);
DROP FUNCTION IF EXISTS complete_stage_and_move_next(uuid);

-- Update provider_project_detail function to include completion_note
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
        'completion_note', s.completion_note,
        'owner', s.owner,
        'components', (
          SELECT coalesce(jsonb_agg(jsonb_build_object(
            'id', sc.id,
            'stage_id', sc.stage_id,
            'component_type', sc.component_type,
            'title', sc.title,
            'config', sc.config,
            'status', sc.status,
            'metadata', sc.metadata
          ) ORDER BY sc.sort_order, sc.created_at), '[]'::jsonb)
          FROM stage_components sc WHERE sc.stage_id = s.id
        )
      ) ORDER BY s."order"), '[]'::jsonb)
      FROM stages s WHERE s.project_id = p.id
    ),
    'comments', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', cm.id,
        'project_id', cm.project_id,
        'stage_id', cm.stage_id,
        'component_id', cm.component_id,
        'author_type', cm.author_type,
        'body', cm.body,
        'created_at', cm.created_at,
        'created_by', cm.created_by
      ) ORDER BY cm.created_at DESC), '[]'::jsonb)
      FROM comments cm WHERE cm.project_id = p.id
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
    )
  ) INTO result
  FROM projects p
  LEFT JOIN clients c ON c.id = p.client_id
  WHERE p.id = project_id_input;

  RETURN result;
END;
$$;

-- Update client_project_detail function to include completion_note
CREATE OR REPLACE FUNCTION client_project_detail(project_id_input uuid, client_email text)
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
        'completion_note', s.completion_note,
        'owner', s.owner,
        'components', (
          SELECT coalesce(jsonb_agg(jsonb_build_object(
            'id', sc.id,
            'stage_id', sc.stage_id,
            'component_type', sc.component_type,
            'title', sc.title,
            'config', sc.config,
            'status', sc.status,
            'metadata', sc.metadata
          ) ORDER BY sc.sort_order, sc.created_at), '[]'::jsonb)
          FROM stage_components sc WHERE sc.stage_id = s.id
        )
      ) ORDER BY s."order"), '[]'::jsonb)
      FROM stages s WHERE s.project_id = p.id
    ),
    'comments', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', cm.id,
        'project_id', cm.project_id,
        'stage_id', cm.stage_id,
        'component_id', cm.component_id,
        'author_type', cm.author_type,
        'body', cm.body,
        'created_at', cm.created_at,
        'created_by', cm.created_by
      ) ORDER BY cm.created_at DESC), '[]'::jsonb)
      FROM comments cm WHERE cm.project_id = p.id
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
    )
  ) INTO result
  FROM projects p
  LEFT JOIN clients c ON c.id = p.client_id
  WHERE p.id = project_id_input
    AND (c.email = client_email OR EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = p.id AND pm.email = client_email
    ));

  RETURN result;
END;
$$;

-- Update complete_stage_and_move_next function to accept completion_note
CREATE OR REPLACE FUNCTION complete_stage_and_move_next(stage_id_input uuid, completion_note_input text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_stage stages%ROWTYPE;
  next_stage stages%ROWTYPE;
  project_record projects%ROWTYPE;
  result json;
BEGIN
  -- Get current stage
  SELECT * INTO current_stage FROM stages WHERE id = stage_id_input;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Stage not found');
  END IF;

  -- Security check
  IF NOT (is_provider() OR (is_client() AND current_stage.owner = 'client')) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Mark current stage as done with completion note
  UPDATE stages
  SET
    status = 'done',
    completion_at = now(),
    completion_note = completion_note_input
  WHERE id = stage_id_input;

  -- Get next stage
  SELECT * INTO next_stage
  FROM stages
  WHERE project_id = current_stage.project_id
    AND "order" > current_stage."order"
    AND status = 'todo'
  ORDER BY "order"
  LIMIT 1;

  -- If next stage exists, activate it
  IF FOUND THEN
    UPDATE stages
    SET status = CASE
      WHEN next_stage.owner = 'provider' THEN 'in_review'
      ELSE 'waiting_client'
    END
    WHERE id = next_stage.id;
  ELSE
    -- No more stages, complete project
    UPDATE projects
    SET status = 'done'
    WHERE id = current_stage.project_id;
  END IF;

  RETURN json_build_object('success', true);
END;
$$;
