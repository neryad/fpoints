-- RPC for owners/sub_owners to view any member's dashboard data

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
  v_is_manager boolean;
  v_total_points bigint;
  v_week_points  bigint;
  v_week_start   timestamptz;
  v_recent       jsonb;
  v_pending      bigint;
BEGIN
  -- Caller must be owner or sub_owner of the group
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

  -- Total points balance
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_points
  FROM public.point_transactions
  WHERE user_id = p_user_id AND group_id = p_group_id;

  -- This week's earned points (positive only)
  SELECT COALESCE(SUM(amount), 0)
  INTO v_week_points
  FROM public.point_transactions
  WHERE user_id = p_user_id
    AND group_id = p_group_id
    AND amount > 0
    AND created_at >= v_week_start;

  -- Last 8 transactions
  SELECT jsonb_agg(t ORDER BY t.created_at DESC)
  INTO v_recent
  FROM (
    SELECT amount, reason, created_at
    FROM public.point_transactions
    WHERE user_id = p_user_id AND group_id = p_group_id
    ORDER BY created_at DESC
    LIMIT 8
  ) t;

  -- Pending task submissions awaiting approval
  SELECT COUNT(*)
  INTO v_pending
  FROM public.task_submissions ts
  JOIN public.tasks tk ON tk.id = ts.task_id
  WHERE ts.user_id = p_user_id
    AND tk.group_id = p_group_id
    AND ts.status = 'pending';

  RETURN jsonb_build_object(
    'total_points', v_total_points,
    'week_points',  v_week_points,
    'recent',       COALESCE(v_recent, '[]'::jsonb),
    'pending_tasks', v_pending
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_member_overview(uuid, uuid) TO authenticated;
