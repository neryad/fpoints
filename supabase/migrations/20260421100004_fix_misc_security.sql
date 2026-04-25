-- SECURITY FIX (Medium + Low):
--
-- 1. get_auth_email_by_username: was accessible to anon, exposing email
--    addresses to unauthenticated callers.  The client already derives the
--    email deterministically (child_{username}@fpoints.app), so the RPC is
--    not needed for the login flow and its anon grant is removed.
--
-- 2. get_member_overview: add explicit auth.uid() null guard and validate
--    that p_user_id is a member of p_group_id before returning their data.

-- ============================================================
-- 1. Revoke anon access to get_auth_email_by_username
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.get_auth_email_by_username(text) FROM anon;
-- authenticated grant is kept so owners can still look up emails if needed.


-- ============================================================
-- 2. get_member_overview (patched — canonical version with tasks)
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
  v_total_points bigint;
  v_week_points  bigint;
  v_week_start   timestamptz;
  v_recent       jsonb;
  v_pending      bigint;
  v_tasks        jsonb;
BEGIN
  -- Caller must be a manager of the group
  PERFORM public._require_manager(p_group_id);

  -- p_user_id must be an actual member of the group
  PERFORM public._require_member(p_user_id, p_group_id);

  v_week_start := date_trunc('week', now() AT TIME ZONE 'UTC');

  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_points
  FROM public.point_transactions
  WHERE user_id = p_user_id AND group_id = p_group_id;

  SELECT COALESCE(SUM(amount), 0)
  INTO v_week_points
  FROM public.point_transactions
  WHERE user_id  = p_user_id
    AND group_id = p_group_id
    AND amount   > 0
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
  WHERE ts.user_id  = p_user_id
    AND tk.group_id = p_group_id
    AND ts.status   = 'pending';

  -- Available tasks: active, assigned to member or unassigned, not yet pending/approved
  SELECT jsonb_agg(t ORDER BY t.created_at ASC)
  INTO v_tasks
  FROM (
    SELECT tk.id, tk.title, tk.points_value, tk.description, tk.created_at
    FROM public.tasks tk
    WHERE tk.group_id = p_group_id
      AND tk.status   = 'active'
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
