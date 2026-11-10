import type { GameId } from "@/src/lib/games/types";
import { GAMES } from "@/src/lib/games/types";

export function fmtTime(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export const gamePath = (game: GameId) => GAMES[game].path;
export const roomPath = (game: GameId, code: string) => `${gamePath(game)}/room/${code}`;

/* Browser storage, wrapped because it can be blocked or full. */

const NAME_KEY = "wc-games-name";
const RUNS_KEY = "wc-games-runs";

export function loadName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveName(name: string) {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    /* ignore */
  }
}

export function loadRunIds(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(RUNS_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function rememberRun(id: string) {
  try {
    const ids = [id, ...loadRunIds().filter((x) => x !== id)].slice(0, 50);
    localStorage.setItem(RUNS_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

/* Treasure hunt keys won on this device. */

const HUNT_KEY = "wc-hunt-keys";
type HuntKeys = Record<1 | 2 | 3 | 4, string>;

export function loadHuntKeys(): HuntKeys {
  const empty: HuntKeys = { 1: "", 2: "", 3: "", 4: "" };
  try {
    const raw = JSON.parse(localStorage.getItem(HUNT_KEY) ?? "{}");
    return {
      1: typeof raw[1] === "string" ? raw[1] : "",
      2: typeof raw[2] === "string" ? raw[2] : "",
      3: typeof raw[3] === "string" ? raw[3] : "",
      4: typeof raw[4] === "string" ? raw[4] : "",
    };
  } catch {
    return empty;
  }
}

export function saveHuntKey(n: 1 | 2 | 3 | 4, key: string) {
  try {
    localStorage.setItem(HUNT_KEY, JSON.stringify({ ...loadHuntKeys(), [n]: key }));
  } catch {
    /* ignore */
  }
}
