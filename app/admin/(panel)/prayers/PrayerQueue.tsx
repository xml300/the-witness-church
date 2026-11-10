"use client";

import { useState, useTransition } from "react";
import { setPrayerStatus } from "./actions";

export type QueueItem = {
  id: string;
  text: string;
  category: string | null;
  status: "pending" | "approved";
  created_at: string;
};

function Card({
  r,
  pending,
  act,
}: {
  r: QueueItem;
  pending: boolean;
  act: (id: string, action: "approve" | "reject") => void;
}) {
  return (
    <li className="bg-white border border-gray-2 rounded-2xl p-5">
      <p className="text-[15px] text-text leading-relaxed whitespace-pre-wrap">{r.text}</p>
      <div className="flex flex-wrap items-center gap-3 mt-4">
        <span className="text-[12px] text-muted">
          {r.category ?? "Other"} · {new Date(r.created_at).toLocaleString("en-GB")}
        </span>
        <span className="ml-auto flex gap-2">
          {r.status === "pending" && (
            <button
              type="button"
              disabled={pending}
              onClick={() => act(r.id, "approve")}
              className="bg-red text-white text-[13px] font-semibold px-4 py-2 rounded-lg hover:bg-red-dark disabled:opacity-60"
            >
              Approve
            </button>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={() => act(r.id, "reject")}
            className="border border-gray-2 text-[13px] font-semibold px-4 py-2 rounded-lg text-text hover:border-red hover:text-red-dark disabled:opacity-60"
          >
            {r.status === "pending" ? "Reject" : "Remove from wall"}
          </button>
        </span>
      </div>
    </li>
  );
}

export default function PrayerQueue({ initial }: { initial: QueueItem[] }) {
  const [rows, setRows] = useState(initial);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function act(id: string, action: "approve" | "reject") {
    setError("");
    start(async () => {
      const r = await setPrayerStatus(id, action);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setRows((prev) =>
        action === "reject"
          ? prev.filter((x) => x.id !== id)
          : prev.map((x) => (x.id === id ? { ...x, status: "approved" } : x)),
      );
    });
  }

  const waiting = rows.filter((r) => r.status === "pending");
  const live = rows.filter((r) => r.status === "approved");

  return (
    <div className="space-y-10">
      {error && <p role="alert" className="text-red-dark text-[14px]">{error}</p>}
      <section>
        <h2 className="text-[12px] font-bold tracking-[2px] uppercase text-red mb-3">
          Waiting for review · {waiting.length}
        </h2>
        {waiting.length === 0 ? (
          <p className="text-muted">Nothing is waiting.</p>
        ) : (
          <ul className="grid gap-3">{waiting.map((r) => <Card key={r.id} r={r} pending={pending} act={act} />)}</ul>
        )}
      </section>
      <section>
        <h2 className="text-[12px] font-bold tracking-[2px] uppercase text-muted mb-3">
          On the wall · {live.length}
        </h2>
        {live.length === 0 ? (
          <p className="text-muted">No approved requests yet.</p>
        ) : (
          <ul className="grid gap-3">{live.map((r) => <Card key={r.id} r={r} pending={pending} act={act} />)}</ul>
        )}
      </section>
    </div>
  );
}
