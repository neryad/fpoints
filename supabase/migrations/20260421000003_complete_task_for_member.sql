-- Allow owners to complete+approve a task for a member in one atomic operation.
-- Also updates get_member_overview to include available tasks.

-- ============================================================
-- complete_task_for_member
-- ============================================================
CREATE OR REPLACE FUNCTION public.complete_task_for_member(
  p_task_id    uuid,
  p_member_id  uuid,
  p_group_id   uuid
)
RETURNS jsonb   -- { points_earned, new_balance, task_title }
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id    uuid := auth.uid();
  v_is_manager   boolean;
  v_task         record;
  v_already      boolean;
  v_submission_id uuid;
  v_new_balance  bigint;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Caller must be owner or sub_owner
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = v_caller_id
      AND group_id = p_group_id
      AND role IN ('owner', 'sub_owner')
  ) INTO v_is_manager;

  IF NOT v_is_manager THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;

  -- Fetch task (must be active and belong to group)
  SELECT id, title, points_value, requires_proof
  INTO v_task
  FROM public.tasks
  WHERE id = p_task_id
    AND group_id = p_group_id
    AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'task_not_found';
  END IF;

  -- Prevent double-completion (pending or approved already)
  SELECT EXISTS (
    SELECT 1 FROM public.task_submissions
    WHERE task_id = p_task_id
      AND user_id = p_member_id
      AND status IN ('pending', 'approved')
  ) INTO v_already;

  IF v_already THEN
    RAISE EXCEPTION 'already_completed';
  END IF;

  -- Insert submission already approved (skip the review step)
  INSERT INTO public.task_submissions (
    task_id, user_id, status, reviewed_by, reviewed_at
  ) VALUES (
    p_task_id, p_member_id, 'approved', v_caller_id, now()
  )
  RETURNING id INTO v_submission_id;

  -- Award points
  INSERT INTO public.point_transactions (
    group_id, user_id, amount, reason
  ) VALUES (
    p_group_id,
    p_member_id,
    v_task.points_value,
    'task_approved:' || v_submission_id
  );

  -- New balance
  SELECT COALESCE(SUM(amount), 0)
  INTO v_new_balance
  FROM public.point_transactions
  WHERE user_id = p_member_id AND group_id = p_group_id;

  RETURN jsonb_build_object(
    'points_earned', v_task.points_value,
    'new_balance',   v_new_balance,
    'task_title',    v_task.title
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_task_for_member(uuid, uuid, uuid) TO authenticated;


-- ============================================================
-- Update get_member_overview to include available tasks
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_member_overview(
  p_user_id  uuid,
  p_group_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_manager   boolean;
  v_total_points bigint;
  v_week_points  bigint;
  v_week_start   timestamptz;
  v_recent       jsonb;
  v_pending      bigint;
  v_tasks        jsonb;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = auth.uid()
      AND group_id = p_group_id
      AND role IN ('owner', 'sub_owner')
  ) INTO v_is_manager;

  IF NOT v_is_manager THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;

  v_week_start := date_trunc('week', now() AT TIME ZONE 'UTC');

  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_points
  FROM public.point_transactions
  WHERE user_id = p_user_id AND group_id = p_group_id;

  SELECT COALESCE(SUM(amount), 0)
  INTO v_week_points
  FROM public.point_transactions
  WHERE user_id = p_user_id
    AND group_id = p_group_id
    AND amount > 0
    AND created_at >= v_week_start;

  SELECT jsonb_agg(t ORDER BY t.created_at DESC)
  INTO v_recent
  FROM (
    SELECT amount, reason, created_at
    FROM public.point_transactions
    WHERE user_id = p_user_id AND group_id = p_group_id
    ORDER BY created_at DESC
    LIMIT 8
  ) t;

  SELECT COUNT(*)
  INTO v_pending
  FROM public.task_submissions ts
  JOIN public.tasks tk ON tk.id = ts.task_id
  WHERE ts.user_id = p_user_id
    AND tk.group_id = p_group_id
    AND ts.status = 'pending';

  -- Available tasks: active, assigned to member or unassigned, not yet pending/approved
  SELECT jsonb_agg(t ORDER BY t.created_at ASC)
  INTO v_tasks
  FROM (
    SELECT tk.id, tk.title, tk.points_value, tk.description
    FROM public.tasks tk
    WHERE tk.group_id = p_group_id
      AND tk.status = 'active'
      AND (tk.assigned_to IS NULL OR tk.assigned_to = p_user_id)
      AND NOT EXISTS (
        SELECT 1 FROM public.task_submissions ts
        WHERE ts.task_id = tk.id
          AND ts.user_id = p_user_id
          AND ts.status IN ('pending', 'approved')
      )
    ORDER BY tk.created_at ASC
  ) t;

  RETURN jsonb_build_object(
    'total_points',  v_total_points,
    'week_points',   v_week_points,
    'recent',        COALESCE(v_recent, '[]'::jsonb),
    'pending_tasks', v_pending,
    'tasks',         COALESCE(v_tasks, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_member_overview(uuid, uuid) TO authenticated;
