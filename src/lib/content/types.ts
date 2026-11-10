export type Theme = {
  navy: string;
  navyDeep: string;
  red: string;
  redDark: string;
  pink: string;
  pinkLight: string;
  grayBg: string;
  gray2: string;
  text: string;
  muted: string;
};

export type SiteInfo = {
  churchName: string;
  location: string;
  liveUrl: string;
  youtubeChannelId: string;
  sermonTitleFilter: string;
  heroEyebrow: string;
  heroLine1: string;
  heroAccent: string;
  heroLine2: string;
  heroSubtext: string;
  heroShade: number;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  welcomeTag: string;
  welcomeTitle: string;
  welcomeSubtext: string;
  footerBlurb: string;
  copyright: string;
  socialYoutube: string;
  socialX: string;
  socialFacebook: string;
  socialInstagram: string;
  socialTiktok: string;
};

export type FontKey = "jakarta" | "fraunces" | "bricolage";

export type Look = { radius: number; font: FontKey };

export type SectionConfig = { id: string; visible: boolean };

export type HeroSlide = { src: string; alt: string };

export type WelcomeCard = {
  label: string;
  title: string;
  cta: string;
  href: string;
  image: string;
  alt: string;
  accent: string;
};

/** One entry on the Celebrations & Events calendar. Dates are YYYY-MM-DD. */
export type ChurchEvent = {
  title: string;
  date: string;
  endDate: string;
  time: string;
  place: string;
  category: string;
  description: string;
  image: string;
  /** "yes" keeps it on the homepage even when it is months away. */
  pinned: string;
  /** "none" | "daily" | "weekly" | "biweekly" | "monthly" | "yearly" */
  repeat: string;
  /** Last day the event repeats. Empty means it keeps repeating. */
  repeatUntil: string;
};

export type EventCategory = { name: string };

export type PinnedSermon = { videoId: string; title: string };

/** A hand-added social post, for platforms that cannot be pulled automatically. */
export type Clip = {
  platform: string;
  title: string;
  url: string;
  image: string;
};

export type Game = {
  emoji: string;
  title: string;
  description: string;
  badge: string;
  badgeStyle: string;
};

export type About = {
  heading: string;
  intro: string;
  story: string;
  mission: string;
  vision: string;
  photo: string;
};

export type ChurchLocation = {
  name: string;
  kind: string; // "in-person" | "online"
  address: string;
  schedule: string;
  link: string;
};

export type Leader = { name: string; role: string; photo: string };

export type GalleryPhoto = { photo: string; caption: string };

export type Devotion = {
  tag: string;
  title: string;
  moreLabel: string;
  moreUrl: string;
};

export type Prayer = {
  tag: string;
  title: string;
  intro: string;
  wallNote: string;
};

export type SiteContent = {
  theme: Theme;
  look: Look;
  site_info: SiteInfo;
  sections: SectionConfig[];
  hero_slides: HeroSlide[];
  welcome_cards: WelcomeCard[];
  events: ChurchEvent[];
  event_categories: EventCategory[];
  pinned_sermons: PinnedSermon[];
  clips: Clip[];
  games: Game[];
  about: About;
  locations: ChurchLocation[];
  leaders: Leader[];
  gallery: GalleryPhoto[];
  devotion: Devotion;
  prayer: Prayer;
};

export type ContentKey = keyof SiteContent;

export const CONTENT_KEYS: ContentKey[] = [
  "theme",
  "look",
  "site_info",
  "sections",
  "hero_slides",
  "welcome_cards",
  "events",
  "event_categories",
  "pinned_sermons",
  "clips",
  "games",
  "about",
  "locations",
  "leaders",
  "gallery",
  "devotion",
  "prayer",
];
