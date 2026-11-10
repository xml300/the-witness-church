import { SECTION_IDS } from "./sections";
import { BLOCK_BY_KEY, type BlockDef, type Field } from "./schema";
import { THEME_KEYS, isHex } from "./theme-css";
import { FONT_CHOICES } from "./look";
import { parseChannelInput } from "@/src/lib/data/youtube";
import type { ContentKey } from "./types";

/** `at` points to the list row that failed, so the editor can open it. */
export type Result =
  | { ok: true; value: unknown }
  | { ok: false; error: string; at?: { key: string; index: number } };

const MAX_BYTES = 200_000;

function supabaseHost(): string | null {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return null;
  }
}

export function isRealDate(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

export function isSafeLink(v: string): boolean {
  if (v === "") return true;
  if (v.startsWith("#")) return true;
  if (v.startsWith("/") && !v.startsWith("//")) return true;
  if (/^(mailto|tel):/i.test(v)) return true;
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function isAllowedImage(v: string): boolean {
  if (v.startsWith("/") && !v.startsWith("//")) return true;
  try {
    const u = new URL(v);
    if (u.protocol !== "https:") return false;
    return u.hostname === "images.unsplash.com" || u.hostname === supabaseHost();
  } catch {
    return false;
  }
}

function checkField(f: Field, raw: unknown): { value?: string | number; error?: string } {
  if (f.type === "number" || f.type === "range") {
    const n = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(n)) return { error: `${f.label} must be a number.` };
    const min = f.min ?? 0;
    const max = f.max ?? 1_000_000;
    if (n < min || n > max) return { error: `${f.label} must be between ${min} and ${max}.` };
    return { value: Math.round(n) };
  }

  if (typeof raw !== "string") return { error: `${f.label} is missing.` };
  const v = raw.trim();

  if (f.type === "select") {
    if (!f.options?.some((o) => o.value === v)) {
      return { error: `${f.label} has an invalid choice.` };
    }
    return { value: v };
  }
  if (f.type === "date") {
    if (!v) {
      return f.optional ? { value: "" } : { error: `${f.label}: pick a date.` };
    }
    if (!isRealDate(v)) return { error: `${f.label} is not a valid date.` };
    return { value: v };
  }
  if (f.type === "image") {
    if (!v) return f.optional ? { value: "" } : { error: `${f.label}: add a photo.` };
    if (!isAllowedImage(v)) {
      return { error: `${f.label}: link must be an uploaded photo or from images.unsplash.com.` };
    }
    return { value: v };
  }
  if (f.type === "url") {
    if (f.required && !v) return { error: `${f.label} is required.` };
    if (!isSafeLink(v)) return { error: `${f.label} is not a valid link.` };
    return { value: v };
  }
  if (f.required && !v) return { error: `${f.label} is required.` };
  const max = f.max ?? 500;
  if (v.length > max) return { error: `${f.label} is too long (max ${max}).` };
  return { value: v };
}

function checkRecord(
  fields: Field[],
  raw: unknown,
  where: string,
): { value?: Record<string, string | number>; error?: string } {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { error: `${where}: invalid data.` };
  }
  const out: Record<string, string | number> = {};
  for (const f of fields) {
    const r = checkField(f, (raw as Record<string, unknown>)[f.name]);
    if (r.error) return { error: `${where}: ${r.error}` };
    out[f.name] = r.value as string | number;
  }
  return { value: out };
}

function validateBlock(def: BlockDef, raw: unknown): Result {
  if (def.kind === "object") {
    const r = checkRecord(def.fields, raw, def.title);
    return r.error ? { ok: false, error: r.error } : { ok: true, value: r.value };
  }
  if (!Array.isArray(raw)) return { ok: false, error: "Invalid list." };
  if (raw.length > (def.maxItems ?? 20)) {
    return { ok: false, error: `${def.title}: at most ${def.maxItems} items.` };
  }
  const items: Record<string, string | number>[] = [];
  for (let i = 0; i < raw.length; i++) {
    const name = String((raw[i] as Record<string, unknown> | null)?.[def.titleField ?? ""] ?? "").trim();
    const r = checkRecord(
      def.fields,
      raw[i],
      `${def.title} #${i + 1}${name ? ` "${name}"` : " (no title yet)"}`,
    );
    if (r.error) return { ok: false, error: r.error, at: { key: def.key, index: i } };
    const item = r.value!;
    items.push(item);
  }
  return { ok: true, value: items };
}

type AnyRow = Record<string, string | number>;

/** Rules that depend on more than one field or on a specific format. */
function extraChecks(key: BlockDef["key"], value: unknown): string | null {
  if (key === "site_info") {
    const id = String((value as AnyRow).youtubeChannelId ?? "");
    if (id && !parseChannelInput(id)) {
      return "YouTube channel: paste the channel link, an @handle, or the channel ID.";
    }
  }
  if (key === "event_categories") {
    const seen = new Set<string>();
    for (const r of value as AnyRow[]) {
      const n = String(r.name).trim().toLowerCase();
      if (seen.has(n)) return `The category "${r.name}" appears twice.`;
      seen.add(n);
    }
  }
  if (key === "pinned_sermons") {
    for (const r of value as AnyRow[]) {
      if (!/^[\w-]{11}$/.test(String(r.videoId))) {
        return "A pinned sermon has an invalid YouTube video ID.";
      }
    }
  }
  if (key === "events") {
    for (const r of value as AnyRow[]) {
      if (r.endDate && String(r.endDate) < String(r.date)) {
        return `Event "${r.title}": the last day is before the first day.`;
      }
      if (r.repeatUntil && String(r.repeatUntil) < String(r.date)) {
        return `Event "${r.title}": it repeats until a date before it starts.`;
      }
    }
  }
  return null;
}

export function validateContent(key: ContentKey, raw: unknown): Result {
  if (JSON.stringify(raw ?? null).length > MAX_BYTES) {
    return { ok: false, error: "That is too much data to save." };
  }

  if (key === "theme") {
    if (typeof raw !== "object" || raw === null) return { ok: false, error: "Invalid theme." };
    const out: Record<string, string> = {};
    for (const k of THEME_KEYS) {
      const v = (raw as Record<string, unknown>)[k];
      if (!isHex(v)) return { ok: false, error: `Color "${k}" must look like #1a3a6e.` };
      out[k] = v.toLowerCase();
    }
    return { ok: true, value: out };
  }

  if (key === "look") {
    const r = (raw as { radius?: unknown } | null)?.radius;
    const f = (raw as { font?: unknown } | null)?.font;
    if (typeof r !== "number" || !Number.isFinite(r) || r < 0 || r > 28) {
      return { ok: false, error: "Corner roundness must be between 0 and 28." };
    }
    if (typeof f !== "string" || !(f in FONT_CHOICES)) {
      return { ok: false, error: "Unknown typeface." };
    }
    return { ok: true, value: { radius: Math.round(r), font: f } };
  }

  if (key === "sections") {
    if (!Array.isArray(raw)) return { ok: false, error: "Invalid sections." };
    const seen = new Set<string>();
    const out: { id: string; visible: boolean }[] = [];
    for (const s of raw) {
      const id = (s as { id?: unknown })?.id;
      if (typeof id !== "string" || !SECTION_IDS.includes(id) || seen.has(id)) {
        return { ok: false, error: "Invalid section list." };
      }
      seen.add(id);
      out.push({ id, visible: (s as { visible?: unknown }).visible !== false });
    }
    if (seen.size !== SECTION_IDS.length) {
      return { ok: false, error: "Every section must be present." };
    }
    return { ok: true, value: out };
  }

  const def = BLOCK_BY_KEY[key as BlockDef["key"]];
  if (!def) return { ok: false, error: "Unknown content block." };
  const result = validateBlock(def, raw);
  if (!result.ok) return result;
  const problem = extraChecks(def.key, result.value);
  return problem ? { ok: false, error: problem } : result;
}
