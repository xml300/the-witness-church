"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  coversDay,
  eventsInYear,
  formatRange,
  lastDay,
  tagStyleFor,
  type EventOccurrence,
} from "@/src/lib/content/events";
import type { ChurchEvent } from "@/src/lib/content/types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

const REPEAT_LABEL: Record<string, string> = {
  daily: "Repeats every day",
  weekly: "Repeats every week",
  biweekly: "Repeats every two weeks",
  monthly: "Repeats every month",
  yearly: "Repeats every year",
};

/** Set only inside the admin editor: days and events become clickable. */
export type CalendarEditing = {
  onDay?: (date: string) => void;
  onEvent?: (index: number) => void;
};

export default function EventsCalendar({
  events,
  today,
  editing,
}: {
  events: ChurchEvent[];
  today: string;
  editing?: CalendarEditing;
}) {
  const [view, setView] = useState({
    y: Number(today.slice(0, 4)),
    m: Number(today.slice(5, 7)) - 1,
  });
  const [selected, setSelected] = useState<string | null>(null);

  // Every showing in the viewed year, repeating events included.
  const yearOcc = useMemo(() => eventsInYear(events, view.y), [events, view.y]);

  const { cells, monthPrefix } = useMemo(() => {
    const startDow = new Date(Date.UTC(view.y, view.m, 1)).getUTCDay();
    const dim = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
    const cells: (number | null)[] = [
      ...Array<null>(startDow).fill(null),
      ...Array.from({ length: dim }, (_, i) => i + 1),
    ];
    while (cells.length % 7) cells.push(null);
    return { cells, monthPrefix: `${view.y}-${pad(view.m + 1)}` };
  }, [view]);

  const go = (delta: number) =>
    setView((v) => {
      const d = new Date(Date.UTC(v.y, v.m + delta, 1));
      return { y: d.getUTCFullYear(), m: d.getUTCMonth() };
    });

  const dayEvents = (d: string) => yearOcc.filter((o) => coversDay(o, d));
  const chosen = selected ? dayEvents(selected) : [];

  // The yearly list shows a repeating event once, with how it repeats,
  // instead of one row for every showing.
  const listed: EventOccurrence[] = [];
  const seen = new Set<number>();
  for (const o of yearOcc) {
    if (o.repeat && o.repeat !== "none") {
      if (seen.has(o.index)) continue;
      seen.add(o.index);
    }
    listed.push(o);
  }
  const byMonth = MONTHS.map((name, m) => ({
    name,
    m,
    items: listed.filter((e) => {
      const key = `${view.y}-${pad(m + 1)}`;
      return e.date.slice(0, 7) <= key && key <= lastDay(e).slice(0, 7);
    }),
  })).filter((g) => g.items.length);

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-16 py-12">
      {editing && (
        <p className="mb-4 rounded-xl bg-pink-light px-4 py-3 text-[13px] text-navy">
          Editing: click a day to add an event on it, or click an event to
          change it.
        </p>
      )}

      <div className="bg-white border border-gray-2 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <h2 className="text-2xl font-bold text-navy">
            {MONTHS[view.m]} {view.y}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => go(-12)}
              className="border border-gray-2 rounded-lg px-2.5 py-1.5 text-[12px] text-muted hover:text-navy hover:border-navy"
              aria-label="Previous year"
            >
              « {view.y - 1}
            </button>
            <button
              type="button"
              onClick={() => go(-1)}
              className="border border-gray-2 rounded-lg w-9 h-9 text-navy hover:border-navy"
              aria-label="Previous month"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => {
                setView({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 });
                setSelected(editing ? null : today);
              }}
              className="border border-gray-2 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-navy hover:border-navy"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="border border-gray-2 rounded-lg w-9 h-9 text-navy hover:border-navy"
              aria-label="Next month"
            >
              ›
            </button>
            <button
              type="button"
              onClick={() => go(12)}
              className="border border-gray-2 rounded-lg px-2.5 py-1.5 text-[12px] text-muted hover:text-navy hover:border-navy"
              aria-label="Next year"
            >
              {view.y + 1} »
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-2 border border-gray-2 rounded-xl overflow-hidden">
          {DAYS.map((d) => (
            <div key={d} className="bg-gray-bg text-center text-[11px] font-bold tracking-wider uppercase text-muted py-2">
              {d}
            </div>
          ))}
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={i} className="bg-gray-bg/60 min-h-[56px] sm:min-h-[92px]" />;
            }
            const d = iso(view.y, view.m, day);
            const list = dayEvents(d);
            const isToday = d === today;
            const isSel = d === selected;
            const label = `${day} ${MONTHS[view.m]}${list.length ? `, ${list.length} event${list.length > 1 ? "s" : ""}` : ""}`;
            const cellClass = `bg-white text-left p-1.5 sm:p-2 min-h-[56px] sm:min-h-[92px] flex flex-col gap-1 transition-colors ${
              editing ? "cursor-copy hover:bg-pink-light/60" : "hover:bg-pink-light/40"
            } ${isSel ? "ring-2 ring-inset ring-red" : ""}`;

            const inner = (
              <>
                <span
                  className={`text-[12px] font-semibold w-6 h-6 inline-flex items-center justify-center rounded-full ${
                    isToday ? "bg-red text-white" : "text-text"
                  }`}
                >
                  {day}
                </span>
                {/* Wide screens: titles. Phones: dots. */}
                <span className="hidden sm:flex flex-col gap-1">
                  {list.slice(0, 2).map((o, k) => {
                    const chip = `truncate rounded px-1.5 py-0.5 text-[10.5px] font-semibold text-left ${
                      d < today ? "bg-gray-2 text-muted" : "bg-red/10 text-red-dark"
                    }`;
                    return editing?.onEvent ? (
                      <button
                        key={k}
                        type="button"
                        className={`${chip} cursor-pointer hover:bg-red/20`}
                        onClick={(e) => {
                          e.stopPropagation();
                          editing.onEvent?.(o.index);
                        }}
                      >
                        {o.title}
                      </button>
                    ) : (
                      <span key={k} className={chip}>
                        {o.title}
                      </span>
                    );
                  })}
                  {list.length > 2 && (
                    <span className="text-[10.5px] text-muted px-1">+{list.length - 2} more</span>
                  )}
                </span>
                {list.length > 0 && (
                  <span className="flex gap-0.5 sm:hidden">
                    {list.slice(0, 3).map((_, k) => (
                      <span key={k} className="w-1.5 h-1.5 rounded-full bg-red" />
                    ))}
                  </span>
                )}
              </>
            );

            // In the editor a day is a click target that holds event buttons,
            // so it cannot itself be a button.
            return editing ? (
              <div
                key={i}
                role="button"
                tabIndex={0}
                aria-label={`Add an event on ${label}`}
                onClick={() => editing.onDay?.(d)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    editing.onDay?.(d);
                  }
                }}
                className={cellClass}
              >
                {inner}
              </div>
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => setSelected(isSel ? null : d)}
                aria-pressed={isSel}
                aria-label={label}
                className={cellClass}
              >
                {inner}
              </button>
            );
          })}
        </div>

        {selected && !editing && (
          <div className="mt-5 border-t border-gray-2 pt-5" aria-live="polite">
            {chosen.length === 0 ? (
              <p className="text-muted text-[14px]">No events on this day.</p>
            ) : (
              <ul className="grid gap-3">
                {chosen.map((e, i) => (
                  <li key={i}>
                    <EventRow event={e} past={lastDay(e) < today} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <h2 className="text-2xl font-bold text-navy mt-14 mb-6">Events in {view.y}</h2>
      {byMonth.length === 0 ? (
        <p className="text-muted">No events are listed for {view.y} yet.</p>
      ) : (
        <div className="space-y-10">
          {byMonth.map((g) => (
            <section key={g.m} aria-labelledby={`m-${g.m}`}>
              <h3
                id={`m-${g.m}`}
                className={`text-[12px] font-bold tracking-[2px] uppercase mb-3 ${
                  `${view.y}-${pad(g.m + 1)}` === monthPrefix ? "text-red" : "text-muted"
                }`}
              >
                {g.name}
              </h3>
              <ul className="grid gap-3">
                {g.items.map((e, i) => (
                  <li key={`${g.m}-${i}`}>
                    <EventRow
                      event={e}
                      past={lastDay(e) < today}
                      onEdit={editing?.onEvent ? () => editing.onEvent?.(e.index) : undefined}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function EventRow({
  event: e,
  past,
  onEdit,
}: {
  event: EventOccurrence;
  past: boolean;
  onEdit?: () => void;
}) {
  const body = (
    <>
      {e.image && (
        <div className="relative w-24 h-24 sm:w-32 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-2">
          <Image src={e.image} alt="" fill className="object-cover" sizes="128px" />
        </div>
      )}
      <div className="min-w-0 text-left">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className={`text-[10px] font-bold tracking-[1px] uppercase px-2.5 py-0.5 rounded-full ${tagStyleFor(e.category)}`}>
            {e.category}
          </span>
          {e.pinned === "yes" && (
            <span className="text-[10px] font-bold tracking-[1px] uppercase text-red">Featured</span>
          )}
          {REPEAT_LABEL[e.repeat] && (
            <span className="text-[10px] font-bold tracking-[1px] uppercase text-muted">
              {REPEAT_LABEL[e.repeat]}
              {e.repeatUntil ? ` until ${e.repeatUntil}` : ""}
            </span>
          )}
          {past && <span className="text-[10px] font-bold tracking-[1px] uppercase text-muted">Past</span>}
        </div>
        <h4 className="text-[16px] font-bold text-navy leading-snug">{e.title}</h4>
        <p className="text-[13px] text-muted mt-1">
          {formatRange(e)}
          {e.time ? ` · ${e.time}` : ""}
          {e.place ? ` · ${e.place}` : ""}
        </p>
        {e.description && (
          <p className="text-[14px] text-text/80 mt-2 leading-relaxed">{e.description}</p>
        )}
      </div>
    </>
  );
  const cls = `flex gap-4 bg-white border border-gray-2 rounded-2xl p-4 w-full ${past ? "opacity-70" : ""}`;
  return onEdit ? (
    <button type="button" onClick={onEdit} className={`${cls} cursor-pointer hover:border-red/40`}>
      {body}
    </button>
  ) : (
    <article className={cls}>{body}</article>
  );
}
