/** Server side of the treasure hunt after Game 1: the founders photo, clue
 *  pages and the chest. Every secret (keys, names, reward text) is checked
 *  here and only returned once it has been earned. */
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { serviceClient } from "@/src/lib/supabase/service";
import { cleanName } from "@/src/lib/games/engine";
import { getHuntConfig, huntWindow, norm, sameKey, type HuntWindow } from "./config";

export type Res<T> = { ok: true; data: T } | { ok: false; error: string };

const NOT_READY = "The treasure hunt is not set up yet.";
const TOO_MANY = "Too many tries. Please wait a few minutes and try again.";

async function ipHash(): Promise<string> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  return createHash("sha256")
    .update(`${ip}|${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`)
    .digest("hex")
    .slice(0, 32);
}

/** Counts a guess and refuses once a visitor guesses too fast. */
async function allowGuess(): Promise<{ ip: string; ok: boolean }> {
  const db = serviceClient()!;
  const ip = await ipHash();
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count } = await db
    .from("hunt_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ip)
    .gte("created_at", since);
  if ((count ?? 0) >= 60) return { ip, ok: false };
  await db.from("hunt_attempts").insert({ ip_hash: ip });
  return { ip, ok: true };
}

/* ------------------------------------------------------------- status */

export type HuntStatus = {
  title: string;
  window: HuntWindow;
  opensAt: string | null;
  closesAt: string | null;
  passMark: number;
};

/** Safe for anyone: no keys, names or rewards. */
export async function huntStatus(): Promise<HuntStatus | null> {
  const c = await getHuntConfig();
  if (!c) return null;
  return {
    title: c.title,
    window: huntWindow(c),
    opensAt: c.opens_at,
    closesAt: c.closes_at,
    passMark: c.pass_mark,
  };
}

/* --------------------------------------------------- Game 2: founders */

export type FoundersView = { photoUrl: string; intro: string };

export async function unlockFounders(key1: unknown): Promise<Res<FoundersView>> {
  const c = await getHuntConfig();
  if (!c || !serviceClient()) return { ok: false, error: NOT_READY };
  const g = await allowGuess();
  if (!g.ok) return { ok: false, error: TOO_MANY };
  if (!sameKey(key1, c.key1)) return { ok: false, error: "That is not the right key." };
  const w = huntWindow(c);
  if (w === "not-open") return { ok: false, error: "This game has not opened yet." };
  if (w === "closed") return { ok: false, error: "This game has closed." };
  return { ok: true, data: { photoUrl: c.founders_photo_url, intro: c.founders_intro } };
}

type Founder = { name: string; aliases: string[] };

function acceptedNames(f: Founder): Set<string> {
  const tokens = f.name.split(/\s+/).map(norm).filter((t) => t.length >= 3);
  return new Set([norm(f.name), ...f.aliases.map(norm), ...tokens]);
}

/** True only if the typed names are exactly the founding members: the same
 *  number of names as founders, and every founder matched by a different
 *  name. Uses a proper matching, so two names that both fit one founder (a
 *  shared surname) cannot stand in for two people. */
function isCompleteList(names: string[], founders: Founder[]): boolean {
  if (founders.length === 0 || names.length !== founders.length) return false;
  const accepted = founders.map(acceptedNames);
  const takenBy: number[] = Array(founders.length).fill(-1); // founder -> name index

  const place = (nameIdx: number, seen: boolean[]): boolean => {
    const guess = norm(names[nameIdx]);
    for (let f = 0; f < founders.length; f++) {
      if (seen[f] || !accepted[f].has(guess)) continue;
      seen[f] = true;
      if (takenBy[f] === -1 || place(takenBy[f], seen)) {
        takenBy[f] = nameIdx;
        return true;
      }
    }
    return false;
  };

  for (let i = 0; i < names.length; i++) {
    if (!place(i, Array(founders.length).fill(false))) return false;
  }
  return true;
}

function cleanNames(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((n) => (typeof n === "string" ? n.trim().slice(0, 80) : ""))
    .filter(Boolean)
    .slice(0, 60);
}

async function founderRows(): Promise<Founder[]> {
  const db = serviceClient()!;
  const { data } = await db.from("hunt_founders").select("name,aliases");
  return (data ?? []) as Founder[];
}

/** Pass or fail only. The answer never says how many were right, or how many
 *  founders there are. */
export async function checkFounders(key1: unknown, names: unknown): Promise<Res<{ passed: boolean; wordHint: string }>> {
  const c = await getHuntConfig();
  if (!c || !serviceClient()) return { ok: false, error: NOT_READY };
  const g = await allowGuess();
  if (!g.ok) return { ok: false, error: TOO_MANY };
  if (!sameKey(key1, c.key1)) return { ok: false, error: "That is not the right key." };
  if (huntWindow(c) !== "open") return { ok: false, error: "This game is not open." };
  const passed = isCompleteList(cleanNames(names), await founderRows());
  return { ok: true, data: { passed, wordHint: passed ? c.word_hint : "" } };
}

export type Clue = { title: string; body: string };

/** The word players build from the names. It is Key 2. The names are sent
 *  again and re-checked, so the word step can't be reached without a full list. */
export async function submitWord(
  key1: unknown,
  names: unknown,
  word: unknown,
): Promise<Res<{ key2: string; clue: Clue }>> {
  const c = await getHuntConfig();
  if (!c || !serviceClient()) return { ok: false, error: NOT_READY };
  const g = await allowGuess();
  if (!g.ok) return { ok: false, error: TOO_MANY };
  if (!sameKey(key1, c.key1)) return { ok: false, error: "That is not the right key." };
  if (huntWindow(c) !== "open") return { ok: false, error: "This game is not open." };
  if (!isCompleteList(cleanNames(names), await founderRows())) {
    return { ok: false, error: "Your list of founding members is not complete yet." };
  }
  if (!sameKey(word, c.key2)) return { ok: false, error: "That is not the word. Look at the names again." };
  return { ok: true, data: { key2: c.key2, clue: { title: c.clue2_title, body: c.clue2_body } } };
}

/* ------------------------------------------------------- clue pages */

/** Key 2 opens the Game 3 clue; Key 3 opens the Game 4 clue. */
export async function unlockClue(stage: unknown, key: unknown): Promise<Res<Clue>> {
  const c = await getHuntConfig();
  if (!c || !serviceClient()) return { ok: false, error: NOT_READY };
  if (stage !== 2 && stage !== 3) return { ok: false, error: "Unknown clue." };
  const g = await allowGuess();
  if (!g.ok) return { ok: false, error: TOO_MANY };
  if (stage === 2) {
    if (!sameKey(key, c.key2)) return { ok: false, error: "That is not the right key." };
    return { ok: true, data: { title: c.clue2_title, body: c.clue2_body } };
  }
  if (!sameKey(key, c.key3)) return { ok: false, error: "That is not the right key." };
  return { ok: true, data: { title: c.clue3_title, body: c.clue3_body } };
}

/* --------------------------------------------------------- the chest */

export type ChestResult = { team: string; place: number; reward: string; already: boolean };

function rewardFor(rewards: string[], fallback: string, place: number): string {
  return rewards[place - 1]?.trim() || fallback;
}

async function placeOf(openedAt: string): Promise<number> {
  const db = serviceClient()!;
  const { count } = await db
    .from("hunt_chest_opens")
    .select("id", { count: "exact", head: true })
    .lt("opened_at", openedAt);
  return (count ?? 0) + 1;
}

export async function openChest(teamName: unknown, keys: unknown): Promise<Res<ChestResult>> {
  const c = await getHuntConfig();
  const db = serviceClient();
  if (!c || !db) return { ok: false, error: NOT_READY };
  const team = cleanName(teamName);
  if (!team) return { ok: false, error: "Enter your team name." };
  if (!Array.isArray(keys) || keys.length !== 4) return { ok: false, error: "Enter all four keys." };

  const g = await allowGuess();
  if (!g.ok) return { ok: false, error: TOO_MANY };

  const real = [c.key1, c.key2, c.key3, c.key4];
  if (real.some((k) => !k.trim())) return { ok: false, error: "The chest is not ready yet." };
  if (!real.every((k, i) => sameKey(keys[i], k))) {
    return { ok: false, error: "That passcode does not open the chest. Check each key." };
  }

  const teamKey = norm(team);
  const { data: prior } = await db
    .from("hunt_chest_opens")
    .select("team_name,opened_at")
    .eq("team_key", teamKey)
    .maybeSingle();
  if (prior) {
    const place = await placeOf(prior.opened_at as string);
    return {
      ok: true,
      data: { team: prior.team_name as string, place, reward: rewardFor(c.rewards, c.reward_default, place), already: true },
    };
  }

  const { data: row, error } = await db
    .from("hunt_chest_opens")
    .insert({ team_key: teamKey, team_name: team, ip_hash: g.ip })
    .select("opened_at")
    .single();
  if (error || !row) {
    // Two taps at once for the same team: report the existing row.
    return { ok: false, error: "Could not record your team. Please press Open again." };
  }
  const place = await placeOf(row.opened_at as string);
  return {
    ok: true,
    data: { team, place, reward: rewardFor(c.rewards, c.reward_default, place), already: false },
  };
}

/** Public list of teams that have opened the chest, in order. */
export async function chestBoard(): Promise<{ place: number; team: string; openedAt: string }[]> {
  const db = serviceClient();
  if (!db) return [];
  const { data } = await db
    .from("hunt_chest_opens")
    .select("team_name,opened_at")
    .order("opened_at", { ascending: true })
    .limit(100);
  return ((data ?? []) as { team_name: string; opened_at: string }[]).map((r, i) => ({
    place: i + 1,
    team: r.team_name,
    openedAt: r.opened_at,
  }));
}
