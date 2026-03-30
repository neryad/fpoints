-- Performance RPC: aggregate leaderboard in DB (faster than client-side sum)
-- Run this in Supabase SQL Editor.

create or replace function public.get_group_points_leaderboard(
  input_group_id uuid,
  input_since timestamptz default null
)
returns table (
  user_id uuid,
  points bigint,
  display_name text
)
language sql
stable
security definer
set search_path = public
as $$
  with viewer as (
    select auth.uid() as uid
  ),
  totals as (
    select
      pt.user_id,
      sum(pt.amount)::bigint as points
    from public.point_transactions pt
    where pt.group_id = input_group_id
      and (input_since is null or pt.created_at >= input_since)
      and exists (
        select 1
        from public.memberships vm
        join viewer v on v.uid = vm.user_id
        where vm.group_id = input_group_id
      )
    group by pt.user_id
  )
  select
    t.user_id,
    t.points,
    coalesce(nullif(u.name, ''), nullif(u.email, ''), 'Usuario sin perfil') as display_name
  from totals t
  join public.memberships m
    on m.group_id = input_group_id
   and m.user_id = t.user_id
  left join public.users u
    on u.id = t.user_id
  order by t.points desc, t.user_id asc;
$$;

revoke all on function public.get_group_points_leaderboard(uuid, timestamptz) from public;
grant execute on function public.get_group_points_leaderboard(uuid, timestamptz) to authenticated;

-- Recommended index for faster weekly and total scans by group/date.
create index if not exists idx_point_transactions_group_created_user
  on public.point_transactions (group_id, created_at desc, user_id);
