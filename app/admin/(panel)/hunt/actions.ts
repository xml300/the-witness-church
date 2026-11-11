"use server";

import { getAdmin } from "@/src/lib/auth";

type Result = { ok: true } | { ok: false; error: string };
const SIGNED_OUT = "You are signed out. Please sign in again.";
const UUID = /^[0-9a-f-]{36}$/i;

export type ConfigInput = {
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
};

const s = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const int = (v: unknown, lo: number, hi: number) =>
  typeof v === "number" && Number.isInteger(v) && v >= lo && v <= hi ? v : null;
const date = (v: unknown) => {
  if (v === null || v === "") return null;
  const d = typeof v === "string" ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toISOString() : undefined;
};

export async function saveHuntConfig(input: ConfigInput): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: SIGNED_OUT };

  const pass = int(input.pass_mark, 1, 100);
  const count = int(input.question_count, 1, 50);
  if (pass === null) return { ok: false, error: "The pass mark must be between 1 and 100." };
  if (count === null) return { ok: false, error: "Questions must be between 1 and 50." };
  const attempts = input.max_attempts === null ? null : int(input.max_attempts, 1, 20);
  if (input.max_attempts !== null && attempts === null) {
    return { ok: false, error: "Attempts must be 1 to 20, or empty." };
  }
  const opens = date(input.opens_at);
  const closes = date(input.closes_at);
  if (opens === undefined || closes === undefined) return { ok: false, error: "A date is not valid." };
  if (opens && closes && closes <= opens) {
    return { ok: false, error: "The closing time must be after the opening time." };
  }

  const keys = [s(input.key1, 60), s(input.key2, 60), s(input.key3, 60), s(input.key4, 60)];
  const filled = keys.filter(Boolean);
  if (new Set(filled.map((k) => k.toLowerCase())).size !== filled.length) {
    return { ok: false, error: "Each key must be different." };
  }

  const rewards = Array.isArray(input.rewards) ? input.rewards.slice(0, 20).map((r) => s(r, 400)) : [];
  while (rewards.length && !rewards[rewards.length - 1]) rewards.pop();

  const { error } = await admin.supabase
    .from("hunt_config")
    .update({
      title: s(input.title, 80) || "Anniversary Treasure Hunt",
      opens_at: opens,
      closes_at: closes,
      pass_mark: pass,
      question_count: count,
      max_attempts: attempts,
      key1: keys[0],
      key2: keys[1],
      key3: keys[2],
      key4: keys[3],
      founders_photo_url: s(input.founders_photo_url, 600),
      founders_intro: s(input.founders_intro, 600),
      word_hint: s(input.word_hint, 600),
      clue2_title: s(input.clue2_title, 80),
      clue2_body: s(input.clue2_body, 1500),
      clue3_title: s(input.clue3_title, 80),
      clue3_body: s(input.clue3_body, 1500),
      rewards,
      reward_default: s(input.reward_default, 400),
      bonus_hint: s(input.bonus_hint, 600),
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  return error ? { ok: false, error: "Could not save. Has migration-006 been run?" } : { ok: true };
}

export type FounderInput = { name: string; aliases: string[] };

/** Replaces the whole list. The photo is not numbered, so numbers are only
 *  internal and follow the order entered. */
export async function saveFounders(list: FounderInput[]): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: SIGNED_OUT };
  if (!Array.isArray(list) || list.length > 60) return { ok: false, error: "Too many people." };

  const clean: { number: number; name: string; aliases: string[] }[] = [];
  for (const [i, f] of list.entries()) {
    const name = s(f.name, 80);
    if (!name) return { ok: false, error: `Row ${i + 1} needs a name, or remove it.` };
    const aliases = (Array.isArray(f.aliases) ? f.aliases : [])
      .map((a) => s(a, 60))
      .filter(Boolean)
      .slice(0, 10);
    clean.push({ number: i + 1, name, aliases });
  }

  if (clean.length) {
    const { error } = await admin.supabase.from("hunt_founders").upsert(clean, { onConflict: "number" });
    if (error) return { ok: false, error: "Could not save the people." };
  }
  const del = admin.supabase.from("hunt_founders").delete();
  const { error: delErr } = clean.length ? await del.gt("number", clean.length) : await del.gte("number", 0);
  return delErr ? { ok: false, error: "Saved, but could not remove old entries." } : { ok: true };
}

export async function deleteChestOpen(id: string): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: SIGNED_OUT };
  if (!UUID.test(id)) return { ok: false, error: "Invalid item." };
  const { error } = await admin.supabase.from("hunt_chest_opens").delete().eq("id", id);
  return error ? { ok: false, error: "Could not remove that entry." } : { ok: true };
}
