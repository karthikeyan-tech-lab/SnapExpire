-- SnapExpire: schedule expired photo cleanup once per minute.
-- PREREQUISITES:
-- 1. Enable pg_cron and pg_net extensions in Supabase.
-- 2. Create a Supabase Vault secret named snapexpire_cleanup_secret.
-- 3. Set Edge Function secret SNAPEXPIRE_CLEANUP_SECRET to the SAME value.
-- Do not paste the secret into this SQL or commit it to GitHub.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

do $$
begin
  if not exists (
    select 1 from vault.decrypted_secrets
    where name = 'snapexpire_cleanup_secret' and decrypted_secret is not null
  ) then
    raise exception 'Create snapexpire_cleanup_secret in Supabase Vault first';
  end if;
end $$;

select cron.schedule(
  'snapexpire-expired-photo-cleanup',
  '* * * * *',
  $job$
  select net.http_post(
    url := 'https://nbhjommpxxqzomubqqfv.supabase.co/functions/v1/snapexpire-api?action=cleanup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'snapexpire_cleanup_secret' limit 1
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 15000
  );
  $job$
);
-- Verify: select jobid, jobname, schedule, active from cron.job where jobname='snapexpire-expired-photo-cleanup';
