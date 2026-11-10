import type { ReactNode } from "react";
import Navbar from "@/src/components/shared/Navbar";
import Footer from "@/src/components/shared/Footer";
import HeroSection from "@/src/components/homeContent/sections/HeroSection";
import WelcomeSection from "@/src/components/homeContent/sections/WelcomeSection";
import DevotionSection from "@/src/components/homeContent/sections/DevotionSection";
import AnnouncementsSection from "@/src/components/homeContent/sections/AnnouncementsSection";
import SermonsSection from "@/src/components/homeContent/sections/SermonsSection";
import SocialClipsSection from "@/src/components/homeContent/sections/SocialClipsSection";
import GamesSection from "@/src/components/homeContent/sections/GamesSection";
import PrayerWallSection from "@/src/components/homeContent/sections/PrayerWallSection";
import { buildClips } from "@/src/lib/content/clips";
import { navProps, watchUrl } from "@/src/lib/content/nav";
import { SECTION_DEFS } from "@/src/lib/content/sections";
import { pickSermons } from "@/src/lib/content/sermons";
import type { SiteContent } from "@/src/lib/content/types";
import type { SiteData } from "@/src/lib/data/types";

/** When set, sections are wrapped with the markers the admin editor uses to
 *  highlight and select them. The public site never passes this. */
export type EditorView = {
  selected: string | null;
  /** Events page: the admin clicked an empty day. */
  onDay?: (date: string) => void;
  /** Events page: the admin clicked an existing event. */
  onEvent?: (index: number) => void;
};

const label = (id: string) =>
  SECTION_DEFS.find((d) => d.id === id)?.label ?? id;

/** The whole homepage as a pure function of its content. Used by the public
 *  site and by the editor's live preview, so they cannot drift apart. */
export default function SiteView({
  content: c,
  data,
  editor,
}: {
  content: SiteContent;
  data: SiteData;
  editor?: EditorView;
}) {
  const info = c.site_info;
  const pinnedIds = c.pinned_sermons.map((p) => p.videoId);
  const followUrl =
    info.socialInstagram ||
    info.socialFacebook ||
    info.socialYoutube ||
    info.socialTiktok ||
    info.socialX;

  const render: Record<string, ReactNode> = {
    hero: <HeroSection slides={c.hero_slides} info={info} autoplay={!editor} />,
    welcome: <WelcomeSection cards={c.welcome_cards} info={info} />,
    devotion: (
      <DevotionSection devotion={c.devotion} verse={data.verse} today={data.today} />
    ),
    announcements: <AnnouncementsSection events={c.events} today={data.today} />,
    sermons: (
      <SermonsSection
        sermons={pickSermons(c.pinned_sermons, data.library)}
        pinnedIds={pinnedIds}
        channelUrl={info.socialYoutube || watchUrl(c, data)}
      />
    ),
    clips: (
      <SocialClipsSection
        clips={buildClips(c.clips, data.social, data.clipMeta, info)}
        followUrl={followUrl}
      />
    ),
    games: <GamesSection games={c.games} />,
    prayer: (
      <PrayerWallSection
        prayer={c.prayer}
        prayers={data.prayers}
        pastorEnabled={data.pastorEnabled}
        preview={Boolean(editor)}
      />
    ),
  };


  return (
    <>
      <Navbar {...navProps(c, data)} />
      <main>
        {c.sections.map((s) => {
          if (!editor) {
            if (!s.visible) return null;
            return (
              <div key={s.id} style={{ display: "contents" }}>
                {render[s.id]}
              </div>
            );
          }
          if (!s.visible) {
            return (
              <button
                key={s.id}
                type="button"
                className="ed-hidden"
                data-act="show"
                data-id={s.id}
              >
                <span>{label(s.id)} is hidden from visitors</span>
                <span>Show</span>
              </button>
            );
          }
          const selected = editor.selected === s.id;
          return (
            <div
              key={s.id}
              data-sec={s.id}
              data-label={label(s.id)}
              className={selected ? "ed-sel" : undefined}
              style={{ position: "relative" }}
            >
              {selected && (
                <div className="ed-bar">
                  <button type="button" data-act="hide" data-id={s.id}>
                    Hide
                  </button>
                </div>
              )}
              {render[s.id]}
            </div>
          );
        })}
      </main>
      <Footer info={info} />
    </>
  );
}
