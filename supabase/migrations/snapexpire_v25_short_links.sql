-- Run once in Supabase SQL Editor before deploying short links.
-- 22 base64url characters = 132 bits of random code entropy.
alter table public.shared_photos add column if not exists short_code text;
alter table public.shared_photos add column if not exists watermark_enabled boolean not null default true;
create unique index if not exists shared_photos_short_code_key on public.shared_photos(short_code);
alter table public.shared_photos drop constraint if exists shared_photos_short_code_format;
alter table public.shared_photos add constraint shared_photos_short_code_format
check (short_code is null or short_code ~ '^[A-Za-z0-9_-]{22}$');
-- Existing long receiver links continue working; no old token is exposed.
