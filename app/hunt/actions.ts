"use server";

import {
  checkNames,
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

export async function checkNamesAction(key1: unknown, guesses: unknown): Promise<Res<Record<number, boolean>>> {
  return checkNames(key1, guesses);
}

export async function submitWordAction(
  key1: unknown,
  word: unknown,
): Promise<Res<{ key2: string; clue: Clue }>> {
  return submitWord(key1, word);
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
