"use client";

import { useState } from "react";
import { formatMedium } from "@/src/lib/content/events";
import type { SermonVideo } from "@/src/lib/data/types";

/* Thumbnails come straight from YouTube, so a plain img is used. */
/* eslint-disable @next/next/no-img-element */

const STEP = 12;

function Card({ v, pinned }: { v: SermonVideo; pinned?: boolean }) {
  return (
    <a
      href={v.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-white border border-gray-2 rounded-2xl overflow-hidden hover:border-red/40 hover:-translate-y-0.5 transition-all"
    >
      <div className="relative aspect-video bg-navy">
        <img
          src={v.thumb}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-12 h-12 rounded-full bg-red/95 flex items-center justify-center shadow-lg opacity-90 group-hover:scale-110 transition-transform">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white ml-0.5" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
        {pinned && (
          <span className="absolute top-3 left-3 bg-white/90 text-navy text-[10px] font-bold tracking-[1.5px] uppercase px-2.5 py-1 rounded-full">
            Pinned
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-[15px] font-semibold text-navy leading-snug line-clamp-2">
          {v.title}
        </h3>
        {v.date && (
          <p className="text-[12px] text-muted mt-1.5">{formatMedium(v.date)}</p>
        )}
      </div>
    </a>
  );
}

export default function SermonsBrowser({
  videos,
  pinned,
  channelUrl,
}: {
  videos: SermonVideo[];
  pinned: SermonVideo[];
  channelUrl: string;
}) {
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [shown, setShown] = useState(STEP);

  const q = query.trim().toLowerCase();
  // A single day is searched by setting only "From" or both fields to it.
  const lo = from && to && from > to ? to : from;
  const hi = from && to && from > to ? from : to;
  const dated = Boolean(lo || hi);
  const filtered = videos.filter(
    (v) =>
      (!q || v.title.toLowerCase().includes(q)) &&
      (!lo || (v.date && v.date >= lo)) &&
      (!hi || (v.date && v.date <= hi)),
  );
  const filtering = Boolean(q) || dated;
  const pinnedIds = pinned.map((p) => p.id);

  if (videos.length === 0 && pinned.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <p className="text-[16px] text-muted mb-6">
          Our messages live on YouTube. The full library will appear here as
          soon as our channel is connected.
        </p>
        <a
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-red text-white font-semibold text-[14px] px-7 py-3.5 rounded-xl hover:bg-red-dark transition-colors"
        >
          Watch on YouTube
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-16 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <p className="text-[14px] text-muted">
          {videos.length} message{videos.length === 1 ? "" : "s"} · opens on YouTube
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="sermon-search" className="block text-[11px] font-semibold text-muted mb-1">
              Search by title
            </label>
            <input
              id="sermon-search"
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShown(STEP);
              }}
              placeholder="Title or preacher"
              className="w-full sm:w-56 bg-white border border-gray-2 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:border-red/50 focus:ring-2 focus:ring-red/10"
            />
          </div>
          <div>
            <label htmlFor="sermon-from" className="block text-[11px] font-semibold text-muted mb-1">
              From date
            </label>
            <input
              id="sermon-from"
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setShown(STEP);
              }}
              className="bg-white border border-gray-2 rounded-xl px-3 py-2.5 text-[14px] focus:outline-none focus:border-red/50 focus:ring-2 focus:ring-red/10"
            />
          </div>
          <div>
            <label htmlFor="sermon-to" className="block text-[11px] font-semibold text-muted mb-1">
              To date
            </label>
            <input
              id="sermon-to"
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setShown(STEP);
              }}
              className="bg-white border border-gray-2 rounded-xl px-3 py-2.5 text-[14px] focus:outline-none focus:border-red/50 focus:ring-2 focus:ring-red/10"
            />
          </div>
          {(filtering) && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFrom("");
                setTo("");
                setShown(STEP);
              }}
              className="text-[13px] font-semibold text-red hover:text-red-dark pb-3"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {!filtering && pinned.length > 0 && (
        <section className="mb-12" aria-label="Pinned messages">
          <h2 className="text-[12px] font-bold tracking-[2px] uppercase text-red mb-4">
            Pinned messages
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pinned.map((v) => (
              <Card key={v.id} v={v} pinned />
            ))}
          </div>
        </section>
      )}

      <section aria-label="All messages">
        <h2 className="text-[12px] font-bold tracking-[2px] uppercase text-muted mb-4">
          {filtering
            ? `${filtered.length} result${filtered.length === 1 ? "" : "s"}`
            : "All messages"}
        </h2>
        {filtered.length === 0 ? (
          <p className="text-muted">
            No messages match that search. Dates come from the service date in
            each title, so try a wider range.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(0, shown).map((v) => (
              <Card key={v.id} v={v} pinned={pinnedIds.includes(v.id)} />
            ))}
          </div>
        )}
        {filtered.length > shown && (
          <div className="text-center mt-10">
            <button
              type="button"
              onClick={() => setShown((n) => n + STEP)}
              className="border border-navy/30 text-navy font-semibold text-[14px] px-7 py-3 rounded-xl hover:bg-navy hover:text-white transition-colors"
            >
              Show more
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
