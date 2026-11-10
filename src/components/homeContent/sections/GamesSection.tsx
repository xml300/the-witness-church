import { SectionTag, Heading, Subtext } from "@/src/components/ui/Typography";
import Link from "next/link";
import GameCard from "@/src/components/homeContent/cards/GameCard";
import { listGames } from "@/src/lib/content/games-list";
import { gameHref } from "@/src/lib/content/text";
import type { Game } from "@/src/lib/content/types";

export default function GamesSection({ games }: { games: Game[] }) {
  return (
    <section id="games" className="bg-[#0a0a0a] py-20 px-6 md:px-12 lg:px-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <SectionTag variant="light">Faith &amp; Fun</SectionTag>
            <Heading as="h2" light>
              Christian Games &amp;
              <br />
              Bible Challenges
            </Heading>
            <Subtext light>
              Grow your knowledge of the Word — learn, compete, and earn
              rewards with your church family.
            </Subtext>
          </div>
          <Link
            href="/games"
            className="text-[13px] text-white/60 hover:text-white font-medium transition-colors flex-shrink-0"
          >
            All Games →
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {listGames(games).map((game, i) => (
            <GameCard
              key={`${i}-${game.title}`}
              href={gameHref(game.title)}
              {...game}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
