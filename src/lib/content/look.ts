import type { FontKey } from "./types";

export const FONT_CHOICES: Record<
  FontKey,
  { label: string; note: string; cssVar: string }
> = {
  jakarta: {
    label: "Plus Jakarta Sans",
    note: "Current. Friendly and clear.",
    cssVar: "var(--font-plus-jakarta-sans)",
  },
  fraunces: {
    label: "Fraunces headings",
    note: "Warm serif titles, clean body.",
    cssVar: "var(--font-fraunces)",
  },
  bricolage: {
    label: "Bricolage Grotesque",
    note: "Bold, with a little more character.",
    cssVar: "var(--font-bricolage)",
  },
};
