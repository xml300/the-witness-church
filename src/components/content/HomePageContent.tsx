import SiteView from "@/src/components/content/SiteView";
import { getContent } from "@/src/lib/content/get-content";
import { getSiteData } from "@/src/lib/data/site-data";

export default async function HomePageContent() {
  const content = await getContent();
  const data = await getSiteData(content);
  return <SiteView content={content} data={data} />;
}
