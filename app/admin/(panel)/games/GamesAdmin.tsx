"use client";

import { useMemo, useState, useTransition } from "react";
import type { QuizPayload, QuotePayload } from "@/src/lib/games/engine";
import { GAMES, LEVELS, LEVEL_LABEL, type GameId } from "@/src/lib/games/types";
import { importQuestions, saveQuestion, setQuestionActive, type QuestionRow } from "./actions";

const input =
  "w-full border border-gray-2 rounded-lg px-3 py-2 text-[14px] outline-none focus:border-navy bg-white";
const label = "grid gap-1 text-[13px] font-semibold text-text";

type Draft = {
  id?: string;
  /* quiz */
  question: string;
  options: string[];
  correctIndex: number;
  difficulty: string;
  explanation: string;
  testament: string;
  caption: string;
  /* shared */
  reference: string;
  /* quote */
  hint: string;
  funFact: string;
  modern: string;
  kjv: string;
  /** Kept as-is when editing, since the form doesn't expose them. */
  extra: { modern?: object; kjv?: object };
};

const blank: Draft = {
  question: "",
  options: ["", "", "", ""],
  correctIndex: 0,
  difficulty: "easy",
  explanation: "",
  testament: "OLD TESTAMENT",
  caption: "",
  reference: "",
  hint: "",
  funFact: "",
  modern: "",
  kjv: "",
  extra: {},
};

function toDraft(r: QuestionRow): Draft {
  if (r.game !== "quote") {
    const p = r.payload as QuizPayload;
    return {
      ...blank,
      id: r.id,
      question: p.question,
      options: [...p.options, "", "", "", ""].slice(0, Math.max(4, p.options.length)),
      correctIndex: p.correctIndex,
      difficulty: r.difficulty ?? "easy",
      explanation: p.explanation,
      testament: p.testament,
      caption: p.caption,
      reference: p.reference,
    };
  }
  const p = r.payload as QuotePayload;
  const { text: m, ...mExtra } = p.translations.modern;
  const { text: k, ...kExtra } = p.translations.kjv;
  return {
    ...blank,
    id: r.id,
    reference: p.reference,
    hint: p.hint,
    funFact: p.funFact,
    modern: m,
    kjv: k,
    extra: { modern: mExtra, kjv: kExtra },
  };
}

function toData(game: GameId, d: Draft) {
  if (game !== "quote") {
    return {
      question: d.question,
      options: d.options.filter((o) => o.trim()),
      correctIndex: d.correctIndex,
      difficulty: d.difficulty,
      reference: d.reference,
      explanation: d.explanation,
      testament: d.testament,
      caption: d.caption,
    };
  }
  return {
    reference: d.reference,
    hint: d.hint,
    funFact: d.funFact,
    translations: {
      modern: { ...d.extra.modern, text: d.modern },
      kjv: { ...d.extra.kjv, text: d.kjv },
    },
  };
}

function titleOf(r: QuestionRow) {
  return r.game === "quote" ? (r.payload as QuotePayload).reference : (r.payload as QuizPayload).question;
}

export default function GamesAdmin({ initial }: { initial: QuestionRow[] }) {
  const [rows, setRows] = useState(initial);
  const [game, setGame] = useState<GameId>("quiz");
  const [q, setQ] = useState("");
  const [lvl, setLvl] = useState("all");
  const [hidden, setHidden] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [importing, setImporting] = useState(false);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, start] = useTransition();

  const shown = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.game === game &&
          (hidden || r.active) &&
          (lvl === "all" || r.difficulty === lvl) &&
          (!q || JSON.stringify(r.payload).toLowerCase().includes(q.toLowerCase())),
      ),
    [rows, game, hidden, lvl, q],
  );
  const total = rows.filter((r) => r.game === game && r.active).length;

  function save() {
    if (!draft) return;
    setError("");
    start(async () => {
      const res = await saveQuestion({ id: draft.id, game, data: toData(game, draft) });
      if (!res.ok) return setError(res.error);
      setRows((prev) => (draft.id ? prev.map((r) => (r.id === res.row.id ? res.row : r)) : [res.row, ...prev]));
      setDraft(null);
      setMsg("Saved.");
    });
  }

  function toggle(r: QuestionRow) {
    setError("");
    start(async () => {
      const res = await setQuestionActive(r.id, !r.active);
      if (!res.ok) return setError(res.error);
      setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, active: !r.active } : x)));
    });
  }

  function doImport() {
    setError("");
    setMsg("");
    start(async () => {
      const res = await importQuestions(game, text);
      if (!res.ok) return setError(res.error);
      setRows((prev) => [...res.rows, ...prev]);
      setMsg(`Added ${res.added}${res.skipped ? `, skipped ${res.skipped} duplicate${res.skipped > 1 ? "s" : ""}` : ""}.`);
      setText("");
      setImporting(false);
    });
  }

  const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  return (
    <div>
      <div className="flex gap-2 mb-5" role="tablist">
        {(["quiz", "quote", "hunt"] as const).map((g) => (
          <button
            key={g}
            role="tab"
            aria-selected={game === g}
            onClick={() => {
              setGame(g);
              setDraft(null);
              setImporting(false);
              setLvl("all");
              setMsg("");
              setError("");
            }}
            className={`px-4 py-2 rounded-lg text-[14px] font-bold border ${
              game === g ? "bg-navy text-white border-navy" : "bg-white border-gray-2 text-navy"
            }`}
          >
            {GAMES[g].title}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          aria-label="Search"
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={`${input} max-w-xs`}
        />
        {game === "quiz" && (
          <select aria-label="Level" value={lvl} onChange={(e) => setLvl(e.target.value)} className={`${input} max-w-[10rem]`}>
            <option value="all">All levels</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>{LEVEL_LABEL[l]}</option>
            ))}
          </select>
        )}
        <label className="flex items-center gap-2 text-[13px] text-muted">
          <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} /> Show hidden
        </label>
        <span className="text-[13px] text-muted">{total} active</span>
        <span className="ml-auto flex gap-2">
          <button onClick={() => { setImporting(!importing); setDraft(null); }} className="border border-gray-2 bg-white text-[13px] font-semibold px-4 py-2 rounded-lg hover:border-navy">
            Import
          </button>
          <button onClick={() => { setDraft({ ...blank }); setImporting(false); setError(""); }} className="bg-red text-white text-[13px] font-semibold px-4 py-2 rounded-lg hover:bg-red-dark">
            Add {game === "quote" ? "verse" : "question"}
          </button>
        </span>
      </div>

      {msg && <p role="status" className="text-[14px] text-green-800 mb-3">{msg}</p>}
      {error && <p role="alert" className="text-[14px] text-red-dark mb-3">{error}</p>}

      {importing && (
        <div className="bg-white border border-gray-2 rounded-2xl p-5 mb-5">
          <p className="text-[13px] text-muted mb-2">
            Paste a JSON list. {game !== "quote"
              ? "Each item needs question, options, correctIndex, difficulty (easy, medium, hard, expert; ignored for Church Trivia) and optionally reference, explanation, testament, caption. The old app's file format also works."
              : "Each item needs reference, hint, funFact and translations: { modern: { text }, kjv: { text } }, with {{double braces}} around blankable words."}{" "}
            Duplicates are skipped. If any item is invalid, nothing is imported.
          </p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8} className={`${input} font-mono text-[12px]`} placeholder="[ { … }, { … } ]" />
          <div className="flex gap-2 mt-3">
            <button disabled={busy || !text.trim()} onClick={doImport} className="bg-navy text-white text-[13px] font-semibold px-4 py-2 rounded-lg disabled:opacity-60">
              {busy ? "Importing…" : "Import"}
            </button>
            <button onClick={() => setImporting(false)} className="text-[13px] text-muted px-3">Cancel</button>
          </div>
        </div>
      )}

      {draft && (
        <form
          onSubmit={(e) => { e.preventDefault(); save(); }}
          className="bg-white border border-gray-2 rounded-2xl p-5 mb-5 grid gap-3"
        >
          <h2 className="text-[16px] font-bold text-navy">{draft.id ? "Edit" : "Add"} {game === "quote" ? "verse" : "question"}</h2>
          {game !== "quote" ? (
            <>
              <label className={label}>Question
                <textarea required rows={2} value={draft.question} onChange={(e) => set({ question: e.target.value })} className={input} />
              </label>
              <fieldset className="grid gap-2">
                <legend className="text-[13px] font-semibold text-text mb-1">Options (tick the correct one)</legend>
                {draft.options.map((o, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="radio" name="correct" aria-label={`Option ${i + 1} is correct`} checked={draft.correctIndex === i} onChange={() => set({ correctIndex: i })} />
                    <input value={o} onChange={(e) => set({ options: draft.options.map((x, j) => (j === i ? e.target.value : x)) })} className={input} placeholder={`Option ${i + 1}`} />
                  </div>
                ))}
              </fieldset>
              <div className="grid sm:grid-cols-3 gap-3">
                {game === "quiz" && <label className={label}>Level
                  <select value={draft.difficulty} onChange={(e) => set({ difficulty: e.target.value })} className={input}>
                    {LEVELS.map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
                  </select>
                </label>}
                <label className={label}>Reference
                  <input value={draft.reference} onChange={(e) => set({ reference: e.target.value })} className={input} placeholder="Genesis 6:14" />
                </label>
                <label className={label}>Testament
                  <select value={draft.testament} onChange={(e) => set({ testament: e.target.value })} className={input}>
                    <option>OLD TESTAMENT</option><option>NEW TESTAMENT</option><option value="">None</option>
                  </select>
                </label>
              </div>
              <label className={label}>Explanation (shown after answering)
                <textarea rows={2} value={draft.explanation} onChange={(e) => set({ explanation: e.target.value })} className={input} />
              </label>
              <label className={label}>Caption (optional)
                <input value={draft.caption} onChange={(e) => set({ caption: e.target.value })} className={input} />
              </label>
            </>
          ) : (
            <>
              <label className={label}>Reference
                <input required value={draft.reference} onChange={(e) => set({ reference: e.target.value })} className={input} placeholder="John 3:16" />
              </label>
              <label className={label}>Hint (shown on Hard; must not quote the verse)
                <input required value={draft.hint} onChange={(e) => set({ hint: e.target.value })} className={input} />
              </label>
              <label className={label}>Fun fact (shown after answering)
                <textarea rows={2} value={draft.funFact} onChange={(e) => set({ funFact: e.target.value })} className={input} />
              </label>
              <label className={label}>Modern English text
                <textarea required rows={3} value={draft.modern} onChange={(e) => set({ modern: e.target.value })} className={input} placeholder="For God so loved the {{world}}, that he gave…" />
              </label>
              <label className={label}>King James text
                <textarea required rows={3} value={draft.kjv} onChange={(e) => set({ kjv: e.target.value })} className={input} />
              </label>
              <p className="text-[12px] text-muted">Wrap the words players may be asked for in {"{{double braces}}"}. Easy hides one of them; Medium hides all of them.</p>
            </>
          )}
          <div className="flex gap-2">
            <button disabled={busy} className="bg-red text-white text-[13px] font-semibold px-5 py-2 rounded-lg disabled:opacity-60">{busy ? "Saving…" : "Save"}</button>
            <button type="button" onClick={() => setDraft(null)} className="text-[13px] text-muted px-3">Cancel</button>
          </div>
        </form>
      )}

      <ul className="grid gap-2">
        {shown.slice(0, 200).map((r) => (
          <li key={r.id} className={`bg-white border border-gray-2 rounded-xl px-4 py-3 flex items-center gap-3 ${r.active ? "" : "opacity-50"}`}>
            <span className="flex-1 min-w-0">
              <span className="block text-[14px] font-semibold text-text truncate">{titleOf(r)}</span>
              <span className="block text-[12px] text-muted">
                {r.game === "quote" ? (r.payload as QuotePayload).hint : r.game === "hunt" ? (r.payload as QuizPayload).reference : `${LEVEL_LABEL[r.difficulty as "easy"] ?? ""} · ${(r.payload as QuizPayload).reference}`}
                {!r.active ? " · hidden" : ""}
              </span>
            </span>
            <button onClick={() => { setDraft(toDraft(r)); setImporting(false); setError(""); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="text-[13px] font-semibold text-navy hover:underline">Edit</button>
            <button disabled={busy} onClick={() => toggle(r)} className="text-[13px] font-semibold text-muted hover:text-red-dark">{r.active ? "Hide" : "Show"}</button>
          </li>
        ))}
        {shown.length === 0 && <li className="text-muted text-[14px] py-6 text-center">Nothing matches.</li>}
        {shown.length > 200 && <li className="text-muted text-[13px] text-center py-2">Showing the first 200. Narrow the search to see more.</li>}
      </ul>
    </div>
  );
}
