# Admin setup (one time)

Login is email and password. No email is ever sent, so the admin email can be a placeholder.

1. **Create the project.** At supabase.com create a free project.
2. **Run the database script.** Paste all of `schema.sql` into Dashboard > SQL Editor > Run. It allows `admin@thewitnesschurch.com`. Change that line first if you want a different address.
3. **Create the admin user.** Dashboard > Authentication > Users > Add user > Create new user.
   - Email: the same address as in step 2.
   - Password: choose a strong one.
   - Tick **Auto Confirm User**. This is what skips email confirmation.
4. **Add the keys.** Copy `.env.example` to `.env.local`. Fill in the Project URL and the `anon` public key from Project Settings > API. Never use the `service_role` key here.
5. **Restart** `npm run dev`, open `/admin` and sign in with that email and password.
6. **Lock sign-ups.** Authentication > Sign In / Providers > turn off "Allow new users to sign up". Even without this, only emails in the `admins` table can change anything.
7. **Vercel.** Add the same two environment variables in the Vercel project settings, then redeploy.

## Draft support (run once if you set up before the editor redesign)

The editor saves unpublished work as a draft row. Run `supabase/migration-002-draft.sql` in the SQL Editor so the public API never returns that row. The editor works without it, but drafts would be readable by anyone who queries the API directly.

## Changing the email later

Create the new user in the dashboard (Auto Confirm User ticked), then add the same email to the `admins` table. Delete the old rows if you no longer want that account.

## Keeping the free project awake

Free Supabase projects pause after about a week without activity. A free scheduled ping, such as a weekly GitHub Action requesting the home page, prevents that.

## Limits to know

- Uploaded photos are shrunk in the browser to at most 1920px and capped at 5 MB.
- Pasted image links must come from `images.unsplash.com` or your Supabase storage.

## Sermon library (YouTube)

1. In the editor open Homepage > Sermons and paste the channel link or its **@handle** (for example `@thewitnesschurch`). You do not need the channel ID or any access to the channel's back end. The site reads the public channel page to find it.
2. Set **Sermon title must contain** to the text that marks church sermons, for example `The Witness Church`. Leave it empty to include every upload.
3. Publish, then reload. Without a key the 15 newest videos load. For the whole archive create a free key: Google Cloud Console > new project > enable **YouTube Data API v3** > Credentials > API key. Put it in `YOUTUBE_API_KEY` (and in Vercel). The free quota is far more than this site uses.

## Prayer wall

1. Run `supabase/migration-003-prayers.sql` in the SQL Editor.
2. Approve or remove wall requests at `/admin/prayers`. Nothing appears publicly until you approve it.
3. **Pastor requests to a Google Sheet.** Do this once.
   1. Create a new Google Sheet, for example "Prayer requests for Pastor". Leave it empty.
   2. In the Sheet open **Extensions > Apps Script**. Delete the starter code and paste in the contents of `supabase/pastor-sheet.gs`.
   3. Change the `SECRET` line to a long random string. Copy that same string; you need it in step 7.
   4. Click **Deploy > New deployment**. Click the gear next to "Select type" and choose **Web app**.
   5. Set **Execute as: Me** and **Who has access: Anyone**. Click **Deploy** and approve the permissions Google asks for (it may say the app is unverified; choose Advanced, then continue).
   6. Copy the **Web app URL**. It starts with `https://script.google.com/` and ends with `/exec`.
   7. In the website's `.env` file set the two values, then restart `npm run dev`:
      ```
      GOOGLE_SHEET_WEBHOOK_URL=the web app URL from step 6
      GOOGLE_SHEET_SECRET=the secret from step 3
      ```
   8. In the editor open Homepage > Prayer wall and press **Send a test to the sheet**. A row marked TEST should appear in the Sheet. If it fails, the message says what to fix.
   9. Share the Sheet with the pastor (Share > add their email as Viewer). Add the same two variables in Vercel before going live.

   The sheet has four columns: Received, Category, Prayer request and Name (optional). Visitors who choose "The pastor" are asked for a name, clearly marked optional. The name goes only to this sheet.

   If you change the script later, use **Deploy > Manage deployments > Edit > New version** so the URL stays the same.

Requests meant for the pastor are never stored in the website's database. Until the two variables are set, the pastor option on the form is greyed out.

## Social posts

YouTube posts come from the channel automatically. For every other platform, paste the link to a post under Homepage > Social clips. The platform is detected from the link, and TikTok and YouTube links fill in their own caption and thumbnail. A platform with a profile link in Site details but no posts shows a Follow card. Instagram and Facebook cannot list a profile's posts from a username; that needs the Meta tokens below. Instagram and Facebook need Meta tokens in the variables above (a business or creator Instagram account and a Facebook Page). TikTok and X cannot be read for free, so add those posts by hand under Homepage > Social clips.

## Events

Add and pin events under the Events page in the editor. The homepage shows events in the next 7 days plus anything pinned.

## Watch Live

Watch Live goes to the stream that is on air right now, as long as its title contains the sermon title text (for example "The Witness Church"). The button then reads "Live now". When nothing is live it goes to the Watch Live link in Site details, or to the channel's own live page. Detecting a live stream needs the YouTube API key, which any Google account can create without owning the channel.

## Bible games

1. Run `supabase/migration-004-games.sql`, then `supabase/migration-005-games-seed.sql`, in the SQL Editor.
2. Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` and to Vercel (Project Settings > API > `service_role`). It is used only on the server. Never prefix it with `NEXT_PUBLIC_`.
3. Play at `/games/bible-quiz` and `/games/bible-quote`. Anyone can create a room (code plus link) with its own level, size, time limit and attempt limit.
4. Manage content at `/admin/games`: add, edit, hide and import questions and verses. Hidden items stay in the database so old scores keep working.

Both games share one scale: Easy, Medium, Hard, Expert, plus All levels. For Bible Quote: Easy hides one word, Medium hides every blankable word, Hard asks for the whole verse with a hint, Expert asks for it from the reference alone.

## Anniversary treasure hunt

1. Run `supabase/migration-006-hunt.sql` in the SQL Editor (after migration-004).
2. Manage it at `/admin/hunt`; add Church Trivia questions at `/admin/games`. Players start at `/hunt`.
3. See DEPLOYMENT.md for the dry-run checklist and event-day notes.

### Games 3 and 4 (in the app)

1. Run `supabase/migration-007-games-3-4.sql`. It only adds things (a `sermon` game id and new settings columns), so it does not reset runs, keys or chest openings and is safe while the hunt is live. Run it **before** deploying the new code.
2. Game 3, the Year 2 Sermon Quiz (`/hunt/sermon`): add questions at `/admin/games` on the Sermon Quiz tab. It opens with Key 2 and hands out Key 3 to anyone who passes. Set its pass mark, size and attempts at `/admin/hunt`.
3. Game 4, the pastor's video: paste the video link at `/admin/hunt`. Players with Key 3 watch it on the hunt page and type the key phrase you set. A correct phrase hands them Key 4. You can list other accepted answers, and a sentence that contains the phrase also passes.
4. Keys already handed out in WhatsApp still work: typing Key 3 on `/hunt` still opens Game 4.
