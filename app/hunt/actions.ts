"use server";

import {
  checkFounders,
  chestBoard,
  completionBoard,
  openChest,
  submitKeyPhrase,
  submitWord,
  unlockClue,
  unlockGame4,
  unlockFounders,
  type ChestResult,
  type Clue,
  type FinishRow,
  type FoundersView,
  type Res,
  type VideoView,
} from "@/src/lib/hunt/service";

/** Thin wrappers: every check lives in src/lib/hunt/service.ts. All
 *  arguments are untrusted input from the browser. */

export async function unlockFoundersAction(key1: unknown): Promise<Res<FoundersView>> {
  return unlockFounders(key1);
}

export async function checkFoundersAction(key1: unknown, names: unknown): Promise<Res<{ passed: boolean; wordHint: string }>> {
  return checkFounders(key1, names);
}

export async function submitWordAction(
  key1: unknown,
  names: unknown,
  word: unknown,
  playerName?: unknown,
): Promise<Res<{ key2: string; clue: Clue }>> {
  return submitWord(key1, names, word, playerName);
}

export async function unlockClueAction(stage: unknown, key: unknown): Promise<Res<Clue>> {
  return unlockClue(stage, key);
}

export async function openChestAction(team: unknown, keys: unknown): Promise<Res<ChestResult>> {
  return openChest(team, keys);
}

export async function chestBoardAction() {
  return chestBoard();
}

export async function unlockGame4Action(key3: unknown): Promise<Res<{ clue: Clue; video: VideoView | null }>> {
  return unlockGame4(key3);
}

export async function submitKeyPhraseAction(
  key3: unknown,
  phrase: unknown,
  playerName?: unknown,
): Promise<Res<{ key4: string }>> {
  return submitKeyPhrase(key3, phrase, playerName);
}

export async function completionBoardAction(stage: unknown): Promise<FinishRow[]> {
  return completionBoard(stage === 4 ? 4 : 2);
}
