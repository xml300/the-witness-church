/** Database side of the games. Server only: reads answer keys and writes
 *  scores using the service-role client. Everything the browser may see is
 *  shaped by ./engine and typed in ./types. */
import { createHash, randomInt } from "node:crypto";
import { headers } from "next/headers";
import { serviceClient } from "@/src/lib/supabase/service";
import { getHuntConfig, huntWindow, quizStage, sameKey } from "@/src/lib/hunt/config";
import {
  buildQuizQuestion,
  buildQuoteQuestion,
  cleanGuess,
  cleanName,
  concreteLevel,
  gradeQuiz,
  gradeQuote,
  shuffle,
  type QuizPayload,
  type QuotePayload,
} from "./engine";
import {
  DEFAULT_ROUND,
  GAME_IDS,
  isHuntGame,
  LEVEL_CHOICES,
  LEVEL_WEIGHT,
  TRANSLATIONS,
  type BoardRow,
  type Feedback,
  type GameId,
  type Guess,
  type Level,
  type LevelChoice,
  type PlayQuestion,
  type Result,
  type RoomInfo,
  type RunSummary,
  type StartedRun,
  type Translation,
} from "./types";

const NOT_READY = "Games are not set up yet. Please try again later.";
const GRACE_MS = 5000; // network slack past a room's time limit

type Item = { qid: string; level: Level };
type StoredAnswer = { guess: Guess | null } | null;

type RunRow = {
  id: string;
  game: GameId;
  room_code: string | null;
  player_name: string;
  difficulty: LevelChoice;
  translation: Translation;
  items: Item[];
  answers: StoredAnswer[];
  attempt_no: number;
  time_limit_seconds: number | null;
  status: "active" | "finished";
  score: number | null;
  total: number;
  percentage: number | null;
  elapsed_ms: number | null;
  started_at: string;
  finished_at: string | null;
};

type RoomRow = {
  code: string;
  game: GameId;
  host_name: string;
  difficulty: LevelChoice;
  translation: Translation;
  max_attempts: number | null;
  time_limit_seconds: number | null;
  question_count: number;
  expires_at: string;
};

/* ---------------------------------------------------------------- utils */

async function ipHash(): Promise<string> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  return createHash("sha256")
    .update(`${ip}|${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`)
    .digest("hex")
    .slice(0, 32);
}

const isGame = (v: unknown): v is GameId => GAME_IDS.includes(v as GameId);
const isLevelChoice = (v: unknown): v is LevelChoice => LEVEL_CHOICES.includes(v as LevelChoice);
const isTranslation = (v: unknown): v is Translation => TRANSLATIONS.includes(v as Translation);
const clamp = (n: unknown, lo: number, hi: number, fallback: number) => {
  const x = typeof n === "number" && Number.isFinite(n) ? Math.round(n) : fallback;
  return Math.max(lo, Math.min(hi, x));
};

function roomInfo(r: RoomRow): RoomInfo {
  return {
    code: r.code,
    game: r.game,
    hostName: r.host_name,
    difficulty: r.difficulty,
    translation: r.translation,
    maxAttempts: r.max_attempts,
    timeLimitSeconds: r.time_limit_seconds,
    questionCount: r.question_count,
    expiresAt: r.expires_at,
    expired: new Date(r.expires_at).getTime() < Date.now(),
  };
}

type PoolRow = { id: string; difficulty: Level | null; payload: unknown };

function questionFor(
  game: GameId,
  row: PoolRow,
  level: Level,
  translation: Translation,
): PlayQuestion {
  return game === "quote"
    ? buildQuoteQuestion(row.payload as QuotePayload, level, translation)
    : buildQuizQuestion(row.payload as QuizPayload, level);
}

function gradeFor(
  game: GameId,
  row: PoolRow,
  level: Level,
  translation: Translation,
  guess: Guess | null,
): Feedback {
  return game === "quote"
    ? gradeQuote(row.payload as QuotePayload, level, translation, guess)
    : gradeQuiz(row.payload as QuizPayload, guess);
}

/* --------------------------------------------------------------- rooms */

function makeCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I
  let c = "";
  for (let i = 0; i < 6; i++) c += chars[randomInt(chars.length)];
  return c;
}

export async function createRoom(input: {
  game: unknown;
  hostName: unknown;
  difficulty: unknown;
  translation: unknown;
  maxAttempts: unknown;
  timeLimitSeconds: unknown;
  questionCount: unknown;
}): Promise<Result<RoomInfo>> {
  const db = serviceClient();
  if (!db) return { ok: false, error: NOT_READY };
  if (!isGame(input.game) || isHuntGame(input.game)) return { ok: false, error: "Unknown game." };
  const host = cleanName(input.hostName);
  if (!host) return { ok: false, error: "Enter a name for the room host (1 to 30 letters)." };
  if (!isLevelChoice(input.difficulty)) return { ok: false, error: "Pick a difficulty." };

  const ip = await ipHash();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await db
    .from("game_rooms")
    .select("code", { count: "exact", head: true })
    .eq("ip_hash", ip)
    .gte("created_at", since);
  if ((count ?? 0) >= 10) return { ok: false, error: "Too many rooms created. Try again in an hour." };

  const row = {
    game: input.game,
    host_name: host,
    ip_hash: ip,
    difficulty: input.difficulty,
    translation: input.game === "quote" && isTranslation(input.translation) ? input.translation : "modern",
    max_attempts: input.maxAttempts == null ? null : clamp(input.maxAttempts, 1, 20, 1),
    time_limit_seconds:
      input.timeLimitSeconds == null ? null : clamp(input.timeLimitSeconds, 10, 3600, 300),
    question_count: clamp(input.questionCount, 1, 50, DEFAULT_ROUND),
  };

  for (let tries = 0; tries < 5; tries++) {
    const { data, error } = await db
      .from("game_rooms")
      .insert({ ...row, code: makeCode() })
      .select("*")
      .single();
    if (!error && data) return { ok: true, data: roomInfo(data as RoomRow) };
    if (error && error.code !== "23505") break; // not a code clash
  }
  return { ok: false, error: "Could not create the room. Please try again." };
}

export async function getRoom(code: unknown): Promise<RoomInfo | null> {
  const db = serviceClient();
  if (!db || typeof code !== "string") return null;
  const { data } = await db
    .from("game_rooms")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();
  return data ? roomInfo(data as RoomRow) : null;
}

/* ---------------------------------------------------------- start a run */

export async function startRun(input: {
  game: unknown;
  playerName: unknown;
  difficulty: unknown;
  translation: unknown;
  questionCount: unknown;
  roomCode?: unknown;
  /** Game 3 only: Key 2, which opens the sermon quiz. */
  huntKey?: unknown;
}): Promise<Result<StartedRun>> {
  const db = serviceClient();
  if (!db) return { ok: false, error: NOT_READY };

  const name = cleanName(input.playerName);
  if (!name) return { ok: false, error: "Enter a name (1 to 30 letters, no unkind words)." };

  let game: GameId;
  let difficulty: LevelChoice;
  let translation: Translation;
  let count: number;
  let room: RoomRow | null = null;
  let attemptsLeftHunt: number | null = null;
  let attemptNoHunt = 1;

  if (typeof input.roomCode === "string" && input.roomCode) {
    const { data } = await db
      .from("game_rooms")
      .select("*")
      .eq("code", input.roomCode.trim().toUpperCase())
      .maybeSingle();
    if (!data) return { ok: false, error: "That room code was not found." };
    room = data as RoomRow;
    game = room.game;
    difficulty = room.difficulty;
    translation = room.translation;
    count = room.question_count;
  } else if (isHuntGame(input.game)) {
    const hunt = await getHuntConfig();
    if (!hunt) return { ok: false, error: NOT_READY };
    const stage = quizStage(hunt, input.game);
    const w = huntWindow({ opens_at: stage.opensAt, closes_at: stage.closesAt });
    if (w === "not-open") return { ok: false, error: "This game has not opened yet." };
    if (w === "closed") return { ok: false, error: "This game has closed." };
    if (input.game === "sermon" && !sameKey(input.huntKey, hunt.key2)) {
      return { ok: false, error: "Enter Key 2 to open the Sermon Quiz." };
    }
    if (stage.maxAttempts != null) {
      const { count: used } = await db
        .from("game_runs")
        .select("id", { count: "exact", head: true })
        .eq("game", input.game)
        .ilike("player_name", name.replace(/[%_\\]/g, "\\$&"));
      if ((used ?? 0) >= stage.maxAttempts) {
        return { ok: false, error: `You have used all ${stage.maxAttempts} attempt(s).` };
      }
      attemptsLeftHunt = stage.maxAttempts - (used ?? 0) - 1;
      attemptNoHunt = (used ?? 0) + 1;
    }
    game = input.game;
    difficulty = "all";
    translation = "modern";
    count = stage.count;
  } else {
    if (!isGame(input.game)) return { ok: false, error: "Unknown game." };
    if (!isLevelChoice(input.difficulty)) return { ok: false, error: "Pick a difficulty." };
    game = input.game;
    difficulty = input.difficulty;
    translation = game === "quote" && isTranslation(input.translation) ? input.translation : "modern";
    count = clamp(input.questionCount, 5, 20, DEFAULT_ROUND);
  }

  const ip = await ipHash();
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count: recent } = await db
    .from("game_runs")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ip)
    .gte("started_at", since);
  if ((recent ?? 0) >= 30) return { ok: false, error: "Slow down a little and try again in a few minutes." };

  let attemptNo = attemptNoHunt;
  let attemptsLeft: number | null = attemptsLeftHunt;
  if (room) {
    const { count: used } = await db
      .from("game_runs")
      .select("id", { count: "exact", head: true })
      .eq("room_code", room.code)
      .ilike("player_name", name.replace(/[%_\\]/g, "\\$&"));
    attemptNo = (used ?? 0) + 1;
    if (room.max_attempts != null) {
      if (attemptNo > room.max_attempts) {
        return { ok: false, error: `You have used all ${room.max_attempts} attempt(s) in this room.` };
      }
      attemptsLeft = room.max_attempts - attemptNo;
    }
  }

  // Draw the questions.
  let query = db.from("game_questions").select("id, difficulty, payload").eq("game", game).eq("active", true);
  if (game === "quiz" && difficulty !== "all") query = query.eq("difficulty", difficulty);
  const { data: pool, error } = await query;
  if (error || !pool || pool.length === 0) {
    return { ok: false, error: "There are no questions for that choice yet." };
  }
  const rows = pool as PoolRow[];

  const items: Item[] = [];
  if (game !== "quote") {
    for (const r of shuffle(rows).slice(0, count)) items.push({ qid: r.id, level: r.difficulty as Level });
  } else {
    let deck = shuffle(rows);
    let cursor = 0;
    while (items.length < count) {
      if (cursor >= deck.length) {
        deck = shuffle(rows);
        cursor = 0;
      }
      items.push({ qid: deck[cursor++].id, level: concreteLevel(difficulty) });
    }
  }

  const byId = new Map(rows.map((r) => [r.id, r]));
  const questions = items.map((it) => questionFor(game, byId.get(it.qid)!, it.level, translation));

  const { data: run, error: insertErr } = await db
    .from("game_runs")
    .insert({
      game,
      room_code: room?.code ?? null,
      player_name: name,
      ip_hash: ip,
      difficulty,
      translation,
      items,
      answers: items.map(() => null),
      attempt_no: attemptNo,
      time_limit_seconds: room?.time_limit_seconds ?? null,
      total: items.length,
    })
    .select("id")
    .single();
  if (insertErr || !run) return { ok: false, error: "Could not start the round. Please try again." };

  return {
    ok: true,
    data: {
      runId: run.id as string,
      game,
      difficulty,
      translation,
      timeLimitSeconds: room?.time_limit_seconds ?? null,
      questions,
      attemptNo,
      attemptsLeft,
    },
  };
}

/* ------------------------------------------------------- lock an answer */

async function loadPool(ids: string[]): Promise<Map<string, PoolRow>> {
  const db = serviceClient()!;
  const { data } = await db.from("game_questions").select("id, difficulty, payload").in("id", ids);
  return new Map(((data ?? []) as PoolRow[]).map((r) => [r.id, r]));
}

async function loadRun(runId: unknown): Promise<RunRow | null> {
  const db = serviceClient();
  if (!db || typeof runId !== "string" || !/^[0-9a-f-]{36}$/i.test(runId)) return null;
  const { data } = await db.from("game_runs").select("*").eq("id", runId).maybeSingle();
  return (data as RunRow | null) ?? null;
}

export async function answerRun(input: {
  runId: unknown;
  index: unknown;
  guess: unknown;
}): Promise<Result<Feedback>> {
  const db = serviceClient();
  if (!db) return { ok: false, error: NOT_READY };
  const run = await loadRun(input.runId);
  if (!run) return { ok: false, error: "This round was not found. Start a new one." };
  if (run.status !== "active") return { ok: false, error: "This round is already finished." };

  const idx = input.index;
  if (typeof idx !== "number" || !Number.isInteger(idx) || idx < 0 || idx >= run.items.length) {
    return { ok: false, error: "Invalid question." };
  }
  if (run.answers[idx]) return { ok: false, error: "That question was already answered." };

  if (run.time_limit_seconds != null) {
    const spent = Date.now() - new Date(run.started_at).getTime();
    if (spent > run.time_limit_seconds * 1000 + GRACE_MS) return { ok: false, error: "Time is up." };
  }

  const item = run.items[idx];
  const pool = await loadPool([item.qid]);
  const row = pool.get(item.qid);
  if (!row) return { ok: false, error: "That question is no longer available." };

  const q = questionFor(run.game, row, item.level, run.translation);
  const guess = cleanGuess(q, input.guess);
  const feedback = gradeFor(run.game, row, item.level, run.translation, guess);

  const answers = [...run.answers];
  answers[idx] = { guess };
  // Guard on the old value so two quick taps can't both write.
  const { error } = await db
    .from("game_runs")
    .update({ answers })
    .eq("id", run.id)
    .eq("status", "active");
  if (error) return { ok: false, error: "Could not save that answer." };
  return { ok: true, data: feedback };
}

/* ----------------------------------------------------------- finish run */

async function buildReview(run: RunRow): Promise<RunSummary["review"]> {
  const pool = await loadPool(run.items.map((i) => i.qid));
  return run.items.map((it, i) => {
    const row = pool.get(it.qid)!;
    const guess = run.answers[i]?.guess ?? null;
    return {
      ...gradeFor(run.game, row, it.level, run.translation, guess),
      guess,
      question: questionFor(run.game, row, it.level, run.translation),
    };
  });
}

export async function finishRun(runId: unknown): Promise<Result<RunSummary>> {
  const db = serviceClient();
  if (!db) return { ok: false, error: NOT_READY };
  let run = await loadRun(runId);
  if (!run) return { ok: false, error: "This round was not found." };

  const review = await buildReview(run);

  if (run.status === "active") {
    const score = review.filter((r, i) => run!.answers[i] && r.correct).length;
    let elapsed = Date.now() - new Date(run.started_at).getTime();
    if (run.time_limit_seconds != null) elapsed = Math.min(elapsed, run.time_limit_seconds * 1000);
    const total = run.items.length;
    const patch = {
      status: "finished" as const,
      score,
      percentage: total ? Math.round((score / total) * 100) : 0,
      elapsed_ms: Math.max(0, Math.round(elapsed)),
      finished_at: new Date().toISOString(),
    };
    const { data, error } = await db
      .from("game_runs")
      .update(patch)
      .eq("id", run.id)
      .eq("status", "active")
      .select("*")
      .maybeSingle();
    if (error) return { ok: false, error: "Could not save your score." };
    run = (data as RunRow | null) ?? (await loadRun(run.id));
    if (!run) return { ok: false, error: "Could not save your score." };
  }

  const board = await leaderboard({
    game: run.game,
    difficulty: run.difficulty,
    roomCode: run.room_code,
    limit: 500,
  });
  const mine = board.find((b) => b.playerName.toLowerCase() === run!.player_name.toLowerCase());

  // Treasure hunt: passing wins Key 1 (Church Trivia) or Key 3 (Sermon Quiz).
  let award: RunSummary["award"] = null;
  if (isHuntGame(run.game)) {
    const hunt = await getHuntConfig();
    const stage = hunt ? quizStage(hunt, run.game) : null;
    const passed = !!stage && (run.percentage ?? 0) >= stage.passMark;
    award = {
      passMark: stage?.passMark ?? 70,
      passed,
      key: passed && stage?.key ? stage.key : null,
      keyNo: stage?.keyNo ?? (run.game === "sermon" ? 3 : 1),
    };
  }

  return {
    ok: true,
    data: {
      runId: run.id,
      game: run.game,
      roomCode: run.room_code,
      playerName: run.player_name,
      difficulty: run.difficulty,
      score: run.score ?? 0,
      total: run.total,
      percentage: run.percentage ?? 0,
      elapsedMs: run.elapsed_ms ?? 0,
      finishedAt: run.finished_at ?? new Date().toISOString(),
      rank: mine?.rank ?? null,
      participants: board.length,
      award,
      review,
    },
  };
}

/* ---------------------------------------------------------- leaderboard */

/** Best finished run per player: highest percentage, then (on the all-levels
 *  board) the harder level, then the faster time. */
export async function leaderboard(input: {
  game: GameId;
  difficulty: LevelChoice;
  roomCode?: string | null;
  limit?: number;
}): Promise<BoardRow[]> {
  const db = serviceClient();
  if (!db) return [];

  if (input.roomCode) {
    const { data: room } = await db.from("game_rooms").select("expires_at").eq("code", input.roomCode).maybeSingle();
    if (!room || new Date(room.expires_at as string).getTime() < Date.now()) return [];
  }

  let q = db
    .from("game_runs")
    .select("player_name, difficulty, score, total, percentage, elapsed_ms, finished_at")
    .eq("game", input.game)
    .eq("status", "finished")
    .order("percentage", { ascending: false })
    .order("elapsed_ms", { ascending: true })
    .limit(1000);
  q = input.roomCode ? q.eq("room_code", input.roomCode) : q.is("room_code", null);
  if (!input.roomCode && input.difficulty !== "all") q = q.eq("difficulty", input.difficulty);

  const { data } = await q;
  const rows = (data ?? []) as {
    player_name: string;
    difficulty: LevelChoice;
    score: number;
    total: number;
    percentage: number;
    elapsed_ms: number;
  }[];

  rows.sort(
    (a, b) =>
      b.percentage - a.percentage ||
      LEVEL_WEIGHT[b.difficulty] - LEVEL_WEIGHT[a.difficulty] ||
      a.elapsed_ms - b.elapsed_ms,
  );

  const seen = new Set<string>();
  const out: BoardRow[] = [];
  for (const r of rows) {
    const key = r.player_name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      rank: out.length + 1,
      playerName: r.player_name,
      difficulty: r.difficulty,
      score: r.score,
      total: r.total,
      percentage: r.percentage,
      elapsedMs: r.elapsed_ms,
    });
  }
  return out.slice(0, input.limit ?? 10);
}

/* ------------------------------------------------------------- my runs */

/** The browser remembers its own run ids; this returns their summaries
 *  (without the answer review). */
export async function runsByIds(ids: unknown): Promise<Omit<RunSummary, "review" | "rank" | "participants" | "award">[]> {
  const db = serviceClient();
  if (!db || !Array.isArray(ids)) return [];
  const clean = ids.filter((x): x is string => typeof x === "string" && /^[0-9a-f-]{36}$/i.test(x)).slice(0, 50);
  if (!clean.length) return [];
  const { data } = await db
    .from("game_runs")
    .select("*")
    .in("id", clean)
    .eq("status", "finished")
    .order("finished_at", { ascending: false });
  return ((data ?? []) as RunRow[]).map((r) => ({
    runId: r.id,
    game: r.game,
    roomCode: r.room_code,
    playerName: r.player_name,
    difficulty: r.difficulty,
    score: r.score ?? 0,
    total: r.total,
    percentage: r.percentage ?? 0,
    elapsedMs: r.elapsed_ms ?? 0,
    finishedAt: r.finished_at ?? r.started_at,
  }));
}

/** Question counts per level, so the setup screen can say what's available. */
export async function poolCounts(game: GameId): Promise<Record<LevelChoice, number>> {
  const out: Record<LevelChoice, number> = { easy: 0, medium: 0, hard: 0, expert: 0, all: 0 };
  const db = serviceClient();
  if (!db) return out;
  const { data } = await db.from("game_questions").select("difficulty").eq("game", game).eq("active", true);
  for (const r of (data ?? []) as { difficulty: Level | null }[]) {
    out.all++;
    if (r.difficulty) out[r.difficulty]++;
  }
  if (game === "quote") for (const l of ["easy", "medium", "hard", "expert"] as const) out[l] = out.all;
  return out;
}
