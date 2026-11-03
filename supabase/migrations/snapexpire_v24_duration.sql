-- Required before deploying 1–10 second viewing options.
-- Existing shared photos keep their original 5-second duration.
alter table public.shared_photos
add column if not exists duration_seconds integer not null default 5
check (duration_seconds between 1 and 10);
