import GamePage from "@/src/components/games/GamePage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Church Trivia" };

export default function Page() {
  return <GamePage game="hunt" />;
}
