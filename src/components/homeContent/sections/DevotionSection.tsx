"use client";

import { useState } from "react";
import { SectionTag, Heading } from "@/src/components/ui/Typography";
import { formatLong } from "@/src/lib/content/events";
import type { Devotion } from "@/src/lib/content/types";
import type { Verse } from "@/src/lib/data/types";

export default function DevotionSection({
  devotion,
  verse,
  today,
}: {
  devotion: Devotion;
  verse: Verse;
  today: string;
}) {
  const [menu, setMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const message = () =>
    `“${verse.text}”\n— ${verse.reference} (${verse.version})\n${window.location.origin}`;

  async function share() {
    const text = message();
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Verse of the day", text });
        return;
      } catch {
        // Cancelled or unsupported: fall through to the manual options.
      }
    }
    setMenu((open) => !open);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(message());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the other links still work */
    }
  }

  const enc = (s: string) => encodeURIComponent(s);
  const btn =
    "text-[12px] font-semibold px-4 py-2 rounded-full transition-all duration-150";

  return (
    <section id="devotion" className="bg-[#0a0a0a] py-20 px-6 md:px-12 lg:px-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <SectionTag variant="light">
              <span data-edit="devotion.tag">{devotion.tag}</span>
            </SectionTag>
            <Heading as="h2" light className="mt-1">
              <span data-edit="devotion.title">{devotion.title}</span>
            </Heading>
          </div>
          <a
            href={devotion.moreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] text-white/60 hover:text-white font-medium transition-colors flex-shrink-0"
          >
            {devotion.moreLabel} →
          </a>
        </div>

        <figure className="bg-white/5 border border-white/10 rounded-2xl p-7 md:p-10">
          <p className="text-[10px] font-bold tracking-[2px] uppercase text-white/45 mb-5">
            {formatLong(today)}
          </p>
          <blockquote className="border-l-[3px] border-red pl-5 md:pl-7">
            <p className="font-playfair italic text-[20px] md:text-[26px] text-white/90 leading-relaxed">
              &ldquo;{verse.text}&rdquo;
            </p>
            <figcaption className="text-red text-[13px] font-semibold mt-4 tracking-wide">
              {verse.reference} · {verse.version}
            </figcaption>
          </blockquote>

          <div className="relative mt-8 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={share}
              aria-expanded={menu}
              className={`${btn} bg-red text-white hover:bg-red-dark`}
            >
              ↗ Share
            </button>
            {menu && (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Share options">
                <a
                  className={`${btn} border border-white/25 text-white/80 hover:bg-white/10`}
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://wa.me/?text=${enc(`“${verse.text}” — ${verse.reference} (${verse.version})`)}`}
                >
                  WhatsApp
                </a>
                <a
                  className={`${btn} border border-white/25 text-white/80 hover:bg-white/10`}
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://twitter.com/intent/tweet?text=${enc(`“${verse.text}” — ${verse.reference}`)}`}
                >
                  X
                </a>
                <button
                  type="button"
                  onClick={copy}
                  className={`${btn} border border-white/25 text-white/80 hover:bg-white/10`}
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            )}
          </div>
        </figure>
      </div>
    </section>
  );
}
