import { DEFAULT_CONTENT } from "./defaults";
import { BLOCK_BY_KEY } from "./schema";
import { SECTION_IDS } from "./sections";
import { CONTENT_KEYS, type SectionConfig, type SiteContent } from "./types";

export const CONTENT_TAG = "site-content";

type Row = { key: string; value: unknown };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function normalizeSections(value: unknown): SectionConfig[] {
  const seen = new Set<string>();
  const out: SectionConfig[] = [];
  if (Array.isArray(value)) {
    for (const s of value) {
      if (
        isObject(s) &&
        typeof s.id === "string" &&
        SECTION_IDS.includes(s.id) &&
        !seen.has(s.id)
      ) {
        seen.add(s.id);
        out.push({ id: s.id, visible: s.visible !== false });
      }
    }
  }
  // Any section missing from the saved list (e.g. added in a later release)
  // is appended so it never silently disappears.
  for (const id of SECTION_IDS) {
    if (!seen.has(id)) out.push({ id, visible: true });
  }
  return out;
}

function merge(rows: Row[]): SiteContent {
  const content: SiteContent = structuredClone(DEFAULT_CONTENT);
  for (const { key, value } of rows) {
    switch (key) {
      case "theme":
      case "look":
      case "site_info":
      case "about":
      case "devotion":
      case "prayer":
        if (isObject(value)) {
          Object.assign(content[key], value);
        }
        break;
      case "sections":
        content.sections = normalizeSections(value);
        break;
      case "hero_slides":
      case "welcome_cards":
      case "events":
      case "event_categories":
      case "pinned_sermons":
      case "clips":
      case "games":
      case "locations":
      case "leaders":
      case "gallery":
        if (Array.isArray(value)) {
          // Rows saved before a field existed get that field's starting value.
          const blank = BLOCK_BY_KEY[key as keyof typeof BLOCK_BY_KEY]?.blank ?? {};
          (content[key] as unknown[]) = value.map((item) =>
            isObject(item) ? { ...blank, ...item } : item,
          );
        }
        break;
    }
  }
  return content;
}

/** Turns a saved {key: value} object (the draft) into full content. */
export function contentFromObject(v: unknown): SiteContent {
  if (!isObject(v)) return structuredClone(DEFAULT_CONTENT);
  const rows: Row[] = CONTENT_KEYS.filter((k) => k in v).map((k) => ({
    key: k,
    value: v[k],
  }));
  return merge(rows);
}

async function load(fresh: boolean): Promise<SiteContent> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return DEFAULT_CONTENT;
  try {
    const res = await fetch(`${url}/rest/v1/site_content?select=key,value`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
      ...(fresh
        ? { cache: "no-store" as const }
        : { next: { tags: [CONTENT_TAG], revalidate: 3600 } }),
    });
    if (!res.ok) return DEFAULT_CONTENT;
    return merge((await res.json()) as Row[]);
  } catch {
    return DEFAULT_CONTENT;
  }
}

/** Public site: cached until an admin saves (tag) or one hour passes. */
export const getContent = () => load(false);

/** Admin editors: always reads the latest rows. */
export const getFreshContent = () => load(true);
