create table if not exists public.document_records (
  id text primary key,
  mission text not null check (mission in ('MISSION-001', 'MISSION-002', 'MISSION-003', 'MISSION-004')),
  investigation text not null,
  title text not null,
  record_type text not null,
  library_file_id text not null unique,
  document_url text not null,
  status text not null default 'RECOVERED',
  created_at timestamptz not null default now()
);

alter table public.document_records enable row level security;
alter table private.allowed_users enable row level security;

drop policy if exists "odyssey owner reads documents" on public.document_records;
create policy "odyssey owner reads documents"
on public.document_records
for select
to authenticated
using ((select private.is_odyssey_user()));

revoke all on table private.allowed_users from anon, authenticated;
revoke all on table public.odyssey_workspace_state from anon, authenticated;
revoke all on table public.document_records from anon, authenticated;
revoke all on table public.source_watch from anon, authenticated;
revoke all on table public.story_updates from anon, authenticated;
revoke all on table public.mobile_intake from anon, authenticated;

grant select on table public.odyssey_workspace_state to authenticated;
grant select on table public.document_records to authenticated;
grant select on table public.source_watch to authenticated;
grant select on table public.story_updates to authenticated;
grant select, insert, update on table public.mobile_intake to authenticated;
