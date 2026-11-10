"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { PrayerWallItem } from "@/src/lib/data/types";

/** One light per category, chosen to glow against the site's navy. */
const LIGHT: Record<string, string> = {
  "Health & Healing": "#5eead4",
  Family: "#f9a8d4",
  "Finance & Career": "#fcd34d",
  "Salvation of a Loved One": "#93c5fd",
  Marriage: "#fca5a5",
  Breakthrough: "#fdba74",
  Other: "#c4b5fd",
};
const lightFor = (c: string) => LIGHT[c] ?? LIGHT.Other;

/** Stable pseudo-random number in [0, 1) from a string, so the scatter looks
 *  hand-placed but is identical on every load. */
function rnd(seed: string, n: number): number {
  let h = 2166136261 ^ n;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

type Placed = { x: number; y: number; w: number; h: number; size: number };
type Layout = { items: Record<string, Placed>; height: number };

const MIN_PX = 16; // 12 pt, the smallest the writing ever gets
const PAD = 20; // keeps writing off the edges
const GAP = 44; // much wider than the drift, so prayers never touch
const SAFETY = 6; // extra height allowed for each prayer when measuring
// Long unbroken words wrap instead of spilling into the next prayer.
const WRAP: CSSProperties = { overflowWrap: "anywhere", wordBreak: "break-word" };

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const baseSize = (len: number) =>
  len <= 70 ? 34 : len <= 150 ? 26 : len <= 300 ? 21 : 18;

/** A small, slow drift inside each prayer's own space. */
function driftVars(id: string): CSSProperties {
  const dur = 18 + rnd(id, 9) * 20;
  return {
    "--x0": `${(rnd(id, 1) - 0.5) * 12}px`,
    "--y0": `${(rnd(id, 2) - 0.5) * 12}px`,
    "--r0": `${(rnd(id, 3) - 0.5) * 2}deg`,
    "--x1": `${(rnd(id, 6) - 0.5) * 12}px`,
    "--y1": `${(rnd(id, 7) - 0.5) * 12}px`,
    "--r1": `${(rnd(id, 8) - 0.5) * 2}deg`,
    "--dur": `${dur}s`,
    "--delay": `-${rnd(id, 10) * dur}s`,
  } as CSSProperties;
}

function PrayerText({ p, size }: { p: PrayerWallItem; size: number }) {
  const color = lightFor(p.category);
  return (
    <p
      className="font-playfair font-semibold leading-[1.2]"
      style={{ color, fontSize: size, textShadow: `0 0 22px ${color}40`, ...WRAP }}
    >
      {p.text}
    </p>
  );
}

/** The wall. Every prayer is measured, then scattered across the wall with no
 *  two touching. If they do not all fit, the type shrinks (never below 12 pt)
 *  and, only as a last resort, the wall grows taller. Long prayers wrap into
 *  paragraphs instead of one long line. Before the browser has measured
 *  anything, and without JavaScript, they simply flow in a wrapped list. */
export default function PrayerField({ prayers }: { prayers: PrayerWallItem[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [layout, setLayout] = useState<Layout | null>(null);
  // Re-run the layout when something on the page changes after it was made.
  const [tick, setTick] = useState(0);
  // Heights seen on screen that were taller than predicted (font swap etc).
  const overrides = useRef(new Map<string, number>());
  const attempts = useRef(0);

  useIsoLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(Math.round(el.clientWidth)));
    ro.observe(el);
    setWidth(Math.round(el.clientWidth));
    return () => ro.disconnect();
  }, []);

  // A new width or a new set of prayers starts from a clean slate.
  useIsoLayoutEffect(() => {
    attempts.current = 0;
    overrides.current.clear();
  }, [width, prayers]);

  // Web fonts change how wide text is. Lay out again when they finish loading.
  useIsoLayoutEffect(() => {
    const fonts = document.fonts;
    if (!fonts?.addEventListener) return;
    const onDone = () => requestAnimationFrame(() => setTick((t) => t + 1));
    fonts.addEventListener("loadingdone", onDone);
    return () => fonts.removeEventListener("loadingdone", onDone);
  }, []);

  useIsoLayoutEffect(() => {
    const el = wrap.current;
    if (!el || !width || prayers.length === 0) {
      setLayout(null);
      return;
    }
    let cancelled = false;

    const compute = () => {
      if (cancelled) return;
      const W = width;
      const probe = document.createElement("p");
      probe.className = "font-playfair font-semibold";
      probe.style.cssText =
        "position:absolute;visibility:hidden;left:-9999px;top:0;margin:0;line-height:1.2;overflow-wrap:anywhere;word-break:break-word;";
      el.appendChild(probe);

      const measure = (p: PrayerWallItem, scale: number) => {
        const size = Math.max(MIN_PX, Math.round(baseSize(p.text.length) * scale));
        const maxW = Math.min(400, W - 2 * PAD);
        const minW = Math.min(170, maxW);
        // Long prayers get a narrower column, so they read as a paragraph.
        const w = Math.round(
          Math.min(maxW, Math.max(minW, Math.sqrt(p.text.length * size * size * 2.4))),
        );
        probe.style.fontSize = `${size}px`;
        probe.style.width = `${w}px`;
        probe.textContent = p.text;
        // Never smaller than what was actually seen on screen for this prayer.
        const seen = overrides.current.get(`${p.id}@${size}@${w}`) ?? 0;
        return { p, w, h: Math.max(probe.offsetHeight + SAFETY, seen), size };
      };

      const attempt = (scale: number, H: number): Layout | null => {
        const boxes = prayers.map((p) => measure(p, scale));
        boxes.sort((a, b) => b.w * b.h - a.w * a.h); // biggest first
        const placed: { x: number; y: number; w: number; h: number }[] = [];
        const items: Record<string, Placed> = {};
        for (const b of boxes) {
          const maxX = W - b.w - PAD;
          const maxY = H - b.h - PAD;
          if (maxX < PAD || maxY < PAD) return null;
          const free = (x: number, y: number) =>
            placed.every(
              (q) =>
                !(
                  x < q.x + q.w + GAP &&
                  x + b.w + GAP > q.x &&
                  y < q.y + q.h + GAP &&
                  y + b.h + GAP > q.y
                ),
            );
          let spot: { x: number; y: number } | null = null;
          // Scattered: try many pseudo-random spots first.
          for (let k = 0; k < 90 && !spot; k++) {
            const x = PAD + rnd(b.p.id, 100 + k * 2) * (maxX - PAD);
            const y = PAD + rnd(b.p.id, 101 + k * 2) * (maxY - PAD);
            if (free(x, y)) spot = { x, y };
          }
          // Then sweep for any gap that is left.
          for (let y = PAD; y <= maxY && !spot; y += 12) {
            for (let x = PAD; x <= maxX && !spot; x += 12) {
              if (free(x, y)) spot = { x, y };
            }
          }
          if (!spot) return null;
          placed.push({ ...spot, w: b.w, h: b.h });
          items[b.p.id] = {
            x: Math.round(spot.x),
            y: Math.round(spot.y),
            w: b.w,
            h: b.h,
            size: b.size,
          };
        }
        return { items, height: H };
      };

      // Aim for one screen. Shrink the type first, grow the wall last.
      const H0 = Math.max(440, Math.min(window.innerHeight * 0.72, 780));
      let found: Layout | null = null;
      for (const scale of [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3]) {
        found = attempt(scale, H0);
        if (found) break;
      }
      for (let k = 1; !found && k <= 40; k++) found = attempt(0.3, H0 + k * 120);

      probe.remove();
      if (!cancelled) setLayout(found);
    };

    compute();
    // Measure again once the web fonts have loaded, since they change widths.
    document.fonts?.ready.then(compute);
    return () => {
      cancelled = true;
    };
  }, [width, prayers, tick]);

  // Check the real boxes on screen against the prediction. If any prayer turned
  // out taller than measured (a late font, a different renderer), remember that
  // and lay everything out again, so nothing is left overlapping.
  useIsoLayoutEffect(() => {
    const el = wrap.current;
    if (!layout || !el) return;
    const check = () => {
      let changed = false;
      el.querySelectorAll<HTMLElement>("li[data-pid]").forEach((li) => {
        const id = li.dataset.pid ?? "";
        const it = layout.items[id];
        if (it && li.offsetHeight > it.h - 1) {
          overrides.current.set(`${id}@${it.size}@${it.w}`, li.offsetHeight + SAFETY);
          changed = true;
        }
      });
      if (changed && attempts.current < 5) {
        attempts.current += 1;
        setTick((t) => t + 1);
      }
    };
    const ro = new ResizeObserver(check);
    el.querySelectorAll("li[data-pid]").forEach((li) => ro.observe(li));
    check();
    return () => ro.disconnect();
  }, [layout]);

  return (
    <div ref={wrap} className="relative w-full">
      {layout ? (
        <ul className="relative" style={{ height: layout.height }}>
          {prayers.map((p) => {
            const it = layout.items[p.id];
            if (!it) return null;
            return (
              <li
                key={p.id}
                data-pid={p.id}
                className="prayer-drift absolute"
                style={{ left: it.x, top: it.y, width: it.w, ...driftVars(p.id) }}
              >
                <PrayerText p={p} size={it.size} />
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="flex flex-wrap gap-x-12 gap-y-10 justify-center">
          {prayers.map((p) => (
            <li key={p.id} style={{ maxWidth: "24rem" }}>
              <PrayerText p={p} size={Math.max(MIN_PX, baseSize(p.text.length) - 4)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
