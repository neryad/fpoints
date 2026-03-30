-- Rewards MVP SQL
-- Run this in Supabase SQL editor.

-- 1) Catalog table: rewards
create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null,
  cost_points integer not null check (cost_points > 0),
  created_by uuid not null references public.users(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2) Redemption requests table
create table if not exists public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  reward_id uuid not null references public.rewards(id) on delete restrict,
  user_id uuid not null references public.users(id) on delete cascade,
  reward_title text not null,
  reward_cost_points integer not null check (reward_cost_points > 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_by uuid null references public.users(id) on delete set null,
  approved_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists ix_rewards_group_active
  on public.rewards(group_id, active);

create index if not exists ix_reward_redemptions_group_status
  on public.reward_redemptions(group_id, status, created_at desc);

create index if not exists ix_reward_redemptions_user
  on public.reward_redemptions(user_id, created_at desc);

alter table public.rewards enable row level security;
alter table public.reward_redemptions enable row level security;

-- Drop old policies if present.
drop policy if exists rewards_select_group_members on public.rewards;
drop policy if exists rewards_insert_manager_only on public.rewards;
drop policy if exists rewards_update_manager_only on public.rewards;
drop policy if exists rewards_delete_manager_only on public.rewards;

drop policy if exists redemptions_select_member_or_manager on public.reward_redemptions;
drop policy if exists redemptions_insert_member_only on public.reward_redemptions;

-- Rewards policies
create policy rewards_select_group_members
  on public.rewards
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.memberships m
      where m.group_id = rewards.group_id
        and m.user_id = auth.uid()
    )
  );

create policy rewards_insert_manager_only
  on public.rewards
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1
      from public.memberships m
      where m.group_id = rewards.group_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'sub_owner')
    )
  );

create policy rewards_update_manager_only
  on public.rewards
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.memberships m
      where m.group_id = rewards.group_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'sub_owner')
    )
  )
  with check (
    exists (
      select 1
      from public.memberships m
      where m.group_id = rewards.group_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'sub_owner')
    )
  );

create policy rewards_delete_manager_only
  on public.rewards
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.memberships m
      where m.group_id = rewards.group_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'sub_owner')
    )
  );

-- Redemption policies
create policy redemptions_select_member_or_manager
  on public.reward_redemptions
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.memberships m
      where m.group_id = reward_redemptions.group_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'sub_owner')
    )
  );

create policy redemptions_insert_member_only
  on public.reward_redemptions
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and exists (
      select 1
      from public.memberships m
      where m.group_id = reward_redemptions.group_id
        and m.user_id = auth.uid()
    )
  );

-- 3) RPC to approve/reject redemption atomically
create or replace function public.review_reward_redemption(
  input_redemption_id uuid,
  input_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reviewer_id uuid;
  v_redemption public.reward_redemptions%rowtype;
  v_can_review boolean;
  v_balance integer;
begin
  if input_status not in ('approved', 'rejected') then
    raise exception 'invalid status';
  end if;

  v_reviewer_id := auth.uid();
  if v_reviewer_id is null then
    raise exception 'not authorized';
  end if;

  select *
  into v_redemption
  from public.reward_redemptions
  where id = input_redemption_id
  for update;

  if not found then
    raise exception 'redemption not found';
  end if;

  select exists (
    select 1
    from public.memberships m
    where m.group_id = v_redemption.group_id
      and m.user_id = v_reviewer_id
      and m.role in ('owner', 'sub_owner')
  )
  into v_can_review;

  if not v_can_review then
    raise exception 'not authorized';
  end if;

  if v_redemption.status <> 'pending' then
    raise exception 'already reviewed';
  end if;

  if input_status = 'approved' then
    select coalesce(sum(pt.amount), 0)::integer
    into v_balance
    from public.point_transactions pt
    where pt.group_id = v_redemption.group_id
      and pt.user_id = v_redemption.user_id;

    if v_balance < v_redemption.reward_cost_points then
      raise exception 'insufficient points';
    end if;

    insert into public.point_transactions (
      user_id,
      group_id,
      amount,
      reason,
      created_at
    )
    values (
      v_redemption.user_id,
      v_redemption.group_id,
      -v_redemption.reward_cost_points,
      'reward_redeemed:' || v_redemption.id,
      now()
    );
  end if;

  update public.reward_redemptions
  set
    status = input_status,
    approved_by = v_reviewer_id,
    approved_at = now()
  where id = input_redemption_id;
end;
$$;

grant execute on function public.review_reward_redemption(uuid, text) to authenticated;
