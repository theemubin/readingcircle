-- ============================================================
-- Migration 007: Storage Buckets + Policies
-- ============================================================

-- Create storage buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('epubs',   'epubs',   false, 104857600, array['application/epub+zip', 'application/octet-stream']),
  ('covers',  'covers',  true,  5242880,   array['image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', true,  2097152,   array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- ─── EPUBs (private, campus_poc and admin only upload) ────
create policy "Campus PoC uploads EPUB" on storage.objects
  for insert with check (
    bucket_id = 'epubs'
    and public.current_user_role() in ('campus_poc', 'admin')
  );

create policy "Authenticated users read EPUB" on storage.objects
  for select using (
    bucket_id = 'epubs'
    and auth.role() = 'authenticated'
  );

create policy "Campus PoC deletes own EPUB" on storage.objects
  for delete using (
    bucket_id = 'epubs'
    and public.current_user_role() in ('campus_poc', 'admin')
  );

-- ─── Covers (public read, campus_poc upload) ──────────────
create policy "Public reads covers" on storage.objects
  for select using (bucket_id = 'covers');

create policy "Campus PoC uploads cover" on storage.objects
  for insert with check (
    bucket_id = 'covers'
    and public.current_user_role() in ('campus_poc', 'admin')
  );

-- ─── Avatars (public read, own upload) ────────────────────
create policy "Public reads avatars" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Users upload own avatar" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users delete own avatar" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
