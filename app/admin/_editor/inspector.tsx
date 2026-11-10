"use client";

import { useState } from "react";
import { testPastorSheet } from "../actions";
import { todayInLagos } from "@/src/lib/content/events";
import { BLOCK_BY_KEY, type BlockDef, type Field } from "@/src/lib/content/schema";
import { formatMedium } from "@/src/lib/content/events";
import { FieldInput, type Row } from "./fields";
import { sectionLabel, type EditorCtx } from "./panels";

type ObjectKey = "site_info" | "about" | "devotion" | "prayer";
type ListKey = Exclude<BlockDef["key"], ObjectKey>;

type Spec = {
  object?: { key: ObjectKey; fields?: string[] };
  lists?: ListKey[];
  extra?: "sermons" | "clips" | "prayer" | "announcements" | "categories";
  note?: string;
};

const SITE_FIELDS = [
  "churchName", "location", "liveUrl", "footerBlurb", "copyright",
  "socialYoutube", "socialFacebook", "socialInstagram", "socialTiktok", "socialX",
];

const HERO_FIELDS = [
  "heroEyebrow", "heroLine1", "heroAccent", "heroLine2", "heroSubtext",
  "heroShade", "primaryCtaLabel", "primaryCtaHref", "secondaryCtaLabel",
  "secondaryCtaHref",
];

const INSPECTOR: Record<string, Spec> = {
  site: { object: { key: "site_info", fields: SITE_FIELDS } },
  hero: { object: { key: "site_info", fields: HERO_FIELDS }, lists: ["hero_slides"] },
  welcome: {
    object: { key: "site_info", fields: ["welcomeTag", "welcomeTitle", "welcomeSubtext"] },
    lists: ["welcome_cards"],
  },
  devotion: {
    object: { key: "devotion" },
    note: "The verse changes every day on its own. Only the wording around it is edited here.",
  },
  announcements: { extra: "announcements" },
  sermons: {
    object: { key: "site_info", fields: ["youtubeChannelId", "sermonTitleFilter"] },
    lists: ["pinned_sermons"],
    extra: "sermons",
  },
  clips: { lists: ["clips"], extra: "clips" },
  games: { lists: ["games"] },
  prayer: { object: { key: "prayer" }, extra: "prayer" },
  about: { object: { key: "about" } },
  connect: { lists: ["locations", "leaders", "gallery"] },
  events: { lists: ["events"], extra: "categories" },
};

function fieldList(key: ObjectKey, names?: string[]): Field[] {
  const all = BLOCK_BY_KEY[key].fields;
  return names ? names.map((n) => all.find((f) => f.name === n)!) : all;
}

/* ---------- event categories ---------- */

/** Adds a category if the name is free. Returns an error message, or null. */
function makeAddCategory(ctx: EditorCtx) {
  return (raw: string): string | null => {
    const name = raw.trim();
    if (!name) return "Type a name for the category.";
    if (ctx.S.event_categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      return "That category already exists.";
    }
    ctx.mutate("catAdd", (d) => {
      d.event_categories.push({ name });
    });
    return null;
  };
}

const categoryProps = (ctx: EditorCtx) => ({
  categories: ctx.S.event_categories.map((c) => c.name),
  onAddCategory: makeAddCategory(ctx),
});

function CategoryManager({ ctx }: { ctx: EditorCtx }) {
  const { S, mutate } = ctx;
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState<number | null>(null);
  const [name, setName] = useState("");
  const add = makeAddCategory(ctx);
  const uses = (n: string) => S.events.filter((e) => e.category === n).length;

  function rename(i: number, raw: string) {
    const next = raw.trim();
    const old = S.event_categories[i].name;
    if (next === old) return;
    if (!next) return setError("A category needs a name.");
    if (S.event_categories.some((c, k) => k !== i && c.name.toLowerCase() === next.toLowerCase())) {
      return setError(`"${next}" already exists.`);
    }
    setError("");
    mutate(`catRename.${i}`, (d) => {
      d.event_categories[i].name = next;
      // Events using the old name follow the rename.
      for (const e of d.events) if (e.category === old) e.category = next;
    });
  }

  return (
    <details className="ed-item" style={{ marginBottom: 12 }}>
      <summary>
        <span className="ed-ttl">Manage categories · {S.event_categories.length}</span>
        <span className="ed-chev" aria-hidden="true">▾</span>
      </summary>
      <div className="ed-body">
        <p className="ed-hint" style={{ marginBottom: 10 }}>
          Rename a category and every event using it follows. Deleting one
          leaves its events with no category.
        </p>
        {S.event_categories.map((c, i) => (
          <div className="ed-catrow" key={`${i}-${c.name}`}>
            <input
              type="text"
              defaultValue={c.name}
              maxLength={24}
              aria-label={`Rename category ${c.name}`}
              onBlur={(e) => rename(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
            />
            <span className="ed-sub-note">{uses(c.name)} event{uses(c.name) === 1 ? "" : "s"}</span>
            <button
              type="button"
              className={`ed-mini${confirming === i ? " ed-danger" : ""}`}
              onClick={() => {
                if (confirming !== i) return setConfirming(i);
                setConfirming(null);
                mutate(`catDel.${i}`, (d) => {
                  const gone = d.event_categories[i].name;
                  d.event_categories.splice(i, 1);
                  for (const e of d.events) if (e.category === gone) e.category = "";
                });
              }}
              onBlur={() => setConfirming(null)}
            >
              {confirming === i ? "Click again to delete" : "Delete"}
            </button>
          </div>
        ))}
        <div className="ed-catrow" style={{ marginTop: 8 }}>
          <input
            type="text"
            value={name}
            maxLength={24}
            placeholder="New category"
            aria-label="New category name"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const err = add(name);
                setError(err ?? "");
                if (!err) setName("");
              }
            }}
          />
          <button
            type="button"
            className="ed-mini"
            onClick={() => {
              const err = add(name);
              setError(err ?? "");
              if (!err) setName("");
            }}
          >
            Add
          </button>
        </div>
        {error && <p className="ed-error" style={{ marginTop: 8 }}>{error}</p>}
      </div>
    </details>
  );
}

/* ---------- list editor ---------- */

function ListEditor({ def, ctx }: { def: BlockDef; ctx: EditorCtx }) {
  const { S, mutate, setPick, setTab } = ctx;
  const catProps = categoryProps(ctx);
  const arr = S[def.key] as unknown as Row[];
  const max = def.maxItems ?? 20;
  const imgField = def.fields.find((f) => f.type === "image");

  return (
    <>
      <div className="ed-sub">
        {def.title} · {arr.length}
      </div>
      {arr.length === 0 && <p className="ed-hint" style={{ marginBottom: 8 }}>{def.description}</p>}
      {arr.map((it, i) => (
        <details key={i} className="ed-item" open={arr.length === 1}>
          <summary>
            {imgField && (
              <span
                className="ed-thumb"
                style={
                  it[imgField.name]
                    ? { backgroundImage: `url("${String(it[imgField.name])}")` }
                    : undefined
                }
              />
            )}
            <span className="ed-ttl">
              {String(it[def.titleField ?? def.fields[0].name] || "Untitled")}
            </span>
            <span className="ed-chev" aria-hidden="true">▾</span>
          </summary>
          <div className="ed-body">
            {def.fields.map((f) => (
              <FieldInput
                key={f.name}
                field={f}
                {...catProps}
            {...catProps}
                value={it[f.name]}
                onChange={(v) =>
                  mutate(`${def.key}.${i}.${f.name}`, (d) => {
                    (d[def.key] as unknown as Row[])[i][f.name] = v;
                  })
                }
                onPickImage={() => {
                  setPick(`${def.key}.${i}.${f.name}`);
                  setTab("media");
                }}
              />
            ))}
          </div>
          <div className="ed-tools">
            <button
              type="button"
              className="ed-mini"
              disabled={i === 0}
              aria-label="Move up"
              onClick={() =>
                mutate("lmove", (d) => {
                  const a = d[def.key] as unknown as Row[];
                  [a[i - 1], a[i]] = [a[i], a[i - 1]];
                })
              }
            >
              ↑
            </button>
            <button
              type="button"
              className="ed-mini"
              disabled={i === arr.length - 1}
              aria-label="Move down"
              onClick={() =>
                mutate("lmove", (d) => {
                  const a = d[def.key] as unknown as Row[];
                  [a[i + 1], a[i]] = [a[i], a[i + 1]];
                })
              }
            >
              ↓
            </button>
            <button
              type="button"
              className="ed-mini ed-danger"
              onClick={() =>
                mutate("ldel", (d) => {
                  (d[def.key] as unknown as Row[]).splice(i, 1);
                })
              }
            >
              Delete
            </button>
          </div>
        </details>
      ))}
      <button
        type="button"
        className="ed-add"
        disabled={arr.length >= max}
        onClick={() =>
          mutate("ladd", (d) => {
            const row = { ...(def.blank ?? {}) } as Row;
            // A required date must never start empty.
            for (const f of def.fields) {
              if (f.type === "date" && !f.optional && !row[f.name]) row[f.name] = todayInLagos();
            }
            (d[def.key] as unknown as Row[]).push(row);
          })
        }
      >
        + Add item
      </button>
    </>
  );
}

/* ---------- event form (opened from the calendar) ---------- */

/** The form behind a click on the calendar. A new event is only added when
 *  the admin presses the button; an existing one is edited in place. */
function EventForm({ ctx }: { ctx: EditorCtx }) {
  const { S, mutate, eventFocus, setEventFocus, setPick, setTab } = ctx;
  const catProps = categoryProps(ctx);
  const def = BLOCK_BY_KEY.events;
  const [draft, setDraft] = useState<Row>(() => ({
    ...(def.blank ?? {}),
    ...(eventFocus?.mode === "new" ? { date: eventFocus.date } : {}),
  }));
  const [error, setError] = useState("");

  if (!eventFocus) return null;

  if (eventFocus.mode === "new") {
    const add = () => {
      if (!String(draft.title).trim()) return setError("Give the event a title.");
      if (!draft.date) return setError("Pick a date.");
      setError("");
      const index = S.events.length;
      mutate("eventAdd", (d) => {
        (d.events as unknown as Row[]).push({ ...draft });
      });
      setEventFocus({ mode: "edit", index });
    };
    return (
      <>
        <div className="ed-sub" style={{ marginTop: 0 }}>New event</div>
        {def.fields.map((f) => (
          <FieldInput
            key={f.name}
            field={f}
            {...catProps}
            value={draft[f.name]}
            onChange={(v) => setDraft((p) => ({ ...p, [f.name]: v }))}
            onPickImage={() => {
              setError("Add the event first, then you can choose its photo.");
            }}
          />
        ))}
        {error && <p className="ed-error">{error}</p>}
        <div className="ed-row" style={{ justifyContent: "flex-start" }}>
          <button type="button" className="ed-btn ed-primary" onClick={add}>
            Add to calendar
          </button>
          <button type="button" className="ed-btn" onClick={() => setEventFocus(null)}>
            Cancel
          </button>
        </div>
      </>
    );
  }

  const i = eventFocus.index;
  const ev = (S.events as unknown as Row[])[i];
  if (!ev) {
    return <p className="ed-tip">That event no longer exists.</p>;
  }
  return (
    <>
      <div className="ed-sub" style={{ marginTop: 0 }}>Edit event</div>
      {def.fields.map((f) => (
        <FieldInput
          key={f.name}
          field={f}
          value={ev[f.name]}
          onChange={(v) =>
            mutate(`events.${i}.${f.name}`, (d) => {
              (d.events as unknown as Row[])[i][f.name] = v;
            })
          }
          onPickImage={() => {
            setPick(`events.${i}.${f.name}`);
            setTab("media");
          }}
        />
      ))}
      <div className="ed-row" style={{ justifyContent: "flex-start", flexWrap: "wrap" }}>
        <button type="button" className="ed-btn ed-primary" onClick={() => setEventFocus(null)}>
          Done
        </button>
        <button
          type="button"
          className="ed-btn"
          onClick={() => {
            mutate("eventDup", (d) => {
              const list = d.events as unknown as Row[];
              list.splice(i + 1, 0, { ...list[i], title: `${list[i].title} (copy)` });
            });
            setEventFocus({ mode: "edit", index: i + 1 });
          }}
        >
          Duplicate
        </button>
        <button
          type="button"
          className="ed-btn ed-danger"
          onClick={() => {
            mutate("eventDel", (d) => {
              (d.events as unknown as Row[]).splice(i, 1);
            });
            setEventFocus(null);
          }}
        >
          Delete
        </button>
      </div>
    </>
  );
}

/* ---------- sermon library picker ---------- */

function SermonPicker({ ctx }: { ctx: EditorCtx }) {
  const { S, mutate, library, info } = ctx;
  const [query, setQuery] = useState("");
  const pinned = new Set(S.pinned_sermons.map((p) => p.videoId));
  const q = query.trim().toLowerCase();
  const shown = library
    .filter((v) => !q || v.title.toLowerCase().includes(q))
    .slice(0, 30);

  const channelSet = Boolean(S.site_info.youtubeChannelId);

  return (
    <>
      <div className="ed-sub">Sermon library · {library.length}</div>
      {!channelSet ? (
        <p className="ed-tip">
          Add your YouTube channel above, publish, and the library fills in.
        </p>
      ) : library.length === 0 ? (
        <p className="ed-tip">
          No videos found yet. Check the channel and the title filter, then
          publish. Library changes show after you publish and reload.
        </p>
      ) : (
        <>
          {!info.youtubeKey && (
            <p className="ed-tip" style={{ marginTop: 0 }}>
              Only the 15 newest videos load without a YouTube API key. Add
              one to load the whole archive (see the setup guide).
            </p>
          )}
          <div className="ed-field">
            <label htmlFor="sermon-find">Find a message to pin</label>
            <input
              id="sermon-find"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title"
            />
          </div>
          <ul className="ed-srows">
            {shown.map((v) => {
              const on = pinned.has(v.id);
              return (
                <li key={v.id} className="ed-srow">
                  <span
                    className="ed-thumb"
                    style={{ backgroundImage: `url("${v.thumb}")` }}
                  />
                  <span className="ed-nm" style={{ minWidth: 0 }}>
                    <span className="ed-ttl" style={{ display: "block" }}>{v.title}</span>
                    <span className="ed-sub-note">{v.date ? formatMedium(v.date) : ""}</span>
                  </span>
                  <button
                    type="button"
                    className="ed-tiny"
                    disabled={!on && S.pinned_sermons.length >= 6}
                    onClick={() =>
                      mutate("pin", (d) => {
                        if (on) {
                          d.pinned_sermons = d.pinned_sermons.filter(
                            (p) => p.videoId !== v.id,
                          );
                        } else {
                          d.pinned_sermons.push({ videoId: v.id, title: v.title });
                        }
                      })
                    }
                  >
                    {on ? "Unpin" : "Pin"}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}

/* ---------- status notes ---------- */

function SheetTest() {
  const [state, setState] = useState<{
    kind: "idle" | "busy" | "ok" | "error";
    text: string;
  }>({ kind: "idle", text: "" });
  return (
    <div style={{ marginTop: 12 }}>
      <button
        type="button"
        className="ed-btn"
        disabled={state.kind === "busy"}
        onClick={async () => {
          setState({ kind: "busy", text: "" });
          const r = await testPastorSheet();
          setState(
            r.ok
              ? { kind: "ok", text: "Sent. Check the sheet for a row marked TEST." }
              : { kind: "error", text: r.error },
          );
        }}
      >
        {state.kind === "busy" ? "Sending…" : "Send a test to the sheet"}
      </button>
      {state.kind === "ok" && (
        <p className="ed-hint" style={{ color: "var(--good)", marginTop: 6 }}>
          {state.text}
        </p>
      )}
      {state.kind === "error" && (
        <p className="ed-error" style={{ marginTop: 6 }}>
          {state.text}
        </p>
      )}
    </div>
  );
}

function Status({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="ed-chk">
      <span className={`ed-pill ${ok ? "ok" : "no"}`}>{ok ? "On" : "Off"}</span>
      <span>{children}</span>
    </li>
  );
}

function Extra({ kind, ctx }: { kind: NonNullable<Spec["extra"]>; ctx: EditorCtx }) {
  const { info, S } = ctx;
  if (kind === "sermons") return <SermonPicker ctx={ctx} />;
  if (kind === "categories") return <CategoryManager ctx={ctx} />;
  if (kind === "announcements") {
    return (
      <p className="ed-tip">
        This section picks itself from the events calendar: anything
        happening in the next 7 days, plus any event you pin. To change it,
        edit the events on the Events page, or pin an event there.
      </p>
    );
  }
  if (kind === "clips") {
    return (
      <>
        <div className="ed-sub">Where posts come from</div>
        <ul className="ed-checks" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          <Status ok={Boolean(S.site_info.youtubeChannelId)}>
            YouTube: latest uploads, from the channel in Sermons
          </Status>
          <Status ok={info.instagram}>Instagram: latest posts (needs a Meta token)</Status>
          <Status ok={info.facebook}>Facebook: latest posts (needs a Meta token)</Status>
        </ul>
        <p className="ed-hint" style={{ marginTop: 8 }}>
          Instagram, Facebook, TikTok and X do not let anyone list a profile&apos;s
          posts from a username. Paste the link to a post below and it shows
          beside the automatic ones. Until then, each channel with a link
          in Site details shows a Follow card.
        </p>
      </>
    );
  }
  return (
    <>
      <div className="ed-sub">Delivery</div>
      <ul className="ed-checks" style={{ listStyle: "none", padding: 0, margin: 0 }}>
        <Status ok={info.sheet}>
          Pastor requests go to the Google Sheet
        </Status>
      </ul>
      {!info.sheet && (
        <p className="ed-hint" style={{ marginTop: 8 }}>
          Until the sheet is connected, visitors can only post to the wall.
          See the setup guide.
        </p>
      )}
      <SheetTest />
      <a className="ed-btn" style={{ marginTop: 12, textDecoration: "none" }} href="/admin/prayers">
        Review requests{info.pendingPrayers > 0 ? ` (${info.pendingPrayers} waiting)` : ""}
      </a>
    </>
  );
}

/* ---------- inspector ---------- */

export function Inspector({ id, ctx }: { id: string; ctx: EditorCtx }) {
  const spec = INSPECTOR[id] ?? {};
  const { S, mutate, setSel, setPick, setTab, eventFocus, setEventFocus } = ctx;
  const obj = spec.object;
  const formOpen = id === "events" && eventFocus !== null;
  const catProps = categoryProps(ctx);

  return (
    <>
      <button
        type="button"
        className="ed-backlink"
        onClick={() => (formOpen ? setEventFocus(null) : setSel(null))}
      >
        ‹ {formOpen ? "All events" : "Back"}
      </button>
      <h2>{sectionLabel(id)}</h2>
      <p className="ed-lede">
        {id === "events" && !formOpen
          ? "Click a day on the calendar to add an event, or click an event to change it."
          : "Changes show on the page instantly."}
      </p>
      {spec.note && <p className="ed-tip" style={{ marginTop: 0, marginBottom: 14 }}>{spec.note}</p>}

      {obj &&
        fieldList(obj.key, obj.fields).map((f) => (
          <FieldInput
            key={`${obj.key}.${f.name}`}
            field={f}
            {...catProps}
            value={(S[obj.key] as unknown as Row)[f.name]}
            onChange={(v) =>
              mutate(`${obj.key}.${f.name}`, (d) => {
                (d[obj.key] as unknown as Row)[f.name] = v;
              })
            }
            onPickImage={() => {
              setPick(`${obj.key}.${f.name}`);
              setTab("media");
            }}
          />
        ))}

      {formOpen && (
        <EventForm
          key={
            eventFocus?.mode === "new"
              ? `new-${eventFocus.date}-${eventFocus.n}`
              : `edit-${eventFocus?.mode === "edit" ? eventFocus.index : ""}`
          }
          ctx={ctx}
        />
      )}
      {id === "events" && !formOpen && (
        <button
          type="button"
          className="ed-btn ed-primary"
          style={{ marginBottom: 12 }}
          onClick={() =>
            setEventFocus({ mode: "new", date: todayInLagos(), n: Date.now() })
          }
        >
          + Add event
        </button>
      )}
      {spec.extra && <Extra kind={spec.extra} ctx={ctx} />}
      {!formOpen &&
        spec.lists?.map((k) => <ListEditor key={k} def={BLOCK_BY_KEY[k]} ctx={ctx} />)}
    </>
  );
}
