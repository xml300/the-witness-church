"use client";

import { useState, useTransition } from "react";
import { uploadImage } from "@/app/admin/_editor/fields";
import { deleteChestOpen, saveFounders, saveHuntConfig, type ConfigInput } from "./actions";

export type Founder = { name: string; aliases: string[] };
export type ChestRow = { id: string; team_name: string; opened_at: string };

const input =
  "w-full border border-gray-2 rounded-lg px-3 py-2 text-[14px] outline-none focus:border-navy bg-white";
const label = "grid gap-1 text-[13px] font-semibold text-text";
const card = "bg-white border border-gray-2 rounded-2xl p-5 grid gap-3";
const btn = "bg-red text-white text-[13px] font-semibold px-5 py-2 rounded-lg hover:bg-red-dark disabled:opacity-60";

/** ISO timestamp to the value a datetime-local input expects. */
function toLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function HuntAdmin({
  config,
  founders,
  chest,
  top,
}: {
  config: ConfigInput;
  founders: Founder[];
  chest: ChestRow[];
  top: { name: string; score: string }[];
}) {
  const [c, setC] = useState<ConfigInput>({ ...config, rewards: config.rewards ?? [] });
  const [opens, setOpens] = useState(toLocal(config.opens_at));
  const [closes, setCloses] = useState(toLocal(config.closes_at));
  const [opens34, setOpens34] = useState(toLocal(config.g34_opens_at ?? null));
  const [closes34, setCloses34] = useState(toLocal(config.g34_closes_at ?? null));
  const [people, setPeople] = useState<(Founder & { aliasText: string })[]>(
    founders.map((f) => ({ ...f, aliasText: f.aliases.join(", ") })),
  );
  const [chestRows, setChestRows] = useState(chest);
  const [msg, setMsg] = useState<{ where: string; text: string; bad?: boolean } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, start] = useTransition();

  const set = (patch: Partial<ConfigInput>) => setC((x) => ({ ...x, ...patch }));
  const say = (where: string, text: string, bad = false) => setMsg({ where, text, bad });

  function saveConfig() {
    start(async () => {
      const res = await saveHuntConfig({
        ...c,
        opens_at: opens ? new Date(opens).toISOString() : null,
        closes_at: closes ? new Date(closes).toISOString() : null,
        g34_opens_at: opens34 ? new Date(opens34).toISOString() : null,
        g34_closes_at: closes34 ? new Date(closes34).toISOString() : null,
      });
      say("config", res.ok ? "Settings saved." : res.error, !res.ok);
    });
  }

  function savePeople() {
    start(async () => {
      const res = await saveFounders(
        people.map((p) => ({
          name: p.name,
          aliases: p.aliasText.split(",").map((a) => a.trim()).filter(Boolean),
        })),
      );
      say("people", res.ok ? "People saved." : res.error, !res.ok);
    });
  }

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      set({ founders_photo_url: await uploadImage(file) });
      say("config", "Photo uploaded. Press Save settings to keep it.");
    } catch (e) {
      say("config", e instanceof Error ? e.message : "Upload failed.", true);
    } finally {
      setUploading(false);
    }
  }

  const note = (where: string) =>
    msg?.where === where && (
      <p role={msg.bad ? "alert" : "status"} className={`text-[13px] ${msg.bad ? "text-red-dark" : "text-green-800"}`}>
        {msg.text}
      </p>
    );

  return (
    <div className="grid gap-6">
      {/* ---------- timing and Game 1 ---------- */}
      <section className={card}>
        <h2 className="text-[16px] font-bold text-navy">Event and Game 1 (Church Trivia)</h2>
        <label className={label}>Event title
          <input value={c.title} onChange={(e) => set({ title: e.target.value })} className={input} />
        </label>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className={label}>Games 1 and 2 open
            <input type="datetime-local" value={opens} onChange={(e) => setOpens(e.target.value)} className={input} />
          </label>
          <label className={label}>Games 1 and 2 close
            <input type="datetime-local" value={closes} onChange={(e) => setCloses(e.target.value)} className={input} />
          </label>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className={label}>Pass mark (%)
            <input type="number" min={1} max={100} value={c.pass_mark} onChange={(e) => set({ pass_mark: Number(e.target.value) })} className={input} />
          </label>
          <label className={label}>Questions per round
            <input type="number" min={1} max={50} value={c.question_count} onChange={(e) => set({ question_count: Number(e.target.value) })} className={input} />
          </label>
          <label className={label}>Attempts per name
            <input
              type="number"
              min={1}
              max={20}
              placeholder="Unlimited"
              value={c.max_attempts ?? ""}
              onChange={(e) => set({ max_attempts: e.target.value ? Number(e.target.value) : null })}
              className={input}
            />
          </label>
        </div>
        <p className="text-[12px] text-muted">Leave a date empty for no limit. Times use this computer&rsquo;s time zone.</p>
      </section>

      {/* ---------- keys ---------- */}
      <section className={card}>
        <h2 className="text-[16px] font-bold text-navy">The four keys</h2>
        <p className="text-[13px] text-muted">
          The same for every team. Together they open the chest. Key 1 is shown to anyone who passes Game 1.
          Key 2 is the word players build from the founders&rsquo; names. Key 3 is handed to anyone who passes Game 3. Key 4 is handed to anyone who finds the key phrase in the pastor&rsquo;s video.
          Capital letters, spaces and punctuation are ignored when players type them.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className={label}>Key 1 (Game 1 prize)
            <input value={c.key1} onChange={(e) => set({ key1: e.target.value })} className={input} autoComplete="off" />
          </label>
          <label className={label}>Key 2 (the word from Game 2)
            <input value={c.key2} onChange={(e) => set({ key2: e.target.value })} className={input} autoComplete="off" />
          </label>
          <label className={label}>Key 3 (Game 3 prize)
            <input value={c.key3} onChange={(e) => set({ key3: e.target.value })} className={input} autoComplete="off" />
          </label>
          <label className={label}>Key 4 (Game 4 prize)
            <input value={c.key4} onChange={(e) => set({ key4: e.target.value })} className={input} autoComplete="off" />
          </label>
        </div>
      </section>

      {/* ---------- games 3 and 4 ---------- */}
      <section className={card}>
        <h2 className="text-[16px] font-bold text-navy">Game 3 (Year 2 Sermon Quiz)</h2>
        <p className="text-[13px] text-muted">
          Played on your own, like Game 1. Add the questions under{" "}
          <a href="/admin/games" className="underline text-navy">Game content</a>, on the Sermon Quiz tab. Anyone who
          reaches the pass mark is handed Key 3 automatically.
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className={label}>Pass mark (%)
            <input type="number" min={1} max={100} value={c.g3_pass_mark} onChange={(e) => set({ g3_pass_mark: Number(e.target.value) })} className={input} />
          </label>
          <label className={label}>Questions per round
            <input type="number" min={1} max={50} value={c.g3_question_count} onChange={(e) => set({ g3_question_count: Number(e.target.value) })} className={input} />
          </label>
          <label className={label}>Attempts per name
            <input
              type="number"
              min={1}
              max={20}
              placeholder="Unlimited"
              value={c.g3_max_attempts ?? ""}
              onChange={(e) => set({ g3_max_attempts: e.target.value ? Number(e.target.value) : null })}
              className={input}
            />
          </label>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className={label}>Games 3 and 4 open
            <input type="datetime-local" value={opens34} onChange={(e) => setOpens34(e.target.value)} className={input} />
          </label>
          <label className={label}>Games 3 and 4 close
            <input type="datetime-local" value={closes34} onChange={(e) => setCloses34(e.target.value)} className={input} />
          </label>
        </div>
        <p className="text-[12px] text-muted">Leave a date empty for no limit.</p>
      </section>

      <section className={card}>
        <h2 className="text-[16px] font-bold text-navy">Game 4 (The Pastor&rsquo;s Video)</h2>
        <p className="text-[13px] text-muted">
          Players who have Key 3 see the video and type the key phrase they find in it. A correct phrase hands them Key 4 above. The phrase itself is not a key.
        </p>
        <label className={label}>Link to the video
          <input value={c.video_url} onChange={(e) => set({ video_url: e.target.value })} className={input} placeholder="https://www.youtube.com/watch?v=…" autoComplete="off" />
        </label>
        <p className="text-[12px] text-muted">
          YouTube, Vimeo and Google Drive links play on the page. A direct .mp4 link works too. For YouTube, set the
          video to Unlisted so only people with the link can find it. Once a video is posted, anyone with its link can
          watch it, but the key phrase itself stays hidden until a player types it correctly.
        </p>
        <label className={label}>Key phrase (the answer to find in the video; capital letters, spaces and punctuation are ignored)
          <input value={c.key_phrase} onChange={(e) => set({ key_phrase: e.target.value })} className={input} autoComplete="off" />
        </label>
        <label className={label}>Video title (optional)
          <input value={c.video_title} onChange={(e) => set({ video_title: e.target.value })} className={input} />
        </label>
        <label className={label}>Instructions shown above the video (optional)
          <textarea rows={2} value={c.video_intro} onChange={(e) => set({ video_intro: e.target.value })} className={input} placeholder="Watch closely. Somewhere in this message is the key phrase." />
        </label>
      </section>

      {/* ---------- game 2 ---------- */}
      <section className={card}>
        <h2 className="text-[16px] font-bold text-navy">Game 2 (Founding Members)</h2>
        <label className={label}>Instructions shown above the photo
          <textarea rows={2} value={c.founders_intro} onChange={(e) => set({ founders_intro: e.target.value })} className={input} />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          {c.founders_photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.founders_photo_url} alt="Founders" className="h-20 rounded-lg border border-gray-2" />
          )}
          <label className="text-[13px] font-semibold text-navy cursor-pointer underline">
            {uploading ? "Uploading…" : c.founders_photo_url ? "Replace the photo" : "Upload the photo"}
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => void pickPhoto(e.target.files?.[0])} />
          </label>
        </div>
        <p className="text-[12px] text-muted">
          Upload a plain photo with no numbers or labels. Players have to work out who the founding members are. The
          photo link is hidden until Key 1 is entered, but anyone who finds the link could open it, so avoid sharing it.
        </p>
        <label className={label}>Word hint (shown only after a player names every founding member)
          <textarea rows={2} value={c.word_hint} onChange={(e) => set({ word_hint: e.target.value })} className={input} placeholder="For example: take the first letter of each name, in order of age." />
        </label>
      </section>

      {/* ---------- clues and rewards ---------- */}
      <section className={card}>
        <h2 className="text-[16px] font-bold text-navy">Clue pages</h2>
        <p className="text-[12px] text-muted">Players read the first clue after Game 2 and the second after Game 3.</p>
        <label className={label}>Clue for Game 3 (opens with Key 2): title
          <input value={c.clue2_title} onChange={(e) => set({ clue2_title: e.target.value })} className={input} />
        </label>
        <label className={label}>Clue for Game 3: text
          <textarea rows={3} value={c.clue2_body} onChange={(e) => set({ clue2_body: e.target.value })} className={input} placeholder="Next up is the Year 2 Sermon Quiz…" />
        </label>
        <label className={label}>Clue for Game 4 (opens with Key 3): title
          <input value={c.clue3_title} onChange={(e) => set({ clue3_title: e.target.value })} className={input} />
        </label>
        <label className={label}>Clue for Game 4: text
          <textarea rows={3} value={c.clue3_body} onChange={(e) => set({ clue3_body: e.target.value })} className={input} />
        </label>
      </section>

      <section className={card}>
        <h2 className="text-[16px] font-bold text-navy">Rewards by finishing order</h2>
        <p className="text-[13px] text-muted">
          Shown only after a team opens the chest. The first team sees the first line, the second team the second, and
          so on. Teams beyond your list see the default reward.
        </p>
        {c.rewards.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-8 text-[13px] font-bold text-navy">#{i + 1}</span>
            <input
              value={r}
              onChange={(e) => set({ rewards: c.rewards.map((x, j) => (j === i ? e.target.value : x)) })}
              className={input}
            />
            <button type="button" onClick={() => set({ rewards: c.rewards.filter((_, j) => j !== i) })} className="text-[13px] text-muted hover:text-red-dark">
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={() => set({ rewards: [...c.rewards, ""] })} className="justify-self-start text-[13px] font-semibold text-navy underline">
          Add a place
        </button>
        <label className={label}>Default reward (every later team)
          <input value={c.reward_default} onChange={(e) => set({ reward_default: e.target.value })} className={input} />
        </label>
        <label className={label}>Note for you: bonus hint for the Game 1 top scorer (not shown to players)
          <textarea rows={2} value={c.bonus_hint} onChange={(e) => set({ bonus_hint: e.target.value })} className={input} />
        </label>
        {top.length > 0 && (
          <p className="text-[13px] text-text">
            Current Game 1 leaders: {top.map((t, i) => `${i + 1}. ${t.name} (${t.score})`).join(", ")}
          </p>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button disabled={busy} onClick={saveConfig} className={btn}>
          {busy ? "Saving…" : "Save settings"}
        </button>
        {note("config")}
      </div>

      {/* ---------- founders ---------- */}
      <section className={card}>
        <h2 className="text-[16px] font-bold text-navy">Founding members (answers)</h2>
        <p className="text-[13px] text-muted">
          List every founding member, and only them. Players must type exactly this many names, each one matching a
          different person here, to pass Game 2. A name counts if it is the full name, any single name of 3 or more
          letters, or one of the other spellings you list. There are currently <strong>{people.filter((p) => p.name.trim()).length}</strong> founding members.
        </p>
        {people.map((p, i) => (
          <div key={i} className="grid grid-cols-[1.5rem_1fr_1fr_auto] gap-2 items-center">
            <span className="text-[13px] font-bold text-muted">{i + 1}.</span>
            <input
              aria-label="Name"
              placeholder="Full name"
              value={p.name}
              onChange={(e) => setPeople(people.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
              className={input}
            />
            <input
              aria-label="Other spellings"
              placeholder="Other spellings, comma separated"
              value={p.aliasText}
              onChange={(e) => setPeople(people.map((x, j) => (j === i ? { ...x, aliasText: e.target.value } : x)))}
              className={input}
            />
            <button type="button" onClick={() => setPeople(people.filter((_, j) => j !== i))} className="text-[13px] text-muted hover:text-red-dark">
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setPeople([...people, { name: "", aliases: [], aliasText: "" }])}
          className="justify-self-start text-[13px] font-semibold text-navy underline"
        >
          Add a person
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <button disabled={busy} onClick={savePeople} className={btn}>Save people</button>
          {note("people")}
        </div>
      </section>

      {/* ---------- chest log ---------- */}
      <section className={card}>
        <h2 className="text-[16px] font-bold text-navy">Chest log</h2>
        {chestRows.length === 0 ? (
          <p className="text-[13px] text-muted">No team has opened the chest yet.</p>
        ) : (
          <ol className="grid gap-1">
            {chestRows.map((r, i) => (
              <li key={r.id} className="flex items-center gap-3 text-[14px]">
                <strong className="w-8 text-navy">#{i + 1}</strong>
                <span className="flex-1">{r.team_name}</span>
                <span className="text-muted text-[12px]">{new Date(r.opened_at).toLocaleString()}</span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    start(async () => {
                      const res = await deleteChestOpen(r.id);
                      if (res.ok) setChestRows((rows) => rows.filter((x) => x.id !== r.id));
                      else say("chest", res.error, true);
                    })
                  }
                  className="text-[13px] text-muted hover:text-red-dark"
                >
                  Remove
                </button>
              </li>
            ))}
          </ol>
        )}
        <p className="text-[12px] text-muted">Removing a row lets that team open the chest again, and moves later teams up.</p>
        {note("chest")}
      </section>
    </div>
  );
}
