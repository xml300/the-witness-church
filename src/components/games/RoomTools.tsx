"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createRoomAction } from "@/app/games/actions";
import {
  GAMES,
  LEVEL_CHOICES,
  LEVEL_LABEL,
  NAME_MAX,
  ROUND_SIZES,
  TRANSLATIONS,
  TRANSLATION_LABEL,
  type GameId,
  type LevelChoice,
  type RoomInfo,
  type Translation,
} from "@/src/lib/games/types";
import { loadName, roomPath, saveName } from "./util";

const field =
  "w-full border border-gray-2 rounded-lg px-3 py-2.5 text-[14px] outline-none focus:border-navy bg-white";

export default function RoomTools({ game }: { game: GameId }) {
  const router = useRouter();
  const meta = GAMES[game];
  const [code, setCode] = useState("");
  const [joinError, setJoinError] = useState("");

  const [host, setHost] = useState(() => loadName());
  const [level, setLevel] = useState<LevelChoice>("all");
  const [translation, setTranslation] = useState<Translation>("modern");
  const [rounds, setRounds] = useState(10);
  const [attempts, setAttempts] = useState<number | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [made, setMade] = useState<RoomInfo | null>(null);
  const [copied, setCopied] = useState(false);

  function join(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(c)) {
      setJoinError("Room codes have 6 letters and numbers.");
      return;
    }
    router.push(roomPath(game, c));
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await createRoomAction({
      game,
      hostName: host,
      difficulty: level,
      translation,
      maxAttempts: attempts,
      timeLimitSeconds: minutes === null ? null : minutes * 60,
      questionCount: rounds,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    saveName(host.trim());
    setMade(res.data);
  }

  const link = made && typeof window !== "undefined" ? `${window.location.origin}${roomPath(game, made.code)}` : "";

  if (made) {
    return (
      <div className="text-center">
        <p className="text-[13px] text-muted mb-1">Your room code</p>
        <p className="text-[40px] font-extrabold tracking-[6px] text-navy">{made.code}</p>
        <p className="text-[13px] text-muted mt-1 mb-5">
          Share the code or the link. The room leaderboard closes in 2 hours.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link);
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
            className="border border-navy/30 text-navy font-semibold text-[14px] px-5 py-2.5 rounded-xl hover:bg-navy hover:text-white transition-colors"
          >
            {copied ? "Link copied" : "Copy link"}
          </button>
          <button
            onClick={() => router.push(roomPath(game, made.code))}
            className="bg-red text-white font-semibold text-[14px] px-5 py-2.5 rounded-xl hover:bg-red-dark transition-colors"
          >
            Open room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      <form onSubmit={join}>
        <h3 className="text-[15px] font-bold text-navy mb-2">Join a room</h3>
        <div className="flex gap-2">
          <input
            aria-label="Room code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
            placeholder="ABC123"
            className={`${field} tracking-[3px] font-bold uppercase`}
            autoComplete="off"
          />
          <button className="bg-navy text-white font-semibold text-[14px] px-5 rounded-lg hover:bg-navy-deep transition-colors">
            Join
          </button>
        </div>
        {joinError && <p role="alert" className="text-[13px] text-red-dark mt-2">{joinError}</p>}
      </form>

      <form onSubmit={create} className="grid gap-3">
        <h3 className="text-[15px] font-bold text-navy">Create a room</h3>
        <p className="text-[13px] text-muted -mt-1">
          Everyone in the room plays the same settings and is ranked together.
        </p>
        <label className="grid gap-1 text-[13px] font-semibold text-text">
          Your name
          <input value={host} onChange={(e) => setHost(e.target.value)} maxLength={NAME_MAX} required className={field} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-[13px] font-semibold text-text">
            Level
            <select value={level} onChange={(e) => setLevel(e.target.value as LevelChoice)} className={field}>
              {LEVEL_CHOICES.map((l) => (
                <option key={l} value={l}>{LEVEL_LABEL[l]}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-[13px] font-semibold text-text">
            {meta.unit === "verses" ? "Verses" : "Questions"}
            <select value={rounds} onChange={(e) => setRounds(Number(e.target.value))} className={field}>
              {[...ROUND_SIZES, 30, 50].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-[13px] font-semibold text-text">
            Attempts each
            <select value={attempts ?? ""} onChange={(e) => setAttempts(e.target.value ? Number(e.target.value) : null)} className={field}>
              <option value="">Unlimited</option>
              {[1, 2, 3, 5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-[13px] font-semibold text-text">
            Time limit
            <select value={minutes ?? ""} onChange={(e) => setMinutes(e.target.value ? Number(e.target.value) : null)} className={field}>
              <option value="">None</option>
              {[1, 2, 3, 5, 10, 15, 30].map((n) => (
                <option key={n} value={n}>{n} min</option>
              ))}
            </select>
          </label>
        </div>
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
        {error && <p role="alert" className="text-[13px] text-red-dark">{error}</p>}
        <button
          disabled={busy}
          className="bg-red text-white font-semibold text-[14px] px-6 py-3 rounded-xl hover:bg-red-dark disabled:opacity-60 transition-colors"
        >
          {busy ? "Creating…" : "Create room"}
        </button>
      </form>
    </div>
  );
}
