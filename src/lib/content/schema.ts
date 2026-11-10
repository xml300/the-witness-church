import type { ContentKey } from "./types";

/**
 * Single source of truth for what the admin may edit.
 * The same definitions render the forms AND validate saves on the server.
 */

export type Option = { label: string; value: string };

export type Field = {
  name: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "url"
    | "image"
    | "number"
    | "range"
    | "date"
    | "time"
    | "category"
    | "select";
  options?: Option[];
  hint?: string;
  max?: number; // max characters (text) or max value (number)
  min?: number; // min value (number)
  /** image/date only: an empty value is allowed */
  optional?: boolean;
  /** text/url only: an empty value is rejected */
  required?: boolean;
};

export type BlockDef = {
  key: Exclude<ContentKey, "theme" | "look" | "sections">;
  title: string;
  description: string;
  kind: "object" | "list";
  fields: Field[];
  /** list only: field shown as the row title */
  titleField?: string;
  /** list only: maximum rows */
  maxItems?: number;
  /** list only: template for a newly added row */
  blank?: Record<string, string | number>;
};

// Tailwind finds these class names because they appear literally in source.
export const GAME_BADGE_STYLES: Option[] = [
  { label: "Red", value: "bg-red/20 text-red-200" },
  { label: "Blue", value: "bg-blue-400/20 text-blue-200" },
  { label: "Green", value: "bg-green-400/20 text-green-200" },
  { label: "Pink", value: "bg-pink/20 text-pink-200" },
  { label: "Amber", value: "bg-amber-400/20 text-amber-200" },
];

export const CARD_ACCENTS: Option[] = [
  { label: "Red", value: "bg-red" },
  { label: "Pink", value: "bg-pink" },
  { label: "Navy", value: "bg-navy" },
];

export const PLATFORMS = ["YouTube", "Instagram", "Facebook", "TikTok", "X"];

const PLATFORM_OPTIONS: Option[] = PLATFORMS.map((p) => ({ label: p, value: p }));

const YES_NO: Option[] = [
  { label: "No", value: "no" },
  { label: "Yes, keep it on the homepage", value: "yes" },
];

export const REPEAT_OPTIONS: Option[] = [
  { label: "Does not repeat", value: "none" },
  { label: "Every day", value: "daily" },
  { label: "Every week", value: "weekly" },
  { label: "Every two weeks", value: "biweekly" },
  { label: "Every month", value: "monthly" },
  { label: "Every year", value: "yearly" },
];

/** Times offered in the picker: every 30 minutes, plus a few church-specific ones. */
export const TIME_CHOICES: string[] = [
  "All day",
  "All services",
  ...Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2);
    const m = i % 2 ? "30" : "00";
    return `${h % 12 === 0 ? 12 : h % 12}:${m} ${h < 12 ? "AM" : "PM"}`;
  }),
];

const KIND_OPTIONS: Option[] = [
  { label: "In person", value: "in-person" },
  { label: "Online", value: "online" },
];

const IMG_HINT = "Choose a photo from your library or upload a new one.";

export const BLOCKS: BlockDef[] = [
  {
    key: "site_info",
    title: "Site details",
    description:
      "Name, hero wording, buttons, YouTube setup, footer text and social links.",
    kind: "object",
    fields: [
      { name: "churchName", label: "Church name", type: "text", max: 80 },
      { name: "location", label: "Location line", type: "text", max: 80 },
      {
        name: "liveUrl",
        label: "Watch Live link",
        type: "url",
        hint: "Used when nothing is live. When a stream with the sermon title text is on air, Watch Live goes to it automatically (needs a YouTube API key).",
      },
      {
        name: "youtubeChannelId",
        label: "YouTube channel",
        type: "text",
        max: 160,
        hint: "Paste the channel link or its @handle, for example @thewitnesschurch. No YouTube login needed. Builds the sermon library.",
      },
      {
        name: "sermonTitleFilter",
        label: "Sermon title must contain",
        type: "text",
        max: 80,
        hint: "Only videos whose title contains this text join the sermon library. Leave empty to include every video.",
      },
      { name: "heroEyebrow", label: "Hero small label", type: "text", max: 80 },
      { name: "heroLine1", label: "Hero headline, first line", type: "text", max: 60 },
      {
        name: "heroAccent",
        label: "Hero headline, highlighted word",
        type: "text",
        max: 30,
        hint: "Shown in the accent color.",
      },
      { name: "heroLine2", label: "Hero headline, second line", type: "text", max: 60 },
      { name: "heroSubtext", label: "Hero paragraph", type: "textarea", max: 300 },
      { name: "heroShade", label: "Photo darkness", type: "range", min: 20, max: 90 },
      { name: "primaryCtaLabel", label: "Main button text", type: "text", max: 40 },
      { name: "primaryCtaHref", label: "Main button link", type: "url" },
      { name: "secondaryCtaLabel", label: "Second button text", type: "text", max: 40 },
      { name: "secondaryCtaHref", label: "Second button link", type: "url" },
      { name: "welcomeTag", label: "Welcome section label", type: "text", max: 60 },
      { name: "welcomeTitle", label: "Welcome section title", type: "text", max: 80 },
      { name: "welcomeSubtext", label: "Welcome section paragraph", type: "textarea", max: 300 },
      { name: "footerBlurb", label: "Footer description", type: "textarea", max: 300 },
      { name: "copyright", label: "Footer copyright line", type: "text", max: 160 },
      { name: "socialYoutube", label: "YouTube link", type: "url" },
      { name: "socialX", label: "X (Twitter) link", type: "url" },
      { name: "socialFacebook", label: "Facebook link", type: "url" },
      { name: "socialInstagram", label: "Instagram link", type: "url" },
      { name: "socialTiktok", label: "TikTok link", type: "url" },
    ],
  },
  {
    key: "hero_slides",
    title: "Hero photos",
    description: "The rotating background photos at the top of the homepage.",
    kind: "list",
    titleField: "alt",
    maxItems: 12,
    blank: { src: "", alt: "" },
    fields: [
      { name: "src", label: "Photo", type: "image", hint: IMG_HINT },
      { name: "alt", label: "Description (for screen readers)", type: "text", max: 120 },
    ],
  },
  {
    key: "welcome_cards",
    title: "Welcome cards",
    description: "The photo cards under the welcome heading.",
    kind: "list",
    titleField: "title",
    maxItems: 6,
    blank: {
      label: "",
      title: "",
      cta: "Learn More",
      href: "#",
      image: "",
      alt: "",
      accent: "bg-red",
    },
    fields: [
      { name: "image", label: "Photo", type: "image", hint: IMG_HINT },
      { name: "alt", label: "Photo description", type: "text", max: 120 },
      { name: "label", label: "Small label", type: "text", max: 60 },
      { name: "title", label: "Title", type: "text", max: 80 },
      { name: "cta", label: "Link text", type: "text", max: 40 },
      { name: "href", label: "Link", type: "url" },
      { name: "accent", label: "Top bar color", type: "select", options: CARD_ACCENTS },
    ],
  },
  {
    key: "events",
    title: "Celebrations & events",
    description:
      "Everything on the events calendar. The homepage picks what is happening this week, plus anything you pin.",
    kind: "list",
    titleField: "title",
    maxItems: 200,
    blank: {
      title: "",
      date: "",
      endDate: "",
      time: "",
      place: "",
      category: "Event",
      description: "",
      image: "",
      pinned: "no",
      repeat: "none",
      repeatUntil: "",
    },
    fields: [
      { name: "title", label: "Title", type: "text", max: 120, required: true },
      { name: "date", label: "Date", type: "date" },
      {
        name: "endDate",
        label: "Last day",
        type: "date",
        optional: true,
        hint: "Only for events that run over several days.",
      },
      { name: "time", label: "Time", type: "time" },
      {
        name: "repeat",
        label: "Repeat",
        type: "select",
        options: REPEAT_OPTIONS,
        hint: "Repeating events appear on every matching day of the calendar.",
      },
      {
        name: "repeatUntil",
        label: "Repeat until",
        type: "date",
        optional: true,
        hint: "Leave empty to keep repeating.",
      },
      { name: "place", label: "Where", type: "text", max: 80 },
      { name: "category", label: "Category", type: "category", max: 24 },
      {
        name: "pinned",
        label: "Pin to homepage",
        type: "select",
        options: YES_NO,
        hint: "Pinned events show on the homepage even when they are months away.",
      },
      { name: "description", label: "Details", type: "textarea", max: 800 },
      { name: "image", label: "Photo", type: "image", optional: true, hint: IMG_HINT },
    ],
  },
  {
    key: "event_categories",
    title: "Event categories",
    description: "The choices in the Category dropdown on events.",
    kind: "list",
    titleField: "name",
    maxItems: 30,
    blank: { name: "" },
    fields: [{ name: "name", label: "Name", type: "text", max: 24, required: true }],
  },
  {
    key: "pinned_sermons",
    title: "Pinned sermons",
    description: "Messages from the sermon library that always show on the homepage.",
    kind: "list",
    titleField: "title",
    maxItems: 6,
    blank: { videoId: "", title: "" },
    fields: [
      { name: "videoId", label: "YouTube video ID", type: "text", max: 11, required: true },
      { name: "title", label: "Title", type: "text", max: 200 },
    ],
  },
  {
    key: "clips",
    title: "Manual social posts",
    description:
      "Posts from platforms that cannot be pulled automatically. They appear beside the automatic ones.",
    kind: "list",
    titleField: "title",
    maxItems: 20,
    blank: { platform: "Instagram", title: "", url: "", image: "" },
    fields: [
      { name: "platform", label: "Platform (if the link is not recognised)", type: "select", options: PLATFORM_OPTIONS },
      {
        name: "url",
        label: "Link to the post",
        type: "url",
        required: true,
        hint: "Paste the post link. The platform is detected from it. YouTube and TikTok fill in the caption and thumbnail by themselves.",
      },
      { name: "title", label: "Caption (optional)", type: "text", max: 140 },
      { name: "image", label: "Thumbnail (optional)", type: "image", optional: true, hint: IMG_HINT },
    ],
  },
  {
    key: "games",
    title: "Games",
    description: "Cards in the Games section. Each links to its own page.",
    kind: "list",
    titleField: "title",
    maxItems: 12,
    blank: {
      emoji: "🎮",
      title: "",
      description: "",
      badge: "",
      badgeStyle: "bg-red/20 text-red-200",
    },
    fields: [
      { name: "emoji", label: "Emoji", type: "text", max: 8 },
      { name: "title", label: "Title", type: "text", max: 60, required: true },
      { name: "description", label: "Description", type: "textarea", max: 200 },
      { name: "badge", label: "Badge text", type: "text", max: 24 },
      { name: "badgeStyle", label: "Badge color", type: "select", options: GAME_BADGE_STYLES },
    ],
  },
  {
    key: "about",
    title: "About page",
    description: "The text and photo on the About Us page.",
    kind: "object",
    fields: [
      { name: "heading", label: "Page title", type: "text", max: 80 },
      { name: "intro", label: "Opening line", type: "textarea", max: 300 },
      { name: "story", label: "Our story", type: "textarea", max: 2000 },
      { name: "mission", label: "Mission", type: "textarea", max: 300 },
      { name: "vision", label: "Vision", type: "textarea", max: 300 },
      { name: "photo", label: "Photo", type: "image", optional: true, hint: IMG_HINT },
    ],
  },
  {
    key: "locations",
    title: "Locations",
    description: "In-person and online services shown on the Connect page.",
    kind: "list",
    titleField: "name",
    maxItems: 20,
    blank: { name: "", kind: "in-person", address: "", schedule: "", link: "" },
    fields: [
      { name: "name", label: "Name", type: "text", max: 80, required: true },
      { name: "kind", label: "Type", type: "select", options: KIND_OPTIONS },
      { name: "address", label: "Address or platform", type: "text", max: 160 },
      { name: "schedule", label: "Service times", type: "text", max: 160 },
      {
        name: "link",
        label: "Map or watch link",
        type: "url",
        hint: "A Google Maps link, or the live-stream link for online services.",
      },
    ],
  },
  {
    key: "leaders",
    title: "Leaders",
    description: "Photos and names of the leaders shown on the Connect page.",
    kind: "list",
    titleField: "name",
    maxItems: 30,
    blank: { name: "", role: "", photo: "" },
    fields: [
      { name: "name", label: "Name", type: "text", max: 80, required: true },
      { name: "role", label: "Role", type: "text", max: 80 },
      { name: "photo", label: "Photo", type: "image", hint: IMG_HINT },
    ],
  },
  {
    key: "gallery",
    title: "Photo gallery",
    description: "Photos of events and services shown on the Connect page.",
    kind: "list",
    titleField: "caption",
    maxItems: 30,
    blank: { photo: "", caption: "" },
    fields: [
      { name: "photo", label: "Photo", type: "image", hint: IMG_HINT },
      { name: "caption", label: "Caption", type: "text", max: 120 },
    ],
  },
  {
    key: "devotion",
    title: "Verse of the day",
    description:
      "The verse itself changes daily on its own. You control the wording around it.",
    kind: "object",
    fields: [
      { name: "tag", label: "Small label", type: "text", max: 60 },
      { name: "title", label: "Title", type: "text", max: 80 },
      { name: "moreLabel", label: "More plans link text", type: "text", max: 40 },
      {
        name: "moreUrl",
        label: "More plans link",
        type: "url",
        hint: "Opens the YouVersion reading plans by default.",
      },
    ],
  },
  {
    key: "prayer",
    title: "Prayer wall",
    description: "The wording around the prayer form and wall.",
    kind: "object",
    fields: [
      { name: "tag", label: "Small label", type: "text", max: 60 },
      { name: "title", label: "Title", type: "text", max: 80 },
      { name: "intro", label: "Introduction", type: "textarea", max: 300 },
      { name: "wallNote", label: "Note about review", type: "textarea", max: 200 },
    ],
  },
];

export const BLOCK_BY_KEY = Object.fromEntries(
  BLOCKS.map((b) => [b.key, b]),
) as Record<BlockDef["key"], BlockDef>;
