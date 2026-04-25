-- Reusable security guard helpers for SECURITY DEFINER RPCs.
-- Call these at the top of every privileged function instead of
-- inlining the same EXISTS(...) checks each time.

-- ============================================================
-- _require_manager: raises if the calling user is not
-- owner or sub_owner of p_group_id.
-- ============================================================
CREATE OR REPLACE FUNCTION public._require_manager(p_group_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = auth.uid()
      AND group_id = p_group_id
      AND role IN ('owner', 'sub_owner')
  ) THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;
END;
$$;

-- ============================================================
-- _require_member: raises if p_user_id has no active
-- membership in p_group_id.
-- Use this in "on behalf of" RPCs to prevent managers from
-- operating on users outside their group.
-- ============================================================
CREATE OR REPLACE FUNCTION public._require_member(p_user_id uuid, p_group_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id  = p_user_id
      AND group_id = p_group_id
  ) THEN
    RAISE EXCEPTION 'member_not_in_group';
  END IF;
END;
$$;

-- These helpers are internal; only postgres (function owner) executes them.
-- Calling SECURITY DEFINER RPCs invoke them with elevated privileges already.
REVOKE ALL ON FUNCTION public._require_manager(uuid)        FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._require_member(uuid, uuid)   FROM PUBLIC, anon, authenticated;
