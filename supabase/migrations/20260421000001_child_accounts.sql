-- Child accounts: username login + PIN for members without email

-- 1. Add username to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS username text UNIQUE,
  ADD COLUMN IF NOT EXISTS display_name text;

-- 2. Pending invitations created by owners for child members
CREATE TABLE IF NOT EXISTS public.child_invitations (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  username     text UNIQUE NOT NULL,
  pin          text NOT NULL,
  display_name text NOT NULL,
  group_id     uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  created_by   uuid NOT NULL REFERENCES public.users(id),
  used_at      timestamptz,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.child_invitations ENABLE ROW LEVEL SECURITY;

-- Only group owners/sub_owners can create invitations for their group
DROP POLICY IF EXISTS child_invitations_insert_manager ON public.child_invitations;
CREATE POLICY child_invitations_insert_manager ON public.child_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.group_id = child_invitations.group_id
        AND m.role IN ('owner', 'sub_owner')
    )
  );

-- Owners can read their group's invitations
DROP POLICY IF EXISTS child_invitations_select_manager ON public.child_invitations;
CREATE POLICY child_invitations_select_manager ON public.child_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.group_id = child_invitations.group_id
        AND m.role IN ('owner', 'sub_owner')
    )
  );

-- 3. RPC: validate child invitation (accessible by anon for login flow)
CREATE OR REPLACE FUNCTION public.claim_child_invitation(
  p_username text,
  p_pin      text
)
RETURNS uuid  -- returns group_id on success, null if not found
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv record;
BEGIN
  SELECT * INTO v_inv
  FROM public.child_invitations
  WHERE username = p_username
    AND pin = p_pin
    AND used_at IS NULL
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  UPDATE public.child_invitations
  SET used_at = now()
  WHERE id = v_inv.id;

  RETURN v_inv.group_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_child_invitation(text, text) TO anon, authenticated;

-- 4. RPC: look up the generated email by username (for subsequent logins)
CREATE OR REPLACE FUNCTION public.get_auth_email_by_username(p_username text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.users WHERE username = p_username LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_auth_email_by_username(text) TO anon, authenticated;

-- 5. RPC: finalize child account setup after auth signup
CREATE OR REPLACE FUNCTION public.join_group_as_child(
  p_group_id    uuid,
  p_username    text,
  p_display_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET username = p_username,
      display_name = p_display_name
  WHERE id = auth.uid();

  INSERT INTO public.memberships (user_id, group_id, role)
  VALUES (auth.uid(), p_group_id, 'member')
  ON CONFLICT (user_id, group_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_group_as_child(uuid, text, text) TO authenticated;
