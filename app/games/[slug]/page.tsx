import { notFound, redirect } from "next/navigation";
import { getContent } from "@/src/lib/content/get-content";
import { slugify } from "@/src/lib/content/text";

/** Every game has its own address. Until a game is built, its address sends
 *  visitors to the coming-soon page. When a game is ready, replace this
 *  redirect for that slug with the real page. */
export default async function GamePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug === "bible-quiz-battle") redirect("/games/bible-quiz"); // old name
  const { games } = await getContent();
  if (!games.some((g) => slugify(g.title) === slug)) notFound();
  redirect("/games/coming-soon");
}
