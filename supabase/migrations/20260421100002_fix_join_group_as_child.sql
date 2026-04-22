-- SECURITY FIX (Critical): join_group_as_child previously allowed any
-- authenticated user to join any group by passing an arbitrary p_group_id,
-- bypassing the invitation system entirely via SECURITY DEFINER.
--
-- Fix: before inserting the membership, verify that a child_invitations row
-- for this (username, group_id) pair was claimed within the last 30 minutes.
-- This ties the join to a recent, legitimate claim_child_invitation call
-- without requiring auth.uid() at claim time (the user isn't authenticated yet
-- when they call claim_child_invitation as anon).

CREATE OR REPLACE FUNCTION public.join_group_as_child(
  p_group_id     uuid,
  p_username     text,
  p_display_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Verify that a valid invitation for this (username, group) was recently
  -- claimed.  The 30-minute window covers normal signup flows while blocking
  -- attackers who have never gone through claim_child_invitation.
  IF NOT EXISTS (
    SELECT 1 FROM public.child_invitations
    WHERE username  = p_username
      AND group_id  = p_group_id
      AND used_at   IS NOT NULL
      AND used_at   > now() - interval '30 minutes'
  ) THEN
    RAISE EXCEPTION 'invalid_invitation';
  END IF;

  UPDATE public.users
  SET username     = p_username,
      display_name = p_display_name
  WHERE id = auth.uid();

  INSERT INTO public.memberships (user_id, group_id, role)
  VALUES (auth.uid(), p_group_id, 'member')
  ON CONFLICT (user_id, group_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_group_as_child(uuid, text, text) TO authenticated;
