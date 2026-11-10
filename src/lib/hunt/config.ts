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
  clue2_title: string;
  clue2_body: string;
  clue3_title: string;
  clue3_body: string;
  rewards: string[];
  reward_default: string;
  bonus_hint: string;
};

export async function getHuntConfig(): Promise<HuntConfig | null> {
  const db = serviceClient();
  if (!db) return null;
  const { data } = await db.from("hunt_config").select("*").eq("id", 1).maybeSingle();
  if (!data) return null;
  const rewards = Array.isArray(data.rewards) ? (data.rewards as unknown[]).map(String) : [];
  return { ...(data as HuntConfig), rewards };
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
