"use client";

import { useEffect, useState } from "react";
import { boardAction } from "@/app/games/actions";
import {
  LEVEL_CHOICES,
  LEVEL_LABEL,
  type BoardRow,
  type GameId,
  type LevelChoice,
} from "@/src/lib/games/types";
import { fmtTime } from "./util";

export default function Leaderboard({
  game,
  roomCode,
  highlight,
  refreshKey = 0,
  single = false,
}: {
  game: GameId;
  /** A room board has no level tabs. */
  roomCode?: string;
  /** The player's own name, to mark their row. */
  highlight?: string;
  refreshKey?: number;
  /** One combined board, no level tabs. */
  single?: boolean;
}) {
  const [level, setLevel] = useState<LevelChoice>("all");
  const [rows, setRows] = useState<BoardRow[] | null>(null);

  useEffect(() => {
    let live = true;
    boardAction({ game, difficulty: level, roomCode }).then((r) => {
      if (live) setRows(r);
    });
    return () => {
      live = false;
    };
  }, [game, level, roomCode, refreshKey]);

  return (
    <div>
      {!roomCode && !single && (
        <div className="flex flex-wrap gap-1.5 mb-4" role="tablist" aria-label="Level">
          {LEVEL_CHOICES.map((l) => (
            <button
              key={l}
              role="tab"
              aria-selected={level === l}
              onClick={() => {
                setRows(null);
                setLevel(l);
              }}
              className={`text-[12px] font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                level === l
                  ? "bg-navy text-white border-navy"
                  : "border-gray-2 text-muted hover:border-navy hover:text-navy"
              }`}
            >
              {LEVEL_LABEL[l]}
            </button>
          ))}
        </div>
      )}

      {rows === null ? (
        <p className="text-[14px] text-muted py-6 text-center">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-[14px] text-muted py-6 text-center">
          {roomCode ? "No scores yet, or this room has closed." : "No scores yet. Be the first."}
        </p>
      ) : (
        <ol className="divide-y divide-gray-2">
          {rows.map((r) => {
            const me = highlight && r.playerName.toLowerCase() === highlight.toLowerCase();
            return (
              <li
                key={r.rank}
                className={`flex items-center gap-3 py-2.5 px-2 rounded-lg ${me ? "bg-pink-light" : ""}`}
              >
                <span className="w-7 text-center text-[14px] font-extrabold text-navy" aria-label={`Rank ${r.rank}`}>
                  {r.rank <= 3 ? ["🥇", "🥈", "🥉"][r.rank - 1] : r.rank}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[14px] font-semibold text-text truncate">{r.playerName}</span>
                  {!roomCode && !single && (
                    <span className="block text-[11px] text-muted">{LEVEL_LABEL[r.difficulty]}</span>
                  )}
                </span>
                <span className="text-right">
                  <span className="block text-[14px] font-bold text-text">
                    {r.score}/{r.total}
                  </span>
                  <span className="block text-[11px] text-muted">{fmtTime(r.elapsedMs)}</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
