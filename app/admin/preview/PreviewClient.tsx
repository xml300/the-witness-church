"use client";

import { Component, useEffect, useState, type ReactNode } from "react";
import PageView from "@/src/components/pages/PageView";
import type { PageId } from "@/src/lib/content/pages";
import type { SiteData } from "@/src/lib/data/types";
import { themeToCss } from "@/src/lib/content/theme-css";
import { isAllowedImage } from "@/src/lib/content/validate";
import type { SiteContent } from "@/src/lib/content/types";
import type { FromPreview, ToPreview } from "../_editor/protocol";

const FALLBACK_IMAGE = "/hero/hgf.png";

/** A half-typed image link must not crash next/image, so unknown hosts fall
 *  back to a placeholder in the preview only. Publishing still rejects them. */
function safe(c: SiteContent): SiteContent {
  const x = structuredClone(c);
  const must = (v: string) => (isAllowedImage(v) ? v : FALLBACK_IMAGE);
  const maybe = (v: string) => (v === "" || isAllowedImage(v) ? v : "");
  x.hero_slides.forEach((s) => (s.src = must(s.src)));
  x.welcome_cards.forEach((s) => (s.image = must(s.image)));
  x.leaders.forEach((s) => (s.photo = must(s.photo)));
  x.gallery.forEach((s) => (s.photo = must(s.photo)));
  x.events.forEach((s) => (s.image = maybe(s.image)));
  x.about.photo = maybe(x.about.photo);
  return x;
}

function setPath(obj: unknown, path: string, value: string) {
  const parts = path.split(".");
  const last = parts.pop()!;
  let cur = obj as Record<string, unknown>;
  for (const p of parts) cur = cur[p] as Record<string, unknown>;
  cur[last] = value;
}

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(prev: { children: ReactNode }) {
    if (prev.children !== this.props.children && this.state.failed) {
      this.setState({ failed: false });
    }
  }
  render() {
    return this.state.failed ? (
      <p style={{ padding: 24, font: "14px system-ui" }}>
        This section could not be drawn with the current values. Adjust the last
        change and it will return.
      </p>
    ) : (
      this.props.children
    );
  }
}

const EDITOR_CSS = `
[data-sec]{position:relative}
[data-sec]::after{content:attr(data-label);position:absolute;left:0;top:0;z-index:60;background:#0d8a7a;color:#fff;font:600 11px/1 system-ui,sans-serif;letter-spacing:.04em;padding:5px 9px;border-radius:0 0 8px 0;opacity:0;pointer-events:none;transition:opacity .12s}
[data-sec]:hover{outline:2px solid rgba(13,138,122,.55);outline-offset:-2px}
[data-sec]:hover::after,[data-sec].ed-sel::after{opacity:1}
[data-sec].ed-sel{outline:2px solid #0d8a7a;outline-offset:-2px}
nav:hover,footer:hover{outline:2px dashed rgba(13,138,122,.55);outline-offset:-2px}
[data-edit]{cursor:text;border-radius:4px}
[data-edit]:hover{background:rgba(13,138,122,.16)}
[contenteditable="true"]{outline:2px solid #0d8a7a;background:rgba(13,138,122,.16);border-radius:4px;cursor:text}
.ed-bar{position:absolute;right:12px;top:12px;z-index:70;display:flex;gap:4px;background:#fff;color:#131a2a;border:1px solid #dadfe8;border-radius:10px;padding:4px;box-shadow:0 8px 24px rgba(19,26,42,.18);font:600 12px system-ui,sans-serif}
.ed-bar button{border:0;background:transparent;border-radius:7px;height:28px;min-width:28px;padding:0 8px;cursor:pointer;color:#131a2a}
.ed-bar button:hover:not(:disabled){background:rgba(13,138,122,.14);color:#0d8a7a}
.ed-bar button:disabled{opacity:.35;cursor:default}
.ed-hidden{display:flex;justify-content:space-between;align-items:center;width:100%;padding:12px 18px;border:0;border-top:1px dashed #b8c0cf;border-bottom:1px dashed #b8c0cf;background:repeating-linear-gradient(45deg,#f5f6f9,#f5f6f9 10px,#eef0f5 10px,#eef0f5 20px);color:#5b6477;font:500 13px system-ui,sans-serif;cursor:pointer;text-align:left}
.ed-hidden span:last-child{color:#0d8a7a;font-weight:700}
`;

function sendToEditor(m: FromPreview) {
  window.parent.postMessage(m, window.location.origin);
}

export default function PreviewClient({
  initial,
  data,
  page,
}: {
  initial: SiteContent;
  data: SiteData;
  page: PageId;
}) {
  const [content, setContent] = useState(() => safe(initial));
  const [selected, setSelected] = useState<string | null>(null);
  // Bumped after an inline edit so the page is rebuilt from state instead of
  // trusting a DOM node the browser edited behind React's back.
  const [rev, setRev] = useState(0);

  useEffect(() => {
    const origin = window.location.origin;
    const post = (m: FromPreview) => window.parent.postMessage(m, origin);
    let pending: { path: string; value: string } | null = null;
    let lastState = "";

    const onMessage = (e: MessageEvent) => {
      if (e.origin !== origin) return;
      const m = e.data as ToPreview;
      if (m?.t === "state") {
        // Identical repeats would redraw the page for nothing.
        const key = JSON.stringify([m.content, m.selected]);
        if (key === lastState) return;
        lastState = key;
        setContent(safe(m.content));
        setSelected(m.selected);
      }
    };

    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('[contenteditable="true"]')) return;
      // Keep every link and form inert so the preview never navigates away.
      e.preventDefault();
      const act = el.closest<HTMLElement>("[data-act]");
      if (act) {
        post({
          t: "act",
          act: act.dataset.act as "hide" | "show",
          id: act.dataset.id ?? "",
        });
        return;
      }
      const sec = el.closest<HTMLElement>("[data-sec]");
      if (sec) post({ t: "select", id: sec.dataset.sec ?? null });
      else if (el.closest("nav, footer")) post({ t: "select", id: "site" });
      else post({ t: "select", id: null });
    };

    const onDblClick = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>("[data-edit]");
      if (!t) return;
      t.contentEditable = "true";
      t.focus();
      const range = document.createRange();
      range.selectNodeContents(t);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    };

    const onInput = (e: Event) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>(
        '[data-edit][contenteditable="true"]',
      );
      if (!t?.dataset.edit) return;
      pending = { path: t.dataset.edit, value: t.textContent ?? "" };
      post({ t: "edit", ...pending });
    };

    const onFocusOut = (e: FocusEvent) => {
      const t = (e.target as HTMLElement).closest?.<HTMLElement>(
        '[contenteditable="true"]',
      );
      if (!t) return;
      t.contentEditable = "false";
      if (pending) {
        const p = pending;
        pending = null;
        lastState = ""; // the next state from the editor must be applied
        setContent((c) => {
          const next = structuredClone(c);
          setPath(next, p.path, p.value);
          return next;
        });
      }
      setRev((r) => r + 1);
      post({ t: "editEnd" });
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const t = (e.target as HTMLElement).closest?.('[contenteditable="true"]');
      if (!t) return;
      if (e.key === "Enter" || e.key === "Escape") {
        e.preventDefault();
        (t as HTMLElement).blur();
      }
    };

    const onPaste = (e: ClipboardEvent) => {
      const t = (e.target as HTMLElement).closest?.('[contenteditable="true"]');
      if (!t) return;
      e.preventDefault();
      document.execCommand(
        "insertText",
        false,
        e.clipboardData?.getData("text/plain") ?? "",
      );
    };

    window.addEventListener("message", onMessage);
    document.addEventListener("click", onClick, true);
    document.addEventListener("dblclick", onDblClick);
    document.addEventListener("input", onInput);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("paste", onPaste);
    post({ t: "ready" });

    return () => {
      window.removeEventListener("message", onMessage);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("dblclick", onDblClick);
      document.removeEventListener("input", onInput);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("paste", onPaste);
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeToCss(content.theme, content.look) }} />
      <style dangerouslySetInnerHTML={{ __html: EDITOR_CSS }} />
      <Boundary>
        <div key={rev}>
          <PageView
            page={page}
            content={content}
            data={data}
            editor={{
              selected,
              onDay: (date) => sendToEditor({ t: "eventNew", date }),
              onEvent: (index) => sendToEditor({ t: "eventEdit", index }),
            }}
          />
        </div>
      </Boundary>
    </>
  );
}
