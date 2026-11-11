-- Anniversary treasure hunt. Run once in Supabase after migration-004:
-- SQL Editor > New query > paste > Run. Safe to re-run.
--
-- Like the games tables, nothing here is readable by visitors. The server
-- (service role) checks keys and the passcode, so answers, keys and the
-- reward text never reach the browser until they are earned.

-- Church Trivia (Game 1) reuses the game tables with a third game id.
alter table public.game_questions drop constraint if exists game_questions_game_check;
alter table public.game_questions drop constraint if exists game_questions_check;
alter table public.game_questions
  add constraint game_questions_game_check check (game in ('quiz', 'quote', 'hunt'));
alter table public.game_questions
  add constraint game_questions_check
  check ((game in ('quiz', 'hunt') and difficulty is not null) or (game = 'quote' and difficulty is null));

alter table public.game_runs drop constraint if exists game_runs_game_check;
alter table public.game_runs
  add constraint game_runs_game_check check (game in ('quiz', 'quote', 'hunt'));

-- ---------------------------------------------------------------- config
create table if not exists public.hunt_config (
  id                 int primary key check (id = 1),     -- one row
  title              text not null default 'Anniversary Treasure Hunt',
  -- Games 1 and 2 are playable between these times. Null = no limit.
  opens_at           timestamptz,
  closes_at          timestamptz,
  pass_mark          int  not null default 70 check (pass_mark between 1 and 100),
  question_count     int  not null default 10 check (question_count between 1 and 50),
  max_attempts       int  check (max_attempts between 1 and 20),   -- per player name; null = unlimited
  -- The four keys. Key 2 is also the answer to the Founding Members word.
  key1               text not null default '',
  key2               text not null default '',
  key3               text not null default '',
  key4               text not null default '',
  founders_photo_url text not null default '',
  founders_intro     text not null default '',
  -- Shown after a player names every founding member: how names make the word.
  word_hint          text not null default '',
  -- Shown when a key is entered.
  clue2_title        text not null default 'Clue for Game 3',
  clue2_body         text not null default '',
  clue3_title        text not null default 'Clue for Game 4',
  clue3_body         text not null default '',
  -- Reward text by finishing order: ["1st place text", "2nd place text", ...]
  rewards            jsonb not null default '[]'::jsonb,
  reward_default     text not null default '',
  -- Note for admins about the top-scorer bonus hint (not shown to players).
  bonus_hint         text not null default '',
  updated_at         timestamptz not null default now()
);
-- Safe if the table was created before word_hint existed.
alter table public.hunt_config add column if not exists word_hint text not null default '';

insert into public.hunt_config (id) values (1) on conflict (id) do nothing;

-- -------------------------------------------------------------- founders
create table if not exists public.hunt_founders (
  id       uuid primary key default gen_random_uuid(),
  number   int  not null unique check (number between 1 and 99),
  name     text not null check (char_length(name) between 1 and 80),
  -- Other accepted spellings or nicknames.
  aliases  text[] not null default '{}'
);

-- ----------------------------------------------------------------- chest
create table if not exists public.hunt_chest_opens (
  id         uuid primary key default gen_random_uuid(),
  team_key   text not null unique,           -- team name, lowercased and trimmed
  team_name  text not null,
  opened_at  timestamptz not null default now(),
  ip_hash    text
);

-- For rate limiting guesses (keys and passcodes).
create table if not exists public.hunt_attempts (
  id         bigint generated always as identity primary key,
  ip_hash    text not null,
  created_at timestamptz not null default now()
);
create index if not exists hunt_attempts_ip_idx on public.hunt_attempts (ip_hash, created_at);

alter table public.hunt_config      enable row level security;
alter table public.hunt_founders    enable row level security;
alter table public.hunt_chest_opens enable row level security;
alter table public.hunt_attempts    enable row level security;

drop policy if exists "admins manage hunt config"   on public.hunt_config;
drop policy if exists "admins manage founders"      on public.hunt_founders;
drop policy if exists "admins read chest opens"     on public.hunt_chest_opens;
drop policy if exists "admins delete chest opens"   on public.hunt_chest_opens;

create policy "admins manage hunt config"
  on public.hunt_config for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admins manage founders"
  on public.hunt_founders for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admins read chest opens"
  on public.hunt_chest_opens for select to authenticated using (public.is_admin());
create policy "admins delete chest opens"
  on public.hunt_chest_opens for delete to authenticated using (public.is_admin());

revoke all on public.hunt_config, public.hunt_founders, public.hunt_chest_opens, public.hunt_attempts from anon;
