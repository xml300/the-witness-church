import { pickAnnouncements } from "./events";
import type { SiteContent } from "./types";
import { channelLiveUrl } from "@/src/lib/data/youtube";
import type { SiteData } from "@/src/lib/data/types";

/** Where Watch Live goes: the stream on air now if there is one, else the
 *  link set in the admin, else the channel's own live page. */
export function watchUrl(content: SiteContent, data: SiteData): string {
  const i = content.site_info;
  if (data.live) return data.live.url;
  if (i.liveUrl) return i.liveUrl;
  const own = channelLiveUrl(i.youtubeChannelId);
  if (own) return own;
  return i.socialYoutube || "https://www.youtube.com";
}

/** Props the navbar needs, derived from content so every page agrees. */
export function navProps(content: SiteContent, data: SiteData) {
  const a = pickAnnouncements(content.events, data.today);
  return {
    liveUrl: watchUrl(content, data),
    isLive: Boolean(data.live),
    eventCount: a.fallback ? 0 : a.items.length,
  };
}
