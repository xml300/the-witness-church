import { SectionTag, Heading, Subtext } from "@/src/components/ui/Typography";
import ClipCard from "@/src/components/homeContent/cards/ClipCard";
import PlatformIcon from "@/src/components/shared/PlatformIcon";
import type { ClipsResult } from "@/src/lib/content/clips";

export default function SocialClipsSection({
  clips,
  followUrl,
}: {
  clips: ClipsResult;
  followUrl: string;
}) {
  return (
    <section id="clips" className="bg-gray-bg py-20 px-6 md:px-12 lg:px-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <SectionTag>Social Media Clips</SectionTag>
            <Heading as="h2">
              Bite-Sized Faith
              <br />
              for Every Day
            </Heading>
            <Subtext>
              The latest from our channels. Tap a post to open it where it
              lives.
            </Subtext>
          </div>
          {followUrl && (
            <a
              href={followUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-navy/60 hover:text-navy font-medium transition-colors flex-shrink-0"
            >
              Follow on Social →
            </a>
          )}
        </div>

        {clips.posts.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {clips.posts.map((clip, i) => (
              <ClipCard key={`${i}-${clip.url}`} {...clip} />
            ))}
          </div>
        )}

        {/* Channels with nothing to show yet get their icon, linking to the church page. */}
        {clips.icons.length > 0 && (
          <div className={clips.posts.length > 0 ? "mt-10" : ""}>
            <p className="text-[12px] font-bold tracking-[2px] uppercase text-muted mb-4 text-center">
              {clips.posts.length > 0 ? "Also find us on" : "Find us on"}
            </p>
            <ul className="flex flex-wrap justify-center gap-4">
              {clips.icons.map((i) => (
                <li key={i.platform}>
                  <a
                    href={i.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`The Witness Church on ${i.platform}`}
                    className="group flex flex-col items-center gap-2"
                  >
                    <span className="w-14 h-14 rounded-full bg-white border border-gray-2 text-navy flex items-center justify-center group-hover:bg-navy group-hover:text-white group-hover:border-navy transition-colors">
                      <PlatformIcon platform={i.platform} className="w-6 h-6" />
                    </span>
                    <span className="text-[12px] font-semibold text-muted group-hover:text-navy">
                      {i.platform}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {clips.posts.length === 0 && clips.icons.length === 0 && (
          <p className="bg-white border border-gray-2 rounded-2xl p-8 text-center text-muted">
            Add your social links in Site details and they appear here.
          </p>
        )}
      </div>
    </section>
  );
}
