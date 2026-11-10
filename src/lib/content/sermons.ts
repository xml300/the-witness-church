import type { PinnedSermon } from "./types";
import type { SermonVideo } from "@/src/lib/data/types";

const fromPin = (p: PinnedSermon): SermonVideo => ({
  id: p.videoId,
  title: p.title || "Sermon",
  published: "",
  date: "",
  thumb: `https://i.ytimg.com/vi/${p.videoId}/hqdefault.jpg`,
  url: `https://www.youtube.com/watch?v=${p.videoId}`,
});

/** Homepage sermons: pinned messages first (in the admin's order), then the
 *  newest messages from the library until the list is full. */
export function pickSermons(
  pinned: PinnedSermon[],
  library: SermonVideo[],
  limit = 4,
): SermonVideo[] {
  const out: SermonVideo[] = [];
  const seen = new Set<string>();
  for (const p of pinned) {
    if (seen.has(p.videoId)) continue;
    seen.add(p.videoId);
    out.push(library.find((v) => v.id === p.videoId) ?? fromPin(p));
  }
  for (const v of library) {
    if (out.length >= limit) break;
    if (!seen.has(v.id)) {
      seen.add(v.id);
      out.push(v);
    }
  }
  return out.slice(0, Math.max(limit, pinned.length));
}

/** Pinned messages resolved against the library, for the sermons page. */
export function resolvePinned(
  pinned: PinnedSermon[],
  library: SermonVideo[],
): SermonVideo[] {
  return pinned.map((p) => library.find((v) => v.id === p.videoId) ?? fromPin(p));
}
