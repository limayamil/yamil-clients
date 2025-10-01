-- Fix complete_stage_and_move_next to not rely on auth.jwt()
-- Instead, we'll pass user_id and role as parameters

DROP FUNCTION IF EXISTS complete_stage_and_move_next(uuid);
DROP FUNCTION IF EXISTS complete_stage_and_move_next(uuid, text);

CREATE OR REPLACE FUNCTION complete_stage_and_move_next(
  stage_id_input uuid,
  completion_note_input text DEFAULT NULL,
  user_id_input uuid DEFAULT NULL,
  user_role_input text DEFAULT NULL
)
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
  RAISE NOTICE '🔍 complete_stage_and_move_next called with stage_id: %, completion_note: %, user_id: %, role: %',
    stage_id_input, completion_note_input, user_id_input, user_role_input;

  -- Get current stage
  SELECT * INTO current_stage FROM stages WHERE id = stage_id_input;

  IF NOT FOUND THEN
    RAISE NOTICE '❌ Stage not found: %', stage_id_input;
    RETURN json_build_object('success', false, 'error', 'Stage not found');
  END IF;

  RAISE NOTICE '✅ Stage found: % (status: %, owner: %)', current_stage.title, current_stage.status, current_stage.owner;

  -- Security check: provider can complete any stage, client can only complete their own
  IF user_role_input IS NULL THEN
    RAISE NOTICE '❌ No user role provided';
    RETURN json_build_object('success', false, 'error', 'Unauthorized: no role');
  END IF;

  IF user_role_input != 'provider' AND (user_role_input != 'client' OR current_stage.owner != 'client') THEN
    RAISE NOTICE '❌ Unauthorized: role=%, stage.owner=%', user_role_input, current_stage.owner;
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  RAISE NOTICE '✅ Security check passed for role: %', user_role_input;

  -- Mark current stage as done with completion note
  UPDATE stages
  SET
    status = 'done'::stage_status,
    completion_at = now(),
    completion_note = completion_note_input
  WHERE id = stage_id_input;

  RAISE NOTICE '✅ Stage updated to done with completion_note length: %', coalesce(length(completion_note_input), 0);

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
    RAISE NOTICE '✅ Next stage found: % (id: %, owner: %)', next_stage.title, next_stage.id, next_stage.owner;
    UPDATE stages
    SET status = CASE
      WHEN next_stage.owner = 'provider' THEN 'in_review'::stage_status
      ELSE 'waiting_client'::stage_status
    END
    WHERE id = next_stage.id;
    RAISE NOTICE '✅ Next stage activated with status: %', CASE WHEN next_stage.owner = 'provider' THEN 'in_review' ELSE 'waiting_client' END;
  ELSE
    RAISE NOTICE '⚠️ No next stage found, completing project';
    -- No more stages, complete project
    UPDATE projects
    SET status = 'done'
    WHERE id = current_stage.project_id;
  END IF;

  RAISE NOTICE '✅ Function completed successfully';
  RETURN json_build_object('success', true);
END;
$$;
