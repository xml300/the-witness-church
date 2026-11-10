"use client";

import "./editor.css";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SiteContent } from "@/src/lib/content/types";
import { discardDraft, publishDraft, saveDraft, signOut } from "../actions";
import { setPath } from "./fields";
import { Inspector } from "./inspector";
import {
  DesignPanel,
  MediaPanel,
  PagePanel,
  SectionsPanel,
  type EditorCtx,
  type EventFocus,
  type Integrations,
  type Tab,
} from "./panels";
import { PAGES, type PageId } from "@/src/lib/content/pages";
import type { SermonVideo } from "@/src/lib/data/types";
import type { FromPreview, ToPreview } from "./protocol";

type Device = "desktop" | "tablet" | "phone";

// Inner page widths, so the preview crosses the same breakpoints real phones do.
const DEVICES: Record<Device, { w: number; label: string }> = {
  desktop: { w: 1180, label: "Desktop" },
  tablet: { w: 768, label: "Tablet" },
  phone: { w: 390, label: "Phone" },
};

type SaveState = "idle" | "saving" | "saved" | "error";

const differs = (a: unknown, b: unknown) => JSON.stringify(a) !== JSON.stringify(b);

function summarize(S: SiteContent, P: SiteContent): string[] {
  const out: string[] = [];
  const check = (label: string, ...keys: (keyof SiteContent)[]) => {
    if (keys.some((k) => differs(S[k], P[k]))) out.push(label);
  };
  check("Colors and look", "theme", "look");
  check("Site details and hero text", "site_info");
  check("Hero photos", "hero_slides");
  check("Welcome cards", "welcome_cards");
  check("Events calendar", "events", "event_categories");
  check("Pinned sermons", "pinned_sermons");
  check("Social posts", "clips");
  check("Games", "games");
  check("About page", "about");
  check("Connect page", "locations", "leaders", "gallery");
  check("Verse of the day wording", "devotion");
  check("Prayer wall wording", "prayer");
  if (differs(S.sections.map((s) => s.id), P.sections.map((s) => s.id)))
    out.push("Section order");
  else if (differs(S.sections.map((s) => s.visible), P.sections.map((s) => s.visible)))
    out.push("Hidden or shown sections");
  return out;
}

export default function Editor({
  published,
  draft,
  library,
  info,
}: {
  published: SiteContent;
  draft: SiteContent | null;
  library: SermonVideo[];
  info: Integrations;
}) {
  const [S, setS] = useState<SiteContent>(() => draft ?? published);
  const [PUB, setPUB] = useState<SiteContent>(published);
  const [tab, setTab] = useState<Tab>("sections");
  const [sel, setSel] = useState<string | null>(null);
  const [pick, setPick] = useState<string | null>(null);
  const [dev, setDev] = useState<Device>("desktop");
  const [page, setPage] = useState<PageId>("home");
  const [eventFocus, setEventFocus] = useState<EventFocus>(null);
  const [popOpen, setPopOpen] = useState(false);
  const [popError, setPopError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [save, setSave] = useState<SaveState>("idle");
  const [toastMsg, setToastMsg] = useState("");
  const [stage, setStage] = useState({ w: 900, h: 700 });
  const [showTip, setShowTip] = useState(true);
  const [hist, setHist] = useState({ undo: 0, redo: 0 });

  const Sref = useRef(S);
  const selRef = useRef(sel);
  const past = useRef<string[]>([]);
  const future = useRef<string[]>([]);
  const lastKey = useRef("");
  const lastT = useRef(0);
  const iframe = useRef<HTMLIFrameElement>(null);
  const stageEl = useRef<HTMLDivElement>(null);
  const ready = useRef(false);
  const inlineEditing = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    selRef.current = sel;
  }, [sel]);

  const toast = useCallback((m: string) => {
    setToastMsg(m);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(""), 2400);
  }, []);

  /* ---- autosave the draft ---- */
  const syncHist = useCallback(
    () => setHist({ undo: past.current.length, redo: future.current.length }),
    [],
  );

  const scheduleSave = useCallback(() => {
    setSave("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const r = await saveDraft(Sref.current);
      setSave(r.ok ? "saved" : "error");
    }, 1200);
  }, []);

  /* ---- editing with undo history ---- */
  const mutate = useCallback(
    (key: string, fn: (d: SiteContent) => void) => {
      const now = Date.now();
      if (key !== lastKey.current || now - lastT.current > 900) {
        past.current.push(JSON.stringify(Sref.current));
        if (past.current.length > 120) past.current.shift();
        future.current = [];
      }
      lastKey.current = key;
      lastT.current = now;
      const next = structuredClone(Sref.current);
      fn(next);
      Sref.current = next;
      setS(next);
      syncHist();
      scheduleSave();
    },
    [scheduleSave, syncHist],
  );

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(JSON.stringify(Sref.current));
    Sref.current = JSON.parse(prev);
    lastKey.current = "";
    setS(Sref.current);
    syncHist();
    scheduleSave();
  }, [scheduleSave, syncHist]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push(JSON.stringify(Sref.current));
    Sref.current = JSON.parse(next);
    lastKey.current = "";
    setS(Sref.current);
    syncHist();
    scheduleSave();
  }, [scheduleSave, syncHist]);

  /* ---- talk to the preview frame ---- */
  const postState = useCallback(() => {
    const w = iframe.current?.contentWindow;
    if (!w || !ready.current) return;
    const msg: ToPreview = { t: "state", content: Sref.current, selected: selRef.current };
    w.postMessage(msg, window.location.origin);
  }, []);

  useEffect(() => {
    if (!inlineEditing.current) postState();
  }, [S, sel, postState]);

  const api = useRef({ mutate, toast, postState });
  useEffect(() => {
    api.current = { mutate, toast, postState };
  });

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.source !== iframe.current?.contentWindow) return;
      const m = e.data as FromPreview;
      const { mutate: mut, toast: say, postState: post } = api.current;
      switch (m?.t) {
        case "ready":
          ready.current = true;
          post();
          break;
        case "select":
          // The calendar sends "select nothing" just before "add event";
          // the second message wins.
          setSel(m.id);
          if (!m.id) setEventFocus(null);
          if (m.id) {
            setTab("sections");
            setPick(null);
          }
          break;
        case "act": {
          const id = m.id;
          const visible = m.act === "show";
          mut("vis", (c) => {
            const s = c.sections.find((x) => x.id === id);
            if (s) s.visible = visible;
          });
          setSel(visible ? id : null);
          if (!visible) say("Section hidden. Click its bar to bring it back.");
          break;
        }
        case "edit":
          inlineEditing.current = true;
          mut(m.path, (c) => setPath(c, m.path, m.value));
          break;
        case "editEnd":
          inlineEditing.current = false;
          post();
          break;
        case "eventNew":
          setTab("sections");
          setPick(null);
          setSel("events");
          setEventFocus({ mode: "new", date: m.date, n: Date.now() });
          break;
        case "eventEdit":
          setTab("sections");
          setPick(null);
          setSel("events");
          setEventFocus({ mode: "edit", index: m.index });
          break;
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  /* ---- keyboard, resize, unload ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement).closest?.(
        "input, textarea, select, [contenteditable='true']",
      );
      if (typing || !(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (k === "y") {
        e.preventDefault();
        redo();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  useEffect(() => {
    const el = stageEl.current;
    if (!el) return;
    const ro = new ResizeObserver(() =>
      setStage((prev) => {
        const w = Math.round(el.clientWidth);
        const h = Math.round(el.clientHeight);
        return prev.w === w && prev.h === h ? prev : { w, h };
      }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (save === "saving") e.preventDefault();
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [save]);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem("ed-tip-dismissed")) setShowTip(false);
    } catch {
      /* storage can be blocked; the tip just stays visible */
    }
  }, []);

  /* ---- publish / discard ---- */
  const changes = summarize(S, PUB);

  /** Opens the row that failed to publish so it can be fixed straight away. */
  function jumpTo(key: string, index: number) {
    const where: Record<string, { page: PageId; sel: string }> = {
      events: { page: "events", sel: "events" },
      hero_slides: { page: "home", sel: "hero" },
      welcome_cards: { page: "home", sel: "welcome" },
      pinned_sermons: { page: "home", sel: "sermons" },
      clips: { page: "home", sel: "clips" },
      games: { page: "home", sel: "games" },
      locations: { page: "connect", sel: "connect" },
      leaders: { page: "connect", sel: "connect" },
      gallery: { page: "connect", sel: "connect" },
    };
    const w = where[key];
    if (!w) return;
    if (w.page !== page) {
      ready.current = false;
      setPage(w.page);
    }
    setTab("sections");
    setPick(null);
    setSel(w.sel);
    setEventFocus(key === "events" ? { mode: "edit", index } : null);
  }

  async function onPublish() {
    setPublishing(true);
    setPopError("");
    clearTimeout(saveTimer.current);
    const r = await publishDraft(Sref.current);
    setPublishing(false);
    if (!r.ok) {
      setPopError(r.error);
      if (r.at) jumpTo(r.at.key, r.at.index);
      return;
    }
    setPUB(structuredClone(Sref.current));
    setSave("idle");
    setPopOpen(false);
    toast("Published. Visitors now see these changes.");
  }

  async function onDiscard() {
    clearTimeout(saveTimer.current);
    const r = await discardDraft();
    if (!r.ok) {
      setPopError(r.error);
      return;
    }
    Sref.current = structuredClone(PUB);
    past.current = [];
    future.current = [];
    setS(Sref.current);
    setSave("idle");
    setSel(null);
    setPopOpen(false);
    syncHist();
    toast("Draft discarded");
  }

  /* ---- layout numbers ---- */
  const frameW = DEVICES[dev].w + (dev === "desktop" ? 2 : 16);
  const zoom = Math.max(0.2, Math.min(1, (stage.w - 32) / frameW));
  const frameH = Math.max(480, (stage.h - 32) / zoom);

  const ctx: EditorCtx = {
    S, mutate, page, sel, setSel, pick, setPick, setTab, toast, info, library,
    eventFocus, setEventFocus,
  };
  const statusText =
    save === "saving"
      ? "Saving draft…"
      : save === "error"
        ? "Could not save the draft"
        : changes.length
          ? `Draft saved · ${changes.length} unpublished`
          : "Live site is up to date";
  const statusDot = save === "error" ? "err" : changes.length || save === "saving" ? "dirty" : "";

  return (
    <div className="ed-root">
      <header className="ed-top">
        <div className="ed-crumb">
          <a className="ed-back" href="/" target="_blank" rel="noreferrer">
            View site ↗
          </a>
          <div>
            <h1>Homepage</h1>
            <small>The Witness Church</small>
          </div>
        </div>

        <label className="ed-pagepick">
          <span className="ed-sr">Page</span>
          <select
            value={page}
            onChange={(e) => {
              ready.current = false;
              setSel(null);
              setPick(null);
              setEventFocus(null);
              setPage(e.target.value as PageId);
            }}
          >
            {PAGES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <div className="ed-seg" role="group" aria-label="Preview size">
          {(Object.keys(DEVICES) as Device[]).map((k) => (
            <button key={k} type="button" aria-pressed={dev === k} onClick={() => setDev(k)}>
              {DEVICES[k].label}
            </button>
          ))}
        </div>

        <div className="ed-pair">
          <button type="button" className="ed-iconbtn" onClick={undo} disabled={!hist.undo} aria-label="Undo" title="Undo (Ctrl+Z)">
            ↶
          </button>
          <button type="button" className="ed-iconbtn" onClick={redo} disabled={!hist.redo} aria-label="Redo" title="Redo (Ctrl+Shift+Z)">
            ↷
          </button>
        </div>

        <span className="ed-status" aria-live="polite">
          <span className={`ed-dot ${statusDot}`} />
          {statusText}
        </span>

        <div className="ed-pubwrap">
          <button type="button" className="ed-btn ed-primary" onClick={() => setPopOpen((o) => !o)} aria-expanded={popOpen}>
            Publish
            {changes.length > 0 && <span className="ed-count">{changes.length}</span>}
          </button>
          {popOpen && (
            <div className="ed-pop" role="dialog" aria-label="Publish changes">
              {changes.length ? (
                <>
                  <h3>Ready to go live</h3>
                  <ul>
                    {changes.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                  {popError && <p className="ed-error">{popError}</p>}
                  <div className="ed-row">
                    <button type="button" className="ed-btn ed-danger" onClick={onDiscard}>
                      Discard draft
                    </button>
                    <button type="button" className="ed-btn ed-primary" disabled={publishing} onClick={onPublish}>
                      {publishing ? "Publishing…" : "Publish now"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3>Nothing to publish</h3>
                  <p className="ed-none">
                    Edits are saved as a draft first. Visitors see them only after you publish.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        <a className="ed-btn ed-quiet" href="/admin/prayers" style={{ textDecoration: "none" }}>
          Prayers
          {info.pendingPrayers > 0 && <span className="ed-count ed-count-alt">{info.pendingPrayers}</span>}
        </a>

        <a className="ed-btn ed-quiet" href="/admin/games" style={{ textDecoration: "none" }}>
          Game content
        </a>

        <a className="ed-btn ed-quiet" href="/admin/hunt" style={{ textDecoration: "none" }}>
          Treasure hunt
        </a>

        <button
          type="button"
          className="ed-btn ed-quiet"
          onClick={async () => {
            await signOut();
            window.location.assign("/admin/login");
          }}
        >
          Sign out
        </button>
      </header>

      <div className="ed-main">
        <nav className="ed-rail" aria-label="Editor tools">
          {(
            [
              ["sections", "Content"],
              ["design", "Design"],
              ["media", "Photos"],
            ] as [Tab, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              aria-current={tab === k}
              onClick={() => {
                setTab(k);
                setPick(null);
                if (k === "sections") {
                  setSel(null);
                  setEventFocus(null);
                }
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        <aside className="ed-panel">
          {tab === "design" && <DesignPanel {...ctx} />}
          {tab === "media" && <MediaPanel {...ctx} />}
          {tab === "sections" &&
            (sel ? (
              <Inspector key={sel} id={sel} ctx={ctx} />
            ) : page === "home" ? (
              <SectionsPanel {...ctx} />
            ) : (
              <PagePanel {...ctx} />
            ))}
        </aside>

        <main className="ed-stage" ref={stageEl}>
          <div className="ed-devwrap" style={{ zoom }}>
            <div className={`ed-frame ${dev}`} style={{ width: frameW }}>
              <iframe
                ref={iframe}
                title="Live preview of your homepage"
                src={`/admin/preview?page=${page}`}
                style={{ height: frameH }}
              />
            </div>
          </div>
          {showTip && (
            <div className="ed-helper">
              <span><b>Click</b> a section to edit it</span>
              <span><b>Double-click</b> text to type on the page</span>
              <span>Switch sizes above to check phones</span>
              <button
                type="button"
                className="ed-mini"
                onClick={() => {
                  setShowTip(false);
                  try {
                    localStorage.setItem("ed-tip-dismissed", "1");
                  } catch {
                    /* ignore */
                  }
                }}
              >
                Got it
              </button>
            </div>
          )}
        </main>
      </div>

      <div className={`ed-toast${toastMsg ? " on" : ""}`} role="status">
        {toastMsg}
      </div>
    </div>
  );
}
