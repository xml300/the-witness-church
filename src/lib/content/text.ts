export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "game"
  );
}

/** The games that are built. A card whose title slug matches one of these
 *  links straight to the playable game; any other card goes to the
 *  coming-soon page. */
const PLAYABLE: Record<string, string> = {
  "bible-quiz": "/games/bible-quiz",
  "bible-quote": "/games/bible-quote",
  "bible-quote-game": "/games/bible-quote",
};

export function gameHref(title: string): string {
  const slug = slugify(title);
  return PLAYABLE[slug] ?? `/games/${slug}`;
}
