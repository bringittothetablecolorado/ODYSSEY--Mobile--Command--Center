-- ODYSSEY Phase 1 authenticated phone-intake bridge.
-- The public GitHub intelligence feed remains read-only and separate.

create extension if not exists pgcrypto;

create table if not exists public.mobile_intake (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  notes text not null check (char_length(notes) between 1 and 4000),
  source_url text,
  mission text not null check (mission in ('MISSION-001', 'MISSION-002', 'MISSION-003', 'MISSION-004')),
  status text not null default 'PENDING_REVIEW' check (status in ('PENDING_REVIEW', 'REVIEWED', 'EXPORTED_TO_DESKTOP')),
  captured_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_id)
);

create index if not exists mobile_intake_user_id_idx
  on public.mobile_intake (user_id);

alter table public.mobile_intake enable row level security;

create policy "Owners can read their own mobile intake"
  on public.mobile_intake for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Owners can insert their own mobile intake"
  on public.mobile_intake for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Owners can update their own mobile intake"
  on public.mobile_intake for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.set_mobile_intake_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists mobile_intake_updated_at on public.mobile_intake;
create trigger mobile_intake_updated_at
before update on public.mobile_intake
for each row execute function public.set_mobile_intake_updated_at();

revoke all on table public.mobile_intake from anon;
grant select, insert, update on table public.mobile_intake to authenticated;
