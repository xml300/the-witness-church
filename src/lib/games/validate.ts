/** Checks admin-entered questions and verses before they are stored. */
import type { QuizPayload, QuotePayload, QuoteText } from "./engine";
import { LEVELS, type Level } from "./types";

type Ok<T> = { ok: true; value: T };
type Bad = { ok: false; error: string };

const str = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export function parseQuiz(raw: unknown): Ok<{ difficulty: Level; payload: QuizPayload }> | Bad {
  if (typeof raw !== "object" || raw === null) return { ok: false, error: "Not an object." };
  const r = raw as Record<string, unknown>;

  const question = str(r.question, 500);
  if (question.length < 5) return { ok: false, error: "The question is too short." };

  const optsIn = Array.isArray(r.options) ? r.options : [];
  const options = optsIn.map((o) => str(o, 200)).filter(Boolean);
  if (options.length < 2 || options.length > 6) return { ok: false, error: "Give 2 to 6 answer options." };
  if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) {
    return { ok: false, error: "Answer options must be different from each other." };
  }

  // Accept both our shape and the original app's shape.
  const idx = r.correctIndex ?? r.correctOptionIndex;
  if (typeof idx !== "number" || !Number.isInteger(idx) || idx < 0 || idx >= options.length) {
    return { ok: false, error: "Pick which option is correct." };
  }

  const level = String(r.difficulty ?? "").toLowerCase() as Level;
  if (!LEVELS.includes(level)) return { ok: false, error: "Pick a level (easy, medium, hard or expert)." };

  return {
    ok: true,
    value: {
      difficulty: level,
      payload: {
        question,
        options,
        correctIndex: idx,
        reference: str(r.reference, 80),
        explanation: str(r.explanation, 1200),
        testament: str(r.testament, 40),
        caption: str(r.caption ?? r.illustrationCaption, 200),
      },
    },
  };
}

function parseText(raw: unknown, label: string): Ok<QuoteText> | Bad {
  const t = (raw ?? {}) as Record<string, unknown>;
  const text = str(t.text, 1500);
  if (!text) return { ok: false, error: `${label}: enter the verse text.` };
  const blanks = [...text.matchAll(/\{\{(.*?)\}\}/g)].map((m) => m[1].trim());
  if (blanks.length === 0) return { ok: false, error: `${label}: wrap at least one word in {{double braces}}.` };
  if (blanks.some((b) => !b)) return { ok: false, error: `${label}: an empty {{ }} was found.` };
  if (/\{\{|\}\}/.test(text.replace(/\{\{.*?\}\}/g, ""))) {
    return { ok: false, error: `${label}: unmatched braces.` };
  }
  const out: QuoteText = { text };
  if (typeof t.easyIndex === "number" && Number.isInteger(t.easyIndex) && t.easyIndex >= 0 && t.easyIndex < blanks.length) {
    out.easyIndex = t.easyIndex;
  }
  if (t.synonyms && typeof t.synonyms === "object" && !Array.isArray(t.synonyms)) {
    const syn: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(t.synonyms as Record<string, unknown>)) {
      if (Array.isArray(v)) syn[k.toLowerCase()] = v.map((x) => str(x, 60)).filter(Boolean).slice(0, 10);
    }
    if (Object.keys(syn).length) out.synonyms = syn;
  }
  return { ok: true, value: out };
}

export function parseQuote(raw: unknown): Ok<{ payload: QuotePayload }> | Bad {
  if (typeof raw !== "object" || raw === null) return { ok: false, error: "Not an object." };
  const r = raw as Record<string, unknown>;
  const reference = str(r.reference, 80);
  if (!reference) return { ok: false, error: "Enter the verse reference, for example John 3:16." };
  const hint = str(r.hint, 300);
  if (!hint) return { ok: false, error: "Enter a hint that does not quote the verse." };

  const tr = (r.translations ?? {}) as Record<string, unknown>;
  const modern = parseText(tr.modern, "Modern English");
  if (!modern.ok) return modern;
  const kjv = parseText(tr.kjv, "King James");
  if (!kjv.ok) return kjv;

  return {
    ok: true,
    value: {
      payload: {
        reference,
        hint,
        funFact: str(r.funFact, 600),
        translations: { modern: modern.value, kjv: kjv.value },
      },
    },
  };
}
