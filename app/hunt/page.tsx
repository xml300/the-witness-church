import PageShell, { PageHeader } from "@/src/components/pages/PageShell";
import HuntClient from "@/src/components/hunt/HuntClient";
import { getContent } from "@/src/lib/content/get-content";
import { getSiteData } from "@/src/lib/data/site-data";
import { chestBoard, huntStatus } from "@/src/lib/hunt/service";
import { gamesConfigured } from "@/src/lib/supabase/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Anniversary Treasure Hunt" };

export default async function HuntPage() {
  const content = await getContent();
  const data = await getSiteData(content);
  const status = gamesConfigured ? await huntStatus() : null;

  return (
    <PageShell content={content} data={data}>
      <PageHeader
        tag="Second anniversary"
        title={status?.title ?? "Anniversary Treasure Hunt"}
        intro="Four games, four keys, one chest. Win a key in each game, then use all four to open the chest."
      />
      <div className="px-6 md:px-12 py-10 md:py-14">
        {status ? (
          <HuntClient status={status} board={await chestBoard()} />
        ) : (
          <p className="max-w-xl mx-auto text-center text-muted py-10">
            The treasure hunt is not open yet. Please check back soon.
          </p>
        )}
      </div>
    </PageShell>
  );
}
