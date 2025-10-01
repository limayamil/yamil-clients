-- Add function to update completion note on completed stages
CREATE OR REPLACE FUNCTION update_stage_completion_note(
  stage_id_input uuid,
  completion_note_input text,
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
BEGIN
  -- Get current stage
  SELECT * INTO current_stage FROM stages WHERE id = stage_id_input;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Stage not found');
  END IF;

  -- Verify stage is completed
  IF current_stage.status != 'done' THEN
    RETURN json_build_object('success', false, 'error', 'Stage must be completed to update completion note');
  END IF;

  -- Security check: only providers can update completion notes
  IF user_role_input IS NULL OR user_role_input != 'provider' THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: only providers can update completion notes');
  END IF;

  -- Update completion note
  UPDATE stages
  SET completion_note = completion_note_input
  WHERE id = stage_id_input;

  RETURN json_build_object('success', true);
END;
$$;
