-- Games 3 and 4 inside the app. Run once in Supabase after migration-006:
-- SQL Editor > New query > paste > Run. Safe to re-run.
--
-- ADDITIVE ONLY. This does not delete, reset or rewrite anything: existing
-- runs, scores, keys, chest openings, founders and questions are untouched,
-- so it is safe to run while the hunt is live. It only
--   1. lets the games tables accept a fourth game id, 'sermon' (Game 3), and
--   2. adds new settings columns to hunt_config, each with a default.

-- Game 3 (Year 2 Sermon Quiz) reuses the game tables with the id 'sermon'.
-- The new checks accept everything the old ones did, plus 'sermon'.
alter table public.game_questions drop constraint if exists game_questions_game_check;
alter table public.game_questions drop constraint if exists game_questions_check;
alter table public.game_questions
  add constraint game_questions_game_check check (game in ('quiz', 'quote', 'hunt', 'sermon'));
alter table public.game_questions
  add constraint game_questions_check
  check ((game in ('quiz', 'hunt', 'sermon') and difficulty is not null) or (game = 'quote' and difficulty is null));

alter table public.game_runs drop constraint if exists game_runs_game_check;
alter table public.game_runs
  add constraint game_runs_game_check check (game in ('quiz', 'quote', 'hunt', 'sermon'));

-- Game 3 rules. Passing the sermon quiz wins Key 3 automatically.
alter table public.hunt_config add column if not exists g3_pass_mark      int not null default 70
  check (g3_pass_mark between 1 and 100);
alter table public.hunt_config add column if not exists g3_question_count int not null default 10
  check (g3_question_count between 1 and 50);
alter table public.hunt_config add column if not exists g3_max_attempts   int
  check (g3_max_attempts between 1 and 20);               -- per player name; null = unlimited

-- Games 3 and 4 are playable between these times. Null = no limit.
alter table public.hunt_config add column if not exists g34_opens_at  timestamptz;
alter table public.hunt_config add column if not exists g34_closes_at timestamptz;

-- Game 4: the pastor's video. Players find a key phrase in it and type it;
-- a correct phrase hands them Key 4 (key4 itself is unchanged).
alter table public.hunt_config add column if not exists key_phrase text not null default '';
-- Other answers that also count, one per line.
alter table public.hunt_config add column if not exists phrase_alts text not null default '';
alter table public.hunt_config add column if not exists video_url   text not null default '';
alter table public.hunt_config add column if not exists video_title text not null default '';
alter table public.hunt_config add column if not exists video_intro text not null default '';
