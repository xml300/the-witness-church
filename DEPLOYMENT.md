# Merging and updating production

This release adds the admin editor, new pages (about, connect, events, games, prayer, sermons), the prayer wall, and a Supabase backend. Production needs database changes and environment variables as well as the code, so follow the order below.

## 1. Merge the code

The work is on branch `feature/treasure-hunt`, which already contains `feature/games` (the Bible Quiz and Bible Quote games) and `feature/admin-and-pages` (the admin editor and new pages). Merge `feature/treasure-hunt` once; you do not need to merge the other branches separately.

```bash
git checkout main
git pull origin main
git merge --no-ff feature/treasure-hunt
npm install
npm run build        # must pass before you push
git push origin main
```

Or push the branch and open a pull request on GitHub (`Greatseun02/the-witness-church`), then merge it there. Vercel builds a preview for the branch, so check it before merging.

## 2. Prepare Supabase (before the new code goes live)

The site needs these in place or `/admin` and the prayer wall will not work. Full detail is in `supabase/SETUP.md`.

1. In the Supabase SQL Editor run, in this order:
   1. `supabase/schema.sql` (first time only)
   2. `supabase/migration-002-draft.sql`
   3. `supabase/migration-003-prayers.sql`
   4. `supabase/migration-004-games.sql` (game tables)
   5. `supabase/migration-005-games-seed.sql` (300 quiz questions, 22 verses; skipped if already seeded)
   6. `supabase/migration-006-hunt.sql` (anniversary treasure hunt)
2. Authentication > Users > Add user. Use the admin email from `schema.sql`, tick **Auto Confirm User**.
3. Authentication > Sign In / Providers > turn off "Allow new users to sign up".

If the database already exists, only run the migrations you have not run before.

## 3. Set environment variables in Vercel

Project > Settings > Environment Variables (Production, and Preview if you want previews to work). Names come from `.env.example`.

Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the `anon` key)
- `SUPABASE_SERVICE_ROLE_KEY` (Supabase > Project Settings > API > `service_role`). Used only by the games, on the server, to keep answers private and record scores. Never give it a `NEXT_PUBLIC_` prefix and never paste it anywhere public. Without it the game pages show "not switched on yet".

Optional:
- `YOUTUBE_API_KEY` for the full sermon archive and live detection
- `GOOGLE_SHEET_WEBHOOK_URL` and `GOOGLE_SHEET_SECRET` for pastor prayer requests
- `META_IG_USER_ID`, `META_ACCESS_TOKEN`, `META_PAGE_ID`, `META_PAGE_TOKEN` for Instagram and Facebook posts

Changing variables does not affect a build that already ran, so redeploy after setting them.

## 4. Deploy and verify

Pushing to `main` triggers the Vercel deploy. If it was already built, use Deployments > Redeploy.

Then check:
- The home page and the new pages load.
- `/admin` redirects to the login, and you can sign in.
- Change something in the editor, publish, and see it on the live site.
- Submit a prayer request, approve it at `/admin/prayers`, and see it on the wall.
- Play a round at `/games/bible-quiz` and `/games/bible-quote`, and check your score on the leaderboard.
- Create a room, open its link in a private window, play it and see the room board.
- At `/admin/games` add a question, hide it again, and try an import.
- Treasure hunt: follow the dry run in the section below.

## 5. Rolling back

Vercel > Deployments > pick the previous good deployment > Promote to Production. This restores the old code instantly. Database migrations are not undone by this.

## Notes

- Image files moved from `src/assets/hero` to `public/hero`. Nothing else needs moving.
- Do not commit `.env.local`. `.env*` is git-ignored except `.env.example`.
- Sections on the homepage can be shown or hidden in the editor, but their order is fixed.
- Games: scores are computed on the server. Room leaderboards hide 2 hours after the room is created. Hiding a question in `/admin/games` keeps past scores intact; nothing is deleted.
- Rounds and rooms are rate limited per visitor (stored as a salted hash, never the raw IP).

## Anniversary treasure hunt

Players use `/hunt`. Game 1 (Church Trivia) is at `/hunt/trivia`. Games 3 and 4 run in WhatsApp; the website only holds their clue pages and the chest.

**Set up (admin)**
1. `/admin/games`, tab **Church Trivia**: add the sermon and church questions (or import a JSON list).
2. `/admin/hunt`: set the opening and closing times, pass mark, the four keys, the clue texts and the rewards by finishing order. Upload a plain, unnumbered founders photo, list every founding member (and other spellings), and write the word hint players see after they get the list right.
3. Keys are the same for every team. Key 1 is given automatically to anyone who passes Game 1. Key 2 is the word built from the founders' names. Keys 3 and 4 are sent by the game master in WhatsApp.

**Dry run before the event** (use a private window and a test team name)
1. Play `/hunt/trivia` and pass; confirm Key 1 appears.
2. On `/hunt` unlock Game 2 with Key 1. Try one name too many, one too few and one wrong name (each should fail), then the exact list (the word step opens). Submit the word and confirm the Game 3 clue appears.
3. Enter Key 3 to see the Game 4 clue, then open the chest with all four keys and confirm the reward.
4. In `/admin/hunt` > Chest log, remove your test team so it does not take a finishing place.
5. Also remove test scores if needed: Supabase > Table Editor > `game_runs` (filter `game = hunt`).

**On the day**
- Games 1 and 2 only work between the opening and closing times; the chest and clue pages stay open.
- The first team to open the chest sees the first reward, the next sees the second, and so on. The log is in `/admin/hunt`.
- The Game 1 leaderboard shows the top scorer, who gets the bonus hint from the game master.
- Guesses are rate limited per visitor, so a wrong-key spree locks out for a few minutes.
