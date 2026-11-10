import GamePage, { gameMetadata } from "@/src/components/games/GamePage";

export const dynamic = "force-dynamic";
export const metadata = gameMetadata("quiz");

export default function Page() {
  return <GamePage game="quiz" />;
}
