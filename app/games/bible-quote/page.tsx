import GamePage, { gameMetadata } from "@/src/components/games/GamePage";

export const dynamic = "force-dynamic";
export const metadata = gameMetadata("quote");

export default function Page() {
  return <GamePage game="quote" />;
}
