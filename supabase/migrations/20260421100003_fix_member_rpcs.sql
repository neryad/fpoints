-- SECURITY FIX (High): complete_task_for_member and redeem_reward_for_member
-- did not verify that p_member_id holds an active membership in p_group_id.
-- A manager could award/drain points for users outside their group, or
-- self-award points by passing their own UUID as p_member_id.
--
-- Fix: call _require_member(p_member_id, p_group_id) immediately after the
-- manager authorization check, before any writes.

-- ============================================================
-- complete_task_for_member (patched)
-- ============================================================
CREATE OR REPLACE FUNCTION public.complete_task_for_member(
  p_task_id    uuid,
  p_member_id  uuid,
  p_group_id   uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id     uuid := auth.uid();
  v_task          record;
  v_already       boolean;
  v_submission_id uuid;
  v_new_balance   bigint;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Caller must be owner or sub_owner of the group
  PERFORM public._require_manager(p_group_id);

  -- p_member_id must be an active member of the group
  PERFORM public._require_member(p_member_id, p_group_id);

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

  -- Return new balance
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
-- redeem_reward_for_member (patched)
-- ============================================================
CREATE OR REPLACE FUNCTION public.redeem_reward_for_member(
  p_group_id  uuid,
  p_reward_id uuid,
  p_member_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id     uuid := auth.uid();
  v_reward        record;
  v_balance       bigint;
  v_redemption_id uuid;
  v_new_balance   bigint;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Caller must be owner or sub_owner of the group
  PERFORM public._require_manager(p_group_id);

  -- p_member_id must be an active member of the group
  PERFORM public._require_member(p_member_id, p_group_id);

  -- Fetch reward (must be active and belong to group)
  SELECT id, title, cost_points
  INTO v_reward
  FROM public.rewards
  WHERE id = p_reward_id
    AND group_id = p_group_id
    AND active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'reward_not_found_or_inactive';
  END IF;

  -- Check member has enough points
  SELECT COALESCE(SUM(amount), 0)
  INTO v_balance
  FROM public.point_transactions
  WHERE user_id = p_member_id AND group_id = p_group_id;

  IF v_balance < v_reward.cost_points THEN
    RAISE EXCEPTION 'insufficient_points';
  END IF;

  -- Create redemption already approved
  INSERT INTO public.reward_redemptions (
    group_id, reward_id, user_id,
    reward_title, reward_cost_points,
    status, approved_by, approved_at
  ) VALUES (
    p_group_id, p_reward_id, p_member_id,
    v_reward.title, v_reward.cost_points,
    'approved', v_caller_id, now()
  )
  RETURNING id INTO v_redemption_id;

  -- Deduct points
  INSERT INTO public.point_transactions (group_id, user_id, amount, reason)
  VALUES (
    p_group_id,
    p_member_id,
    -v_reward.cost_points,
    'reward_redeemed:' || v_redemption_id
  );

  -- Return new balance
  SELECT COALESCE(SUM(amount), 0)
  INTO v_new_balance
  FROM public.point_transactions
  WHERE user_id = p_member_id AND group_id = p_group_id;

  RETURN jsonb_build_object(
    'points_spent',  v_reward.cost_points,
    'new_balance',   v_new_balance,
    'reward_title',  v_reward.title
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_reward_for_member(uuid, uuid, uuid) TO authenticated;
