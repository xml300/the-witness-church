import { serviceClient } from "@/src/lib/supabase/service";

/** The single hunt settings row. Server only: it contains the keys. */
export type HuntConfig = {
  title: string;
  opens_at: string | null;
  closes_at: string | null;
  pass_mark: number;
  question_count: number;
  max_attempts: number | null;
  key1: string;
  key2: string;
  key3: string;
  key4: string;
  founders_photo_url: string;
  founders_intro: string;
  word_hint: string;
  clue2_title: string;
  clue2_body: string;
  clue3_title: string;
  clue3_body: string;
  rewards: string[];
  reward_default: string;
  bonus_hint: string;
  // Games 3 and 4 (migration 007). Defaults apply until that is run.
  g3_pass_mark: number;
  g3_question_count: number;
  g3_max_attempts: number | null;
  g34_opens_at: string | null;
  g34_closes_at: string | null;
  key_phrase: string;
  video_url: string;
  video_title: string;
  video_intro: string;
};

const LATER_DEFAULTS = {
  g3_pass_mark: 70,
  g3_question_count: 10,
  g3_max_attempts: null,
  g34_opens_at: null,
  g34_closes_at: null,
  key_phrase: "",
  video_url: "",
  video_title: "",
  video_intro: "",
};

export async function getHuntConfig(): Promise<HuntConfig | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("hunt_config").select("*").eq("id", 1).maybeSingle();
  if (!data) return null;
  const rewards = Array.isArray(data.rewards) ? (data.rewards as unknown[]).map(String) : [];
  return { ...LATER_DEFAULTS, ...(data as HuntConfig), rewards };
}

export type HuntWindow = "not-open" | "open" | "closed";

export function huntWindow(c: Pick<HuntConfig, "opens_at" | "closes_at">, now = Date.now()): HuntWindow {
  if (c.opens_at && now < new Date(c.opens_at).getTime()) return "not-open";
  if (c.closes_at && now > new Date(c.closes_at).getTime()) return "closed";
  return "open";
}

/** Lenient comparison for keys, words and names. */
export function norm(s: string): string {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

export function sameKey(entered: unknown, expected: string): boolean {
  return typeof entered === "string" && expected.trim() !== "" && norm(entered) === norm(expected);
}

/** The two games that are quizzes inside the hunt. */
export type HuntGameId = "hunt" | "sermon";

/** Rules for one of them. Game 1 wins Key 1, Game 3 wins Key 3. */
export function quizStage(c: HuntConfig, game: HuntGameId) {
  return game === "sermon"
    ? {
        keyNo: 3 as const,
        key: c.key3,
        passMark: c.g3_pass_mark,
        count: c.g3_question_count,
        maxAttempts: c.g3_max_attempts,
        opensAt: c.g34_opens_at,
        closesAt: c.g34_closes_at,
      }
    : {
        keyNo: 1 as const,
        key: c.key1,
        passMark: c.pass_mark,
        count: c.question_count,
        maxAttempts: c.max_attempts,
        opensAt: c.opens_at,
        closesAt: c.closes_at,
      };
}
