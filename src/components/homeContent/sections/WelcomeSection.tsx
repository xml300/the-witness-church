import Image from "next/image";
import Link from "next/link";
import { SectionTag, Heading, Subtext } from "@/src/components/ui/Typography";
import type { SiteInfo, WelcomeCard } from "@/src/lib/content/types";

export default function WelcomeSection({
  cards,
  info,
}: {
  cards: WelcomeCard[];
  info: SiteInfo;
}) {
  return (
    <section id="community" className="bg-white py-20 px-6 md:px-12 lg:px-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <SectionTag>
            <span data-edit="site_info.welcomeTag">{info.welcomeTag}</span>
          </SectionTag>
          <Heading as="h2" className="mb-2">
            <span data-edit="site_info.welcomeTitle">{info.welcomeTitle}</span>
          </Heading>
          <Subtext>
            <span data-edit="site_info.welcomeSubtext">{info.welcomeSubtext}</span>
          </Subtext>
        </div>

        {/* 3-column card grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {cards.map((card, i) => (
            <Link
              key={`${i}-${card.title}`}
              href={card.href}
              className="group relative rounded-2xl overflow-hidden h-[360px] md:h-[420px] block"
            >
              {/* Image */}
              <Image
                src={card.image}
                alt={card.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/5 group-hover:from-black/70 transition-all duration-300" />

              {/* Top accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${card.accent}`} />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-7">
                <p className="text-[10px] font-bold tracking-[2.5px] uppercase text-white/65 mb-2">
                  <span data-edit={`welcome_cards.${i}.label`}>{card.label}</span>
                </p>
                <h3 className="font-playfair text-[22px] font-semibold text-white mb-4 leading-snug">
                  <span data-edit={`welcome_cards.${i}.title`}>{card.title}</span>
                </h3>
                <div className="flex items-center gap-2 text-[12px] font-semibold text-white/80 group-hover:text-white transition-colors">
                  <span>{card.cta}</span>
                  <span className="transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
