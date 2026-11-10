import type { ChurchEvent } from "./types";

/** Church time. Every "today" and "this week" decision uses Lagos dates so a
 *  server running in another timezone cannot shift an event by a day. */
export const CHURCH_TZ = "Africa/Lagos";

export function todayInLagos(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: CHURCH_TZ }).format(now);
}

export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

type Span = { date: string; endDate: string };

export const lastDay = (e: Span) =>
  e.endDate && e.endDate >= e.date ? e.endDate : e.date;

const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    ...opts,
  });

export const formatShort = (iso: string) =>
  fmt(iso, { weekday: "short", day: "numeric", month: "short" });

export const formatLong = (iso: string) =>
  fmt(iso, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export const formatMedium = (iso: string) =>
  fmt(iso.slice(0, 10), { day: "numeric", month: "short", year: "numeric" });

export function formatRange(e: Span): string {
  const end = lastDay(e);
  if (end === e.date) return formatLong(e.date);
  return `${fmt(e.date, { day: "numeric", month: "short" })} to ${fmt(end, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

/** One dated showing of an event. A one-off event has one; a repeating event
 *  has one per matching day. `index` points back to the event in the list. */
export type EventOccurrence = ChurchEvent & { index: number };

const daysBetween = (a: string, b: string) =>
  Math.round(
    (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000,
  );

/** Same day number n months later, clamped to short months (31st -> 30th). */
function addMonths(iso: string, n: number, anchorDay: number): string {
  const [y, m] = iso.split("-").map(Number);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = total % 12;
  const dim = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  const day = Math.min(anchorDay, dim);
  return `${ny}-${String(nm + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const STEP_DAYS: Record<string, number> = { daily: 1, weekly: 7, biweekly: 14 };

/** Every showing of one event that touches the window [from, to]. */
export function occurrences(
  e: ChurchEvent,
  index: number,
  from: string,
  to: string,
): EventOccurrence[] {
  if (!e.date) return [];
  const span = e.endDate && e.endDate >= e.date ? daysBetween(e.date, e.endDate) : 0;
  const make = (d: string): EventOccurrence => ({
    ...e,
    index,
    date: d,
    endDate: span ? addDays(d, span) : "",
  });

  const repeat = e.repeat || "none";
  if (repeat === "none") {
    const o = make(e.date);
    return lastDay(o) >= from && o.date <= to ? [o] : [];
  }

  const stop = e.repeatUntil && e.repeatUntil < to ? e.repeatUntil : to;
  const out: EventOccurrence[] = [];
  const stepDays = STEP_DAYS[repeat];
  const anchorDay = Number(e.date.slice(8, 10));
  // Day-based repeats can skip straight to the first showing near the window.
  let i = stepDays
    ? Math.max(0, Math.floor((daysBetween(e.date, from) - span) / stepDays))
    : 0;
  for (let guard = 0; guard < 2000; guard++, i++) {
    let d: string;
    if (stepDays) d = addDays(e.date, i * stepDays);
    else if (repeat === "monthly") d = addMonths(e.date, i, anchorDay);
    else if (repeat === "yearly") d = addMonths(e.date, i * 12, anchorDay);
    else break;
    if (d > stop) break;
    if (addDays(d, span) >= from) out.push(make(d));
  }
  return out;
}

type Titled = { date: string; title: string };

const byDate = (a: Titled, b: Titled) =>
  a.date === b.date ? a.title.localeCompare(b.title) : a.date < b.date ? -1 : 1;

/** All showings in a window, earliest first. */
export function expandEvents(
  events: ChurchEvent[],
  from: string,
  to: string,
): EventOccurrence[] {
  return events.flatMap((e, i) => occurrences(e, i, from, to)).sort(byDate);
}

export const eventsInYear = (events: ChurchEvent[], year: number) =>
  expandEvents(events, `${year}-01-01`, `${year}-12-31`);

/** What the homepage shows: events happening within the next 7 days (or
 *  already under way), plus anything the admin pinned however far ahead.
 *  A repeating event counts once, at its next showing. Earliest first, so
 *  this week naturally leads. When nothing qualifies it falls back to the
 *  next few upcoming events so the section is never empty. */
export function pickAnnouncements(
  events: ChurchEvent[],
  today: string,
  limit = 4,
): { items: EventOccurrence[]; fallback: boolean } {
  const weekEnd = addDays(today, 7);
  const next = new Map<number, EventOccurrence>();
  for (const o of expandEvents(events, today, addDays(today, 400))) {
    if (!next.has(o.index)) next.set(o.index, o);
  }
  const upcoming = [...next.values()].sort(byDate);
  const chosen = upcoming
    .filter((o) => o.pinned === "yes" || o.date <= weekEnd)
    .slice(0, limit);
  if (chosen.length) return { items: chosen, fallback: false };
  return { items: upcoming.slice(0, 3), fallback: true };
}

/** Whether an event covers the given day. */
export const coversDay = (e: Span, iso: string) =>
  e.date <= iso && iso <= lastDay(e);

// Tailwind finds these class names because they appear literally here.
const TAG_STYLES = [
  "bg-blue-50 text-blue-700",
  "bg-green-50 text-green-700",
  "bg-purple-50 text-purple-700",
  "bg-orange-50 text-orange-700",
  "bg-rose-50 text-rose-700",
];

export function tagStyleFor(category: string): string {
  let h = 0;
  for (const ch of category) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TAG_STYLES[h % TAG_STYLES.length];
}
