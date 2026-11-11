"use client";

import Link from "next/link";
import { useState } from "react";
import { GAMES, LEVEL_LABEL, type PlayQuestion, type RunSummary } from "@/src/lib/games/types";
import { fmtTime } from "./util";

function Confetti() {
  const colors = ["#e53935", "#1a3a6e", "#d81b60", "#f9a825", "#43a047"];
  return (
    <div className="wc-confetti" aria-hidden="true">
      <style>{`
        .wc-confetti{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:50}
        .wc-confetti i{position:absolute;top:-16px;width:9px;height:14px;border-radius:2px;animation:wc-fall linear forwards}
        @keyframes wc-fall{to{transform:translateY(110vh) rotate(720deg);opacity:.9}}
        @media (prefers-reduced-motion:reduce){.wc-confetti{display:none}}
      `}</style>
      {Array.from({ length: 48 }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            background: colors[i % colors.length],
            animationDuration: `${2.4 + ((i * 13) % 20) / 10}s`,
            animationDelay: `${((i * 7) % 12) / 10}s`,
          }}
        />
      ))}
    </div>
  );
}

function describeGuess(q: PlayQuestion, guess: RunSummary["review"][number]["guess"]): string {
  if (guess === null) return "No answer";
  if (q.mode === "choice") return typeof guess === "number" ? (q.options[guess] ?? "No answer") : "No answer";
  return Array.isArray(guess) ? guess.filter(Boolean).join(", ") || "No answer" : "No answer";
}

/** Draws a square score card and hands it to the share sheet, or downloads it. */
async function shareCard(s: RunSummary, link: string): Promise<string> {
  const game = GAMES[s.game];
  const size = 1080;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  if (!g) return "Your browser can't make the image.";

  const bg = g.createLinearGradient(0, 0, size, size);
  bg.addColorStop(0, "#1a3a6e");
  bg.addColorStop(1, "#0f2347");
  g.fillStyle = bg;
  g.fillRect(0, 0, size, size);
  g.fillStyle = "#e53935";
  g.fillRect(0, 0, size, 14);

  g.textAlign = "center";
  g.fillStyle = "rgba(255,255,255,.65)";
  g.font = "700 34px system-ui, sans-serif";
  g.fillText("THE WITNESS CHURCH", size / 2, 130);
  g.fillStyle = "#fff";
  g.font = "800 76px system-ui, sans-serif";
  g.fillText(game.title, size / 2, 250);

  g.font = "800 300px system-ui, sans-serif";
  g.fillText(`${s.score}/${s.total}`, size / 2, 560);
  g.fillStyle = "#ff8a80";
  g.font = "800 90px system-ui, sans-serif";
  g.fillText(`${s.percentage}%`, size / 2, 690);

  g.fillStyle = "#fff";
  g.font = "600 46px system-ui, sans-serif";
  g.fillText(`${s.playerName} · ${LEVEL_LABEL[s.difficulty]} · ${fmtTime(s.elapsedMs)}`, size / 2, 810);
  if (s.rank) {
    g.fillStyle = "rgba(255,255,255,.75)";
    g.font = "600 40px system-ui, sans-serif";
    g.fillText(`Rank #${s.rank} of ${s.participants}`, size / 2, 880);
  }
  g.fillStyle = "rgba(255,255,255,.55)";
  g.font = "500 32px system-ui, sans-serif";
  g.fillText(link.replace(/^https?:\/\//, ""), size / 2, 990);

  const blob: Blob | null = await new Promise((r) => c.toBlob(r, "image/png"));
  if (!blob) return "Could not make the image.";
  const file = new File([blob], `${game.slug}-score.png`, { type: "image/png" });
  const text = `I scored ${s.score}/${s.total} on ${game.title} at The Witness Church. Can you beat me?`;

  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text, url: link });
      return "";
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return "";
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(a.href);
  return "Image saved. Share it with your friends.";
}

export default function Results({
  summary,
  link,
  onAgain,
  onExit,
  againLabel,
}: {
  summary: RunSummary;
  /** Public link to the game or room, printed on the share card. */
  link: string;
  onAgain: (() => void) | null;
  onExit: () => void;
  againLabel: string;
}) {
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);
  const great = summary.percentage >= 80;

  return (
    <div className="max-w-2xl mx-auto">
      {great && <Confetti />}
      <div className="bg-gradient-to-br from-navy to-navy-deep text-white rounded-2xl p-8 text-center shadow-sm">
        <p className="text-[12px] font-bold tracking-[2px] uppercase text-white/60 mb-2">
          {great ? "Well done, " : ""}
          {summary.playerName}
        </p>
        <p className="text-[64px] font-extrabold leading-none">
          {summary.score}
          <span className="text-white/40 text-[40px]">/{summary.total}</span>
        </p>
        <p className="text-[18px] font-semibold text-red-200 mt-1">{summary.percentage}%</p>
        <p className="text-[14px] text-white/70 mt-3">
          {LEVEL_LABEL[summary.difficulty]} · {fmtTime(summary.elapsedMs)}
          {summary.rank ? ` · Rank #${summary.rank} of ${summary.participants}` : ""}
        </p>
      </div>

      {summary.award && (
        <div
          className={`mt-5 rounded-2xl p-5 text-center border ${summary.award.passed ? "bg-green-50 border-green-200" : "bg-red/5 border-red/20"}`}
          aria-live="polite"
        >
          {summary.award.passed && summary.award.key ? (
            <>
              <p className="text-[12px] font-bold tracking-[2px] uppercase text-green-800">You won Key {summary.award.keyNo}</p>
              <p className="text-[28px] font-extrabold text-navy tracking-wide mt-1">{summary.award.key}</p>
              <p className="text-[13px] text-muted mt-1">It is saved on this device. Keep it safe, you need it for the chest{summary.award.keyNo === 1 ? " and Game 2" : ""}.</p>
              <Link href="/hunt" className="inline-block mt-3 bg-red text-white font-semibold text-[14px] px-6 py-2.5 rounded-xl hover:bg-red-dark transition-colors">
                {summary.award.keyNo === 1 ? "On to Game 2" : "On to Game 4"}
              </Link>
            </>
          ) : (
            <>
              <p className="text-[15px] font-bold text-red-dark">Not quite there yet</p>
              <p className="text-[13px] text-muted mt-1">
                You need {summary.award.passMark}% to win Key {summary.award.keyNo}. You scored {summary.percentage}%. Try again!
              </p>
            </>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mt-5">
        {onAgain && (
          <button onClick={onAgain} className="bg-red text-white font-semibold text-[14px] px-6 py-3 rounded-xl hover:bg-red-dark transition-colors">
            {againLabel}
          </button>
        )}
        <button
          onClick={async () => setNote(await shareCard(summary, link))}
          className="border border-navy/30 text-navy font-semibold text-[14px] px-6 py-3 rounded-xl hover:bg-navy hover:text-white transition-colors"
        >
          Share my score
        </button>
        <button onClick={onExit} className="text-muted font-semibold text-[14px] px-4 py-3 hover:text-navy">
          Back to start
        </button>
      </div>
      {note && (
        <p role="status" className="text-[13px] text-muted mt-3">
          {note}
        </p>
      )}

      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="mt-8 text-[14px] font-bold text-navy underline underline-offset-4"
      >
        {open ? "Hide" : "Review"} my answers
      </button>

      {open && (
        <ol className="mt-4 grid gap-3">
          {summary.review.map((r, i) => (
            <li
              key={i}
              className={`rounded-xl border p-4 ${r.correct ? "border-green-200 bg-green-50/50" : "border-red/20 bg-red/5"}`}
            >
              <p className="text-[12px] font-bold text-muted mb-1">
                {i + 1}. {r.correct ? "Correct" : "Missed"} · {r.reference}
              </p>
              {r.question.mode === "choice" && (
                <p className="text-[15px] font-semibold text-navy mb-2">{r.question.question}</p>
              )}
              <p className="text-[13px] text-text">
                Your answer: <strong>{describeGuess(r.question, r.guess)}</strong>
              </p>
              {!r.correct && (
                <p className="text-[13px] text-text">
                  Correct:{" "}
                  <strong>
                    {r.question.mode === "choice" && r.correctIndex !== undefined
                      ? r.question.options[r.correctIndex]
                      : r.correctAnswers?.join(", ")}
                  </strong>
                </p>
              )}
              {r.note && <p className="text-[13px] text-muted mt-2 leading-relaxed">{r.note}</p>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
