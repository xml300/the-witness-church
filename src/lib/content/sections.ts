/** Every homepage section the admin can reorder or hide. `anchor` is the
 *  element id the navbar links to. */
export const SECTION_DEFS: readonly { id: string; label: string; anchor: string }[] = [
  { id: "hero", label: "Hero banner", anchor: "hero" },
  { id: "welcome", label: "Welcome cards", anchor: "community" },
  { id: "devotion", label: "Verse of the day", anchor: "devotion" },
  { id: "announcements", label: "What's happening", anchor: "events" },
  { id: "sermons", label: "Sermons", anchor: "sermons" },
  { id: "clips", label: "Social clips", anchor: "clips" },
  { id: "games", label: "Games", anchor: "games" },
  { id: "prayer", label: "Prayer wall", anchor: "prayer" },
];

export const SECTION_IDS: string[] = SECTION_DEFS.map((s) => s.id);
