import type { Clip } from "@/src/lib/content/types";

type Meta = { title: string; image: string };

/** Looks up the title and thumbnail for a post link using each platform's
 *  public oEmbed address. YouTube and TikTok answer without any account.
 *  Instagram and Facebook require a Meta token, and X does not return a
 *  picture, so those keep whatever the admin typed. */
async function lookup(url: string): Promise<Meta | null> {
  let endpoint = "";
  const host = new URL(url).hostname.replace(/^www\./, "");
  if (host === "youtube.com" || host === "youtu.be") {
    endpoint = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`;
  } else if (host.endsWith("tiktok.com")) {
    endpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
  } else {
    return null;
  }
  const res = await fetch(endpoint, {
    next: { revalidate: 86_400, tags: ["social"] },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;
  const j = (await res.json()) as { title?: string; thumbnail_url?: string };
  return { title: j.title ?? "", image: j.thumbnail_url ?? "" };
}

/** For each hand-added post that is missing a caption or thumbnail, fetch
 *  them from its link. Returns a map keyed by link. Never throws. */
export async function enrichClips(clips: Clip[]): Promise<Record<string, Meta>> {
  const out: Record<string, Meta> = {};
  await Promise.all(
    clips
      .filter((c) => c.url && (!c.title || !c.image))
      .slice(0, 20)
      .map(async (c) => {
        try {
          const m = await lookup(c.url);
          if (m) out[c.url] = m;
        } catch {
          /* leave this one as typed */
        }
      }),
  );
  return out;
}
