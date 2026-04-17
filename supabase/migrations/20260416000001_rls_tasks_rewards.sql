-- RLS policies for tasks and rewards tables
-- Ensures only group managers (owner/sub_owner) can create, update, or delete.
-- All group members can read.

-- ============================================================
-- tasks
-- ============================================================
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tasks_select_member ON public.tasks;
CREATE POLICY tasks_select_member ON public.tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.group_id = tasks.group_id
    )
  );

DROP POLICY IF EXISTS tasks_insert_manager ON public.tasks;
CREATE POLICY tasks_insert_manager ON public.tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.group_id = tasks.group_id
        AND m.role IN ('owner', 'sub_owner')
    )
  );

DROP POLICY IF EXISTS tasks_update_manager ON public.tasks;
CREATE POLICY tasks_update_manager ON public.tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.group_id = tasks.group_id
        AND m.role IN ('owner', 'sub_owner')
    )
  );

DROP POLICY IF EXISTS tasks_delete_manager ON public.tasks;
CREATE POLICY tasks_delete_manager ON public.tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.group_id = tasks.group_id
        AND m.role IN ('owner', 'sub_owner')
    )
  );

-- ============================================================
-- rewards
-- ============================================================
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rewards_select_member ON public.rewards;
CREATE POLICY rewards_select_member ON public.rewards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.group_id = rewards.group_id
    )
  );

DROP POLICY IF EXISTS rewards_insert_manager ON public.rewards;
CREATE POLICY rewards_insert_manager ON public.rewards
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.group_id = rewards.group_id
        AND m.role IN ('owner', 'sub_owner')
    )
  );

DROP POLICY IF EXISTS rewards_update_manager ON public.rewards;
CREATE POLICY rewards_update_manager ON public.rewards
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.group_id = rewards.group_id
        AND m.role IN ('owner', 'sub_owner')
    )
  );

DROP POLICY IF EXISTS rewards_delete_manager ON public.rewards;
CREATE POLICY rewards_delete_manager ON public.rewards
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.group_id = rewards.group_id
        AND m.role IN ('owner', 'sub_owner')
    )
  );
