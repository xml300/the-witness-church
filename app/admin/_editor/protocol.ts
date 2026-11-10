import type { SiteContent } from "@/src/lib/content/types";

/** Messages between the editor and the preview frame. Both sides ignore any
 *  message that does not come from their own origin. */
export type ToPreview = {
  t: "state";
  content: SiteContent;
  selected: string | null;
};

export type FromPreview =
  | { t: "ready" }
  | { t: "select"; id: string | null }
  | { t: "act"; act: "hide" | "show"; id: string }
  | { t: "edit"; path: string; value: string }
  | { t: "editEnd" }
  | { t: "eventNew"; date: string }
  | { t: "eventEdit"; index: number };
