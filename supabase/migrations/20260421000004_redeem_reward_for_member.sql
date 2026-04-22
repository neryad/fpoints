-- Allow owners/sub_owners to redeem a reward on behalf of a member
-- (for members who don't have a mobile device).
-- Creates an already-approved redemption and deducts points atomically.

CREATE OR REPLACE FUNCTION public.redeem_reward_for_member(
  p_group_id  uuid,
  p_reward_id uuid,
  p_member_id uuid
)
RETURNS jsonb   -- { points_spent, new_balance, reward_title }
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id    uuid := auth.uid();
  v_is_manager   boolean;
  v_reward       record;
  v_balance      bigint;
  v_redemption_id uuid;
  v_new_balance  bigint;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Caller must be owner or sub_owner of the group
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = v_caller_id
      AND group_id = p_group_id
      AND role IN ('owner', 'sub_owner')
  ) INTO v_is_manager;

  IF NOT v_is_manager THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;

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

  -- New balance
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
