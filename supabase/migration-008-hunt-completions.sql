-- Leaderboards for Games 2 and 4. Run once in Supabase after migration-007:
-- SQL Editor > New query > paste > Run. Safe to re-run.
--
-- ADDITIVE ONLY: one new table. Nothing existing is changed or reset, so it is
-- safe while the hunt is live. Games 1 and 3 already have score boards (they
-- are quizzes). Games 2 and 4 are solved, not scored, so their board is the
-- order in which players finished. It only records finishes from now on;
-- anyone who finished before this was added is not listed.

create table if not exists public.hunt_completions (
  id           uuid primary key default gen_random_uuid(),
  stage        int  not null check (stage in (2, 4)),
  player_name  text not null check (char_length(player_name) between 1 and 40),
  name_key     text not null,                      -- name, lowercased and trimmed
  completed_at timestamptz not null default now(),
  ip_hash      text,
  unique (stage, name_key)                         -- the first finish counts
);
create index if not exists hunt_completions_stage_idx on public.hunt_completions (stage, completed_at);

alter table public.hunt_completions enable row level security;

drop policy if exists "admins read completions"   on public.hunt_completions;
drop policy if exists "admins delete completions" on public.hunt_completions;
create policy "admins read completions"
  on public.hunt_completions for select to authenticated using (public.is_admin());
create policy "admins delete completions"
  on public.hunt_completions for delete to authenticated using (public.is_admin());

revoke all on public.hunt_completions from anon;
