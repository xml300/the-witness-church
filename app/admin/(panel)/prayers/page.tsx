import type { Metadata } from "next";
import Link from "next/link";
import { getAdmin } from "@/src/lib/auth";
import PrayerQueue, { type QueueItem } from "./PrayerQueue";

export const metadata: Metadata = { title: "Prayer requests" };
export const dynamic = "force-dynamic";

export default async function PrayersPage() {
  const admin = await getAdmin();
  if (!admin) return null;

  const { data } = await admin.supabase
    .from("prayer_requests")
    .select("id,text,category,status,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as QueueItem[];

  return (
    <main className="min-h-screen bg-gray-bg">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link href="/admin" className="text-[13px] text-muted hover:text-navy">
          ‹ Back to the editor
        </Link>
        <h1 className="text-3xl font-extrabold text-navy mt-3 mb-2">Prayer requests</h1>
        <p className="text-muted mb-8">
          Approve a request to show it on the prayer wall. Remove anything
          that should not be public. Requests sent only to the pastor never
          appear here; they go to the Google Sheet.
        </p>
        <PrayerQueue initial={rows} />
      </div>
    </main>
  );
}
