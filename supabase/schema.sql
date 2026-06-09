-- Life Dashboard — Supabase schema + Row Level Security
-- Run this in your Supabase project: Dashboard → SQL Editor → New query → paste → Run.
--
-- Design notes:
--   * One row per account. The whole dashboard lives in a single `data` jsonb
--     blob on purpose, so adding a new section later is just a new key in the
--     JSON — never a schema migration.
--   * user_id is the primary key, so an upsert keyed on user_id always targets
--     the single row that belongs to the logged-in account.

create table if not exists public.dashboards (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Lock the table down. Without RLS enabled, the anon key could read everything.
alter table public.dashboards enable row level security;

-- The logged-in account may read only its own row.
drop policy if exists "dashboards_select_own" on public.dashboards;
create policy "dashboards_select_own"
  on public.dashboards
  for select
  using (auth.uid() = user_id);

-- ...insert only a row stamped with its own user_id.
drop policy if exists "dashboards_insert_own" on public.dashboards;
create policy "dashboards_insert_own"
  on public.dashboards
  for insert
  with check (auth.uid() = user_id);

-- ...and update only its own row.
drop policy if exists "dashboards_update_own" on public.dashboards;
create policy "dashboards_update_own"
  on public.dashboards
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
