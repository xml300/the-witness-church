-- Prayer wall. Run once in Supabase: SQL Editor > New query > paste > Run.
-- Safe to re-run.
--
-- Privacy: the table has no name, email or IP column. Requests meant only for
-- the pastor never reach this table; they go straight to the Google Sheet.

create table if not exists public.prayer_requests (
  id         uuid primary key default gen_random_uuid(),
  text       text not null check (char_length(text) between 5 and 600),
  category   text,
  status     text not null default 'pending'
             check (status in ('pending', 'approved')),
  created_at timestamptz not null default now()
);

alter table public.prayer_requests enable row level security;

drop policy if exists "anyone can submit a request"  on public.prayer_requests;
drop policy if exists "approved requests are public" on public.prayer_requests;
drop policy if exists "admins read all requests"     on public.prayer_requests;
drop policy if exists "admins update requests"       on public.prayer_requests;
drop policy if exists "admins delete requests"       on public.prayer_requests;

-- Visitors can add a request, but only as 'pending'.
create policy "anyone can submit a request"
  on public.prayer_requests for insert
  to anon, authenticated
  with check (status = 'pending');

-- Visitors can read only what an admin approved.
create policy "approved requests are public"
  on public.prayer_requests for select
  to anon, authenticated
  using (status = 'approved');

create policy "admins read all requests"
  on public.prayer_requests for select
  to authenticated
  using (public.is_admin());

create policy "admins update requests"
  on public.prayer_requests for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins delete requests"
  on public.prayer_requests for delete
  to authenticated
  using (public.is_admin());
