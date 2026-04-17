-- RLS para task_submissions y reward_redemptions
-- Fix de seguridad: tablas sin cobertura RLS expuestas a cualquier usuario autenticado.
-- También implementa request_reward_redemption como RPC atómica (evita TOCTOU en balance).

-- ============================================================
-- task_submissions
-- ============================================================
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;

-- Miembro ve sus propias submissions; manager ve todas las de su grupo
DROP POLICY IF EXISTS task_submissions_select ON public.task_submissions;
CREATE POLICY task_submissions_select ON public.task_submissions
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.memberships m ON m.group_id = t.group_id
      WHERE t.id = task_submissions.task_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'sub_owner')
    )
  );

-- Solo miembros del grupo de la tarea pueden enviar submissions propias
DROP POLICY IF EXISTS task_submissions_insert ON public.task_submissions;
CREATE POLICY task_submissions_insert ON public.task_submissions
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.memberships m ON m.group_id = t.group_id
      WHERE t.id = task_submissions.task_id
        AND m.user_id = auth.uid()
    )
  );

-- ============================================================
-- reward_redemptions
-- ============================================================
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Miembro ve sus propios canjes; manager ve todos los del grupo
DROP POLICY IF EXISTS reward_redemptions_select ON public.reward_redemptions;
CREATE POLICY reward_redemptions_select ON public.reward_redemptions
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.group_id = reward_redemptions.group_id
        AND m.role IN ('owner', 'sub_owner')
    )
  );

-- Solo miembros del grupo pueden crear canjes propios para premios activos del mismo grupo
DROP POLICY IF EXISTS reward_redemptions_insert ON public.reward_redemptions;
CREATE POLICY reward_redemptions_insert ON public.reward_redemptions
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.group_id = reward_redemptions.group_id
    )
    AND EXISTS (
      SELECT 1 FROM public.rewards r
      WHERE r.id = reward_redemptions.reward_id
        AND r.group_id = reward_redemptions.group_id
        AND r.active = true
    )
  );

-- ============================================================
-- request_reward_redemption RPC (atómica: verifica balance e inserta en una transacción)
-- Reemplaza el insert directo del cliente que tenía race condition TOCTOU.
-- ============================================================
CREATE OR REPLACE FUNCTION public.request_reward_redemption(
  input_group_id uuid,
  input_reward_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id      uuid    := auth.uid();
  v_reward_title text;
  v_reward_cost  integer;
  v_is_member    boolean;
  v_balance      integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  -- Verifica que el premio exista, pertenezca al grupo y esté activo
  SELECT title, cost_points
    INTO v_reward_title, v_reward_cost
    FROM public.rewards
   WHERE id = input_reward_id
     AND group_id = input_group_id
     AND active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'reward not found or inactive';
  END IF;

  -- Verifica membresía del usuario en el grupo
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
     WHERE user_id = v_user_id
       AND group_id = input_group_id
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  -- Verifica balance (usa la RPC existente del proyecto)
  v_balance := public.get_my_points_balance(input_group_id);

  IF v_balance < v_reward_cost THEN
    RAISE EXCEPTION 'insufficient points';
  END IF;

  -- Insert atómico dentro de la misma transacción
  INSERT INTO public.reward_redemptions (
    group_id, reward_id, user_id,
    reward_title, reward_cost_points, status
  ) VALUES (
    input_group_id,
    input_reward_id,
    v_user_id,
    v_reward_title,
    v_reward_cost,
    'pending'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_reward_redemption(uuid, uuid) TO authenticated;
