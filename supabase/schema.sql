-- The Witness Church: admin backend.
-- Run this once in Supabase: Dashboard > SQL Editor > New query > paste > Run.
-- Safe to re-run.

-- 1. Who may edit the site ---------------------------------------------------
create table if not exists public.admins (
  email text primary key
);

-- Placeholder admin email (lowercase). Change it here before running if you prefer another.
insert into public.admins (email)
values ('admin@thewitnesschurch.com')
on conflict do nothing;

-- 2. Site content: one row per editable block (theme, hero_slides, ...) ------
create table if not exists public.site_content (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- 3. Admin check used by every write rule ------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- 4. Row-level security -------------------------------------------------------
alter table public.admins       enable row level security;
alter table public.site_content enable row level security;

-- admins: no policies at all, so no client can read or change the list.
-- (Edit it from the SQL editor or Table Editor only.)

drop policy if exists "content is public"        on public.site_content;
drop policy if exists "admins insert content"    on public.site_content;
drop policy if exists "admins update content"    on public.site_content;
drop policy if exists "admins delete content"    on public.site_content;

create policy "content is public"
  on public.site_content for select
  to anon, authenticated
  using (true);

create policy "admins insert content"
  on public.site_content for insert
  to authenticated
  with check (public.is_admin());

create policy "admins update content"
  on public.site_content for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins delete content"
  on public.site_content for delete
  to authenticated
  using (public.is_admin());

-- 5. Image storage ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-images',
  'site-images',
  true,
  5242880, -- 5 MB cap per file protects the free storage quota
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admins upload images" on storage.objects;
drop policy if exists "admins update images" on storage.objects;
drop policy if exists "admins delete images" on storage.objects;
drop policy if exists "admins list images"   on storage.objects;

create policy "admins upload images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'site-images' and public.is_admin());

create policy "admins update images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'site-images' and public.is_admin());

create policy "admins delete images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'site-images' and public.is_admin());

create policy "admins list images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'site-images' and public.is_admin());
