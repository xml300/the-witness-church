export type SermonVideo = {
  id: string;
  title: string;
  /** ISO timestamp (approximate when read from the public pages) */
  published: string;
  /** The service date, YYYY-MM-DD: read from the title when it has one,
   *  otherwise the upload day. Empty when unknown. */
  date: string;
  thumb: string;
  url: string;
};

export type SocialPost = {
  platform: string;
  title: string;
  url: string;
  image: string;
  /** ISO timestamp, or "" for hand-added posts */
  published: string;
};

export type PrayerWallItem = {
  id: string;
  text: string;
  category: string;
  created: string;
};

export type Verse = { reference: string; text: string; version: string };

/** Everything the homepage and sub-pages need that lives outside the admin
 *  content: fetched on the server, handed to the views as plain data. */
export type SiteData = {
  today: string;
  library: SermonVideo[];
  social: SocialPost[];
  prayers: PrayerWallItem[];
  verse: Verse;
  /** The stream on air right now whose title matches the filter, if any. */
  live: SermonVideo | null;
  /** Title and thumbnail fetched for hand-added post links, by link. */
  clipMeta: Record<string, { title: string; image: string }>;
  /** Whether prayer requests for the pastor can be delivered to the sheet. */
  pastorEnabled: boolean;
};
