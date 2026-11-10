"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { sendToSheet } from "@/src/lib/prayer-sheet";

export type PrayerResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export type PrayerInput = {
  text: string;
  category: string;
  target: string;
  /** Optional, and only used for requests sent to the pastor. */
  name: string;
  /** Honeypot: real people never fill this in. */
  website: string;
  /** Milliseconds between the form appearing and being sent. */
  elapsed: number;
};

const CATEGORIES = [
  "Health & Healing",
  "Family",
  "Finance & Career",
  "Salvation of a Loved One",
  "Marriage",
  "Breakthrough",
  "Other",
];

// Best-effort throttle held in memory only: nothing about a visitor is stored.
const recent = new Map<string, number[]>();
function throttled(key: string): boolean {
  const now = Date.now();
  const list = (recent.get(key) ?? []).filter((t) => now - t < 10 * 60_000);
  if (list.length >= 5) {
    recent.set(key, list);
    return true;
  }
  list.push(now);
  recent.set(key, list);
  if (recent.size > 5000) recent.clear();
  return false;
}

export async function submitPrayer(input: PrayerInput): Promise<PrayerResult> {
  const text = String(input.text ?? "").trim();
  const category = CATEGORIES.includes(input.category) ? input.category : "Other";
  const target = input.target;
  // A name is optional and goes only to the pastor's sheet, never to our database.
  const name = target === "pastor" ? String(input.name ?? "").trim().slice(0, 60) : "";

  // Bots: pretend it worked so they do not retry.
  if (input.website || input.elapsed < 2000) {
    return { ok: true, message: "Thank you. We are praying with you." };
  }
  if (!["wall", "pastor"].includes(target)) {
    return { ok: false, error: "Choose where this request should go." };
  }
  if (text.length < 5) {
    return { ok: false, error: "Please share a little more about your request." };
  }
  if (text.length > 600) {
    return { ok: false, error: "Please keep your request under 600 characters." };
  }

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  if (throttled(createHash("sha256").update(ip).digest("hex"))) {
    return { ok: false, error: "You have sent several requests. Please try again in a few minutes." };
  }

  const toPastor = target === "pastor";
  const toWall = target === "wall";

  // The pastor copy goes first. A request meant only for the pastor is never
  // stored in our database at all.
  if (toPastor) {
    const sent = await sendToSheet({ text, category, target, name });
    if (!sent.ok) {
      return {
        ok: false,
        error:
          "We could not deliver this to the pastor right now. Please try again later.",
      };
    }
  }

  if (toWall) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      return { ok: false, error: "The prayer wall is not available right now." };
    }
    const supabase = createClient(url, anon, { auth: { persistSession: false } });
    const { error } = await supabase
      .from("prayer_requests")
      .insert({ text, category, status: "pending" });
    if (error) {
      return { ok: false, error: "We could not save your request. Please try again." };
    }
  }

  const message = toPastor
    ? "Your request was sent privately to our pastor. We are praying with you."
    : "Thank you. Your request will appear on the wall once our team has reviewed it.";
  return { ok: true, message };
}
