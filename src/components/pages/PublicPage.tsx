import PageView from "@/src/components/pages/PageView";
import type { PageId } from "@/src/lib/content/pages";
import { getContent } from "@/src/lib/content/get-content";
import { getSiteData } from "@/src/lib/data/site-data";

/** Server wrapper the public routes use: load content and data, then draw. */
export default async function PublicPage({ page }: { page: PageId }) {
  const content = await getContent();
  const data = await getSiteData(content);
  return <PageView page={page} content={content} data={data} />;
}
