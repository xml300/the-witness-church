/** Pure game logic: builds the questions a player sees and grades their
 *  answers. No database access. Runs on the server only, because the
 *  payloads it reads contain the correct answers. */
import type {
  Feedback,
  Guess,
  Level,
  LevelChoice,
  PlayQuestion,
  Translation,
} from "./types";
import { LEVELS } from "./types";

/* ---------- stored payloads (see migration-004-games.sql) ---------- */

export type QuizPayload = {
  question: string;
  options: string[];
  correctIndex: number;
  reference: string;
  explanation: string;
  testament: string;
  caption: string;
};

export type QuoteText = {
  /** Blankable words are marked inline as {{word}}. */
  text: string;
  easyIndex?: number;
  synonyms?: Record<string, string[]>;
};

export type QuotePayload = {
  reference: string;
  hint: string;
  funFact: string;
  translations: Record<Translation, QuoteText>;
};

/* ---------- helpers ---------- */

export function shuffle<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function randomLevel(): Level {
  return LEVELS[Math.floor(Math.random() * LEVELS.length)];
}

/** The level one question is played at. "all" picks one at random. */
export function concreteLevel(choice: LevelChoice): Level {
  return choice === "all" ? randomLevel() : choice;
}

export function normalize(s: string): string {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'‘’“”—–]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* ---------- quote: parsing {{blank}} markup ---------- */

type ParsedVerse = {
  segments: string[];
  blanks: { word: string; accepted: string[] }[];
  fullText: string;
  easyIndex: number;
};

const BLANK = /\{\{(.*?)\}\}/g;

function parseVerse(v: QuotePayload, t: Translation): ParsedVerse {
  const entry = v.translations[t] ?? v.translations.modern;
  const segments: string[] = [];
  const blanks: ParsedVerse["blanks"] = [];
  let last = 0;
  const re = new RegExp(BLANK);
  let m: RegExpExecArray | null;
  while ((m = re.exec(entry.text)) !== null) {
    segments.push(entry.text.slice(last, m.index));
    const word = m[1];
    blanks.push({
      word,
      accepted: [word, ...(entry.synonyms?.[word.toLowerCase()] ?? [])].map(normalize),
    });
    last = m.index + m[0].length;
  }
  segments.push(entry.text.slice(last));
  return {
    segments,
    blanks,
    fullText: entry.text.replace(BLANK, "$1"),
    easyIndex: Math.min(entry.easyIndex ?? 0, Math.max(blanks.length - 1, 0)),
  };
}

/** Easy hides one word; medium hides every blankable word. */
function blankIndices(p: ParsedVerse, level: Level): number[] {
  if (p.blanks.length === 0) return [];
  if (level === "easy") return [p.easyIndex];
  return p.blanks.map((_, i) => i);
}

/* ---------- build what the browser sees ---------- */

export function buildQuizQuestion(p: QuizPayload, level: Level): PlayQuestion {
  return {
    mode: "choice",
    level,
    question: p.question,
    options: p.options,
    testament: p.testament,
    caption: p.caption,
  };
}

export function buildQuoteQuestion(
  p: QuotePayload,
  level: Level,
  translation: Translation,
): PlayQuestion {
  if (level === "hard" || level === "expert") {
    return {
      mode: "full",
      level,
      reference: p.reference,
      hint: level === "hard" ? p.hint : null,
    };
  }
  const parsed = parseVerse(p, translation);
  const picked = new Set(blankIndices(parsed, level));
  const parts: string[] = [];
  let current = "";
  parsed.blanks.forEach((b, i) => {
    current += parsed.segments[i];
    if (picked.has(i)) {
      parts.push(current);
      current = "";
    } else {
      current += b.word;
    }
  });
  current += parsed.segments[parsed.segments.length - 1];
  parts.push(current);
  return {
    mode: "blank",
    level,
    reference: p.reference,
    textParts: parts,
    blankCount: picked.size,
  };
}

/* ---------- grade one answer ---------- */

export function gradeQuiz(p: QuizPayload, guess: Guess | null): Feedback {
  return {
    correct: typeof guess === "number" && guess === p.correctIndex,
    reference: p.reference,
    note: p.explanation,
    correctIndex: p.correctIndex,
  };
}

export function gradeQuote(
  p: QuotePayload,
  level: Level,
  translation: Translation,
  guess: Guess | null,
): Feedback {
  const typed = Array.isArray(guess) ? guess.map(String) : [];
  const parsed = parseVerse(p, translation);

  if (level === "hard" || level === "expert") {
    return {
      correct: normalize(typed[0] ?? "") === normalize(parsed.fullText),
      reference: p.reference,
      note: p.funFact,
      correctAnswers: [parsed.fullText],
    };
  }

  const idx = blankIndices(parsed, level);
  const blankResults = idx.map((bi, i) => parsed.blanks[bi].accepted.includes(normalize(typed[i] ?? "")));
  return {
    correct: blankResults.length > 0 && blankResults.every(Boolean),
    reference: p.reference,
    note: p.funFact,
    blankResults,
    correctAnswers: idx.map((bi) => parsed.blanks[bi].word),
  };
}

/** Keeps a submitted guess to the shape the question expects. */
export function cleanGuess(q: PlayQuestion, raw: unknown): Guess | null {
  if (q.mode === "choice") {
    return typeof raw === "number" && Number.isInteger(raw) && raw >= 0 && raw < q.options.length
      ? raw
      : null;
  }
  if (!Array.isArray(raw)) return null;
  const want = q.mode === "blank" ? q.blankCount : 1;
  return raw
    .slice(0, want)
    .map((x) => String(x ?? "").slice(0, 2000));
}

/* ---------- player names ---------- */

const BLOCKED = ["fuck", "shit", "bitch", "cunt", "nigg", "asshole", "dick", "pussy", "whore", "slut", "porn", "rape"];

export function cleanName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim();
  if (name.length < 1 || name.length > 30) return null;
  const flat = name.toLowerCase().replace(/[^a-z]/g, "");
  if (BLOCKED.some((w) => flat.includes(w))) return null;
  return name;
}
