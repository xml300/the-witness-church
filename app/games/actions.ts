"use server";

import {
  answerRun,
  createRoom,
  finishRun,
  getRoom,
  leaderboard,
  runsByIds,
  startRun,
} from "@/src/lib/games/service";
import {
  GAME_IDS,
  LEVEL_CHOICES,
  type BoardRow,
  type Feedback,
  type GameId,
  type LevelChoice,
  type Result,
  type RoomInfo,
  type RunSummary,
  type StartedRun,
} from "@/src/lib/games/types";

/** Thin wrappers: the real checks live in src/lib/games/service.ts. Every
 *  argument is untrusted input from the browser. */

export async function startRoundAction(input: {
  game: unknown;
  playerName: unknown;
  difficulty: unknown;
  translation: unknown;
  questionCount: unknown;
  roomCode?: unknown;
  huntKey?: unknown;
}): Promise<Result<StartedRun>> {
  return startRun(input);
}

export async function answerAction(input: {
  runId: unknown;
  index: unknown;
  guess: unknown;
}): Promise<Result<Feedback>> {
  return answerRun(input);
}

export async function finishAction(runId: unknown): Promise<Result<RunSummary>> {
  return finishRun(runId);
}

export async function createRoomAction(input: {
  game: unknown;
  hostName: unknown;
  difficulty: unknown;
  translation: unknown;
  maxAttempts: unknown;
  timeLimitSeconds: unknown;
  questionCount: unknown;
}): Promise<Result<RoomInfo>> {
  return createRoom(input);
}

export async function roomAction(code: unknown): Promise<RoomInfo | null> {
  return getRoom(code);
}

export async function boardAction(input: {
  game: unknown;
  difficulty: unknown;
  roomCode?: unknown;
}): Promise<BoardRow[]> {
  if (!GAME_IDS.includes(input.game as GameId)) return [];
  const difficulty: LevelChoice = LEVEL_CHOICES.includes(input.difficulty as LevelChoice)
    ? (input.difficulty as LevelChoice)
    : "all";
  const roomCode =
    typeof input.roomCode === "string" && /^[A-Za-z0-9]{6}$/.test(input.roomCode)
      ? input.roomCode.toUpperCase()
      : null;
  return leaderboard({ game: input.game as GameId, difficulty, roomCode, limit: 10 });
}

export async function myRunsAction(ids: unknown) {
  return runsByIds(ids);
}
