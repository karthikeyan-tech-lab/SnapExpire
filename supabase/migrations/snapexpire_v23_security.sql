-- Run in Supabase SQL Editor before deploying v2.3.
create table if not exists public.snapexpire_upload_limits (
  client_hash text not null,
  window_start timestamptz not null,
  attempts integer not null default 0,
  primary key (client_hash, window_start)
);
alter table public.snapexpire_upload_limits enable row level security;
revoke all on public.snapexpire_upload_limits from anon, authenticated;
create or replace function public.snapexpire_allow_upload(p_client_hash text)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_count integer;
begin
  if p_client_hash is null or length(p_client_hash) <> 64 then return false; end if;
  insert into public.snapexpire_upload_limits(client_hash,window_start,attempts)
  values (p_client_hash, date_trunc('hour', now()), 1)
  on conflict (client_hash,window_start)
  do update set attempts = public.snapexpire_upload_limits.attempts + 1
  returning attempts into v_count;
  return v_count <= 10;
end; $$;
revoke all on function public.snapexpire_allow_upload(text) from public, anon, authenticated;
grant execute on function public.snapexpire_allow_upload(text) to service_role;
create index if not exists snapexpire_photos_cleanup_idx
on public.shared_photos(expires_at) where storage_deleted_at is null;
-- Maintenance: old limiter rows can be deleted periodically by a privileged job.
