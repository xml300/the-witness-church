"use server";

import {
  checkFounders,
  chestBoard,
  openChest,
  submitWord,
  unlockClue,
  unlockFounders,
  type ChestResult,
  type Clue,
  type FoundersView,
  type Res,
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
): Promise<Res<{ key2: string; clue: Clue }>> {
  return submitWord(key1, names, word);
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
