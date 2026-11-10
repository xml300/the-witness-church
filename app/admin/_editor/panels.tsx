"use client";

import { useEffect, useRef, useState } from "react";
import { SECTION_DEFS } from "@/src/lib/content/sections";
import { DEFAULT_CONTENT } from "@/src/lib/content/defaults";
import { FONT_CHOICES } from "@/src/lib/content/look";
import type { PageId } from "@/src/lib/content/pages";
import type { FontKey, SiteContent, Theme } from "@/src/lib/content/types";
import type { SermonVideo } from "@/src/lib/data/types";
import { createClient } from "@/src/lib/supabase/client";
import { getPath, uploadImage, type Row } from "./fields";

export type Tab = "sections" | "design" | "media";

/** What is connected on the server, so the editor can say what works. */
export type Integrations = {
  youtubeKey: boolean;
  instagram: boolean;
  facebook: boolean;
  sheet: boolean;
  pendingPrayers: number;
};

/** Which event the Events page form is showing. */
export type EventFocus =
  | { mode: "new"; date: string; n: number }
  | { mode: "edit"; index: number }
  | null;

export type EditorCtx = {
  S: SiteContent;
  mutate: (key: string, fn: (d: SiteContent) => void) => void;
  page: PageId;
  sel: string | null;
  setSel: (id: string | null) => void;
  pick: string | null;
  setPick: (path: string | null) => void;
  setTab: (t: Tab) => void;
  toast: (m: string) => void;
  info: Integrations;
  library: SermonVideo[];
  eventFocus: EventFocus;
  setEventFocus: (f: EventFocus) => void;
};

const PANEL_LABELS: Record<string, string> = {
  site: "Site details",
  about: "About page",
  connect: "Connect page",
  events: "Events calendar",
  sermons: "Sermons",
  games: "Games",
};

export const sectionLabel = (id: string) =>
  PANEL_LABELS[id] ?? SECTION_DEFS.find((d) => d.id === id)?.label ?? id;

/* ======================= Other pages ======================= */

const PAGE_ROWS: Record<string, { id: string; note: string }[]> = {
  about: [
    { id: "about", note: "Story, mission, vision and photo" },
    { id: "site", note: "Social links shown on this page" },
  ],
  connect: [{ id: "connect", note: "Locations, leaders and photo gallery" }],
  events: [{ id: "events", note: "Add, edit and pin calendar events" }],
  sermons: [{ id: "sermons", note: "YouTube channel and pinned messages" }],
  games: [{ id: "games", note: "The games and their cards" }],
};

/** The left panel when a page other than the homepage is open. */
export function PagePanel({ page, setSel }: EditorCtx) {
  const rows = PAGE_ROWS[page] ?? [];
  return (
    <>
      <h2>Page content</h2>
      <p className="ed-lede">
        The page is on the right and updates as you type. Choose what to edit.
      </p>
      <ul className="ed-srows">
        {rows.map((r) => (
          <li
            key={r.id}
            className="ed-srow"
            tabIndex={0}
            onClick={() => setSel(r.id)}
            onKeyDown={(e) => e.key === "Enter" && setSel(r.id)}
          >
            <span className="ed-nm">{sectionLabel(r.id)}</span>
            <span className="ed-sub-note">{r.note}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

/* ======================= Sections ======================= */

export function SectionsPanel({ S, mutate, setSel }: EditorCtx) {
  return (
    <>
      <h2>Sections</h2>
      <p className="ed-lede">
        Show or hide homepage sections. The order is fixed.
      </p>
      <ul className="ed-srows">
        <li
          className="ed-srow ed-pinned"
          tabIndex={0}
          onClick={() => setSel("site")}
          onKeyDown={(e) => e.key === "Enter" && setSel("site")}
        >
          <span className="ed-nm">Site details</span>
          <span className="ed-sub-note">Menu, footer, links</span>
        </li>
        {S.sections.map((s) => (
          <li
            key={s.id}
            className={`ed-srow${s.visible ? "" : " ed-off"}`}
            tabIndex={0}
            onClick={() => s.visible && setSel(s.id)}
            onKeyDown={(e) => e.key === "Enter" && s.visible && setSel(s.id)}
          >
            <span className="ed-nm">{sectionLabel(s.id)}</span>
            <button
              type="button"
              className="ed-tiny"
              aria-label={`${s.visible ? "Hide" : "Show"} ${sectionLabel(s.id)}`}
              onClick={(e) => {
                e.stopPropagation();
                mutate("vis", (d) => {
                  const t = d.sections.find((x) => x.id === s.id);
                  if (t) t.visible = !t.visible;
                });
              }}
            >
              {s.visible ? "Hide" : "Show"}
            </button>
          </li>
        ))}
      </ul>
      <div className="ed-tip">
        <b>The top menu lists pages, not sections.</b> Hiding a section here
        only changes the homepage.
      </div>
    </>
  );
}

/* ======================= Design ======================= */

const COLOR_ROWS: [keyof Theme, string, string][] = [
  ["navy", "Main dark", "Dark sections, headings, footer"],
  ["navyDeep", "Deeper dark", "Footer and overlays"],
  ["red", "Action color", "Buttons and highlights"],
  ["redDark", "Action color, hover", "Button hover state"],
  ["pink", "Accent", "Tags and small accents"],
  ["pinkLight", "Soft accent", "Tag backgrounds"],
  ["grayBg", "Light background", "Alternating sections"],
  ["gray2", "Borders", "Thin lines and card edges"],
  ["text", "Body text", "Main reading color"],
  ["muted", "Secondary text", "Captions and details"],
];

const PRESETS: { name: string; theme: Theme }[] = [
  { name: "Witness", theme: DEFAULT_CONTENT.theme },
  {
    name: "Forest",
    theme: {
      navy: "#1b4332", navyDeep: "#0f2a1f", red: "#c2410c", redDark: "#9a3412",
      pink: "#b45309", pinkLight: "#fef3c7", grayBg: "#f6f8f5", gray2: "#e7ece6",
      text: "#1a2e24", muted: "#5f6f66",
    },
  },
  {
    name: "Royal",
    theme: {
      navy: "#312e81", navyDeep: "#1e1b4b", red: "#db2777", redDark: "#9d174d",
      pink: "#7c3aed", pinkLight: "#ede9fe", grayBg: "#f7f7fb", gray2: "#ececf4",
      text: "#1c1b33", muted: "#6b6b85",
    },
  },
  {
    name: "Sunrise",
    theme: {
      navy: "#7c2d12", navyDeep: "#431407", red: "#ea580c", redDark: "#c2410c",
      pink: "#be123c", pinkLight: "#ffe4e6", grayBg: "#fbf6f1", gray2: "#efe6dd",
      text: "#2b1810", muted: "#7c6a60",
    },
  },
];

function luminance(hex: string) {
  const c = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
const isHex = (v: string) => /^#[0-9a-f]{6}$/i.test(v);

export function DesignPanel({ S, mutate, toast }: EditorCtx) {
  const t = S.theme;
  const checks: [string, string, string][] = [
    ["Body text on white", t.text, "#ffffff"],
    ["White on action color", "#ffffff", t.red],
    ["White on main dark", "#ffffff", t.navy],
    ["Secondary text on white", t.muted, "#ffffff"],
  ];

  return (
    <>
      <h2>Colors &amp; look</h2>
      <p className="ed-lede">Every change repaints the page on the right.</p>

      <div className="ed-sub" style={{ marginTop: 6 }}>Palettes</div>
      <div className="ed-presets">
        {PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            className="ed-preset"
            aria-pressed={JSON.stringify(p.theme) === JSON.stringify(t)}
            onClick={() =>
              mutate("preset", (d) => {
                d.theme = structuredClone(p.theme);
              })
            }
          >
            <span className="ed-chips">
              {[p.theme.navy, p.theme.red, p.theme.pink, p.theme.pinkLight].map((c) => (
                <i key={c} style={{ background: c }} />
              ))}
            </span>
            <span>{p.name}</span>
          </button>
        ))}
      </div>

      <div className="ed-sub">Colors</div>
      {COLOR_ROWS.map(([k, label, hint]) => (
        <div className="ed-crow" key={k}>
          <input
            type="color"
            aria-label={label}
            value={isHex(t[k]) ? t[k] : "#000000"}
            onChange={(e) =>
              mutate(`theme.${k}`, (d) => {
                d.theme[k] = e.target.value.toLowerCase();
              })
            }
          />
          <div className="ed-lbl">
            <b>{label}</b>
            <small>{hint}</small>
          </div>
          <input
            type="text"
            spellCheck={false}
            aria-label={`${label} hex code`}
            value={t[k]}
            onChange={(e) => {
              const v = e.target.value;
              mutate(`theme.${k}`, (d) => {
                d.theme[k] = v;
              });
            }}
            className={isHex(t[k]) ? "" : "ed-bad"}
          />
        </div>
      ))}

      <div className="ed-sub">Readability</div>
      <div className="ed-checks">
        {checks.map(([label, fg, bg]) => {
          if (!isHex(fg) || !isHex(bg)) return null;
          const r = contrast(fg, bg);
          const ok = r >= 4.5;
          return (
            <div className="ed-chk" key={label}>
              <span className={`ed-pill ${ok ? "ok" : "no"}`}>{r.toFixed(1)}:1</span>
              <span>
                {label}
                {ok ? "" : " is hard to read"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="ed-sub">Typeface</div>
      <div className="ed-fonts">
        {(Object.keys(FONT_CHOICES) as FontKey[]).map((k) => (
          <button
            key={k}
            type="button"
            className="ed-fontopt"
            aria-pressed={S.look.font === k}
            onClick={() =>
              mutate("font", (d) => {
                d.look.font = k;
              })
            }
          >
            <span className="ed-aa" style={{ fontFamily: FONT_CHOICES[k].cssVar }}>
              Aa
            </span>
            <span>
              <b>{FONT_CHOICES[k].label}</b>
              <small>{FONT_CHOICES[k].note}</small>
            </span>
          </button>
        ))}
      </div>

      <div className="ed-sub">Corners</div>
      <div className="ed-field">
        <div className="ed-rangeline">
          <input
            type="range"
            min={0}
            max={28}
            aria-label="Corner roundness"
            value={S.look.radius}
            onChange={(e) =>
              mutate("radius", (d) => {
                d.look.radius = Number(e.target.value);
              })
            }
          />
          <output>{S.look.radius}px</output>
        </div>
      </div>

      <button
        type="button"
        className="ed-btn ed-quiet"
        onClick={() => {
          mutate("resetDesign", (d) => {
            d.theme = structuredClone(DEFAULT_CONTENT.theme);
            d.look = structuredClone(DEFAULT_CONTENT.look);
          });
          toast("Colors and look reset");
        }}
      >
        Reset colors and look
      </button>
    </>
  );
}

/* ======================= Photos ======================= */

const BUILT_IN = [
  "/hero/hgf.png",
  "/hero/boy-praying.png",
  "/hero/girl-praying.png",
  "/hero/pastor-praying.png",
  "/hero/woman-praying.png",
];

function inUse(S: SiteContent): string[] {
  const out: string[] = [];
  S.hero_slides.forEach((s) => out.push(s.src));
  S.welcome_cards.forEach((s) => out.push(s.image));
  S.events.forEach((s) => out.push(s.image));
  S.leaders.forEach((s) => out.push(s.photo));
  S.gallery.forEach((s) => out.push(s.photo));
  out.push(S.about.photo);
  return out.filter(Boolean);
}

export function MediaPanel({ S, mutate, pick, setPick, setTab, toast }: EditorCtx) {
  const file = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    const supabase = createClient();
    const { data } = await supabase.storage.from("site-images").list("uploads", {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });
    setUploads(
      (data ?? [])
        .filter((f) => f.name && !f.name.startsWith("."))
        .map(
          (f) =>
            supabase.storage.from("site-images").getPublicUrl(`uploads/${f.name}`)
              .data.publicUrl,
        ),
    );
  }

  useEffect(() => {
    // Loads the photo library once when the panel opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, []);

  function assign(url: string) {
    if (!pick) {
      toast("Open a section and choose Change photo to place a photo.");
      return;
    }
    const path = pick;
    mutate("img", (d) => {
      const parts = path.split(".");
      const last = parts.pop()!;
      let cur = d as unknown as Record<string, unknown>;
      for (const p of parts) cur = cur[p] as Record<string, unknown>;
      cur[last] = url;
    });
    setPick(null);
    setTab("sections");
    toast("Photo updated");
  }

  async function onFile(f: File | undefined) {
    if (!f) return;
    setError("");
    setBusy(true);
    try {
      const url = await uploadImage(f);
      await refresh();
      if (pick) assign(url);
      else toast("Photo uploaded");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (file.current) file.current.value = "";
    }
  }

  const all = Array.from(new Set([...uploads, ...inUse(S), ...BUILT_IN]));
  const target = pick ? getPath(S, pick.split(".").slice(0, -1).join(".")) : null;
  const targetName =
    target && typeof target === "object"
      ? String(
          (target as Row).title ?? (target as Row).alt ?? (target as Row).label ?? "this item",
        )
      : "";

  return (
    <>
      <h2>Photos</h2>
      <p className="ed-lede">
        Photos are shrunk automatically before upload so the site stays fast.
      </p>
      {pick && (
        <div className="ed-banner">
          <span>
            Choose a photo for <b>{targetName || "this item"}</b>.
          </span>
          <button
            type="button"
            className="ed-mini"
            style={{ justifySelf: "start" }}
            onClick={() => {
              setPick(null);
              setTab("sections");
            }}
          >
            Cancel
          </button>
        </div>
      )}
      <button
        type="button"
        className="ed-upl"
        disabled={busy}
        onClick={() => file.current?.click()}
      >
        <b>{busy ? "Uploading…" : "Upload a photo"}</b>
        <small>JPG, PNG, WebP or GIF · up to 5 MB</small>
      </button>
      <input
        ref={file}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      {error && <p className="ed-error">{error}</p>}
      <div className="ed-mgrid">
        {all.map((u) => (
          <button key={u} type="button" className="ed-mtile" onClick={() => assign(u)}>
            <i style={{ backgroundImage: `url("${u}")` }} />
            <span>{decodeURIComponent(u.split("/").pop() ?? u)}</span>
          </button>
        ))}
      </div>
    </>
  );
}
