"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SectionTag, Heading } from "@/src/components/ui/Typography";
import AnnouncementCard from "@/src/components/homeContent/cards/AnnouncementCard";
import {
  formatRange,
  formatShort,
  pickAnnouncements,
  tagStyleFor,
} from "@/src/lib/content/events";
import type { ChurchEvent } from "@/src/lib/content/types";

export default function AnnouncementsSection({
  events,
  today,
}: {
  events: ChurchEvent[];
  today: string;
}) {
  const { items, fallback } = pickAnnouncements(events, today);
  const [activeIdx, setActiveIdx] = useState(0);
  const active = items[activeIdx] ?? items[0];

  return (
    <section id="events" className="bg-gray-bg py-20 px-6 md:px-12 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <SectionTag>{fallback ? "Coming up" : "This week & pinned"}</SectionTag>
            <Heading as="h2">
              What&apos;s Happening
              <br />
              at Witness
            </Heading>
          </div>
          <Link
            href="/events"
            className="text-[13px] text-navy/60 hover:text-navy font-medium transition-colors flex-shrink-0"
          >
            Full Calendar →
          </Link>
        </div>

        {!active ? (
          <p className="bg-white border border-gray-2 rounded-2xl p-8 text-center text-muted">
            No upcoming events yet. Check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-5">
            <div className="flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
              {items.map((ev, idx) => (
                <div key={`${idx}-${ev.title}`} className="min-w-[220px] md:min-w-0">
                  <AnnouncementCard
                    date={`${formatShort(ev.date)}${ev.time ? ` · ${ev.time}` : ""}`}
                    title={ev.title}
                    tag={ev.category}
                    tagStyle={tagStyleFor(ev.category)}
                    active={activeIdx === idx}
                    onClick={() => setActiveIdx(idx)}
                  />
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-2">
              <div className="relative h-[200px] bg-gradient-to-br from-navy to-navy-deep">
                {active.image && (
                  <Image
                    src={active.image}
                    alt={active.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 66vw"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              <div className="p-7">
                <span className="inline-block bg-red text-white text-[10px] font-bold tracking-[1px] uppercase px-3 py-1 rounded-full mb-4">
                  {active.category}
                </span>
                <h3 className="font-playfair text-[22px] font-bold text-navy mb-3 leading-snug">
                  {active.title}
                </h3>
                <p className="text-[14px] text-muted leading-relaxed mb-6">
                  {active.description}
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5 border-t border-gray-2">
                  <div className="flex flex-wrap gap-4">
                    <span className="flex items-center gap-1.5 text-[12px] text-muted">
                      📅 {formatRange(active)}
                    </span>
                    {active.time && (
                      <span className="flex items-center gap-1.5 text-[12px] text-muted">
                        🕘 {active.time}
                      </span>
                    )}
                    {active.place && (
                      <span className="flex items-center gap-1.5 text-[12px] text-muted">
                        📍 {active.place}
                      </span>
                    )}
                  </div>
                  <Link
                    href="/events"
                    className="flex-shrink-0 bg-red text-white text-[12px] font-semibold px-5 py-2.5 rounded-lg hover:bg-red-dark transition-colors text-center"
                  >
                    See on the calendar
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
