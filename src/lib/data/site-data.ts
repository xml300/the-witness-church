import { todayInLagos } from "@/src/lib/content/events";
import type { SiteContent } from "@/src/lib/content/types";
import { getApprovedPrayers } from "./prayers";
import { getSocialPosts } from "./social";
import type { SiteData } from "./types";
import { getVerseOfDay } from "./verse";
import { enrichClips } from "./oembed";
import { filterSermons, getLiveNow, getUploads, resolveChannelId } from "./youtube";

export const pastorDeliveryConfigured = () =>
  Boolean(
    process.env.GOOGLE_SHEET_WEBHOOK_URL && process.env.GOOGLE_SHEET_SECRET,
  );

/** Gathers everything outside the admin content. Each source fails on its
 *  own, so one broken service never takes the page down. */
export async function getSiteData(content: SiteContent): Promise<SiteData> {
  const today = todayInLagos();
  const info = content.site_info;
  const channelId = await resolveChannelId(info.youtubeChannelId);
  const [uploads, prayers, verse, live, clipMeta] = await Promise.all([
    getUploads(channelId),
    getApprovedPrayers(),
    getVerseOfDay(today),
    getLiveNow(channelId, info.sermonTitleFilter),
    enrichClips(content.clips),
  ]);
  const library = filterSermons(uploads, info.sermonTitleFilter);
  const social = await getSocialPosts(library);
  return {
    today,
    library,
    social,
    prayers,
    verse,
    live,
    clipMeta,
    pastorEnabled: pastorDeliveryConfigured(),
  };
}
