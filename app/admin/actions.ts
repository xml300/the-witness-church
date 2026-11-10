"use server";

import { updateTag } from "next/cache";
import { getAdmin } from "@/src/lib/auth";
import { sendToSheet } from "@/src/lib/prayer-sheet";
import { CONTENT_TAG } from "@/src/lib/content/get-content";
import { validateContent } from "@/src/lib/content/validate";
import { CONTENT_KEYS } from "@/src/lib/content/types";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; at?: { key: string; index: number } };

const SIGNED_OUT = "You are signed out. Please sign in again.";
const DRAFT_KEY = "draft";
const MAX_DRAFT_BYTES = 400_000;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Autosave. Only checks shape and size; strict checks happen on publish so
 *  a half-finished edit never blocks saving the draft. */
export async function saveDraft(content: unknown): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: SIGNED_OUT };
  if (!isObject(content)) return { ok: false, error: "Invalid draft." };
  if (JSON.stringify(content).length > MAX_DRAFT_BYTES) {
    return { ok: false, error: "The draft is too large to save." };
  }
  // Keep only known blocks so nothing else can ride along in the draft row.
  const clean: Record<string, unknown> = {};
  for (const k of CONTENT_KEYS) if (k in content) clean[k] = content[k];

  const { error } = await admin.supabase
    .from("site_content")
    .upsert({ key: DRAFT_KEY, value: clean, updated_at: new Date().toISOString() });
  if (error) return { ok: false, error: "Could not save the draft." };
  return { ok: true };
}

/** Validates every block, writes them live, and clears the draft. */
export async function publishDraft(content: unknown): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: SIGNED_OUT };
  if (!isObject(content)) return { ok: false, error: "Invalid content." };

  const rows: { key: string; value: unknown; updated_at: string }[] = [];
  const now = new Date().toISOString();
  for (const key of CONTENT_KEYS) {
    const checked = validateContent(key, content[key]);
    if (!checked.ok) return { ok: false, error: checked.error, at: checked.at };
    rows.push({ key, value: checked.value, updated_at: now });
  }

  const { error } = await admin.supabase.from("site_content").upsert(rows);
  if (error) return { ok: false, error: "Could not publish. Try again." };

  await admin.supabase.from("site_content").delete().eq("key", DRAFT_KEY);
  updateTag(CONTENT_TAG);
  return { ok: true };
}

export async function discardDraft(): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: SIGNED_OUT };
  const { error } = await admin.supabase
    .from("site_content")
    .delete()
    .eq("key", DRAFT_KEY);
  if (error) return { ok: false, error: "Could not discard the draft." };
  return { ok: true };
}

/** Sends one clearly marked test row to the pastor sheet, so the admin can
 *  confirm the connection works before real requests arrive. */
export async function testPastorSheet(): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: SIGNED_OUT };
  const r = await sendToSheet({
    text: "TEST from the admin editor. You can delete this row.",
    category: "Test",
    target: "pastor",
  });
  return r.ok ? { ok: true } : { ok: false, error: r.reason };
}

export async function signOut() {
  const { createClient } = await import("@/src/lib/supabase/server");
  const supabase = await createClient();
  await supabase.auth.signOut();
}
