"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { startRoundAction } from "@/app/games/actions";
import {
  DEFAULT_ROUND,
  GAMES,
  LEVELS,
  LEVEL_LABEL,
  NAME_MAX,
  ROUND_SIZES,
  TRANSLATIONS,
  TRANSLATION_LABEL,
  type GameId,
  type LevelChoice,
  type RoomInfo,
  type RunSummary,
  type StartedRun,
  type Translation,
} from "@/src/lib/games/types";
import Leaderboard from "./Leaderboard";
import MyRuns from "./MyRuns";
import PlayRound from "./PlayRound";
import Results from "./Results";
import RoomTools from "./RoomTools";
import { gamePath, loadName, rememberRun, roomPath, saveHuntKey, saveName } from "./util";

type Phase = "setup" | "play" | "results";
type Tab = "board" | "mine" | "rooms";

const field =
  "w-full border border-gray-2 rounded-lg px-3 py-2.5 text-[15px] outline-none focus:border-navy bg-white";

export default function GameClient({
  game,
  counts,
  room,
  hunt = null,
}: {
  game: GameId;
  counts: Record<LevelChoice, number>;
  room: RoomInfo | null;
  /** Church Trivia only: its fixed rules and whether it is open. */
  hunt?: { passMark: number; window: "not-open" | "open" | "closed"; opensAt: string | null; closesAt: string | null } | null;
}) {
  const router = useRouter();
  const meta = GAMES[game];
  const [phase, setPhase] = useState<Phase>("setup");
  const [name, setName] = useState(() => loadName());
  const [level, setLevel] = useState<LevelChoice>("easy");
  const [translation, setTranslation] = useState<Translation>("modern");
  const [rounds, setRounds] = useState<number>(DEFAULT_ROUND);
  const [tab, setTab] = useState<Tab>("board");
  const [run, setRun] = useState<StartedRun | null>(null);
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  const start = useCallback(async () => {
    setBusy(true);
    setError("");
    const res = await startRoundAction({
      game,
      playerName: name,
      difficulty: level,
      translation,
      questionCount: rounds,
      roomCode: room?.code,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    saveName(name.trim());
    setRun(res.data);
    setSummary(null);
    setPhase("play");
  }, [game, name, level, translation, rounds, room]);

  const done = useCallback((s: RunSummary) => {
    rememberRun(s.runId);
    if (s.award?.key) saveHuntKey(1, s.award.key);
    setSummary(s);
    setPhase("results");
    setRefresh((n) => n + 1);
    window.scrollTo({ top: 0 });
  }, []);

  const shareLink = () =>
    `${window.location.origin}${room ? roomPath(game, room.code) : gamePath(game)}`;

  if (phase === "play" && run) return <PlayRound run={run} onDone={done} />;

  if (phase === "results" && summary) {
    const canAgain = !room || (run?.attemptsLeft ?? 1) > 0;
    return (
      <>
        <Results
          summary={summary}
          link={shareLink()}
          againLabel="Play again"
          onAgain={canAgain ? () => void start() : null}
          onExit={() => {
            setPhase("setup");
            setTab("board");
          }}
        />
        {error && <p role="alert" className="max-w-2xl mx-auto mt-3 text-[13px] text-red-dark">{error}</p>}
        <div className="max-w-2xl mx-auto mt-10 bg-white border border-gray-2 rounded-2xl p-5">
          <h3 className="text-[15px] font-bold text-navy mb-3">{room ? "Room leaderboard" : "Leaderboard"}</h3>
          <Leaderboard game={game} roomCode={room?.code} highlight={summary.playerName} refreshKey={refresh} single={game === "hunt"} />
        </div>
      </>
    );
  }

  /* ----------------------------- setup ----------------------------- */
  const nameOk = name.trim().length >= 1;
  const closed = room?.expired ?? false;

  return (
    <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 items-start">
      <div className="bg-white border border-gray-2 rounded-2xl p-6 md:p-8 shadow-sm">
        {room && (
          <div className="bg-navy/5 rounded-xl p-4 mb-6 text-[13px] text-text">
            <p className="font-bold text-navy text-[14px] mb-1">
              Room {room.code} · hosted by {room.hostName}
            </p>
            <p>
              {LEVEL_LABEL[room.difficulty]} · {room.questionCount} {meta.unit}
              {meta.hasTranslation ? ` · ${TRANSLATION_LABEL[room.translation]}` : ""}
              {room.timeLimitSeconds ? ` · ${Math.round(room.timeLimitSeconds / 60) || 1} min limit` : ""}
              {room.maxAttempts ? ` · ${room.maxAttempts} attempt${room.maxAttempts > 1 ? "s" : ""} each` : " · unlimited attempts"}
            </p>
            {closed && <p className="mt-1 font-semibold text-red-dark">This room&rsquo;s leaderboard has closed.</p>}
          </div>
        )}

        {hunt && (
          <div className="bg-navy/5 rounded-xl p-4 mb-6 text-[13px] text-text">
            <p className="font-bold text-navy text-[14px] mb-1">Win Key 1</p>
            <p>Score {hunt.passMark}% or more. Everyone who passes gets the key, and you can retry if you miss.</p>
            {hunt.window === "not-open" && <p className="mt-1 font-semibold text-red-dark">This game has not opened yet.</p>}
            {hunt.window === "closed" && <p className="mt-1 font-semibold text-red-dark">This game has closed.</p>}
          </div>
        )}

        <label className="grid gap-1 text-[13px] font-semibold text-text mb-6">
          Your name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={NAME_MAX}
            placeholder="First name or nickname"
            autoComplete="nickname"
            className={field}
          />
        </label>

        {!room && game !== "hunt" && (
          <>
            <fieldset className="mb-6">
              <legend className="text-[13px] font-semibold text-text mb-2">Choose a level</legend>
              <div className="grid grid-cols-2 gap-3">
                {[...LEVELS, "all" as const].map((l) => {
                  const empty = counts[l] === 0;
                  const sel = level === l;
                  return (
                    <button
                      key={l}
                      type="button"
                      disabled={empty}
                      aria-pressed={sel}
                      onClick={() => setLevel(l)}
                      className={`text-left rounded-xl border-2 p-3 transition-colors disabled:opacity-40 ${
                        sel ? "border-red bg-red/5" : "border-gray-2 hover:border-navy"
                      } ${l === "all" ? "col-span-2" : ""}`}
                    >
                      <span className="block text-[14px] font-bold text-navy">{LEVEL_LABEL[l]}</span>
                      <span className="block text-[12px] text-muted leading-snug">
                        {l === "all" ? "A mix of every level" : meta.levelHelp[l]}
                      </span>
                      {game === "quiz" && (
                        <span className="block text-[11px] text-muted/70 mt-1">{counts[l]} questions</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <label className="grid gap-1 text-[13px] font-semibold text-text">
                {meta.unit === "verses" ? "Verses per round" : "Questions per round"}
                <select value={rounds} onChange={(e) => setRounds(Number(e.target.value))} className={field}>
                  {ROUND_SIZES.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
              {meta.hasTranslation && (
                <label className="grid gap-1 text-[13px] font-semibold text-text">
                  Bible version
                  <select value={translation} onChange={(e) => setTranslation(e.target.value as Translation)} className={field}>
                    {TRANSLATIONS.map((t) => (
                      <option key={t} value={t}>{TRANSLATION_LABEL[t]}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </>
        )}

        {error && <p role="alert" className="text-[13px] text-red-dark mb-3">{error}</p>}
        <button
          onClick={() => void start()}
          disabled={!nameOk || busy || (hunt !== null && hunt.window !== "open")}
          className="w-full bg-red text-white font-bold text-[15px] px-6 py-3.5 rounded-xl hover:bg-red-dark disabled:opacity-50 transition-colors"
        >
          {busy ? "Getting ready…" : room ? "Join this room" : "Start"}
        </button>
        {room && (
          <button
            onClick={() => router.push(gamePath(game))}
            className="w-full text-muted font-semibold text-[13px] mt-3 hover:text-navy"
          >
            Leave room
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-2 rounded-2xl p-5 shadow-sm">
        <div className="flex gap-1 mb-4 border-b border-gray-2" role="tablist">
          {(room || game === "hunt" ? (["board", "mine"] as const) : (["board", "mine", "rooms"] as const)).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-[13px] font-bold border-b-2 -mb-px transition-colors ${
                tab === t ? "border-red text-navy" : "border-transparent text-muted hover:text-navy"
              }`}
            >
              {t === "board" ? (room ? "Room board" : "Leaderboard") : t === "mine" ? "My runs" : "Rooms"}
            </button>
          ))}
        </div>
        {tab === "board" && <Leaderboard game={game} roomCode={room?.code} highlight={name.trim()} refreshKey={refresh} single={game === "hunt"} />}
        {tab === "mine" && <MyRuns game={game} refreshKey={refresh} />}
        {tab === "rooms" && <RoomTools game={game} />}
      </div>
    </div>
  );
}
