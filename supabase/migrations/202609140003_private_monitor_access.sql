create or replace function public.can_access_odyssey()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.is_odyssey_user();
$$;

revoke all on function public.can_access_odyssey() from public, anon;
grant execute on function public.can_access_odyssey() to authenticated;
