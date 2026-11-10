"use server";

import { getAdmin } from "@/src/lib/auth";
import type { QuizPayload, QuotePayload } from "@/src/lib/games/engine";
import { parseQuiz, parseQuote } from "@/src/lib/games/validate";
import type { GameId } from "@/src/lib/games/types";

export type QuestionRow = {
  id: string;
  game: GameId;
  difficulty: string | null;
  payload: QuizPayload | QuotePayload;
  active: boolean;
};

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const SIGNED_OUT = "You are signed out. Please sign in again.";
const UUID = /^[0-9a-f-]{36}$/i;
const MAX_IMPORT = 500;

function parseFor(game: GameId, raw: unknown) {
  if (game !== "quote") {
    // Church Trivia questions have no level; store them as "medium".
    const input = game === "hunt" && typeof raw === "object" && raw !== null ? { ...raw, difficulty: "medium" } : raw;
    const p = parseQuiz(input);
    return p.ok ? ({ ok: true, difficulty: p.value.difficulty, payload: p.value.payload } as const) : p;
  }
  const p = parseQuote(raw);
  return p.ok ? ({ ok: true, difficulty: null, payload: p.value.payload } as const) : p;
}

/** Text used to spot duplicates: the question (quiz) or the reference (quote). */
function keyOf(game: GameId, payload: QuizPayload | QuotePayload): string {
  return game === "quote"
    ? (payload as QuotePayload).reference.toLowerCase()
    : (payload as QuizPayload).question.toLowerCase();
}

export async function saveQuestion(input: {
  id?: string;
  game: GameId;
  data: unknown;
}): Promise<Result<{ row: QuestionRow }>> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: SIGNED_OUT };
  if (input.game !== "quiz" && input.game !== "quote" && input.game !== "hunt") return { ok: false, error: "Unknown game." };
  if (input.id && !UUID.test(input.id)) return { ok: false, error: "Invalid item." };

  const parsed = parseFor(input.game, input.data);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const { data: existing } = await admin.supabase
    .from("game_questions")
    .select("id,payload")
    .eq("game", input.game);
  const key = keyOf(input.game, parsed.payload);
  const clash = ((existing ?? []) as { id: string; payload: QuizPayload | QuotePayload }[]).some(
    (r) => r.id !== input.id && keyOf(input.game, r.payload) === key,
  );
  if (clash) {
    return {
      ok: false,
      error: input.game === "quote" ? "That verse is already in the list." : "That question already exists.",
    };
  }

  const values = { game: input.game, difficulty: parsed.difficulty, payload: parsed.payload };
  const q = admin.supabase.from("game_questions");
  const { data, error } = input.id
    ? await q.update(values).eq("id", input.id).select("*").single()
    : await q.insert(values).select("*").single();
  if (error || !data) return { ok: false, error: "Could not save. Please try again." };
  return { ok: true, row: data as QuestionRow };
}

/** Items are hidden rather than deleted, because past scores refer to them. */
export async function setQuestionActive(id: string, active: boolean): Promise<Result> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: SIGNED_OUT };
  if (!UUID.test(id)) return { ok: false, error: "Invalid item." };
  const { error } = await admin.supabase.from("game_questions").update({ active }).eq("id", id);
  return error ? { ok: false, error: "Could not update that item." } : { ok: true };
}

/** All-or-nothing import from pasted JSON (a list of items). */
export async function importQuestions(
  game: GameId,
  text: string,
): Promise<Result<{ added: number; skipped: number }>> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: SIGNED_OUT };
  if (game !== "quiz" && game !== "quote" && game !== "hunt") return { ok: false, error: "Unknown game." };
  if (typeof text !== "string" || text.length > 2_000_000) return { ok: false, error: "That text is too large." };

  let list: unknown;
  try {
    list = JSON.parse(text);
  } catch {
    return { ok: false, error: "That is not valid JSON. Paste a list that starts with [ and ends with ]." };
  }
  if (!Array.isArray(list)) return { ok: false, error: "Paste a list of items, starting with [." };
  if (list.length === 0) return { ok: false, error: "The list is empty." };
  if (list.length > MAX_IMPORT) return { ok: false, error: `Import at most ${MAX_IMPORT} items at a time.` };

  const rows: { game: GameId; difficulty: string | null; payload: QuizPayload | QuotePayload }[] = [];
  for (let i = 0; i < list.length; i++) {
    const p = parseFor(game, list[i]);
    if (!p.ok) return { ok: false, error: `Item ${i + 1}: ${p.error} Nothing was imported.` };
    rows.push({ game, difficulty: p.difficulty, payload: p.payload });
  }

  const { data: existing } = await admin.supabase.from("game_questions").select("payload").eq("game", game);
  const seen = new Set(
    ((existing ?? []) as { payload: QuizPayload | QuotePayload }[]).map((r) => keyOf(game, r.payload)),
  );
  const fresh = rows.filter((r) => {
    const k = keyOf(game, r.payload);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  if (fresh.length) {
    const { error } = await admin.supabase.from("game_questions").insert(fresh);
    if (error) return { ok: false, error: "Could not import. Nothing was added." };
  }
  return { ok: true, added: fresh.length, skipped: rows.length - fresh.length };
}
