import type { Metadata } from "next";
import Link from "next/link";
import { getAdmin } from "@/src/lib/auth";
import { leaderboard } from "@/src/lib/games/service";
import HuntAdmin, { type ChestRow, type Founder } from "./HuntAdmin";
import type { ConfigInput } from "./actions";

export const metadata: Metadata = { title: "Treasure hunt" };
export const dynamic = "force-dynamic";

/** Used until migration 007 has added the Game 3 and 4 columns. */
const NEW_DEFAULTS = {
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

export default async function HuntAdminPage() {
  const admin = await getAdmin();
  if (!admin) return null;

  const [cfg, founders, chest] = await Promise.all([
    admin.supabase.from("hunt_config").select("*").eq("id", 1).maybeSingle(),
    admin.supabase.from("hunt_founders").select("name,aliases").order("number"),
    admin.supabase.from("hunt_chest_opens").select("id,team_name,opened_at").order("opened_at"),
  ]);
  const top = await leaderboard({ game: "hunt", difficulty: "all", limit: 3 });

  return (
    <main className="min-h-screen bg-gray-bg">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link href="/admin" className="text-[13px] text-muted hover:text-navy">
          ‹ Back to the editor
        </Link>
        <h1 className="text-3xl font-extrabold text-navy mt-3 mb-2">Treasure hunt</h1>
        <p className="text-muted mb-2">
          Set the keys, window, clues and rewards. Add the Church Trivia questions under{" "}
          <Link href="/admin/games" className="underline text-navy">
            Game content
          </Link>
          .
        </p>
        <p className="text-muted mb-8">
          Players use <strong>/hunt</strong>. Keys and rewards stay on the server until they are earned.
        </p>
        {cfg.error || !cfg.data ? (
          <p role="alert" className="text-red-dark">
            The treasure hunt tables are missing. Run supabase/migration-006-hunt.sql in the Supabase SQL Editor.
          </p>
        ) : (
          <HuntAdmin
            config={{ ...NEW_DEFAULTS, ...(cfg.data as ConfigInput) }}
            founders={(founders.data ?? []) as Founder[]}
            chest={(chest.data ?? []) as ChestRow[]}
            top={top.map((t) => ({ name: t.playerName, score: `${t.score}/${t.total}` }))}
          />
        )}
      </div>
    </main>
  );
}
