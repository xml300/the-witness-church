import GamePage from "@/src/components/games/GamePage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Game room", robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <GamePage game="quote" code={code.toUpperCase()} />;
}
