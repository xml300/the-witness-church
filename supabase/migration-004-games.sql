-- Bible games (Bible Quiz + Bible Quote). Run once in Supabase:
-- SQL Editor > New query > paste > Run. Safe to re-run.
--
-- Security model: these tables are NOT readable or writable by visitors.
-- Only the server (using the service role key) and signed-in admins touch
-- them. That keeps correct answers out of the browser and lets the server
-- compute every score itself.

-- ---------------------------------------------------------------- content
create table if not exists public.game_questions (
  id          uuid primary key default gen_random_uuid(),
  game        text not null check (game in ('quiz', 'quote')),
  -- Quiz questions carry a level. Quote verses work at every level, so null.
  difficulty  text check (difficulty in ('easy', 'medium', 'hard', 'expert')),
  -- quiz:  {question, options[4], correctIndex, reference, explanation,
  --         testament, caption}
  -- quote: {reference, hint, funFact,
  --         translations: {modern:{text,easyIndex?,synonyms?}, kjv:{...}}}
  payload     jsonb not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  check ((game = 'quiz' and difficulty is not null) or (game = 'quote' and difficulty is null))
);
create index if not exists game_questions_game_idx
  on public.game_questions (game, difficulty) where active;

-- ------------------------------------------------------------------ rooms
create table if not exists public.game_rooms (
  code                text primary key check (code ~ '^[A-Z0-9]{6}$'),
  game                text not null check (game in ('quiz', 'quote')),
  host_name           text not null,
  ip_hash             text,
  difficulty          text not null check (difficulty in ('easy','medium','hard','expert','all')),
  translation         text not null default 'modern' check (translation in ('modern','kjv')),
  max_attempts        int  check (max_attempts between 1 and 20),     -- null = unlimited
  time_limit_seconds  int  check (time_limit_seconds between 10 and 3600), -- null = no limit
  question_count      int  not null default 10 check (question_count between 1 and 50),
  created_at          timestamptz not null default now(),
  -- Room leaderboards are hidden after this moment.
  expires_at          timestamptz not null default (now() + interval '2 hours')
);

-- ------------------------------------------------------------------ runs
-- One row per play. Created when a round starts, filled as answers come in,
-- closed by the server when the round finishes.
create table if not exists public.game_runs (
  id            uuid primary key default gen_random_uuid(),  -- secret handle held by the player's browser
  game          text not null check (game in ('quiz', 'quote')),
  room_code     text references public.game_rooms (code) on delete cascade,
  player_name   text not null check (char_length(player_name) between 1 and 30),
  ip_hash       text,                                         -- salted hash, for rate limits only
  difficulty    text not null check (difficulty in ('easy','medium','hard','expert','all')),
  translation   text not null default 'modern' check (translation in ('modern','kjv')),
  -- The questions drawn for this round, in order: [{qid, level}]
  items         jsonb not null,
  -- Locked-in answers, same order: [{guess: ...}|null]
  answers       jsonb not null default '[]'::jsonb,
  attempt_no    int not null default 1,
  time_limit_seconds int,
  status        text not null default 'active' check (status in ('active', 'finished')),
  score         int,
  total         int not null,
  percentage    int,
  elapsed_ms    int,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz
);
create index if not exists game_runs_board_idx
  on public.game_runs (game, difficulty, percentage desc, elapsed_ms) where status = 'finished';
create index if not exists game_runs_room_idx on public.game_runs (room_code) where status = 'finished';

alter table public.game_questions enable row level security;
alter table public.game_rooms     enable row level security;
alter table public.game_runs      enable row level security;

drop policy if exists "admins manage game questions" on public.game_questions;
drop policy if exists "admins read rooms"            on public.game_rooms;
drop policy if exists "admins read runs"             on public.game_runs;
drop policy if exists "admins delete runs"           on public.game_runs;

create policy "admins manage game questions"
  on public.game_questions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "admins read rooms"
  on public.game_rooms for select to authenticated using (public.is_admin());

create policy "admins read runs"
  on public.game_runs for select to authenticated using (public.is_admin());

create policy "admins delete runs"
  on public.game_runs for delete to authenticated using (public.is_admin());

-- No policies for anon: visitors can do nothing here directly.
revoke all on public.game_questions, public.game_rooms, public.game_runs from anon;

create index if not exists game_runs_rate_idx  on public.game_runs  (ip_hash, started_at);
create index if not exists game_rooms_rate_idx on public.game_rooms (ip_hash, created_at);
