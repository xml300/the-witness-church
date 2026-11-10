import { unstable_cache } from "next/cache";
import { dateFromTitle } from "@/src/lib/content/sermon-date";
import type { SermonVideo } from "./types";

const REVALIDATE = 3600;
const MAX_PAGES = 8; // 8 x 50 = the 400 most recent uploads


const video = (id: string, title: string, published: string): SermonVideo => ({
  id,
  title,
  published,
  date: dateFromTitle(title) ?? published.slice(0, 10),
  thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  url: `https://www.youtube.com/watch?v=${id}`,
});

async function viaApi(channelId: string, key: string): Promise<SermonVideo[]> {
  // A channel's uploads playlist id is its channel id with UC swapped for UU.
  const playlist = `UU${channelId.slice(2)}`;
  const out: SermonVideo[] = [];
  let pageToken = "";
  for (let page = 0; page < MAX_PAGES; page++) {
    const url =
      "https://www.googleapis.com/youtube/v3/playlistItems" +
      `?part=snippet&maxResults=50&playlistId=${playlist}&key=${key}` +
      (pageToken ? `&pageToken=${pageToken}` : "");
    const res = await fetch(url, {
      next: { revalidate: REVALIDATE, tags: ["youtube"] },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) break;
    const json = (await res.json()) as {
      nextPageToken?: string;
      items?: {
        snippet?: {
          title?: string;
          publishedAt?: string;
          resourceId?: { videoId?: string };
        };
      }[];
    };
    for (const it of json.items ?? []) {
      const s = it.snippet;
      const id = s?.resourceId?.videoId;
      if (!id || !s?.title || /^(private|deleted) video$/i.test(s.title)) continue;
      out.push(video(id, s.title, s.publishedAt ?? ""));
    }
    if (!json.nextPageToken) break;
    pageToken = json.nextPageToken;
  }
  return out;
}

const AGO_MS: Record<string, number> = {
  s: 1_000, sec: 1_000, second: 1_000,
  min: 60_000, minute: 60_000,
  h: 3_600_000, hour: 3_600_000,
  d: 86_400_000, day: 86_400_000,
  w: 604_800_000, week: 604_800_000,
  mo: 2_592_000_000, month: 2_592_000_000,
  y: 31_536_000_000, year: 31_536_000_000,
};

/** "Streamed 11h ago" or "8 months ago" -> an approximate ISO timestamp.
 *  The public pages only show relative times, so this is a best estimate. */
function fromRelative(text: string): string {
  const m = /(\d+)\s*(seconds?|sec|s|minutes?|min|hours?|h|days?|d|weeks?|w|months?|mo|years?|y)\b/i.exec(text);
  if (!m) return "";
  const unit = m[2].toLowerCase().replace(/s$/, "") ;
  const ms = AGO_MS[unit] ?? AGO_MS[unit.replace(/s$/, "")];
  return ms ? new Date(Date.now() - Number(m[1]) * ms).toISOString() : "";
}

type Scraped = SermonVideo & { live: boolean };
type LockupMeta = { title?: { content?: string }; metadata?: unknown };

async function readTab(channelId: string, tab: "videos" | "streams"): Promise<Scraped[]> {
  const res = await fetch(`https://www.youtube.com/channel/${channelId}/${tab}`, {
    headers: {
      "Accept-Language": "en",
      Cookie: "CONSENT=YES+cb; SOCS=CAI",
      "User-Agent": "Mozilla/5.0 (compatible; WitnessChurchSite/1.0)",
    },
    cache: "no-store", // pages are over 1 MB; only the small parsed result is cached
    signal: AbortSignal.timeout(9000),
  });
  if (!res.ok) return [];
  const html = await res.text();
  const m = /var ytInitialData = (\{[\s\S]*?\});<\/script>/.exec(html);
  if (!m) return [];
  const out: Scraped[] = [];
  (function walk(o: unknown): void {
    if (!o || typeof o !== "object") return;
    const n = o as Record<string, unknown>;

    // Current layout: a lockup card with the id, title and a metadata line.
    const lockup = (n.metadata as { lockupMetadataViewModel?: LockupMeta } | undefined)
      ?.lockupMetadataViewModel;
    if (typeof n.contentId === "string" && /^[\w-]{11}$/.test(n.contentId) && lockup) {
      const title = lockup.title?.content ?? "";
      const facts = JSON.stringify([lockup.metadata, n.contentImage]);
      const when = /"content":"([^"]*\bago)"/.exec(facts)?.[1] ?? "";
      if (title) {
        out.push({
          ...video(n.contentId, title, fromRelative(when)),
          live: /"(?:content|text|label)":"LIVE"/i.test(facts) || /\bwatching\b/i.test(facts),
        });
      }
      return;
    }

    // Older layout.
    const id = n.videoId;
    const t = n.title as { simpleText?: string; runs?: { text?: string }[] } | undefined;
    if (typeof id === "string" && /^[\w-]{11}$/.test(id) && t) {
      const title = t.simpleText ?? t.runs?.[0]?.text ?? "";
      const when = (n.publishedTimeText as { simpleText?: string } | undefined)?.simpleText ?? "";
      const text = JSON.stringify([n.thumbnailOverlays, n.viewCountText]);
      if (title) {
        out.push({
          ...video(id, title, fromRelative(when)),
          live: /"style":"LIVE"/.test(text) || /\bwatching\b/i.test(text),
        });
      }
      return;
    }
    for (const k in n) walk(n[k]);
  })(JSON.parse(m[1]));
  return out;
}

/** No API key: read the channel's public Videos and Streams tabs. Church
 *  services are usually live streams, so the Streams tab matters most.
 *  Roughly the newest 30 of each. The small result is cached for 2 minutes. */
const scrapeChannel = unstable_cache(
  async (channelId: string): Promise<Scraped[]> => {
    const [videos, streams] = await Promise.all([
      readTab(channelId, "videos").catch(() => []),
      readTab(channelId, "streams").catch(() => []),
    ]);
    const seen = new Map<string, Scraped>();
    for (const v of [...streams, ...videos]) if (!seen.has(v.id)) seen.set(v.id, v);
    return [...seen.values()];
  },
  ["yt-scrape-v8"],
  { revalidate: 120, tags: ["youtube", "live"] },
);

const CHANNEL_ID = /^UC[\w-]{22}$/;

/** What the admin typed: a channel ID, an @handle, or any youtube.com channel
 *  link. Returns the page to read, or null when it is not a YouTube channel. */
export function parseChannelInput(
  input: string,
): { id: string } | { page: string; live: string } | null {
  const v = input.trim();
  if (!v) return null;
  if (CHANNEL_ID.test(v)) return { id: v };
  const byId = /youtube\.com\/channel\/(UC[\w-]{22})/i.exec(v);
  if (byId) return { id: byId[1] };
  const handle = /^@([\w.-]{3,})$/.exec(v) ?? /youtube\.com\/@([\w.-]{3,})/i.exec(v);
  if (handle) {
    const page = `https://www.youtube.com/@${handle[1]}`;
    return { page, live: `${page}/live` };
  }
  const legacy = /youtube\.com\/((?:c|user)\/[\w.-]+)/i.exec(v);
  if (legacy) {
    const page = `https://www.youtube.com/${legacy[1]}`;
    return { page, live: `${page}/live` };
  }
  return null;
}

/** Turns a channel ID, @handle or link into the UC... channel ID by reading
 *  the public channel page. No login or API key needed. Returns "" when it
 *  cannot be worked out. Cached for a day. */
export async function resolveChannelId(input: string): Promise<string> {
  const p = parseChannelInput(input);
  if (!p) return "";
  if ("id" in p) return p.id;
  try {
    const res = await fetch(p.page, {
      headers: {
        "Accept-Language": "en",
        // Skips the cookie-consent wall some regions are shown.
        Cookie: "CONSENT=YES+cb; SOCS=CAI",
        "User-Agent": "Mozilla/5.0 (compatible; WitnessChurchSite/1.0)",
      },
      next: { revalidate: 86_400, tags: ["youtube"] },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    const m =
      /<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/.exec(html) ??
      /"externalId":"(UC[\w-]{22})"/.exec(html) ??
      /"channelId":"(UC[\w-]{22})"/.exec(html);
    return m?.[1] ?? "";
  } catch {
    return "";
  }
}

/** The channel's own live page, for when nothing is on air. */
export function channelLiveUrl(input: string): string {
  const p = parseChannelInput(input);
  if (!p) return "";
  return "id" in p ? `https://www.youtube.com/channel/${p.id}/live` : p.live;
}

/** Newest-first list of the channel's uploads. Never throws. */
export async function getUploads(channelId: string): Promise<SermonVideo[]> {
  if (!/^UC[\w-]{22}$/.test(channelId)) return [];
  try {
    const key = process.env.YOUTUBE_API_KEY;
    const list = key
      ? await viaApi(channelId, key)
      : (await scrapeChannel(channelId)).map(({ live, ...v }) => (void live, v));
    // Newest first. Equal or missing dates keep the order YouTube gave us.
    return list
      .map((v, i) => ({ v, i }))
      .sort((a, b) =>
        (a.v.date || a.v.published) === (b.v.date || b.v.published)
          ? a.i - b.i
          : (a.v.date || a.v.published) < (b.v.date || b.v.published)
            ? 1
            : -1,
      )
      .map((x) => x.v);
  } catch {
    return [];
  }
}

/** The sermon library: uploads whose title contains the filter text. */
export function filterSermons(
  uploads: SermonVideo[],
  filter: string,
): SermonVideo[] {
  const f = filter.trim().toLowerCase();
  if (!f) return uploads;
  return uploads.filter((v) => v.title.toLowerCase().includes(f));
}

/** The stream that is live right now, if its title matches the sermon
 *  filter. Needs the API key (2 quota units per check). Never throws. */
export async function getLiveNow(
  channelId: string,
  filter: string,
): Promise<SermonVideo | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!/^UC[\w-]{22}$/.test(channelId)) return null;
  if (!key) {
    try {
      const f = filter.trim().toLowerCase();
      const hit = (await scrapeChannel(channelId)).find(
        (v) => v.live && (!f || v.title.toLowerCase().includes(f)),
      );
      if (!hit) return null;
      const { live, ...rest } = hit;
      void live;
      return rest;
    } catch {
      return null;
    }
  }
  try {
    const opts = {
      next: { revalidate: 120, tags: ["live"] },
      signal: AbortSignal.timeout(6000),
    };
    // Live streams appear in the uploads playlist while they are on air.
    const list = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=10&playlistId=UU${channelId.slice(2)}&key=${key}`,
      opts,
    );
    if (!list.ok) return null;
    const ids = (
      (await list.json()) as { items?: { contentDetails?: { videoId?: string } }[] }
    ).items
      ?.map((i) => i.contentDetails?.videoId)
      .filter(Boolean)
      .join(",");
    if (!ids) return null;
    const vids = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${ids}&key=${key}`,
      opts,
    );
    if (!vids.ok) return null;
    const items =
      (
        (await vids.json()) as {
          items?: {
            id: string;
            snippet?: {
              title?: string;
              publishedAt?: string;
              liveBroadcastContent?: string;
            };
          }[];
        }
      ).items ?? [];
    const f = filter.trim().toLowerCase();
    const live = items.find(
      (v) =>
        v.snippet?.liveBroadcastContent === "live" &&
        (!f || (v.snippet.title ?? "").toLowerCase().includes(f)),
    );
    return live
      ? video(live.id, live.snippet?.title ?? "Live", live.snippet?.publishedAt ?? "")
      : null;
  } catch {
    return null;
  }
}

export const apiKeyConfigured = () => Boolean(process.env.YOUTUBE_API_KEY);
