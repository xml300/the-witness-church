import { notFound, redirect } from "next/navigation";
import PageShell, { PageHeader } from "@/src/components/pages/PageShell";
import GameClient from "@/src/components/games/GameClient";
import { gamePath, roomPath } from "@/src/components/games/util";
import { getContent } from "@/src/lib/content/get-content";
import { getSiteData } from "@/src/lib/data/site-data";
import { getRoom, poolCounts } from "@/src/lib/games/service";
import { GAMES, type GameId } from "@/src/lib/games/types";
import { huntStatus } from "@/src/lib/hunt/service";
import { gamesConfigured } from "@/src/lib/supabase/service";

const INTRO: Record<GameId, { tag: string; intro: string }> = {
  quiz: {
    tag: "Faith & fun",
    intro: "Test what you know about the Bible. Pick a level, beat the clock and climb the leaderboard.",
  },
  quote: {
    tag: "Faith & fun",
    intro: "Fill in the missing words, or write the whole verse from memory. How well do you know the Word?",
  },
  hunt: {
    tag: "Treasure hunt · Game 1",
    intro: "How well do you know The Witness Church? Reach the pass mark to win Key 1.",
  },
};

/** Server wrapper for a game page, or for a room of that game. */
export default async function GamePage({ game, code }: { game: GameId; code?: string }) {
  const [content, meta] = [await getContent(), GAMES[game]];
  const data = await getSiteData(content);

  let body;
  if (!gamesConfigured) {
    body = (
      <p className="max-w-xl mx-auto text-center text-muted py-16 px-6">
        This game is not switched on yet. Please check back soon.
      </p>
    );
  } else {
    const hunt = game === "hunt" ? await huntStatus() : null;
    const room = code && game !== "hunt" ? await getRoom(code) : null;
    if (code && !room) notFound();
    if (room && room.game !== game) redirect(roomPath(room.game, room.code));
    const counts = await poolCounts(game);
    body = (
      <div className="max-w-5xl mx-auto px-6 md:px-12 py-10 md:py-14">
        <GameClient
          game={game}
          counts={counts}
          room={room}
          hunt={hunt ? { passMark: hunt.passMark, window: hunt.window, opensAt: hunt.opensAt, closesAt: hunt.closesAt } : null}
        />
      </div>
    );
  }

  return (
    <PageShell content={content} data={data}>
      <PageHeader
        tag={code ? `Room ${code.toUpperCase()}` : INTRO[game].tag}
        title={meta.title}
        intro={code ? "You were invited to play. Enter your name to join the room." : INTRO[game].intro}
      />
      {body}
    </PageShell>
  );
}

export function gameMetadata(game: GameId) {
  return {
    title: GAMES[game].title,
    description: INTRO[game].intro,
    alternates: { canonical: gamePath(game) },
  };
}
