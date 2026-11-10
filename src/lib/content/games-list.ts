import { DEFAULT_CONTENT } from "./defaults";
import { gameHref, slugify } from "./text";
import type { Game } from "./types";

/** "Bible Quiz Battle" was the old name for Bible Quiz. */
const RETIRED = new Set(["bible-quiz-battle"]);
const PLAYABLE_HREFS = ["/games/bible-quiz", "/games/bible-quote"];

/** The cards to show: saved cards minus retired ones, plus a card for each
 *  playable game that has none yet, so both games are always reachable. */
export function listGames(saved: Game[]): Game[] {
  const kept = saved.filter((g) => !RETIRED.has(slugify(g.title)));
  const have = new Set(kept.map((g) => gameHref(g.title)));
  const missing = DEFAULT_CONTENT.games.filter((g) => {
    const href = gameHref(g.title);
    return PLAYABLE_HREFS.includes(href) && !have.has(href);
  });
  return [...missing, ...kept];
}
