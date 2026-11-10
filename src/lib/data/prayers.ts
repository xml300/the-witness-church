import type { PrayerWallItem } from "./types";

export const PRAYERS_TAG = "prayers";

/** Approved wall requests, newest first. Anonymous by design: only the text
 *  and time are ever stored or returned. */
export async function getApprovedPrayers(limit = 12): Promise<PrayerWallItem[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return [];
  try {
    const res = await fetch(
      `${url}/rest/v1/prayer_requests?select=id,text,category,created_at&status=eq.approved&order=created_at.desc&limit=${limit}`,
      {
        headers: { apikey: anon, Authorization: `Bearer ${anon}` },
        next: { revalidate: 300, tags: [PRAYERS_TAG] },
        signal: AbortSignal.timeout(6000),
      },
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as {
      id: string;
      text: string;
      category: string | null;
      created_at: string;
    }[];
    return rows.map((r) => ({
      id: r.id,
      text: r.text,
      category: r.category ?? "Other",
      created: r.created_at,
    }));
  } catch {
    return [];
  }
}
