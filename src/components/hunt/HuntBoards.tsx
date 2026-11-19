"use client";

import { useEffect, useState } from "react";
import { completionBoardAction } from "@/app/hunt/actions";
import Leaderboard from "@/src/components/games/Leaderboard";
import type { FinishRow } from "@/src/lib/hunt/service";

const TABS = [
  { n: 1, label: "Game 1", name: "Church Trivia" },
  { n: 2, label: "Game 2", name: "Founding Members" },
  { n: 3, label: "Game 3", name: "Year 2 Sermon Quiz" },
  { n: 4, label: "Game 4", name: "The Pastor's Video" },
] as const;

function Finishers({ stage, refreshKey }: { stage: 2 | 4; refreshKey: number }) {
  const [rows, setRows] = useState<FinishRow[] | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    completionBoardAction(stage).then((r) => {
      if (live) setRows(r);
    });
    return () => {
      live = false;
    };
  }, [stage, refreshKey, tick]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[13px] text-muted">In order of who finished first.</p>
        <button type="button" onClick={() => setTick((n) => n + 1)} className="text-[13px] text-navy underline">
          Refresh
        </button>
      </div>
      {rows === null ? (
        <p className="text-[14px] text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-[14px] text-muted">No one has finished yet. Be the first!</p>
      ) : (
        <ol className="grid gap-1">
          {rows.map((r) => (
            <li key={r.place} className="flex justify-between text-[14px] border-b border-gray-2/60 py-1.5">
              <span>
                <strong className="text-navy">{r.place}.</strong> {r.name}
              </span>
              <span className="text-muted">
                {new Date(r.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** One leaderboard per game: scores for the two quizzes, finish order for the
 *  two solve-it games. */
export default function HuntBoards({ refreshKey = 0 }: { refreshKey?: number }) {
  const [tab, setTab] = useState<1 | 2 | 3 | 4>(1);
  const current = TABS[tab - 1];

  return (
    <section className="bg-white border border-gray-2 rounded-2xl p-6 md:p-7 shadow-sm">
      <h2 className="text-[18px] font-extrabold text-navy mb-3">Leaderboards</h2>
      <div className="flex flex-wrap gap-2 mb-4" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.n}
            role="tab"
            aria-selected={tab === t.n}
            onClick={() => setTab(t.n)}
            className={`px-4 py-2 rounded-lg text-[13px] font-bold border ${
              tab === t.n ? "bg-navy text-white border-navy" : "bg-white border-gray-2 text-navy"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="text-[14px] font-bold text-navy mb-2">{current.name}</p>
      {tab === 1 && <Leaderboard game="hunt" single refreshKey={refreshKey} />}
      {tab === 3 && <Leaderboard game="sermon" single refreshKey={refreshKey} />}
      {(tab === 2 || tab === 4) && <Finishers stage={tab} refreshKey={refreshKey} />}
    </section>
  );
}
