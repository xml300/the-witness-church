import Link from "next/link";
import { SectionTag, Heading } from "@/src/components/ui/Typography";
import { formatMedium } from "@/src/lib/content/events";
import type { SermonVideo } from "@/src/lib/data/types";

/* Thumbnails come straight from YouTube, so a plain img is used. */
/* eslint-disable @next/next/no-img-element */

export default function SermonsSection({
  sermons,
  pinnedIds,
  channelUrl,
}: {
  sermons: SermonVideo[];
  pinnedIds: string[];
  channelUrl: string;
}) {
  const [featured, ...rest] = sermons;

  return (
    <section id="sermons" className="bg-white py-20 px-6 md:px-12 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <SectionTag>Audio &amp; Video Messages</SectionTag>
            <Heading as="h2">
              Messages That
              <br />
              Move You Forward
            </Heading>
          </div>
          <Link
            href="/sermons"
            className="text-[13px] text-navy/60 hover:text-navy font-medium transition-colors flex-shrink-0"
          >
            All Sermons →
          </Link>
        </div>

        {!featured ? (
          <div className="bg-gray-bg border border-gray-2 rounded-2xl p-10 text-center">
            <p className="text-muted mb-4">
              Our messages are on YouTube. Watch the latest there while the
              sermon library is being set up.
            </p>
            <a
              href={channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-red text-white font-semibold text-[13px] px-6 py-3 rounded-xl hover:bg-red-dark transition-colors"
            >
              Watch on YouTube
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5">
            <a
              href={featured.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block rounded-2xl overflow-hidden bg-navy min-h-[280px]"
            >
              <img
                src={featured.thumb}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-16 h-16 rounded-full bg-red flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white ml-1" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </span>
              <span className="absolute bottom-0 left-0 right-0 p-6">
                {pinnedIds.includes(featured.id) && (
                  <span className="inline-block bg-white/15 backdrop-blur text-white text-[10px] font-bold tracking-[1.5px] uppercase px-3 py-1 rounded-full mb-3">
                    Pinned
                  </span>
                )}
                <span className="block font-playfair text-[22px] md:text-[26px] font-bold text-white leading-snug">
                  {featured.title}
                </span>
                {featured.date && (
                  <span className="block text-[12px] text-white/65 mt-2">
                    {formatMedium(featured.date)}
                  </span>
                )}
              </span>
            </a>

            <div className="flex flex-col gap-3">
              {rest.map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex gap-4 items-center bg-gray-bg border border-gray-2 rounded-2xl p-3 hover:border-red/40 transition-colors"
                >
                  <img
                    src={s.thumb}
                    alt=""
                    className="w-28 aspect-video object-cover rounded-xl flex-shrink-0"
                  />
                  <span className="min-w-0">
                    {pinnedIds.includes(s.id) && (
                      <span className="block text-[10px] font-bold tracking-[1.5px] uppercase text-red mb-1">
                        Pinned
                      </span>
                    )}
                    <span className="block text-[14px] font-semibold text-navy leading-snug line-clamp-2">
                      {s.title}
                    </span>
                    {s.date && (
                      <span className="block text-[12px] text-muted mt-1">
                        {formatMedium(s.date)}
                      </span>
                    )}
                  </span>
                </a>
              ))}
              <Link
                href="/sermons"
                className="text-center text-[13px] font-semibold text-red hover:text-red-dark transition-colors pt-2"
              >
                Browse the full sermon library →
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
