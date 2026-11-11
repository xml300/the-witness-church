import GamePage from "@/src/components/games/GamePage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Year 2 Sermon Quiz" };

export default function Page() {
  return <GamePage game="sermon" />;
}
