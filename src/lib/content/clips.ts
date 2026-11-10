import { PLATFORMS } from "./schema";
import type { Clip, SiteInfo } from "./types";
import type { SocialPost } from "@/src/lib/data/types";

const PER_PLATFORM = 2;

/** Which platform a link belongs to, from its address. */
export function platformFromUrl(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be" || host.endsWith("youtube.com")) return "YouTube";
    if (host.endsWith("instagram.com")) return "Instagram";
    if (host.endsWith("facebook.com") || host === "fb.watch" || host === "fb.com")
      return "Facebook";
    if (host.endsWith("tiktok.com")) return "TikTok";
    if (host === "x.com" || host.endsWith("twitter.com")) return "X";
  } catch {
    /* not a URL */
  }
  return null;
}

const PROFILE_KEY: Record<string, keyof SiteInfo> = {
  YouTube: "socialYoutube",
  Instagram: "socialInstagram",
  Facebook: "socialFacebook",
  TikTok: "socialTiktok",
  X: "socialX",
};

export type ClipsResult = {
  posts: SocialPost[];
  /** Channels with a profile link but no posts to show: shown as icons. */
  icons: { platform: string; url: string }[];
};

/** Newest posts from each channel, two per platform in a fixed order.
 *  Automatic posts come first (they carry a date), then hand-added ones,
 *  with any missing caption or thumbnail filled in from the link. A channel
 *  with a profile link but no posts is returned separately so the section can
 *  show its icon, linking to the church's page there. */
export function buildClips(
  manual: Clip[],
  auto: SocialPost[],
  meta: Record<string, { title: string; image: string }>,
  info: SiteInfo,
): ClipsResult {
  const posts: SocialPost[] = [];
  const icons: ClipsResult["icons"] = [];
  for (const platform of PLATFORMS) {
    const fromAuto = auto
      .filter((p) => p.platform === platform)
      .sort((a, b) => (a.published < b.published ? 1 : -1));
    const fromManual: SocialPost[] = manual
      .filter((c) => c.url && (platformFromUrl(c.url) ?? c.platform) === platform)
      .map((c) => ({
        platform,
        url: c.url,
        title: c.title || meta[c.url]?.title || `View on ${platform}`,
        image: c.image || meta[c.url]?.image || "",
        published: "",
      }));
    const found = [...fromAuto, ...fromManual].slice(0, PER_PLATFORM);
    posts.push(...found);
    const profile = String(info[PROFILE_KEY[platform]] ?? "");
    if (found.length === 0 && profile) icons.push({ platform, url: profile });
  }
  return { posts, icons };
}
