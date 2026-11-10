import Image from "next/image";
import { PageHeader } from "@/src/components/pages/PageShell";
import type { SiteContent } from "@/src/lib/content/types";

const SOCIALS: { key: keyof SiteContent["site_info"]; label: string; note: string }[] = [
  { key: "socialYoutube", label: "YouTube", note: "Sermons and live services" },
  { key: "socialFacebook", label: "Facebook", note: "News and community" },
  { key: "socialInstagram", label: "Instagram", note: "Photos and moments" },
  { key: "socialTiktok", label: "TikTok", note: "Short clips" },
  { key: "socialX", label: "X", note: "Updates" },
];

export default function AboutView({ content }: { content: SiteContent }) {
  const { about, site_info: info } = content;
  const socials = SOCIALS.filter((s) => info[s.key]);

  return (
    <>
      <PageHeader tag="Who we are" title={about.heading} intro={about.intro} />

      <section className="px-6 md:px-12 lg:px-16 py-16">
        <div className="max-w-5xl mx-auto grid gap-10 md:grid-cols-2 items-center">
          <div className="text-[16px] leading-[1.8] text-text whitespace-pre-line">
            {about.story}
          </div>
          {about.photo && (
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-bg">
              <Image
                src={about.photo}
                alt={`${info.churchName} community`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          )}
        </div>
      </section>

      <section className="bg-gray-bg px-6 md:px-12 lg:px-16 py-16">
        <div className="max-w-5xl mx-auto grid gap-5 md:grid-cols-2">
          <div className="bg-white border border-gray-2 rounded-2xl p-8">
            <p className="text-[11px] font-bold tracking-[2px] uppercase text-red mb-3">
              Our mission
            </p>
            <p className="text-[18px] leading-relaxed text-navy font-semibold">
              {about.mission}
            </p>
          </div>
          <div className="bg-white border border-gray-2 rounded-2xl p-8">
            <p className="text-[11px] font-bold tracking-[2px] uppercase text-red mb-3">
              Our vision
            </p>
            <p className="text-[18px] leading-relaxed text-navy font-semibold">
              {about.vision}
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-12 lg:px-16 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-navy mb-2">Find us online</h2>
          <p className="text-muted mb-8">
            Follow along on any of our channels.
          </p>
          {socials.length === 0 ? (
            <p className="text-muted">Our social channels are coming soon.</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {socials.map((s) => (
                <li key={s.key}>
                  <a
                    href={info[s.key] as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white border border-gray-2 rounded-2xl p-6 hover:border-red/40 hover:-translate-y-0.5 transition-all"
                  >
                    <span className="block text-[17px] font-bold text-navy">
                      {s.label}
                    </span>
                    <span className="block text-[13px] text-muted mt-1">
                      {s.note}
                    </span>
                    <span className="block text-[12px] font-semibold text-red mt-4">
                      Open {s.label} →
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
