-- Grants the Professional lifetime plan to selected NeuroNex users.
-- Run in the Supabase SQL Editor for project krewdaklcyzqfxkkgvqr.
-- This intentionally does not change admin/developer roles or auth metadata.

begin;

with target_users(user_id) as (
  values
    ('4181f109-1932-4052-826f-a107dceb11ea'::uuid),
    ('90df7c13-d644-4771-9e7b-0ba9f437eb14'::uuid)
),
missing_users as (
  select target_users.user_id
  from target_users
  left join auth.users on auth.users.id = target_users.user_id
  where auth.users.id is null
)
select
  case
    when count(*) = 0 then 'ok: all target users exist'
    else 'error: missing users: ' || string_agg(user_id::text, ', ')
  end as preflight
from missing_users;

do $$
declare
  missing_count integer;
begin
  with target_users(user_id) as (
    values
      ('4181f109-1932-4052-826f-a107dceb11ea'::uuid),
      ('90df7c13-d644-4771-9e7b-0ba9f437eb14'::uuid)
  )
  select count(*)
  into missing_count
  from target_users
  left join auth.users on auth.users.id = target_users.user_id
  where auth.users.id is null;

  if missing_count > 0 then
    raise exception 'Aborting: one or more target users do not exist in auth.users.';
  end if;
end $$;

with target_users(user_id, source_label) as (
  values
    ('4181f109-1932-4052-826f-a107dceb11ea'::uuid, 'manual_lifetime_grant_sidinei_jair_manthey'),
    ('90df7c13-d644-4771-9e7b-0ba9f437eb14'::uuid, 'manual_lifetime_grant_caio_vieira_almeida')
),
upserted as (
  insert into public.user_subscriptions (
    user_id,
    plan,
    status,
    current_period_start,
    current_period_end,
    trial_started_at,
    trial_ends_at,
    canceled_at,
    metadata,
    updated_at
  )
  select
    target_users.user_id,
    'Professional',
    'active',
    now(),
    null,
    null,
    null,
    null,
    jsonb_build_object(
      'lifetime', true,
      'grant_type', 'professional_lifetime',
      'source', target_users.source_label,
      'granted_at', now()
    ),
    now()
  from target_users
  on conflict (user_id)
  do update set
    plan = 'Professional',
    status = 'active',
    current_period_start = coalesce(public.user_subscriptions.current_period_start, excluded.current_period_start),
    current_period_end = null,
    trial_started_at = null,
    trial_ends_at = null,
    canceled_at = null,
    metadata = coalesce(public.user_subscriptions.metadata, '{}'::jsonb)
      || excluded.metadata
      || jsonb_build_object(
        'previous_plan', public.user_subscriptions.plan,
        'previous_status', public.user_subscriptions.status
      ),
    updated_at = now()
  returning user_id, plan, status, metadata
)
select 'updated_subscription' as action, *
from upserted
order by user_id;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'subscription_plan'
  ) then
    update public.profiles
    set
      subscription_plan = 'Professional',
      updated_at = now()
    where id in (
      '4181f109-1932-4052-826f-a107dceb11ea'::uuid,
      '90df7c13-d644-4771-9e7b-0ba9f437eb14'::uuid
    );
  end if;
end $$;

commit;

-- Verification query. Run after the transaction and confirm both rows are Professional/active.
select
  users.id as user_id,
  users.email,
  profiles.first_name,
  profiles.last_name,
  user_subscriptions.plan,
  user_subscriptions.status,
  user_subscriptions.current_period_end,
  user_subscriptions.trial_ends_at,
  user_subscriptions.canceled_at,
  user_subscriptions.metadata
from auth.users as users
left join public.profiles as profiles on profiles.id = users.id
left join public.user_subscriptions as user_subscriptions on user_subscriptions.user_id = users.id
where users.id in (
  '4181f109-1932-4052-826f-a107dceb11ea'::uuid,
  '90df7c13-d644-4771-9e7b-0ba9f437eb14'::uuid
)
order by users.email nulls last, users.id;
