"use client";

import { useEffect, useState } from "react";
import { myRunsAction } from "@/app/games/actions";
import { LEVEL_LABEL, type GameId } from "@/src/lib/games/types";
import { fmtTime, loadRunIds } from "./util";

type Run = Awaited<ReturnType<typeof myRunsAction>>[number];

/** The player's own finished rounds on this device. */
export default function MyRuns({ game, refreshKey = 0 }: { game: GameId; refreshKey?: number }) {
  const [runs, setRuns] = useState<Run[] | null>(null);

  useEffect(() => {
    let live = true;
    const ids = loadRunIds();
    if (ids.length === 0) {
      Promise.resolve([] as Run[]).then((r) => live && setRuns(r));
    } else {
      myRunsAction(ids).then((r) => live && setRuns(r.filter((x) => x.game === game)));
    }
    return () => {
      live = false;
    };
  }, [game, refreshKey]);

  if (runs === null) return <p className="text-[14px] text-muted py-6 text-center">Loading…</p>;
  if (runs.length === 0) {
    return <p className="text-[14px] text-muted py-6 text-center">Your finished rounds will show here.</p>;
  }
  return (
    <ul className="divide-y divide-gray-2">
      {runs.map((r) => (
        <li key={r.runId} className="flex items-center gap-3 py-2.5 px-2">
          <span className="flex-1 min-w-0">
            <span className="block text-[14px] font-semibold text-text">
              {LEVEL_LABEL[r.difficulty]}
              {r.roomCode ? ` · Room ${r.roomCode}` : ""}
            </span>
            <span className="block text-[11px] text-muted">
              {new Date(r.finishedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
            </span>
          </span>
          <span className="text-right">
            <span className="block text-[14px] font-bold text-text">
              {r.score}/{r.total}
            </span>
            <span className="block text-[11px] text-muted">{fmtTime(r.elapsedMs)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
