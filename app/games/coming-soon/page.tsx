import Link from "next/link";
import PageShell, { PageHeader } from "@/src/components/pages/PageShell";
import { getContent } from "@/src/lib/content/get-content";
import { getSiteData } from "@/src/lib/data/site-data";

export const metadata = { title: "Coming soon" };

export default async function ComingSoon() {
  const content = await getContent();
  const data = await getSiteData(content);
  return (
    <PageShell content={content} data={data}>
      <PageHeader
        tag="Faith & fun"
        title="This game is coming soon"
        intro="We are building it now. Check back shortly."
      />
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <p className="text-[56px] mb-4" aria-hidden="true">🎮</p>
        <p className="text-muted mb-8">
          In the meantime, explore the other games or head back home.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/games" className="bg-red text-white font-semibold text-[14px] px-6 py-3 rounded-xl hover:bg-red-dark transition-colors">
            All games
          </Link>
          <Link href="/" className="border border-navy/30 text-navy font-semibold text-[14px] px-6 py-3 rounded-xl hover:bg-navy hover:text-white transition-colors">
            Back home
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
