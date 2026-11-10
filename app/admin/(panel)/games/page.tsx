import type { Metadata } from "next";
import Link from "next/link";
import { getAdmin } from "@/src/lib/auth";
import GamesAdmin from "./GamesAdmin";
import type { QuestionRow } from "./actions";

export const metadata: Metadata = { title: "Game content" };
export const dynamic = "force-dynamic";

export default async function GamesAdminPage() {
  const admin = await getAdmin();
  if (!admin) return null;

  const { data, error } = await admin.supabase
    .from("game_questions")
    .select("id,game,difficulty,payload,active")
    .order("created_at", { ascending: false })
    .limit(2000);

  return (
    <main className="min-h-screen bg-gray-bg">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link href="/admin" className="text-[13px] text-muted hover:text-navy">
          ‹ Back to the editor
        </Link>
        <h1 className="text-3xl font-extrabold text-navy mt-3 mb-2">Game content</h1>
        <p className="text-muted mb-8">
          Manage the Bible Quiz questions and the Bible Quote verses. Hiding an
          item removes it from new rounds but keeps past scores intact.
        </p>
        {error ? (
          <p role="alert" className="text-red-dark">
            The games tables are missing. Run supabase/migration-004-games.sql and
            migration-005-games-seed.sql in the Supabase SQL Editor.
          </p>
        ) : (
          <GamesAdmin initial={(data ?? []) as QuestionRow[]} />
        )}
      </div>
    </main>
  );
}
