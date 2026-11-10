"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { answerAction, finishAction } from "@/app/games/actions";
import {
  LEVEL_LABEL,
  type Feedback,
  type RunSummary,
  type StartedRun,
} from "@/src/lib/games/types";
import { fmtTime } from "./util";

export default function PlayRound({
  run,
  onDone,
}: {
  run: StartedRun;
  onDone: (s: RunSummary) => void;
}) {
  const total = run.questions.length;
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [typed, setTyped] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [saving, setSaving] = useState(false);
  const finishing = useRef(false);

  const q = run.questions[idx];
  const limitMs = run.timeLimitSeconds ? run.timeLimitSeconds * 1000 : null;

  const finish = useCallback(async () => {
    if (finishing.current) return;
    finishing.current = true;
    setSaving(true);
    setBusy(true);
    const res = await finishAction(run.runId);
    if (res.ok) onDone(res.data);
    else {
      finishing.current = false;
      setSaving(false);
      setBusy(false);
      setError(res.error);
    }
  }, [run.runId, onDone]);

  useEffect(() => {
    const t = setInterval(() => {
      const spent = Date.now() - startedAt;
      setElapsed(spent);
      if (limitMs !== null && spent >= limitMs) void finish();
    }, 250);
    return () => clearInterval(t);
  }, [startedAt, limitMs, finish]);

  async function submit(guess: number | string[]) {
    if (busy || feedback) return;
    setBusy(true);
    setError("");
    const res = await answerAction({ runId: run.runId, index: idx, guess });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      if (/time is up/i.test(res.error)) void finish();
      return;
    }
    setFeedback(res.data);
  }

  function next() {
    if (idx + 1 >= total) {
      void finish();
      return;
    }
    setIdx(idx + 1);
    setFeedback(null);
    setPicked(null);
    setTyped([]);
    setError("");
  }

  // Number keys choose an option; Enter moves on after feedback.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (feedback && e.key === "Enter") {
        e.preventDefault();
        next();
        return;
      }
      if (!feedback && q.mode === "choice") {
        const n = Number(e.key);
        if (n >= 1 && n <= q.options.length) {
          setPicked(n - 1);
          void submit(n - 1);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const left = limitMs !== null ? Math.max(0, limitMs - elapsed) : null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress and clock */}
      <div className="flex items-center justify-between text-[13px] font-semibold text-muted mb-2">
        <span>
          Question {idx + 1} of {total} · {LEVEL_LABEL[q.level]}
        </span>
        <span className={left !== null && left < 10000 ? "text-red" : ""} aria-live="off">
          {left !== null ? `⏱ ${fmtTime(left)} left` : `⏱ ${fmtTime(elapsed)}`}
        </span>
      </div>
      <div className="h-2 bg-gray-2 rounded-full overflow-hidden mb-6" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={idx + (feedback ? 1 : 0)}>
        <div
          className="h-full bg-red transition-all duration-300"
          style={{ width: `${((idx + (feedback ? 1 : 0)) / total) * 100}%` }}
        />
      </div>

      <div className="bg-white border border-gray-2 rounded-2xl p-6 md:p-8 shadow-sm">
        {q.mode === "choice" && (
          <>
            {q.testament && (
              <p className="text-[11px] font-bold tracking-[2px] uppercase text-pink mb-3">{q.testament}</p>
            )}
            <h2 className="text-[20px] md:text-[22px] font-extrabold text-navy leading-snug mb-6">{q.question}</h2>
            <div className="grid gap-3">
              {q.options.map((opt, i) => {
                const isRight = feedback?.correctIndex === i;
                const isWrongPick = feedback && picked === i && !feedback.correct;
                return (
                  <button
                    key={i}
                    disabled={busy || !!feedback}
                    onClick={() => {
                      setPicked(i);
                      void submit(i);
                    }}
                    className={`flex items-center gap-3 text-left px-4 py-3 rounded-xl border-2 transition-colors text-[15px] font-medium ${
                      isRight
                        ? "border-green-500 bg-green-50 text-green-900"
                        : isWrongPick
                          ? "border-red bg-red/5 text-red-dark"
                          : picked === i
                            ? "border-navy bg-navy/5"
                            : "border-gray-2 hover:border-navy"
                    }`}
                  >
                    <span className="w-7 h-7 rounded-lg bg-gray-bg text-[12px] font-bold text-muted flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {isRight && <span aria-label="Correct">✓</span>}
                    {isWrongPick && <span aria-label="Your answer, incorrect">✗</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {q.mode === "blank" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit(Array.from({ length: q.blankCount }, (_, i) => typed[i] ?? ""));
            }}
          >
            <p className="text-[11px] font-bold tracking-[2px] uppercase text-pink mb-3">{q.reference}</p>
            <p className="text-[20px] md:text-[22px] leading-[2.4] text-navy font-medium mb-6">
              {q.textParts.map((part, i) => (
                <span key={i}>
                  {part}
                  {i < q.blankCount && (
                    <input
                      aria-label={`Missing word ${i + 1}`}
                      autoFocus={i === 0}
                      autoComplete="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      disabled={busy || !!feedback}
                      value={typed[i] ?? ""}
                      onChange={(e) => {
                        const copy = [...typed];
                        copy[i] = e.target.value;
                        setTyped(copy);
                      }}
                      style={{ width: `${Math.max(6, (typed[i]?.length ?? 0) + 2)}ch` }}
                      className={`mx-1 px-2 py-0.5 border-b-2 bg-gray-bg rounded-t-md text-center outline-none ${
                        feedback?.blankResults
                          ? feedback.blankResults[i]
                            ? "border-green-500 text-green-800"
                            : "border-red text-red-dark"
                          : "border-navy focus:border-red"
                      }`}
                    />
                  )}
                </span>
              ))}
            </p>
            {!feedback && (
              <button disabled={busy} className="bg-red text-white font-semibold text-[14px] px-6 py-3 rounded-xl hover:bg-red-dark disabled:opacity-60 transition-colors">
                {busy ? "Checking…" : "Check answer"}
              </button>
            )}
          </form>
        )}

        {q.mode === "full" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit([typed[0] ?? ""]);
            }}
          >
            <p className="text-[11px] font-bold tracking-[2px] uppercase text-pink mb-3">
              Write this verse from memory
            </p>
            <h2 className="text-[24px] font-extrabold text-navy mb-2">{q.reference}</h2>
            {q.hint && <p className="text-[14px] text-muted italic mb-4">Hint: {q.hint}</p>}
            <textarea
              aria-label="The verse"
              autoFocus
              rows={4}
              disabled={busy || !!feedback}
              value={typed[0] ?? ""}
              onChange={(e) => setTyped([e.target.value])}
              className="w-full border-2 border-gray-2 focus:border-navy rounded-xl p-3 text-[16px] outline-none mb-4 resize-y"
              placeholder="Type the verse…"
            />
            {!feedback && (
              <button disabled={busy} className="bg-red text-white font-semibold text-[14px] px-6 py-3 rounded-xl hover:bg-red-dark disabled:opacity-60 transition-colors">
                {busy ? "Checking…" : "Check answer"}
              </button>
            )}
          </form>
        )}

        {error && (
          <p role="alert" className="mt-4 text-[13px] text-red-dark">
            {error}
          </p>
        )}

        {feedback && (
          <div
            className={`mt-6 rounded-xl p-4 ${feedback.correct ? "bg-green-50 border border-green-200" : "bg-red/5 border border-red/20"}`}
            aria-live="polite"
          >
            <p className={`font-bold text-[15px] mb-1 ${feedback.correct ? "text-green-800" : "text-red-dark"}`}>
              {feedback.correct ? "Correct" : "Not quite"}
            </p>
            {!feedback.correct && feedback.correctAnswers && (
              <p className="text-[14px] text-text mb-2">
                Answer: <strong>{feedback.correctAnswers.join(", ")}</strong>
              </p>
            )}
            {feedback.note && <p className="text-[14px] text-text/80 leading-relaxed">{feedback.note}</p>}
            {feedback.reference && q.mode === "choice" && (
              <p className="text-[12px] text-muted mt-2 font-semibold">{feedback.reference}</p>
            )}
            <button
              onClick={next}
              disabled={busy}
              className="mt-4 bg-navy text-white font-semibold text-[14px] px-6 py-2.5 rounded-xl hover:bg-navy-deep disabled:opacity-60 transition-colors"
            >
              {idx + 1 >= total ? "See my results" : "Next question"} <span className="opacity-60 text-[12px]">↵</span>
            </button>
          </div>
        )}
      </div>

      {saving && <p className="text-center text-[13px] text-muted mt-4">Saving your score…</p>}
    </div>
  );
}
