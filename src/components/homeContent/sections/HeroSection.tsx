"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import type { HeroSlide, SiteInfo } from "@/src/lib/content/types";

export default function HeroSection({
  slides,
  info,
  autoplay = true,
}: {
  slides: HeroSlide[];
  info: SiteInfo;
  /** The editor preview holds still so it does not flicker while editing. */
  autoplay?: boolean;
}) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!autoplay || slides.length < 2) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [autoplay, slides.length]);

  const count = Math.max(slides.length, 1);
  const prev = () => setCurrent((c) => (c - 1 + count) % count);
  const next = () => setCurrent((c) => (c + 1) % count);

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden"
    >
      {/* Carousel backgrounds */}
      {slides.map((slide, i) => (
        <div
          key={`${i}-${slide.src}`}
          className={`absolute inset-0 bg-black transition-opacity duration-1000 ${i === current ? "opacity-100" : "opacity-0"}`}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            priority={i === 0}
            className="object-cover object-center"
            sizes="100vw"
          />
        </div>
      ))}

      {/* Dark overlay */}
      <div
        className="absolute inset-0 bg-black z-10"
        style={{ opacity: info.heroShade / 100 }}
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/20 z-10" />

      {/* Prev / Next arrows */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/15 border border-white/30 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5 fill-white"
          aria-hidden="true"
        >
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
        </svg>
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/15 border border-white/30 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5 fill-white"
          aria-hidden="true"
        >
          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
        </svg>
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-28 md:bottom-32 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? "w-6 h-1.5 bg-white"
                : "w-1.5 h-1.5 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>

      {/* Centered content */}
      <div className="relative z-20 w-full max-w-4xl mx-auto px-6 text-center pt-10 pb-44 md:pb-52">
        {/* Eyebrow pill */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
          <span className="w-2 h-2 rounded-full bg-red animate-pulse-dot" />
          <span className="text-[11px] font-bold tracking-[2.5px] uppercase text-white/80">
            <span data-edit="site_info.heroEyebrow">{info.heroEyebrow}</span>
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[80px] font-extrabold text-white leading-[1.04] tracking-tight mb-6">
          <span data-edit="site_info.heroLine1">{info.heroLine1}</span>{" "}
          <span className="text-red" data-edit="site_info.heroAccent">
            {info.heroAccent}
          </span>
          <br />
          <span data-edit="site_info.heroLine2">{info.heroLine2}</span>
        </h1>

        {/* Subtext */}
        <p className="text-white/60 text-[17px] leading-[1.75] mb-10 max-w-130 mx-auto">
          <span data-edit="site_info.heroSubtext">{info.heroSubtext}</span>
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href={info.primaryCtaHref}
            className="inline-flex items-center gap-2.5 bg-red text-white font-bold text-[14px] px-8 py-4 rounded-2xl hover:bg-red-dark transition-all duration-150 active:scale-95 shadow-xl shadow-red/25"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 fill-current"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            <span data-edit="site_info.primaryCtaLabel">{info.primaryCtaLabel}</span>
          </Link>
          <Link
            href={info.secondaryCtaHref}
            className="inline-flex items-center gap-2 border border-white/35 text-white font-semibold text-[14px] px-8 py-4 rounded-2xl hover:bg-white/10 transition-all duration-150"
          >
            <span data-edit="site_info.secondaryCtaLabel">{info.secondaryCtaLabel}</span>
          </Link>
        </div>
      </div>

      {/* Stats bar — pinned to bottom */}
      {/* <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="bg-black/40 backdrop-blur-md border-t border-white/10">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={`py-6 text-center ${i < stats.length - 1 ? "border-r border-white/10" : ""}`}
              >
                <div className="text-[30px] font-extrabold text-white tracking-tight mb-0.5">
                  {stat.value}
                </div>
                <div className="text-[10px] font-bold tracking-[2px] uppercase text-white/40">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div> */}
    </section>
  );
}
