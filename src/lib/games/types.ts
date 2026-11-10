/** Shared by the browser and the server. Nothing here contains answers. */

export type GameId = "quiz" | "quote" | "hunt";
export type Level = "easy" | "medium" | "hard" | "expert";
export type LevelChoice = Level | "all";
export type Translation = "modern" | "kjv";

export const GAME_IDS: GameId[] = ["quiz", "quote", "hunt"];
export const LEVELS: Level[] = ["easy", "medium", "hard", "expert"];
export const LEVEL_CHOICES: LevelChoice[] = [...LEVELS, "all"];
export const TRANSLATIONS: Translation[] = ["modern", "kjv"];

export const LEVEL_LABEL: Record<LevelChoice, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  expert: "Expert",
  all: "All levels",
};

export const TRANSLATION_LABEL: Record<Translation, string> = {
  modern: "Modern English",
  kjv: "King James Version",
};

/** Higher outranks lower on the "all levels" board at the same percentage. */
export const LEVEL_WEIGHT: Record<LevelChoice, number> = {
  expert: 4,
  hard: 3,
  all: 2.5,
  medium: 2,
  easy: 1,
};

export type GameMeta = {
  id: GameId;
  slug: string;
  /** Public address of the game's page. */
  path: string;
  title: string;
  /** Used in "Players" copy, e.g. "questions" / "verses". */
  unit: string;
  /** What each level means, shown on the level cards. */
  levelHelp: Record<Level, string>;
  hasTranslation: boolean;
};

export const GAMES: Record<GameId, GameMeta> = {
  quiz: {
    id: "quiz",
    slug: "bible-quiz",
    path: "/games/bible-quiz",
    title: "Bible Quiz",
    unit: "questions",
    hasTranslation: false,
    levelHelp: {
      easy: "Well-known stories and people",
      medium: "A good knowledge of Scripture",
      hard: "Deeper details and context",
      expert: "For serious Bible students",
    },
  },
  quote: {
    id: "quote",
    slug: "bible-quote",
    path: "/games/bible-quote",
    title: "Bible Quote",
    unit: "verses",
    hasTranslation: true,
    levelHelp: {
      easy: "Fill in one missing word",
      medium: "Fill in every missing word",
      hard: "Type the whole verse, with a hint",
      expert: "Type the whole verse from the reference alone",
    },
  },
  hunt: {
    id: "hunt",
    slug: "church-trivia",
    path: "/hunt/trivia",
    title: "Church Trivia",
    unit: "questions",
    hasTranslation: false,
    levelHelp: {
      easy: "",
      medium: "",
      hard: "",
      expert: "",
    },
  },
};

export function gameBySlug(slug: string): GameMeta | null {
  return Object.values(GAMES).find((g) => g.slug === slug) ?? null;
}

export const NAME_MAX = 30;
export const ROUND_SIZES = [5, 10, 15, 20] as const;
export const DEFAULT_ROUND = 10;

/* ---------- What the browser receives for each question ---------- */

export type ChoiceQuestion = {
  mode: "choice";
  level: Level;
  question: string;
  options: string[];
  testament: string;
  caption: string;
};

export type BlankQuestion = {
  mode: "blank";
  level: Level;
  reference: string;
  /** part[0] INPUT part[1] INPUT … part[n] */
  textParts: string[];
  blankCount: number;
};

export type FullQuestion = {
  mode: "full";
  level: Level;
  reference: string;
  hint: string | null;
};

export type PlayQuestion = ChoiceQuestion | BlankQuestion | FullQuestion;

/** A player's answer: an option index for choice questions, otherwise typed text. */
export type Guess = number | string[];

/* ---------- Feedback after each locked-in answer ---------- */

export type Feedback = {
  correct: boolean;
  reference: string;
  /** Explanation (quiz) or fun fact (quote). */
  note: string;
  /** quiz */
  correctIndex?: number;
  /** quote */
  correctAnswers?: string[];
  blankResults?: boolean[];
};

export type RoomInfo = {
  code: string;
  game: GameId;
  hostName: string;
  difficulty: LevelChoice;
  translation: Translation;
  maxAttempts: number | null;
  timeLimitSeconds: number | null;
  questionCount: number;
  expiresAt: string;
  expired: boolean;
};

export type StartedRun = {
  runId: string;
  game: GameId;
  difficulty: LevelChoice;
  translation: Translation;
  timeLimitSeconds: number | null;
  questions: PlayQuestion[];
  attemptNo: number;
  attemptsLeft: number | null;
};

export type RunSummary = {
  runId: string;
  game: GameId;
  roomCode: string | null;
  playerName: string;
  difficulty: LevelChoice;
  score: number;
  total: number;
  percentage: number;
  elapsedMs: number;
  finishedAt: string;
  /** Rank on the matching leaderboard, 1-based, if the player is on it. */
  rank: number | null;
  participants: number;
  /** Treasure hunt only: whether the pass mark was reached, and the key won. */
  award: { passMark: number; passed: boolean; key: string | null } | null;
  review: (Feedback & { guess: Guess | null; question: PlayQuestion })[];
};

export type BoardRow = {
  rank: number;
  playerName: string;
  difficulty: LevelChoice;
  score: number;
  total: number;
  percentage: number;
  elapsedMs: number;
};

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };
