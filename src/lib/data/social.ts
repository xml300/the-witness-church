import type { SermonVideo, SocialPost } from "./types";

const REVALIDATE = 1800;

/** Instagram, via the Instagram Graph API (business or creator account).
 *  Needs META_IG_USER_ID and META_ACCESS_TOKEN. */
async function instagram(): Promise<SocialPost[]> {
  const id = process.env.META_IG_USER_ID;
  const token = process.env.META_ACCESS_TOKEN;
  if (!id || !token) return [];
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${id}/media?fields=caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=4&access_token=${token}`,
    {
      next: { revalidate: REVALIDATE, tags: ["social"] },
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!res.ok) return [];
  const j = (await res.json()) as {
    data?: {
      caption?: string;
      media_type?: string;
      media_url?: string;
      thumbnail_url?: string;
      permalink?: string;
      timestamp?: string;
    }[];
  };
  return (j.data ?? [])
    .filter((p) => p.permalink)
    .map((p) => ({
      platform: "Instagram",
      title: (p.caption ?? "View on Instagram").split("\n")[0].slice(0, 140),
      url: p.permalink!,
      image: (p.media_type === "VIDEO" ? p.thumbnail_url : p.media_url) ?? "",
      published: p.timestamp ?? "",
    }));
}

/** Facebook Page posts. Needs META_PAGE_ID and META_PAGE_TOKEN. */
async function facebook(): Promise<SocialPost[]> {
  const id = process.env.META_PAGE_ID;
  const token = process.env.META_PAGE_TOKEN;
  if (!id || !token) return [];
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${id}/posts?fields=message,full_picture,permalink_url,created_time&limit=4&access_token=${token}`,
    {
      next: { revalidate: REVALIDATE, tags: ["social"] },
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!res.ok) return [];
  const j = (await res.json()) as {
    data?: {
      message?: string;
      full_picture?: string;
      permalink_url?: string;
      created_time?: string;
    }[];
  };
  return (j.data ?? [])
    .filter((p) => p.permalink_url)
    .map((p) => ({
      platform: "Facebook",
      title: (p.message ?? "View on Facebook").split("\n")[0].slice(0, 140),
      url: p.permalink_url!,
      image: p.full_picture ?? "",
      published: p.created_time ?? "",
    }));
}

/** Newest posts from every channel that can be read automatically.
 *  YouTube comes from the channel's uploads. TikTok and X have no free read
 *  access, so those are added by hand in the admin. Never throws. */
export async function getSocialPosts(
  uploads: SermonVideo[],
): Promise<SocialPost[]> {
  const youtube: SocialPost[] = uploads.slice(0, 3).map((v) => ({
    platform: "YouTube",
    title: v.title,
    url: v.url,
    image: v.thumb,
    published: v.published,
  }));
  const [ig, fb] = await Promise.all([
    instagram().catch(() => []),
    facebook().catch(() => []),
  ]);
  return [...youtube, ...ig, ...fb];
}

export const metaConfigured = () => ({
  instagram: Boolean(process.env.META_IG_USER_ID && process.env.META_ACCESS_TOKEN),
  facebook: Boolean(process.env.META_PAGE_ID && process.env.META_PAGE_TOKEN),
});
