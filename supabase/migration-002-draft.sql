-- Run once in Supabase: SQL Editor > New query > paste > Run. Safe to re-run.
-- The editor keeps unpublished work in one row (key = 'draft'). This stops the
-- public API from returning that row to visitors.

drop policy if exists "content is public" on public.site_content;

create policy "content is public"
  on public.site_content for select
  to anon, authenticated
  using (key <> 'draft' or public.is_admin());
