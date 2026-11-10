"use server";

import { updateTag } from "next/cache";
import { getAdmin } from "@/src/lib/auth";
import { PRAYERS_TAG } from "@/src/lib/data/prayers";

type Result = { ok: true } | { ok: false; error: string };

const UUID = /^[0-9a-f-]{36}$/i;

export async function setPrayerStatus(
  id: string,
  action: "approve" | "reject",
): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "You are signed out. Please sign in again." };
  if (!UUID.test(id)) return { ok: false, error: "Invalid request." };

  const q = admin.supabase.from("prayer_requests");
  const { error } =
    action === "approve"
      ? await q.update({ status: "approved" }).eq("id", id)
      : await q.delete().eq("id", id);
  if (error) return { ok: false, error: "Could not update that request." };

  updateTag(PRAYERS_TAG);
  return { ok: true };
}
