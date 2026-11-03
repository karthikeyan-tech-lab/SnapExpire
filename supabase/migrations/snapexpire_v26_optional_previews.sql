-- Optional public thumbnails are separate from private view-once photos.
-- Apply in Supabase SQL Editor before uploading a custom preview.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('snapexpire-previews','snapexpire-previews',true,2097152,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true,file_size_limit=2097152,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
-- Public reads for social preview crawlers only; no public uploads/deletes.
drop policy if exists "Public read snapexpire previews" on storage.objects;
create policy "Public read snapexpire previews" on storage.objects
for select to public using (bucket_id='snapexpire-previews');
