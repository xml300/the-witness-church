"use client";

import Link from "next/link";
import { useCallback, useState, useSyncExternalStore } from "react";
import {
  checkFoundersAction,
  chestBoardAction,
  openChestAction,
  submitWordAction,
  unlockClueAction,
  unlockFoundersAction,
} from "@/app/hunt/actions";
import type { ChestResult, Clue, FoundersView, HuntStatus } from "@/src/lib/hunt/service";
import { clearHuntKeys, loadHuntKeys, saveHuntKey } from "@/src/components/games/util";

type Board = Awaited<ReturnType<typeof chestBoardAction>>;

const field =
  "w-full border border-gray-2 rounded-lg px-3 py-2.5 text-[15px] outline-none focus:border-navy bg-white";
const primary =
  "bg-red text-white font-semibold text-[14px] px-6 py-3 rounded-xl hover:bg-red-dark disabled:opacity-60 transition-colors";

function Step({
  n,
  title,
  locked,
  done,
  children,
}: {
  n: number;
  title: string;
  locked?: boolean;
  done?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={`bg-white border rounded-2xl p-6 md:p-7 shadow-sm ${done ? "border-green-300" : "border-gray-2"}`}>
      <h2 className="flex items-center gap-3 text-[18px] font-extrabold text-navy mb-3">
        <span
          className={`w-8 h-8 rounded-full text-[14px] flex items-center justify-center text-white ${
            done ? "bg-green-600" : locked ? "bg-muted/50" : "bg-red"
          }`}
          aria-hidden="true"
        >
          {done ? "✓" : n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function ClueBox({ clue }: { clue: Clue }) {
  return (
    <div className="mt-4 bg-pink-light rounded-xl p-4" aria-live="polite">
      <p className="text-[15px] font-bold text-navy mb-1">{clue.title}</p>
      <p className="text-[14px] text-text whitespace-pre-wrap leading-relaxed">{clue.body}</p>
    </div>
  );
}

const subscribe = () => () => {};

/** Saved keys live in the browser, so the page body renders on the client only. */
export default function HuntClient(props: { status: HuntStatus; board: Board }) {
  const onClient = useSyncExternalStore(subscribe, () => true, () => false);
  return onClient ? <HuntBody {...props} /> : null;
}

function HuntBody({ status, board: initialBoard }: { status: HuntStatus; board: Board }) {
  const [saved] = useState(() => loadHuntKeys());
  const [keys, setKeys] = useState<Record<1 | 2 | 3 | 4, string>>(saved);
  const [msg, setMsg] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");

  const [k1, setK1] = useState(saved[1]);
  const [founders, setFounders] = useState<FoundersView | null>(null);
  const [names, setNames] = useState<string[]>(["", ""]);
  const [listOk, setListOk] = useState(false);
  const [wordHint, setWordHint] = useState("");
  const [word, setWord] = useState("");
  const [clue2, setClue2] = useState<Clue | null>(null);
  const [k2, setK2] = useState(saved[2]);
  const [k3, setK3] = useState(saved[3]);
  const [clue3, setClue3] = useState<Clue | null>(null);
  const [team, setTeam] = useState("");
  const [boxes, setBoxes] = useState([saved[1], saved[2], saved[3], saved[4]]);
  const [result, setResult] = useState<ChestResult | null>(null);
  const [board, setBoard] = useState<Board>(initialBoard);

  const say = (k: string, v: string) => setMsg((m) => ({ ...m, [k]: v }));
  const open = status.window === "open";

  const run = useCallback(async (id: string, fn: () => Promise<void>) => {
    setBusy(id);
    setMsg((m) => ({ ...m, [id]: "" }));
    try {
      await fn();
    } finally {
      setBusy("");
    }
  }, []);

  const unlockFounders = (e: React.FormEvent) => {
    e.preventDefault();
    void run("f", async () => {
      const r = await unlockFoundersAction(k1);
      if (!r.ok) return say("f", r.error);
      saveHuntKey(1, k1.trim());
      setKeys((k) => ({ ...k, 1: k1.trim() }));
      setFounders(r.data);
    });
  };

  const filledNames = () => names.map((n) => n.trim()).filter(Boolean);

  const checkList = () =>
    void run("n", async () => {
      const r = await checkFoundersAction(k1, filledNames());
      if (!r.ok) return say("n", r.error);
      setListOk(r.data.passed);
      setWordHint(r.data.wordHint);
      say(
        "n",
        r.data.passed
          ? "That is the complete list of founding members. Now find the word."
          : "Not quite. Look at the photo again. Is anyone missing, or did you include someone who is not a founding member?",
      );
    });

  const sendWord = (e: React.FormEvent) => {
    e.preventDefault();
    void run("w", async () => {
      const r = await submitWordAction(k1, filledNames(), word);
      if (!r.ok) return say("w", r.error);
      saveHuntKey(2, r.data.key2);
      setKeys((k) => ({ ...k, 2: r.data.key2 }));
      setK2(r.data.key2);
      setBoxes((b) => [b[0], r.data.key2, b[2], b[3]]);
      setClue2(r.data.clue);
    });
  };

  const unlockClue = (stage: 2 | 3, key: string) =>
    void run(`c${stage}`, async () => {
      const r = await unlockClueAction(stage, key);
      if (!r.ok) return say(`c${stage}`, r.error);
      saveHuntKey(stage, key.trim());
      setKeys((k) => ({ ...k, [stage]: key.trim() }));
      if (stage === 2) {
        setClue2(r.data);
        setBoxes((b) => [b[0], key.trim(), b[2], b[3]]);
      } else {
        setClue3(r.data);
        setBoxes((b) => [b[0], b[1], key.trim(), b[3]]);
      }
    });

  const chest = (e: React.FormEvent) => {
    e.preventDefault();
    void run("x", async () => {
      const r = await openChestAction(team, boxes);
      if (!r.ok) return say("x", r.error);
      saveHuntKey(4, boxes[3].trim());
      setResult(r.data);
      setBoard(await chestBoardAction());
    });
  };

  return (
    <div className="max-w-3xl mx-auto grid gap-5">
      {!open && (
        <p role="status" className="bg-navy/5 text-navy rounded-xl p-4 text-[14px] font-medium">
          {status.window === "not-open"
            ? "Games 1 and 2 have not opened yet."
            : "Games 1 and 2 have closed. If you already have Key 2 or later, you can keep going below."}
        </p>
      )}

      <Step n={1} title="Game 1: Church Trivia" done={!!keys[1]}>
        <p className="text-[14px] text-muted mb-4">
          Take the quiz on your own. Score {status.passMark}% or more to win Key 1.
        </p>
        {keys[1] ? (
          <p className="text-[14px]">
            Your Key 1: <strong className="tracking-wide text-navy">{keys[1]}</strong>
          </p>
        ) : null}
        <Link href="/hunt/trivia" className={`${primary} inline-block mt-3`}>
          {keys[1] ? "Play again" : "Play the quiz"}
        </Link>
      </Step>

      <Step n={2} title="Game 2: Founding Members" locked={!founders && !keys[2]} done={!!keys[2]}>
        {!founders ? (
          <form onSubmit={unlockFounders} className="grid gap-3 max-w-sm">
            <p className="text-[14px] text-muted">Enter Key 1 to see the photo.</p>
            <input value={k1} onChange={(e) => setK1(e.target.value)} placeholder="Key 1" className={field} autoComplete="off" />
            <button disabled={!k1.trim() || busy === "f"} className={primary}>
              {busy === "f" ? "Checking…" : "Unlock"}
            </button>
            {msg.f && <p role="alert" className="text-[13px] text-red-dark">{msg.f}</p>}
          </form>
        ) : (
          <div>
            {founders.intro && <p className="text-[14px] text-muted mb-4 whitespace-pre-wrap">{founders.intro}</p>}
            {founders.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={founders.photoUrl} alt="The founding members, each numbered" className="w-full rounded-xl border border-gray-2 mb-5" />
            )}
            <p className="text-[14px] font-semibold text-text mb-1">Who are the founding members in this photo?</p>
            <p className="text-[13px] text-muted mb-3">
              Not everyone in the photo may be a founding member. Add a name for each founding member, as many as
              you need. You only pass when your list is exactly right.
            </p>
            <div className="grid gap-2 mb-3">
              {names.map((n, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 text-[13px] font-bold text-muted text-right">{i + 1}.</span>
                  <input
                    aria-label={`Founding member ${i + 1}`}
                    value={n}
                    disabled={listOk}
                    onChange={(e) => {
                      setNames(names.map((x, j) => (j === i ? e.target.value : x)));
                      setListOk(false);
                    }}
                    className={field}
                    autoComplete="off"
                    placeholder="Name"
                  />
                  {names.length > 1 && !listOk && (
                    <button
                      type="button"
                      aria-label={`Remove name ${i + 1}`}
                      onClick={() => { setNames(names.filter((_, j) => j !== i)); setListOk(false); }}
                      className="text-muted hover:text-red-dark text-[18px] px-2"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            {!listOk && (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setNames([...names, ""])}
                  disabled={names.length >= 40}
                  className="border border-gray-2 text-navy font-semibold text-[14px] px-5 py-2.5 rounded-xl hover:border-navy transition-colors"
                >
                  + Add another name
                </button>
                <button
                  type="button"
                  onClick={checkList}
                  disabled={busy === "n" || filledNames().length === 0}
                  className="border border-navy/30 text-navy font-semibold text-[14px] px-5 py-2.5 rounded-xl hover:bg-navy hover:text-white disabled:opacity-60 transition-colors"
                >
                  {busy === "n" ? "Checking…" : "Check my list"}
                </button>
              </div>
            )}
            {msg.n && (
              <p role="status" className={`text-[13px] mt-2 ${listOk ? "text-green-800 font-semibold" : "text-muted"}`}>
                {msg.n}
              </p>
            )}

            {listOk && (
            <form onSubmit={sendWord} className="mt-6 pt-5 border-t border-gray-2 grid gap-3 max-w-sm">
              <p className="text-[14px] text-muted whitespace-pre-wrap">
                {wordHint || "Use the names to work out the secret word."}
              </p>
              <input value={word} onChange={(e) => setWord(e.target.value)} placeholder="The word" className={field} autoComplete="off" />
              <button disabled={!word.trim() || busy === "w"} className={primary}>
                {busy === "w" ? "Checking…" : "Submit the word"}
              </button>
              {msg.w && <p role="alert" className="text-[13px] text-red-dark">{msg.w}</p>}
            </form>
            )}
          </div>
        )}
        {clue2 && (
          <>
            <p className="mt-4 text-[14px]">
              Key 2: <strong className="text-navy">{keys[2]}</strong>. Your clue for Game 3 is unlocked below.
            </p>
          </>
        )}
      </Step>

      <Step n={3} title="Clue for Game 3" locked={!clue2} done={!!clue2}>
        {clue2 ? (
          <ClueBox clue={clue2} />
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); unlockClue(2, k2); }}
            className="grid gap-3 max-w-sm"
          >
            <p className="text-[14px] text-muted">Already have Key 2? Enter it here.</p>
            <input value={k2} onChange={(e) => setK2(e.target.value)} placeholder="Key 2" className={field} autoComplete="off" />
            <button disabled={!k2.trim() || busy === "c2"} className={primary}>Unlock the clue</button>
            {msg.c2 && <p role="alert" className="text-[13px] text-red-dark">{msg.c2}</p>}
          </form>
        )}
      </Step>

      <Step n={4} title="Clue for Game 4" locked={!clue3} done={!!clue3}>
        {clue3 ? (
          <ClueBox clue={clue3} />
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); unlockClue(3, k3); }}
            className="grid gap-3 max-w-sm"
          >
            <p className="text-[14px] text-muted">Win Key 3 in the WhatsApp group, then enter it here.</p>
            <input value={k3} onChange={(e) => setK3(e.target.value)} placeholder="Key 3" className={field} autoComplete="off" />
            <button disabled={!k3.trim() || busy === "c3"} className={primary}>Unlock the clue</button>
            {msg.c3 && <p role="alert" className="text-[13px] text-red-dark">{msg.c3}</p>}
          </form>
        )}
      </Step>

      <Step n={5} title="The Chest" done={!!result}>
        {result ? (
          <div aria-live="polite" className="text-center">
            <p className="text-[48px]" aria-hidden="true">🎁</p>
            <p className="text-[13px] font-bold tracking-[2px] uppercase text-pink">
              {result.team} · finished #{result.place}
              {result.already ? " (opened before)" : ""}
            </p>
            <p className="text-[20px] font-extrabold text-navy mt-2 whitespace-pre-wrap">
              {result.reward || "Congratulations! You opened the chest."}
            </p>
          </div>
        ) : (
          <form onSubmit={chest} className="grid gap-3 max-w-md">
            <p className="text-[14px] text-muted">Enter your team name and all four keys, in order.</p>
            <input value={team} onChange={(e) => setTeam(e.target.value)} placeholder="Team name" maxLength={30} className={field} />
            <div className="grid grid-cols-2 gap-3">
              {boxes.map((b, i) => (
                <input
                  key={i}
                  aria-label={`Key ${i + 1}`}
                  placeholder={`Key ${i + 1}`}
                  value={b}
                  onChange={(e) => setBoxes(boxes.map((x, j) => (j === i ? e.target.value : x)))}
                  className={field}
                  autoComplete="off"
                />
              ))}
            </div>
            <button disabled={!team.trim() || boxes.some((b) => !b.trim()) || busy === "x"} className={primary}>
              {busy === "x" ? "Opening…" : "Open the chest"}
            </button>
            {msg.x && <p role="alert" className="text-[13px] text-red-dark">{msg.x}</p>}
          </form>
        )}

        {board.length > 0 && (
          <div className="mt-6 pt-5 border-t border-gray-2">
            <p className="text-[12px] font-bold tracking-[2px] uppercase text-muted mb-2">Teams that opened the chest</p>
            <ol className="grid gap-1">
              {board.map((b) => (
                <li key={b.place} className="flex justify-between text-[14px]">
                  <span><strong className="text-navy">{b.place}.</strong> {b.team}</span>
                  <span className="text-muted">{new Date(b.openedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </Step>

      {(keys[1] || keys[2] || keys[3] || keys[4]) && (
        <button
          type="button"
          onClick={() => {
            clearHuntKeys();
            window.location.reload();
          }}
          className="justify-self-center text-[13px] text-muted underline hover:text-navy"
        >
          Clear the keys saved on this device
        </button>
      )}
    </div>
  );
}
