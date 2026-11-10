import Link from "next/link";
import AboutView from "@/src/components/pages/AboutView";
import ConnectView from "@/src/components/pages/ConnectView";
import EventsCalendar from "@/src/components/pages/EventsCalendar";
import PageShell, { PageHeader } from "@/src/components/pages/PageShell";
import SermonsBrowser from "@/src/components/pages/SermonsBrowser";
import SiteView, { type EditorView } from "@/src/components/content/SiteView";
import type { PageId } from "@/src/lib/content/pages";
import { watchUrl } from "@/src/lib/content/nav";
import { resolvePinned } from "@/src/lib/content/sermons";
import { listGames } from "@/src/lib/content/games-list";
import { gameHref } from "@/src/lib/content/text";
import type { SiteContent } from "@/src/lib/content/types";
import type { SiteData } from "@/src/lib/data/types";

/** Any page of the site as a pure function of its content and data. The
 *  public routes and the editor preview both render through this. */
export default function PageView({
  page,
  content,
  data,
  editor,
}: {
  page: PageId;
  content: SiteContent;
  data: SiteData;
  editor?: EditorView;
}) {
  if (page === "home") {
    return <SiteView content={content} data={data} editor={editor} />;
  }

  const info = content.site_info;
  let body;
  if (page === "about") {
    body = <AboutView content={content} />;
  } else if (page === "connect") {
    body = <ConnectView content={content} />;
  } else if (page === "events") {
    body = (
      <>
        <PageHeader
          tag="Celebrations & events"
          title="Church Calendar"
          intro="Everything we have celebrated and everything coming up this year."
        />
        <EventsCalendar
          events={content.events}
          today={data.today}
          editing={
            editor
              ? { onDay: editor.onDay, onEvent: editor.onEvent }
              : undefined
          }
        />
      </>
    );
  } else if (page === "sermons") {
    body = (
      <>
        <PageHeader
          tag="Audio & video messages"
          title="Sermon Library"
          intro="Every message from The Witness Church, straight from our YouTube channel."
        />
        <SermonsBrowser
          videos={data.library}
          pinned={resolvePinned(content.pinned_sermons, data.library)}
          channelUrl={info.socialYoutube || watchUrl(content, data)}
        />
      </>
    );
  } else {
    body = (
      <>
        <PageHeader
          tag="Faith & fun"
          title="Games & Bible Challenges"
          intro="Learn, compete and grow in the Word with your church family."
        />
        <div className="max-w-5xl mx-auto px-6 md:px-12 lg:px-16 py-12 grid gap-5 sm:grid-cols-2">
          {listGames(content.games).map((g, i) => (
            <Link
              key={`${i}-${g.title}`}
              href={gameHref(g.title)}
              className="flex gap-4 items-start bg-white border border-gray-2 rounded-2xl p-6 hover:border-red/40 hover:-translate-y-0.5 transition-all"
            >
              <span className="text-4xl" aria-hidden="true">{g.emoji}</span>
              <span>
                <span className="block text-[17px] font-bold text-navy">{g.title}</span>
                <span className="block text-[14px] text-muted mt-1">{g.description}</span>
                <span className="block text-[12px] font-semibold text-red mt-3">Play →</span>
              </span>
            </Link>
          ))}
        </div>
      </>
    );
  }
  return (
    <PageShell content={content} data={data}>
      {body}
    </PageShell>
  );
}
